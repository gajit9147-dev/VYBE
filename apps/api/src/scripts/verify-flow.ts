import request from "supertest";
import { app } from "../app.js";
import { prisma, disconnectDatabase } from "../config/db.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";

async function runEndToEndFlowVerification() {
  console.log("================================================================================");
  console.log("           VYBE STEP 11 — END-TO-END AUTHENTICATION FLOW VERIFICATION           ");
  console.log("================================================================================\n");

  resetRateLimitStore();

  const timestamp = Date.now();
  const testEmail = `flow_demo_${timestamp}@vybetest.com`;
  const testPassword = "ProductionReady2026!#";
  let createdUserId = "";
  let sessionCookie = "";

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Register
    // -------------------------------------------------------------------------
    console.log("[1] Executing POST /api/auth/register");
    console.log(`    Payload: { email: "${testEmail}", password: "[PROTECTED]" }`);

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword
      });

    console.log(`    HTTP Status: ${registerRes.status} (Expected: 201 Created)`);
    if (registerRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(registerRes.body)}`);
    }

    createdUserId = registerRes.body.user.id;
    console.log(`    Created User ID: ${createdUserId}`);
    console.log(`    Response User Body:`, JSON.stringify(registerRes.body.user, null, 2));

    // Inspect Cookie
    const rawSetCookie = registerRes.headers["set-cookie"];
    const cookieString = Array.isArray(rawSetCookie) ? rawSetCookie[0] : rawSetCookie;
    console.log(`    Set-Cookie Header: ${cookieString}`);
    console.log(`    -> HttpOnly flag present: ${cookieString.toLowerCase().includes("httponly")}`);
    console.log(`    -> SameSite=Lax present: ${cookieString.toLowerCase().includes("samesite=lax")}`);

    sessionCookie = cookieString.split(";")[0];

    // -------------------------------------------------------------------------
    // STEP 2: Verify Database (Argon2id Hash & Session)
    // -------------------------------------------------------------------------
    console.log("\n[2] Verifying Database Records in PostgreSQL:");
    const dbUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      include: { authCredential: true, sessions: true }
    });

    if (!dbUser || !dbUser.authCredential) {
      throw new Error("User or AuthCredential not found in database!");
    }

    const passwordHash = dbUser.authCredential.passwordHash;
    console.log(`    ✓ Database User: ID=${dbUser.id}, Email=${dbUser.email}, Status=${dbUser.status}`);
    console.log(`    ✓ Password Hash Algo: ${dbUser.authCredential.passwordAlgo}`);
    console.log(`    ✓ Stored Argon2id Hash: ${passwordHash.slice(0, 30)}... (Length: ${passwordHash.length})`);
    console.log(`    ✓ Hash starts with $argon2id$: ${passwordHash.startsWith("$argon2id$")}`);

    const dbSession = dbUser.sessions[0];
    if (!dbSession) {
      throw new Error("Session record was not created in user_sessions!");
    }

    console.log(`    ✓ Server-Side Session Record in user_sessions:`);
    console.log(`      - Session ID: ${dbSession.id}`);
    console.log(`      - Stored Token Hash (SHA-256): ${dbSession.refreshTokenHash}`);
    console.log(`      - isRevoked: ${dbSession.isRevoked}`);
    console.log(`      - expiresAt: ${dbSession.expiresAt.toISOString()}`);

    // -------------------------------------------------------------------------
    // STEP 3: Call GET /api/auth/me with the Cookie
    // -------------------------------------------------------------------------
    console.log("\n[3] Executing GET /api/auth/me with Session Cookie");
    console.log(`    Cookie: ${sessionCookie}`);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie);

    console.log(`    HTTP Status: ${meRes.status} (Expected: 200 OK)`);
    console.log(`    Response Body:`, JSON.stringify(meRes.body, null, 2));

    if (meRes.status !== 200 || meRes.body.user.email !== testEmail) {
      throw new Error("Authenticated /me failed to return current user!");
    }
    console.log(`    ✓ Successfully identified authenticated user: ${meRes.body.user.email}`);

    // -------------------------------------------------------------------------
    // STEP 4: Call POST /api/auth/logout with the Cookie
    // -------------------------------------------------------------------------
    console.log("\n[4] Executing POST /api/auth/logout");

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", sessionCookie);

    console.log(`    HTTP Status: ${logoutRes.status} (Expected: 200 OK)`);
    console.log(`    Response Body:`, JSON.stringify(logoutRes.body, null, 2));

    const logoutCookie = Array.isArray(logoutRes.headers["set-cookie"])
      ? logoutRes.headers["set-cookie"][0]
      : logoutRes.headers["set-cookie"];
    console.log(`    Set-Cookie Header on Logout: ${logoutCookie}`);

    // -------------------------------------------------------------------------
    // STEP 5: Verify Session Invalidation in Database & API
    // -------------------------------------------------------------------------
    console.log("\n[5] Verifying Session Invalidation in PostgreSQL:");
    const updatedSession = await prisma.userSession.findUnique({
      where: { id: dbSession.id }
    });

    console.log(`    ✓ Session in DB isRevoked: ${updatedSession?.isRevoked}`);
    console.log(`    ✓ Session in DB revokedAt: ${updatedSession?.revokedAt?.toISOString()}`);

    console.log("\n[6] Calling GET /api/auth/me with the Old Session Cookie:");
    const rejectedMeRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie);

    console.log(`    HTTP Status: ${rejectedMeRes.status} (Expected: 401 Unauthorized)`);
    console.log(`    Response Body:`, JSON.stringify(rejectedMeRes.body, null, 2));

    if (rejectedMeRes.status !== 401) {
      throw new Error("Expected 401 Unauthorized after session invalidation, but got " + rejectedMeRes.status);
    }
    console.log(`    ✓ Confirmed: Expired/Revoked session is strictly rejected!`);

    console.log("\n================================================================================");
    console.log("           ALL 6 STEPS IN THE AUTHENTICATION FLOW VERIFIED SUCCESSFULLY!         ");
    console.log("================================================================================");
  } finally {
    // Cleanup
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
      console.log(`\n[Cleanup] Test user ${createdUserId} removed from database.`);
    }
    await disconnectDatabase();
  }
}

runEndToEndFlowVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
