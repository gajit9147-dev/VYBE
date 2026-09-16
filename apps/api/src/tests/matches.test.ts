import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";

import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { ensureDefaultProfileSeeds } from "../utils/profile-seed.js";

describe("VYBE Step 21 — Mutual Matching System API", () => {
  const timestamp = Date.now();
  const testPassword = "ValidPassword123!";

  let seedInterests: any[] = [];
  let seedIntents: any[] = [];
  let seedQuestions: any[] = [];

  let userAId: string;
  let userACookie: string;

  let userBId: string;
  let userBCookie: string;

  let userCId: string;
  let userCCookie: string;

  let userBlockedId: string;
  let userSuspendedId: string;
  let userBannedId: string;
  let userIneligibleId: string;

  let createdMatchId: string;

  const createdUserIds: string[] = [];

  async function registerAndInitUser(params: {
    email: string;
    displayName: string;
    birthDate: string;
    gender: "MAN" | "WOMAN" | "NON_BINARY";
    interestedInGenders?: ("MAN" | "WOMAN" | "NON_BINARY")[];
    minAge?: number;
    maxAge?: number;
    city?: string;
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
        city: params.city ?? "San Francisco",
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

    // User A: Male, 28, shares interest[0], shares intent[0], shares question[0] (PUBLIC)
    const a = await registerAndInitUser({
      email: `match_a_${timestamp}@vybetest.com`,
      displayName: "User A",
      birthDate: "1998-05-10",
      gender: "MAN",
      interestedInGenders: ["WOMAN"],
      interestIds: [seedInterests[0].id],
      intentIds: [seedIntents[0].id]
    });
    userAId = a.id;
    userACookie = a.cookie;

    await request(app)
      .post("/api/profile/answers")
      .set("Cookie", userACookie)
      .send({
        questionId: seedQuestions[0].id,
        answer: "A commitment to empathy and growth.",
        visibility: "PUBLIC"
      });

    // User B: Female, 26, shares interest[0], shares intent[0], shares question[0] (DISCOVERY), and private answer on question[1]
    const b = await registerAndInitUser({
      email: `match_b_${timestamp}@vybetest.com`,
      displayName: "User B",
      birthDate: "2000-08-15",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      interestIds: [seedInterests[0].id],
      intentIds: [seedIntents[0].id]
    });
    userBId = b.id;
    userBCookie = b.cookie;

    await request(app)
      .post("/api/profile/answers")
      .set("Cookie", userBCookie)
      .send({
        questionId: seedQuestions[0].id,
        answer: "Empathy and curiosity above all.",
        visibility: "DISCOVERY"
      });

    // Add private answer on question[1] for User B and User A
    if (seedQuestions.length > 1) {
      await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: seedQuestions[1].id,
          answer: "Private secret answer from User A",
          visibility: "PRIVATE"
        });

      await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userBCookie)
        .send({
          questionId: seedQuestions[1].id,
          answer: "Private secret answer from User B",
          visibility: "PRIVATE"
        });
    }

    // User C: Third user for security, authorization, and boundary testing
    const c = await registerAndInitUser({
      email: `match_c_${timestamp}@vybetest.com`,
      displayName: "User C",
      birthDate: "1999-04-12",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userCId = c.id;
    userCCookie = c.cookie;

    // Blocked user
    const blk = await registerAndInitUser({
      email: `match_blk_${timestamp}@vybetest.com`,
      displayName: "Blocked User",
      birthDate: "2000-02-14",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userBlockedId = blk.id;
    await prisma.userBlock.create({
      data: {
        blockerUserId: userAId,
        blockedUserId: userBlockedId
      }
    });

    // Suspended user
    const susp = await registerAndInitUser({
      email: `match_susp_${timestamp}@vybetest.com`,
      displayName: "Suspended User",
      birthDate: "2000-03-10",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userSuspendedId = susp.id;
    await prisma.user.update({
      where: { id: userSuspendedId },
      data: { status: "SUSPENDED" }
    });

    // Banned user
    const ban = await registerAndInitUser({
      email: `match_ban_${timestamp}@vybetest.com`,
      displayName: "Banned User",
      birthDate: "2000-03-15",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userBannedId = ban.id;
    await prisma.user.update({
      where: { id: userBannedId },
      data: { status: "BANNED" }
    });

    // Ineligible user (gender preference mismatch: MAN seeking MAN)
    const inelig = await registerAndInitUser({
      email: `match_inelig_${timestamp}@vybetest.com`,
      displayName: "Ineligible User",
      birthDate: "1997-01-20",
      gender: "MAN",
      interestedInGenders: ["MAN"]
    });
    userIneligibleId = inelig.id;
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
  // 1. Core Mutual Matching Creation Tests
  // ---------------------------------------------------------------------------
  describe("1. Match Creation", () => {
    it("1. A likes B -> no Match created", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.liked, true);
      assert.equal(res.body.match, undefined);

      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: userAId, user2Id: userBId },
            { user1Id: userBId, user2Id: userAId }
          ]
        }
      });
      assert.equal(match, null, "One-way like must NOT create a Match");
    });

    it("2. B likes A -> exactly one Match created", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userAId}/like`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.liked, true);
      assert.ok(res.body.match);
      assert.ok(res.body.match.id);

      createdMatchId = res.body.match.id;

      // Verify in DB
      const match = await prisma.match.findUnique({
        where: { id: createdMatchId },
        include: { reasons: true, events: true }
      });
      assert.ok(match);
      assert.equal(match.status, "ACTIVE");

      // Verify deterministic user ordering
      const [expectedUser1, expectedUser2] =
        userAId < userBId ? [userAId, userBId] : [userBId, userAId];
      assert.equal(match.user1Id, expectedUser1);
      assert.equal(match.user2Id, expectedUser2);

      // Verify reasons were populated
      assert.ok(match.reasons.length >= 1, "Match reasons must be generated");
      // Verify MATCH_CREATED event was recorded
      assert.ok(match.events.some((e) => e.type === "MATCH_CREATED"));
    });

    it("3. A likes B twice -> no duplicate Like", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);

      const count = await prisma.profileInteraction.count({
        where: { actorUserId: userAId, targetUserId: userBId }
      });
      assert.equal(count, 1, "ProfileInteraction must remain unique");
    });

    it("4. B likes A twice -> no duplicate Like", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userAId}/like`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);

      const count = await prisma.profileInteraction.count({
        where: { actorUserId: userBId, targetUserId: userAId }
      });
      assert.equal(count, 1, "ProfileInteraction must remain unique");
    });

    it("5. Mutual Likes -> exactly one Match in database", async () => {
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { user1Id: userAId, user2Id: userBId },
            { user1Id: userBId, user2Id: userAId }
          ]
        }
      });
      assert.equal(matches.length, 1, "There must be exactly one Match record for the user pair");
    });

    it("6. A passes C -> no Match", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userCId}/pass`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.passed, true);

      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: userAId, user2Id: userCId },
            { user1Id: userCId, user2Id: userAId }
          ]
        }
      });
      assert.equal(match, null, "PASS must never create a Match");
    });

    it("7. A likes C, C passes A -> no Match", async () => {
      // A changes pass to like on C
      await request(app).post(`/api/discovery/${userCId}/like`).set("Cookie", userACookie);

      // C passes A
      const resPass = await request(app)
        .post(`/api/discovery/${userAId}/pass`)
        .set("Cookie", userCCookie);
      assert.equal(resPass.status, 200);

      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: userAId, user2Id: userCId },
            { user1Id: userCId, user2Id: userAId }
          ]
        }
      });
      assert.equal(match, null, "A like + A pass must NOT create a Match");
    });

    it("8. Existing Match -> repeated processing does not create duplicate Match", async () => {
      await request(app).post(`/api/discovery/${userBId}/like`).set("Cookie", userACookie);
      await request(app).post(`/api/discovery/${userAId}/like`).set("Cookie", userBCookie);

      const totalMatches = await prisma.match.count({
        where: {
          OR: [
            { user1Id: userAId, user2Id: userBId },
            { user1Id: userBId, user2Id: userAId }
          ]
        }
      });
      assert.equal(totalMatches, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Safety & Eligibility Constraints
  // ---------------------------------------------------------------------------
  describe("2. Safety & Eligibility Constraints", () => {
    it("9. Blocked candidate cannot be liked / matched", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBlockedId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 404);
    });

    it("10. Suspended candidate cannot be liked / matched", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userSuspendedId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 404);
    });

    it("11. Banned candidate cannot be liked / matched", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBannedId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 404);
    });

    it("12. Ineligible relationship (gender preference mismatch) cannot be liked / matched", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userIneligibleId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 400);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Privacy & Match Reason Truthfulness
  // ---------------------------------------------------------------------------
  describe("3. Match Reason Truthfulness & Privacy", () => {
    it("13. Private answers are NEVER exposed as match reasons", async () => {
      const reasons = await prisma.matchReason.findMany({
        where: { matchId: createdMatchId }
      });

      for (const r of reasons) {
        assert.doesNotMatch(r.text, /secret/i);
        assert.doesNotMatch(r.text, /private/i);
      }
    });

    it("14. Matches-only answer / public answers are truthful and backed by real DB data", async () => {
      const reasons = await prisma.matchReason.findMany({
        where: { matchId: createdMatchId }
      });

      // User A and User B share seedInterests[0] and question[0]
      const interestReason = reasons.find((r) => r.type === "SHARED_INTEREST");
      assert.ok(interestReason);
      assert.match(interestReason.text, new RegExp(seedInterests[0].name, "i"));

      const intentReason = reasons.find((r) => r.type === "RELATIONSHIP_INTENT");
      assert.ok(intentReason);

      // Verify no fake compatibility percentages
      for (const r of reasons) {
        assert.doesNotMatch(r.text, /%/);
        assert.doesNotMatch(r.text, /compatible/i);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Object-Level Authorization & Match Ownership
  // ---------------------------------------------------------------------------
  describe("4. Object-Level Authorization", () => {
    it("15. Unrelated User C cannot access Match(A, B) via GET (403)", async () => {
      const res = await request(app)
        .get(`/api/matches/${createdMatchId}`)
        .set("Cookie", userCCookie);

      assert.equal(res.status, 403);
    });

    it("16. Unrelated User C cannot unmatch Match(A, B) via DELETE (403)", async () => {
      const res = await request(app)
        .delete(`/api/matches/${createdMatchId}`)
        .set("Cookie", userCCookie);

      assert.equal(res.status, 403);
    });

    it("17. Participant User A can inspect Match(A, B)", async () => {
      const res = await request(app)
        .get(`/api/matches/${createdMatchId}`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.id, createdMatchId);
      assert.equal(res.body.user.id, userBId);
      assert.equal(res.body.user.displayName, "User B");
      assert.ok(Array.isArray(res.body.reasons));
    });

    it("18. Participant User B can inspect Match(A, B)", async () => {
      const res = await request(app)
        .get(`/api/matches/${createdMatchId}`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.id, createdMatchId);
      assert.equal(res.body.user.id, userAId);
      assert.equal(res.body.user.displayName, "User A");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Unmatch Lifecycle & Listing
  // ---------------------------------------------------------------------------
  describe("5. Unmatch Lifecycle & Match Listing", () => {
    it("19. Active matches list includes Match(A, B) for User A", async () => {
      const res = await request(app).get("/api/matches").set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
      const found = res.body.items.find((m: any) => m.id === createdMatchId);
      assert.ok(found);
      assert.equal(found.user.id, userBId);
    });

    it("20. Participant User A can unmatch Match(A, B)", async () => {
      const res = await request(app)
        .delete(`/api/matches/${createdMatchId}`)
        .set("Cookie", userACookie)
        .send({ reasonCode: "NO_LONGER_INTERESTED" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.unmatched, true);
      assert.equal(res.body.status, "UNMATCHED");

      // Verify DB status
      const match = await prisma.match.findUnique({
        where: { id: createdMatchId },
        include: { events: true }
      });
      assert.ok(match);
      assert.equal(match.status, "UNMATCHED");
      assert.equal(match.closedByUserId, userAId);
      assert.equal(match.unmatchReasonCode, "NO_LONGER_INTERESTED");
      assert.ok(match.events.some((e) => e.type === "MATCH_UNMATCHED"));
    });

    it("21. Unmatched Match no longer appears in active GET /api/matches", async () => {
      const resA = await request(app).get("/api/matches").set("Cookie", userACookie);
      assert.equal(resA.status, 200);
      const foundA = resA.body.items.find((m: any) => m.id === createdMatchId);
      assert.equal(foundA, undefined, "Unmatched match must not appear in active list for User A");

      const resB = await request(app).get("/api/matches").set("Cookie", userBCookie);
      assert.equal(resB.status, 200);
      const foundB = resB.body.items.find((m: any) => m.id === createdMatchId);
      assert.equal(foundB, undefined, "Unmatched match must not appear in active list for User B");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Pagination, Validation & Privacy DTO Audit
  // ---------------------------------------------------------------------------
  describe("6. Pagination, Input Validation & Security", () => {
    it("22. Malformed Match ID is rejected (400)", async () => {
      const resGet = await request(app).get("/api/matches/not-a-uuid").set("Cookie", userACookie);
      assert.equal(resGet.status, 400);

      const resDel = await request(app)
        .delete("/api/matches/not-a-uuid")
        .set("Cookie", userACookie);
      assert.equal(resDel.status, 400);
    });

    it("23. Matches API returns clean DTOs without leaking sensitive fields", async () => {
      const res = await request(app).get("/api/matches").set("Cookie", userACookie);
      assert.equal(res.status, 200);

      for (const item of res.body.items) {
        assert.equal(item.user.email, undefined);
        assert.equal(item.user.phoneNumber, undefined);
        assert.equal(item.user.birthDate, undefined);
        assert.equal(item.user.passwordHash, undefined);
        assert.equal(item.user.latitude, undefined);
        assert.equal(item.user.longitude, undefined);
      }
    });

    it("24. Concurrent mutual likes simulation creates exactly one Match", async () => {
      // Create two fresh paired test users
      const u1 = await registerAndInitUser({
        email: `race_1_${timestamp}@vybetest.com`,
        displayName: "Race User 1",
        birthDate: "1998-01-01",
        gender: "MAN",
        interestedInGenders: ["WOMAN"]
      });

      const u2 = await registerAndInitUser({
        email: `race_2_${timestamp}@vybetest.com`,
        displayName: "Race User 2",
        birthDate: "1999-01-01",
        gender: "WOMAN",
        interestedInGenders: ["MAN"]
      });

      // Execute reciprocal likes concurrently
      const [res1, res2] = await Promise.all([
        request(app).post(`/api/discovery/${u2.id}/like`).set("Cookie", u1.cookie),
        request(app).post(`/api/discovery/${u1.id}/like`).set("Cookie", u2.cookie)
      ]);

      assert.equal(res1.status, 200);
      assert.equal(res2.status, 200);

      // Verify exactly one match row in DB
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { user1Id: u1.id, user2Id: u2.id },
            { user1Id: u2.id, user2Id: u1.id }
          ]
        }
      });
      assert.equal(matches.length, 1, "Concurrent reciprocal likes must produce exactly 1 Match");
    });
  });
});
