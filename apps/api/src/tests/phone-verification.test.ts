import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { logger } from "../config/logger.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { resetPhoneRateLimits } from "../services/phone-rate-limiter.service.js";
import { InMemorySmsProvider, smsProvider } from "../services/sms/sms.provider.js";
import { hashOtp, normalizePhoneNumber } from "../utils/phone.js";

describe("VYBE Phone Number Verification API", () => {
  const timestamp = Date.now();
  const userAEmail = `phone_a_${timestamp}@vybetest.com`;
  const userBEmail = `phone_b_${timestamp}@vybetest.com`;
  const testPassword = "ValidPassword123!";

  let userAId = "";
  let userACookie = "";
  let userBId = "";
  let userBCookie = "";

  const validPhoneA = "+14155552671";
  const validPhoneB = "+442071838750";
  const inMemorySms = smsProvider as InMemorySmsProvider;

  before(async () => {
    resetRateLimitStore();
    resetPhoneRateLimits();
    inMemorySms.clear();

    // Register User A
    const resA = await request(app)
      .post("/api/auth/register")
      .send({ email: userAEmail, password: testPassword });
    assert.equal(resA.status, 201);
    userAId = resA.body.user.id;
    const cookieA = resA.headers["set-cookie"];
    userACookie = (Array.isArray(cookieA) ? cookieA[0] : cookieA).split(";")[0];

    // Register User B
    const resB = await request(app)
      .post("/api/auth/register")
      .send({ email: userBEmail, password: testPassword });
    assert.equal(resB.status, 201);
    userBId = resB.body.user.id;
    const cookieB = resB.headers["set-cookie"];
    userBCookie = (Array.isArray(cookieB) ? cookieB[0] : cookieB).split(";")[0];
  });

  after(async () => {
    if (userAId) {
      await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    }
    if (userBId) {
      await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
    }
    await disconnectDatabase();
    await disconnectRedis();
  });

  beforeEach(() => {
    resetRateLimitStore();
    resetPhoneRateLimits();
  });

  it("1. phone normalization correctly converts various international formats to E.164", () => {
    assert.equal(normalizePhoneNumber("+1 (415) 555-2671"), "+14155552671");
    assert.equal(normalizePhoneNumber("  +91 98765-43210 "), "+919876543210");
    assert.equal(normalizePhoneNumber("0044 20 7183 8750"), "+442071838750");
    assert.equal(normalizePhoneNumber("+49.30.1234567"), "+49301234567");

    // Invalid numbers must throw
    assert.throws(() => normalizePhoneNumber("invalid-phone"));
    assert.throws(() => normalizePhoneNumber("+012345")); // zero country code
    assert.throws(() => normalizePhoneNumber("123")); // too short
  });

  it("2. status endpoint initially reports unverified with null phone", async () => {
    const res = await request(app)
      .get("/api/auth/phone/status")
      .set("Cookie", userACookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.isPhoneVerified, false);
    assert.equal(res.body.phoneNumber, null);
    assert.equal(res.body.phoneVerifiedAt, null);
  });

  it("3. send-otp rejects unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .send({ phoneNumber: validPhoneA });

    assert.equal(res.status, 401);
  });

  it("4. send-otp rejects invalid phone number formats", async () => {
    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: "not-a-number" });

    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("5. send-otp dispatches SMS, hashes OTP in DB, and never exposes raw OTP in API response", async () => {
    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: " +1 (415) 555-2671 " });

    assert.equal(res.status, 200);
    assert.ok(res.body.message);

    // SECURITY CHECK: Raw OTP, unmasked phone, and hash must NEVER be in API response JSON
    assert.equal(res.body.otp, undefined);
    assert.equal(res.body.code, undefined);
    assert.equal(res.body.otpHash, undefined);
    assert.notEqual(res.body.phoneNumber, validPhoneA); // Must be masked
    assert.ok(res.body.phoneNumber?.includes("*"));

    // Verify SMS was dispatched to in-memory carrier simulator
    const sentMessages = inMemorySms.getSentMessages();
    assert.equal(sentMessages.length, 1);
    const lastMsg = sentMessages[0];
    assert.equal(lastMsg.to, validPhoneA);

    // Extract OTP from test carrier simulator to inspect DB storage
    const otpMatch = lastMsg.message.match(/(\d{6})/);
    assert.ok(otpMatch, "SMS should contain 6-digit verification code");
    const rawOtp = otpMatch[1];

    // Check DB: Raw OTP must NEVER be stored in the database
    const dbToken = await prisma.phoneVerificationToken.findFirst({
      where: { userId: userAId, phoneNumber: validPhoneA },
      orderBy: { createdAt: "desc" }
    });

    assert.ok(dbToken);
    assert.notEqual(dbToken.otpHash, rawOtp);
    assert.equal(dbToken.otpHash, hashOtp(rawOtp));
    assert.equal(dbToken.attempts, 0);
    assert.equal(dbToken.usedAt, null);
    assert.ok(dbToken.expiresAt > new Date());
  });

  it("6. resend cooldown enforces waiting period between OTP requests", async () => {
    // Calling /send-otp immediately again should hit the cooldown
    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA });

    assert.equal(res.status, 429);
    assert.ok(res.body.error.message.includes("Please wait"));
  });

  let activeOtp = "";
  let lastVerifiedOtp = "";

  it("7. resend invalidates the previous unconsumed OTP", async () => {
    // Manually age the previous token so cooldown passes
    await prisma.phoneVerificationToken.updateMany({
      where: { userId: userAId, phoneNumber: validPhoneA },
      data: { createdAt: new Date(Date.now() - 70 * 1000) }
    });

    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA });

    assert.equal(res.status, 200);

    const latestMsg = inMemorySms.getLastMessage();
    activeOtp = latestMsg!.message.match(/(\d{6})/)![1];

    // Check that previous token was marked used/invalidated
    const tokens = await prisma.phoneVerificationToken.findMany({
      where: { userId: userAId, phoneNumber: validPhoneA },
      orderBy: { createdAt: "asc" }
    });

    assert.equal(tokens.length, 2);
    assert.notEqual(tokens[0].usedAt, null, "Previous token must be invalidated");
    assert.equal(tokens[1].usedAt, null, "Latest token must be active");
  });

  it("8. verify-otp rejects invalid OTP and increments attempt counter", async () => {
    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA, otp: "000000" });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.message.includes("Invalid verification code"));

    // Check DB attempts incremented
    const token = await prisma.phoneVerificationToken.findFirst({
      where: { userId: userAId, phoneNumber: validPhoneA },
      orderBy: { createdAt: "desc" }
    });
    assert.equal(token?.attempts, 1);
  });

  it("9. verify-otp enforces maximum attempts (5 attempts) and locks out token", async () => {
    // Attempt 4 more times with wrong code (reaching 5 total attempts)
    for (let i = 2; i <= 5; i++) {
      const res = await request(app)
        .post("/api/auth/phone/verify-otp")
        .set("Cookie", userACookie)
        .send({ phoneNumber: validPhoneA, otp: "999999" });
      assert.equal(res.status, 400);
    }

    // Token should now be consumed/invalidated due to max attempts
    const token = await prisma.phoneVerificationToken.findFirst({
      where: { userId: userAId, phoneNumber: validPhoneA },
      orderBy: { createdAt: "desc" }
    });
    assert.equal(token?.attempts, 5);
    assert.notEqual(token?.usedAt, null);

    // Even if user now provides the right code, it should be rejected because max attempts reached
    const resExceeded = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA, otp: activeOtp });

    assert.equal(resExceeded.status, 400);
  });

  it("10. verify-otp rejects expired OTP", async () => {
    // Generate new OTP
    await prisma.phoneVerificationToken.updateMany({
      where: { userId: userAId },
      data: { createdAt: new Date(Date.now() - 70 * 1000) }
    });

    await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA });

    const latestMsg = inMemorySms.getLastMessage();
    const correctOtp = latestMsg!.message.match(/(\d{6})/)![1];

    // Force expiration in DB (set expiresAt in the past)
    await prisma.phoneVerificationToken.updateMany({
      where: { userId: userAId, phoneNumber: validPhoneA, usedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });

    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA, otp: correctOtp });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.message.includes("expired"));
  });

  it("11. successful verification verifies phone and masks number in response", async () => {
    // Generate fresh OTP
    await prisma.phoneVerificationToken.updateMany({
      where: { userId: userAId },
      data: { createdAt: new Date(Date.now() - 70 * 1000) }
    });

    await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA });

    const latestMsg = inMemorySms.getLastMessage();
    lastVerifiedOtp = latestMsg!.message.match(/(\d{6})/)![1];

    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA, otp: lastVerifiedOtp });

    assert.equal(res.status, 200);
    assert.equal(res.body.isPhoneVerified, true);
    assert.ok(res.body.phoneVerifiedAt);
    assert.ok(res.body.phoneNumber?.includes("*")); // Must be masked

    // Verify User record in DB
    const user = await prisma.user.findUnique({ where: { id: userAId } });
    assert.equal(user?.phoneNumber, validPhoneA);
    assert.notEqual(user?.phoneVerifiedAt, null);

    // Verify token was marked consumed
    const token = await prisma.phoneVerificationToken.findFirst({
      where: { userId: userAId, phoneNumber: validPhoneA },
      orderBy: { createdAt: "desc" }
    });
    assert.notEqual(token?.usedAt, null);
  });

  it("12. reused OTP is immediately rejected", async () => {
    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA, otp: lastVerifiedOtp });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.message.includes("Invalid or expired"));
  });

  it("13. status endpoint shows masked phone and verification timestamp", async () => {
    const res = await request(app)
      .get("/api/auth/phone/status")
      .set("Cookie", userACookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.isPhoneVerified, true);
    assert.notEqual(res.body.phoneVerifiedAt, null);
    // Security check: Raw phone number must never be returned unmasked
    assert.notEqual(res.body.phoneNumber, validPhoneA);
    assert.ok(res.body.phoneNumber?.includes("*"));
  });

  it("14. attempting to send OTP for already verified phone returns 400", async () => {
    await prisma.phoneVerificationToken.updateMany({
      where: { userId: userAId },
      data: { createdAt: new Date(Date.now() - 70 * 1000) }
    });

    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userACookie)
      .send({ phoneNumber: validPhoneA });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.message.includes("already verified"));
  });

  it("15. duplicate phone number prevents User B from claiming User A's verified phone", async () => {
    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userBCookie)
      .send({ phoneNumber: validPhoneA });

    assert.equal(res.status, 409);
    assert.ok(res.body.error.message.includes("already registered"));
  });

  it("16. phone removal requires re-authentication password and invalidates phone state", async () => {
    // 1. Wrong password fails re-authentication
    const resWrongPw = await request(app)
      .delete("/api/auth/phone/remove")
      .set("Cookie", userACookie)
      .send({ password: "WrongPassword!" });

    assert.equal(resWrongPw.status, 401);
    assert.ok(resWrongPw.body.error.message.includes("Re-authentication is required"));

    // 2. Correct password removes phone number
    const resSuccess = await request(app)
      .delete("/api/auth/phone/remove")
      .set("Cookie", userACookie)
      .send({ password: testPassword });

    assert.equal(resSuccess.status, 200);
    assert.equal(resSuccess.body.isPhoneVerified, false);

    // Verify User record updated in DB
    const user = await prisma.user.findUnique({ where: { id: userAId } });
    assert.equal(user?.phoneNumber, null);
    assert.equal(user?.phoneVerifiedAt, null);

    // Verify /status now reports unverified
    const statusRes = await request(app)
      .get("/api/auth/phone/status")
      .set("Cookie", userACookie);
    assert.equal(statusRes.body.isPhoneVerified, false);
    assert.equal(statusRes.body.phoneNumber, null);
  });

  it("17. multi-dimensional rate limiting independently throttles phone and IP", async () => {
    // Sending 5 requests to phoneB from User B
    for (let i = 0; i < 5; i++) {
      // Age previous token to bypass cooldown
      await prisma.phoneVerificationToken.updateMany({
        where: { userId: userBId },
        data: { createdAt: new Date(Date.now() - 70 * 1000) }
      });

      const res = await request(app)
        .post("/api/auth/phone/send-otp")
        .set("Cookie", userBCookie)
        .send({ phoneNumber: validPhoneB });

      assert.equal(res.status, 200);
    }

    // 6th request to phoneB should be blocked by phone rate limit
    await prisma.phoneVerificationToken.updateMany({
      where: { userId: userBId },
      data: { createdAt: new Date(Date.now() - 70 * 1000) }
    });

    const rateLimitedRes = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Cookie", userBCookie)
      .send({ phoneNumber: validPhoneB });

    assert.equal(rateLimitedRes.status, 429);
    assert.ok(rateLimitedRes.body.error.message.includes("Too many"));
  });

  it("18. raw OTP is never emitted to application logs during send or verify operations", async () => {
    const loggedChunks: string[] = [];
    const origInfo = logger.info.bind(logger);
    const origWarn = logger.warn.bind(logger);
    const origError = logger.error.bind(logger);

    const recordLog = (originalFn: Function) => (...args: any[]) => {
      try {
        loggedChunks.push(JSON.stringify(args));
      } catch {
        loggedChunks.push(String(args));
      }
      return originalFn(...args);
    };

    logger.info = recordLog(origInfo) as any;
    logger.warn = recordLog(origWarn) as any;
    logger.error = recordLog(origError) as any;

    const testPhone = "+14155558899";

    try {
      const sendRes = await request(app)
        .post("/api/auth/phone/send-otp")
        .set("Cookie", userACookie)
        .send({ phoneNumber: testPhone });

      assert.equal(sendRes.status, 200);

      const latestMsg = inMemorySms.getLastMessage();
      assert.ok(latestMsg);
      const rawOtp = latestMsg.message.match(/(\d{6})/)![1];

      // Perform verification attempt
      const verifyRes = await request(app)
        .post("/api/auth/phone/verify-otp")
        .set("Cookie", userACookie)
        .send({ phoneNumber: testPhone, otp: rawOtp });

      assert.equal(verifyRes.status, 200);

      // Verify that the 6-digit raw OTP NEVER appeared in any logger output
      for (const logText of loggedChunks) {
        assert.equal(
          logText.includes(rawOtp),
          false,
          `Raw OTP "${rawOtp}" leaked into application logs: ${logText}`
        );
      }
    } finally {
      logger.info = origInfo;
      logger.warn = origWarn;
      logger.error = origError;
    }
  });
});
