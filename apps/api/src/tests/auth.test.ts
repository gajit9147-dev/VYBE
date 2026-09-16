import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { prisma, disconnectDatabase } from "../config/db.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";

describe("VYBE Authentication API", () => {
  const testRunId = Date.now();
  const testEmail = `auth_test_${testRunId}@vybetest.com`;
  const testPassword = "StrongPassword123!";
  const createdUserIds: string[] = [];

  let sessionCookie: string;

  before(() => {
    resetRateLimitStore();
  });

  after(async () => {
    // Clean up created test users and related records
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } }
      });
    }
    await disconnectDatabase();
  });

  it("1. successful registration sets secure HttpOnly cookie and returns safe user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.user);
    assert.ok(res.body.user.id);
    createdUserIds.push(res.body.user.id);

    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.role, "MEMBER");
    assert.equal(res.body.user.status, "ACTIVE");

    // Security: Password hash and authCredential must never be exposed
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.user.authCredential, undefined);

    // Security: Session token / secret must never be returned in JSON body
    assert.equal(res.body.sessionToken, undefined);
    assert.equal(res.body.token, undefined);
    assert.equal(res.body.refreshTokenHash, undefined);

    // Security: Set-Cookie must be HttpOnly and SameSite=Lax
    const setCookieHeaders = res.headers["set-cookie"];
    assert.ok(setCookieHeaders);
    const cookieHeader = Array.isArray(setCookieHeaders) ? setCookieHeaders[0] : setCookieHeaders;
    assert.ok(cookieHeader.includes("vybe_session="));
    assert.ok(cookieHeader.toLowerCase().includes("httponly"));
    assert.ok(cookieHeader.toLowerCase().includes("samesite=lax"));

    // Save cookie for subsequent tests
    sessionCookie = cookieHeader.split(";")[0];
  });

  it("2. duplicate email registration returns 409 Conflict", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword
      });

    assert.equal(res.status, 409);
    assert.ok(res.body.error);
    assert.ok(res.body.error.message.includes("already exists"));
  });

  it("3. invalid registration input returns 400 Bad Request with details", async () => {
    // Short password (< 8 chars)
    const resShort = await request(app)
      .post("/api/auth/register")
      .send({
        email: "valid@example.com",
        password: "short"
      });
    assert.equal(resShort.status, 400);
    assert.ok(resShort.body.error);

    // Invalid email format
    const resInvalidEmail = await request(app)
      .post("/api/auth/register")
      .send({
        email: "not-an-email",
        password: "StrongPassword123!"
      });
    assert.equal(resInvalidEmail.status, 400);

    // Missing fields
    const resEmpty = await request(app)
      .post("/api/auth/register")
      .send({});
    assert.equal(resEmpty.status, 400);
  });

  it("4. successful login returns safe user and sets new session cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.user);
    assert.equal(res.body.user.email, testEmail);

    // Security assertions
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.authCredential, undefined);
    assert.equal(res.body.sessionToken, undefined);

    const setCookieHeaders = res.headers["set-cookie"];
    assert.ok(setCookieHeaders);
    const cookieHeader = Array.isArray(setCookieHeaders) ? setCookieHeaders[0] : setCookieHeaders;
    assert.ok(cookieHeader.includes("vybe_session="));
    assert.ok(cookieHeader.toLowerCase().includes("httponly"));

    // Update cookie with the newly generated session
    sessionCookie = cookieHeader.split(";")[0];
  });

  it("5. incorrect password returns generic 401 without user enumeration", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "WrongPassword999!"
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, "Invalid email or password");
  });

  it("6. non-existent email login returns identical generic 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent_account_12345@vybetest.com",
        password: "AnyPassword123!"
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, "Invalid email or password");
  });

  it("7. authenticated GET /me returns current user info", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie);

    assert.equal(res.status, 200);
    assert.ok(res.body.user);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.authCredential, undefined);
  });

  it("8. unauthenticated GET /me returns 401 Unauthorized", async () => {
    const res = await request(app)
      .get("/api/auth/me");

    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, "Authentication required");
  });

  it("9. POST /logout invalidates session and clears cookie", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", sessionCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Logged out successfully");

    // Cookie must be cleared in response headers
    const setCookieHeaders = res.headers["set-cookie"];
    assert.ok(setCookieHeaders);
    const cookieHeader = Array.isArray(setCookieHeaders) ? setCookieHeaders[0] : setCookieHeaders;
    assert.ok(cookieHeader.includes("vybe_session=;") || cookieHeader.toLowerCase().includes("expires="));

    // Subsequent call with the logged-out session cookie must now fail with 401
    const resAfterLogout = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie);

    assert.equal(resAfterLogout.status, 401);
    assert.equal(resAfterLogout.body.error.message, "Invalid or expired session");
  });

  it("10. POST /logout-all invalidates all active sessions for user", async () => {
    // Log in twice to establish two separate sessions
    const login1 = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });
    const cookie1 = (Array.isArray(login1.headers["set-cookie"]) ? login1.headers["set-cookie"][0] : login1.headers["set-cookie"]).split(";")[0];

    const login2 = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });
    const cookie2 = (Array.isArray(login2.headers["set-cookie"]) ? login2.headers["set-cookie"][0] : login2.headers["set-cookie"]).split(";")[0];

    // Both sessions should initially be valid
    const check1Before = await request(app).get("/api/auth/me").set("Cookie", cookie1);
    assert.equal(check1Before.status, 200);

    const check2Before = await request(app).get("/api/auth/me").set("Cookie", cookie2);
    assert.equal(check2Before.status, 200);

    // Logout all from session 1
    const logoutAllRes = await request(app)
      .post("/api/auth/logout-all")
      .set("Cookie", cookie1);

    assert.equal(logoutAllRes.status, 200);
    assert.equal(logoutAllRes.body.message, "All sessions invalidated successfully");

    // Now BOTH session 1 and session 2 must be rejected with 401
    const check1After = await request(app).get("/api/auth/me").set("Cookie", cookie1);
    assert.equal(check1After.status, 401);

    const check2After = await request(app).get("/api/auth/me").set("Cookie", cookie2);
    assert.equal(check2After.status, 401);
  });
});
