import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { prisma, disconnectDatabase } from "../config/db.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { emailProvider } from "../services/email/email.provider.js";
import { hashVerificationToken } from "../services/email-verification.service.js";

describe("VYBE Email Verification API", () => {
  const timestamp = Date.now();
  const testEmail = `ev_test_${timestamp}@vybetest.com`;
  const testPassword = "ValidPassword123!";
  let testUserId = "";
  let userSessionCookie = "";

  before(async () => {
    resetRateLimitStore();
    emailProvider.clear();

    // Register a test user
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: testEmail, password: testPassword });

    assert.equal(res.status, 201);
    testUserId = res.body.user.id;
    const rawCookie = res.headers["set-cookie"];
    userSessionCookie = (Array.isArray(rawCookie) ? rawCookie[0] : rawCookie).split(";")[0];
  });

  after(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await disconnectDatabase();
  });

  it("1. status endpoint initially shows unverified", async () => {
    const res = await request(app)
      .get(`/api/auth/email-verification/status?email=${encodeURIComponent(testEmail)}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.email, testEmail);
    assert.equal(res.body.isVerified, false);
    assert.equal(res.body.verifiedAt, null);
  });

  it("2. send verification email dispatches email and creates hashed token in DB", async () => {
    emailProvider.clear();

    const res = await request(app)
      .post("/api/auth/email-verification/send")
      .set("Cookie", userSessionCookie)
      .send({});

    assert.equal(res.status, 200);
    assert.ok(res.body.message);

    // Security check: Raw token or URL must never be in API response JSON
    assert.equal(res.body.token, undefined);
    assert.equal(res.body.verificationUrl, undefined);
    assert.equal(res.body.tokenHash, undefined);

    // Verify an email was captured by the email provider
    const sentEmails = emailProvider.getSentEmails();
    assert.equal(sentEmails.length, 1);
    const sentEmail = sentEmails[0];
    assert.equal(sentEmail.to, testEmail);

    // Extract the raw token from the sent email text/HTML for verification testing
    const urlMatch = sentEmail.text.match(/token=([A-Za-z0-9_-]+)/);
    assert.ok(urlMatch, "Email should contain verification link with token parameter");
    const rawToken = urlMatch[1];
    assert.ok(rawToken.length >= 32, "Token should have at least 32 characters of high entropy");

    // Check DB: Raw token must NEVER be stored in the database
    const dbTokens = await prisma.emailVerificationToken.findMany({
      where: { userId: testUserId }
    });
    assert.equal(dbTokens.length, 1);
    const dbToken = dbTokens[0];

    assert.notEqual(dbToken.tokenHash, rawToken);
    assert.equal(dbToken.tokenHash, hashVerificationToken(rawToken));
    assert.equal(dbToken.usedAt, null);
    assert.ok(dbToken.expiresAt > new Date());
  });

  it("3. resend cooldown enforces waiting period between emails", async () => {
    // Calling /send immediately again should hit the 60s cooldown
    const res = await request(app)
      .post("/api/auth/email-verification/send")
      .set("Cookie", userSessionCookie)
      .send({});

    assert.equal(res.status, 429);
    assert.ok(res.body.error.message.includes("Please wait"));
  });

  it("4. invalid verification token returns 400 Bad Request", async () => {
    const invalidToken = "completely_invalid_nonexistent_token_string_123456789";
    const res = await request(app)
      .get(`/api/auth/email-verification/verify?token=${encodeURIComponent(invalidToken)}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, "Invalid or already used verification token");
  });

  it("5. expired verification token returns 400 Bad Request", async () => {
    // Create an explicitly expired token in the DB
    const expiredRawToken = "expired_test_token_string_32_bytes_long_randomness";
    const expiredHash = hashVerificationToken(expiredRawToken);

    await prisma.emailVerificationToken.create({
      data: {
        userId: testUserId,
        tokenHash: expiredHash,
        expiresAt: new Date(Date.now() - 60 * 1000) // 1 minute ago
      }
    });

    const res = await request(app)
      .get(`/api/auth/email-verification/verify?token=${encodeURIComponent(expiredRawToken)}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, "Verification token has expired");
  });

  it("6. successful email verification consumes token and updates user", async () => {
    const sentEmail = emailProvider.getLastEmail();
    assert.ok(sentEmail);
    const urlMatch = sentEmail.text.match(/token=([A-Za-z0-9_-]+)/);
    assert.ok(urlMatch);
    const validToken = urlMatch[1];

    const res = await request(app)
      .get(`/api/auth/email-verification/verify?token=${encodeURIComponent(validToken)}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.isVerified, true);
    assert.equal(res.body.email, testEmail);
    assert.ok(res.body.verifiedAt);

    // Verify DB user state
    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    assert.ok(userInDb?.emailVerifiedAt);

    // Verify token consumed in DB
    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashVerificationToken(validToken) }
    });
    assert.ok(tokenRecord?.usedAt);
  });

  it("7. reused token returns 400 Bad Request", async () => {
    const sentEmail = emailProvider.getLastEmail();
    assert.ok(sentEmail);
    const urlMatch = sentEmail.text.match(/token=([A-Za-z0-9_-]+)/);
    assert.ok(urlMatch);
    const alreadyUsedToken = urlMatch[1];

    const res = await request(app)
      .get(`/api/auth/email-verification/verify?token=${encodeURIComponent(alreadyUsedToken)}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, "Invalid or already used verification token");
  });

  it("8. status endpoint reflects verified state", async () => {
    const res = await request(app)
      .get(`/api/auth/email-verification/status?email=${encodeURIComponent(testEmail)}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.isVerified, true);
    assert.ok(res.body.verifiedAt);
  });

  it("9. sending verification to already-verified account returns already-verified message", async () => {
    resetRateLimitStore();

    // Reset cooldown in DB so cooldown isn't the trigger
    await prisma.emailVerificationToken.deleteMany({ where: { userId: testUserId } });

    const res = await request(app)
      .post("/api/auth/email-verification/send")
      .send({ email: testEmail });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Email is already verified.");
  });

  it("10. IP rate limiter blocks excessive requests", async () => {
    resetRateLimitStore();

    // Hit the endpoint 6 times rapidly (limit is 5)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/auth/email-verification/send")
        .send({ email: `arbitrary_${i}@example.com` });
    }

    const rateLimitedRes = await request(app)
      .post("/api/auth/email-verification/send")
      .send({ email: "arbitrary_excess@example.com" });

    assert.equal(rateLimitedRes.status, 429);
    assert.ok(rateLimitedRes.body.error.message.includes("Too many email verification requests"));
  });
});
