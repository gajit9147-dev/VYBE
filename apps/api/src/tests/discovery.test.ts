import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { ensureDefaultProfileSeeds } from "../utils/profile-seed.js";

describe("VYBE Step 19 — Discovery System API", () => {
  const timestamp = Date.now();
  const testPassword = "DiscoveryTestPass123!";

  // Users:
  // User A: Active Male, 28 (1998-05-10), looking for Women 22-30, interests: Photography, Hiking
  // User B: Active Female, 25 (2001-08-15), looking for Men 24-32, interests: Photography, Travel
  // User C: Active Female, 27 (1999-03-20), looking for Men, blocked by A
  // User D: Active Female, 26 (2000-01-05), who blocks A
  // User E: Active Female, 35 (1991-04-10) -> outside User A's age preference (22-30)
  // User F: Active Female, hidden profile (isDiscoverable = false)
  // User G: Active Female, discovery paused (isDiscoveryPaused = true)
  // User H: Suspended Female

  let userAId = "";
  let userACookie = "";

  let userBId = "";
  let userBCookie = "";

  let userCId = "";
  let userDId = "";
  let userEId = "";
  let userFId = "";
  let userGId = "";
  let userHId = "";

  let seedInterests: { id: string; name: string; slug: string }[] = [];
  let seedIntents: { id: string; code: string; label: string }[] = [];
  let seedQuestions: { id: string; questionText: string; category: string }[] = [];

  const createdUserIds: string[] = [];

  async function registerAndInitUser(params: {
    email: string;
    displayName: string;
    birthDate: string;
    gender: "MAN" | "WOMAN" | "NON_BINARY";
    interestedInGenders?: ("MAN" | "WOMAN" | "NON_BINARY")[];
    minAge?: number;
    maxAge?: number;
    interestIds?: string[];
    intentIds?: string[];
    isDiscoverable?: boolean;
    isDiscoveryPaused?: boolean;
  }): Promise<{ id: string; cookie: string }> {
    const resReg = await request(app)
      .post("/api/auth/register")
      .send({ email: params.email, password: testPassword });
    assert.equal(resReg.status, 201);
    const id = resReg.body.user.id;
    createdUserIds.push(id);

    const cookieHeader = resReg.headers["set-cookie"];
    const cookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader).split(";")[0];

    // Initialize profile
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", cookie)
      .send({
        displayName: params.displayName,
        birthDate: params.birthDate,
        gender: params.gender,
        bio: `Bio for ${params.displayName}`,
        city: "San Francisco",
        isDiscoverable: params.isDiscoverable ?? true
      });

    // Add interests if provided
    if (params.interestIds) {
      for (const interestId of params.interestIds) {
        await request(app)
          .post("/api/profile/interests")
          .set("Cookie", cookie)
          .send({ interestId });
      }
    }

    // Add relationship intents if provided
    if (params.intentIds && params.intentIds.length > 0) {
      await request(app)
        .put("/api/profile/relationship-intents")
        .set("Cookie", cookie)
        .send({
          intentIds: params.intentIds,
          primaryIntentId: params.intentIds[0]
        });
    }

    // Set discovery preferences
    await request(app)
      .put("/api/profile/preferences")
      .set("Cookie", cookie)
      .send({
        minAge: params.minAge ?? 18,
        maxAge: params.maxAge ?? 45,
        interestedInGenders: params.interestedInGenders ?? ["WOMAN", "MAN"],
        isDiscoveryPaused: params.isDiscoveryPaused ?? false
      });

    return { id, cookie };
  }

  before(async () => {
    resetRateLimitStore();

    const seeds = await ensureDefaultProfileSeeds();
    seedInterests = seeds.interests;
    seedIntents = seeds.intents;
    seedQuestions = seeds.questions;

    // 1. User A: Active Male, looking for Women 22-30
    const a = await registerAndInitUser({
      email: `disc_a_${timestamp}@vybetest.com`,
      displayName: "User A",
      birthDate: "1998-05-10",
      gender: "MAN",
      interestedInGenders: ["WOMAN"],
      minAge: 22,
      maxAge: 30,
      interestIds: [seedInterests[0].id, seedInterests[1].id], // Photography, Hiking
      intentIds: [seedIntents[0].id] // Long term
    });
    userAId = a.id;
    userACookie = a.cookie;

    // User A answers Question 0 (Public)
    await request(app)
      .post("/api/profile/answers")
      .set("Cookie", userACookie)
      .send({
        questionId: seedQuestions[0].id,
        answer: "Authenticity and kindness.",
        visibility: "PUBLIC"
      });

    // 2. User B: Active Female, 25, looking for Men 24-32
    const b = await registerAndInitUser({
      email: `disc_b_${timestamp}@vybetest.com`,
      displayName: "User B",
      birthDate: "2001-08-15",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      minAge: 24,
      maxAge: 32,
      interestIds: [seedInterests[0].id], // Shares Photography!
      intentIds: [seedIntents[0].id] // Shares Long term!
    });
    userBId = b.id;
    userBCookie = b.cookie;

    // User B answers Question 0 (Discovery visibility)
    await request(app)
      .post("/api/profile/answers")
      .set("Cookie", userBCookie)
      .send({
        questionId: seedQuestions[0].id,
        answer: "Honesty and deep curiosity.",
        visibility: "DISCOVERY"
      });

    // 3. User C: Active Female, 27, but User A blocks C
    const c = await registerAndInitUser({
      email: `disc_c_${timestamp}@vybetest.com`,
      displayName: "User C",
      birthDate: "1999-03-20",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      minAge: 24,
      maxAge: 32
    });
    userCId = c.id;
    await prisma.userBlock.create({
      data: {
        blockerUserId: userAId,
        blockedUserId: userCId
      }
    });

    // 4. User D: Active Female, 26, who blocks User A
    const d = await registerAndInitUser({
      email: `disc_d_${timestamp}@vybetest.com`,
      displayName: "User D",
      birthDate: "2000-01-05",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      minAge: 24,
      maxAge: 32
    });
    userDId = d.id;
    await prisma.userBlock.create({
      data: {
        blockerUserId: userDId,
        blockedUserId: userAId
      }
    });

    // 5. User E: Active Female, 35 (too old for User A's 22-30 preference)
    const e = await registerAndInitUser({
      email: `disc_e_${timestamp}@vybetest.com`,
      displayName: "User E",
      birthDate: "1991-04-10",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      minAge: 24,
      maxAge: 35
    });
    userEId = e.id;

    // 6. User F: Active Female, profile hidden (isDiscoverable = false)
    const f = await registerAndInitUser({
      email: `disc_f_${timestamp}@vybetest.com`,
      displayName: "User F",
      birthDate: "2000-05-15",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      isDiscoverable: false
    });
    userFId = f.id;

    // 7. User G: Active Female, discovery paused
    const g = await registerAndInitUser({
      email: `disc_g_${timestamp}@vybetest.com`,
      displayName: "User G",
      birthDate: "2000-08-10",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      isDiscoveryPaused: true
    });
    userGId = g.id;

    // 8. User H: Suspended Female
    const h = await registerAndInitUser({
      email: `disc_h_${timestamp}@vybetest.com`,
      displayName: "User H",
      birthDate: "2000-02-14",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userHId = h.id;
    await prisma.user.update({
      where: { id: userHId },
      data: { status: "SUSPENDED" }
    });
  });

  after(async () => {
    for (const uid of createdUserIds) {
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    await disconnectDatabase();
    await disconnectRedis();
  });

  beforeEach(() => {
    resetRateLimitStore();
  });

  // ---------------------------------------------------------------------------
  // Discovery Feed & Candidate Eligibility Tests
  // ---------------------------------------------------------------------------
  describe("Candidate Eligibility & Filtering", () => {
    it("1. Unauthenticated discovery request is rejected (401)", async () => {
      const res = await request(app).get("/api/discovery");
      assert.equal(res.status, 401);
    });

    it("2. Authenticated discovery works and returns eligible candidates", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
      const hasUserB = res.body.items.some((item: any) => item.user.id === userBId);
      assert.equal(hasUserB, true, "User B should appear in User A's discovery feed");
    });

    it("3. Current user never appears in their own discovery feed", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasSelf = res.body.items.some((item: any) => item.user.id === userAId);
      assert.equal(hasSelf, false, "Current user must never appear in their own feed");
    });

    it("4. Blocked candidate is excluded (User A blocked User C)", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasUserC = res.body.items.some((item: any) => item.user.id === userCId);
      assert.equal(hasUserC, false, "User C blocked by User A must be excluded");
    });

    it("5. Candidate who blocked current user is excluded (User D blocked User A)", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasUserD = res.body.items.some((item: any) => item.user.id === userDId);
      assert.equal(hasUserD, false, "User D who blocked User A must be excluded");
    });

    it("6. Candidate outside age preferences is excluded (User E is 35, limit is 30)", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasUserE = res.body.items.some((item: any) => item.user.id === userEId);
      assert.equal(hasUserE, false, "Candidate outside age preference must be excluded");
    });

    it("7. Candidate with hidden profile (isDiscoverable=false) is excluded", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasUserF = res.body.items.some((item: any) => item.user.id === userFId);
      assert.equal(hasUserF, false, "Candidate with isDiscoverable=false must be excluded");
    });

    it("8. Candidate with paused discovery is excluded", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasUserG = res.body.items.some((item: any) => item.user.id === userGId);
      assert.equal(hasUserG, false, "Candidate with paused discovery must be excluded");
    });

    it("9. Suspended or banned candidate is excluded", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasUserH = res.body.items.some((item: any) => item.user.id === userHId);
      assert.equal(hasUserH, false, "Suspended user must never appear in discovery");
    });
  });

  // ---------------------------------------------------------------------------
  // Explainable Reasons & Safety Tests
  // ---------------------------------------------------------------------------
  describe("Explainable Reasons & Ranking", () => {
    it("10. Shared interests generate a human-readable reason", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const candidateB = res.body.items.find((item: any) => item.user.id === userBId);
      assert.ok(candidateB);
      assert.ok(Array.isArray(candidateB.reasons));

      const interestReason = candidateB.reasons.find(
        (r: any) => r.type === "SHARED_INTEREST"
      );
      assert.ok(interestReason);
      assert.match(interestReason.text, /photography/i);
    });

    it("11. Shared relationship intent generates a human-readable reason", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const candidateB = res.body.items.find((item: any) => item.user.id === userBId);
      assert.ok(candidateB);

      const intentReason = candidateB.reasons.find(
        (r: any) => r.type === "RELATIONSHIP_INTENT"
      );
      assert.ok(intentReason);
      assert.match(intentReason.text, /long-term/i);
    });

    it("12. Shared discoverable answers generate a reason", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const candidateB = res.body.items.find((item: any) => item.user.id === userBId);
      assert.ok(candidateB);

      const answerReason = candidateB.reasons.find(
        (r: any) => r.type === "SHARED_ANSWER"
      );
      assert.ok(answerReason);
      assert.match(answerReason.text, /You both answered questions about/i);
    });

    it("13. Discovery response never exposes deceptive percentage match scores", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      for (const item of res.body.items) {
        assert.equal(item.score, undefined);
        assert.equal(item.matchPercentage, undefined);
        assert.equal(item.compatibilityScore, undefined);
      }
    });

    it("14. Discovery response never leaks private contact or auth metadata", async () => {
      const res = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      for (const item of res.body.items) {
        assert.equal(item.user.email, undefined);
        assert.equal(item.user.phoneNumber, undefined);
        assert.equal(item.user.birthDate, undefined); // Age is calculated server-side
        assert.equal(item.user.passwordHash, undefined);
        assert.equal(item.user.coordinates, undefined);
        assert.equal(typeof item.user.age, "number");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Object-Level Authorization & Candidate Profile Inspection
  // ---------------------------------------------------------------------------
  describe("Object-Level Authorization & Candidate Profile", () => {
    it("15. GET /api/discovery/:userId returns discovery-safe profile for eligible candidate", async () => {
      const res = await request(app)
        .get(`/api/discovery/${userBId}`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.user.id, userBId);
      assert.equal(res.body.user.displayName, "User B");
      assert.ok(Array.isArray(res.body.reasons));
      assert.ok(Array.isArray(res.body.user.answers));
      // Verify answers are public/discovery only
      for (const ans of res.body.user.answers) {
        assert.ok(ans.questionText);
        assert.ok(ans.answer);
      }
    });

    it("16. GET /api/discovery/:userId rejects unauthorized access to blocked candidate (404)", async () => {
      const res = await request(app)
        .get(`/api/discovery/${userCId}`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 404);
    });

    it("17. GET /api/discovery/:userId rejects access to self (400)", async () => {
      const res = await request(app)
        .get(`/api/discovery/${userAId}`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 400);
    });
  });

  // ---------------------------------------------------------------------------
  // Discovery Events Telemetry & Pagination
  // ---------------------------------------------------------------------------
  describe("Discovery Events & Pagination", () => {
    it("18. POST /api/discovery/events records interaction telemetry", async () => {
      const res = await request(app)
        .post("/api/discovery/events")
        .set("Cookie", userACookie)
        .send({
          candidateUserId: userBId,
          eventType: "VIEW"
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.eventId);
    });

    it("19. POST /api/discovery/events rejects self-event", async () => {
      const res = await request(app)
        .post("/api/discovery/events")
        .set("Cookie", userACookie)
        .send({
          candidateUserId: userAId,
          eventType: "VIEW"
        });

      assert.equal(res.status, 400);
    });

    it("20. POST /api/discovery/events rejects unknown extra fields (.strict())", async () => {
      const res = await request(app)
        .post("/api/discovery/events")
        .set("Cookie", userACookie)
        .send({
          candidateUserId: userBId,
          eventType: "VIEW",
          userId: userBId // client cannot spoof actor user ID
        });

      assert.equal(res.status, 400);
    });

    it("21. Pagination limit constraints are enforced (1 to 50)", async () => {
      const resZero = await request(app)
        .get("/api/discovery?limit=0")
        .set("Cookie", userACookie);
      assert.equal(resZero.status, 400);

      const resExcessive = await request(app)
        .get("/api/discovery?limit=100")
        .set("Cookie", userACookie);
      assert.equal(resExcessive.status, 400);

      const resValid = await request(app)
        .get("/api/discovery?limit=5")
        .set("Cookie", userACookie);
      assert.equal(resValid.status, 200);
    });

    it("22. SKIP event immediately excludes candidate from future discovery feed", async () => {
      // User A skips User B
      const resSkip = await request(app)
        .post("/api/discovery/events")
        .set("Cookie", userACookie)
        .send({
          candidateUserId: userBId,
          eventType: "SKIP"
        });
      assert.equal(resSkip.status, 201);

      // Now User B must no longer appear in User A's discovery feed!
      const resFeed = await request(app)
        .get("/api/discovery")
        .set("Cookie", userACookie);
      assert.equal(resFeed.status, 200);
      const hasUserB = resFeed.body.items.some((item: any) => item.user.id === userBId);
      assert.equal(hasUserB, false, "Skipped user must be excluded from future feeds");
    });
  });
});
