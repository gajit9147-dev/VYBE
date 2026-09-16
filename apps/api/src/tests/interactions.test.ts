import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { ensureDefaultProfileSeeds } from "../utils/profile-seed.js";

describe("VYBE Step 20 — Likes & Pass System API", () => {
  const timestamp = Date.now();
  const testPassword = "InteractionsPassword123!";

  let userAId = "";
  let userACookie = "";

  let userBId = "";
  let userBCookie = "";

  let userCId = "";
  let userCCookie = "";

  let userBlockedId = "";
  let userSuspendedId = "";
  let userHiddenId = "";

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

    // User A: Male, 28, shares interest[0] (Photography) with B, shares question[0] with B
    const a = await registerAndInitUser({
      email: `like_a_${timestamp}@vybetest.com`,
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

    // User B: Female, 26, shares interest[0] (Photography) with A, shares question[0] with A
    const b = await registerAndInitUser({
      email: `like_b_${timestamp}@vybetest.com`,
      displayName: "User B",
      birthDate: "2000-08-15",
      gender: "WOMAN",
      interestedInGenders: ["MAN", "WOMAN"],
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

    // User C: Third user for security and authorization boundary testing
    const c = await registerAndInitUser({
      email: `like_c_${timestamp}@vybetest.com`,
      displayName: "User C",
      birthDate: "1999-04-12",
      gender: "WOMAN",
      interestedInGenders: ["MAN", "WOMAN"]
    });
    userCId = c.id;
    userCCookie = c.cookie;

    // Blocked user
    const blocked = await registerAndInitUser({
      email: `like_blk_${timestamp}@vybetest.com`,
      displayName: "Blocked User",
      birthDate: "2000-02-14",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userBlockedId = blocked.id;
    await prisma.userBlock.create({
      data: {
        blockerUserId: userAId,
        blockedUserId: userBlockedId
      }
    });

    // Suspended user
    const suspended = await registerAndInitUser({
      email: `like_susp_${timestamp}@vybetest.com`,
      displayName: "Suspended User",
      birthDate: "2000-03-10",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userSuspendedId = suspended.id;
    await prisma.user.update({
      where: { id: userSuspendedId },
      data: { status: "SUSPENDED" }
    });

    // Hidden profile user
    const hidden = await registerAndInitUser({
      email: `like_hid_${timestamp}@vybetest.com`,
      displayName: "Hidden User",
      birthDate: "2000-06-20",
      gender: "WOMAN",
      interestedInGenders: ["MAN"],
      isDiscoverable: false
    });
    userHiddenId = hidden.id;
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
  // 1. LIKE Action Tests
  // ---------------------------------------------------------------------------
  describe("1. LIKE Action", () => {
    it("1. Unauthenticated LIKE is rejected (401)", async () => {
      const res = await request(app).post(`/api/discovery/${userBId}/like`);
      assert.equal(res.status, 401);
    });

    it("2. Authenticated user can LIKE an eligible candidate", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.liked, true);

      // Verify no match was created
      const match = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: userAId, user2Id: userBId },
            { user1Id: userBId, user2Id: userAId }
          ]
        }
      });
      assert.equal(match, null, "LIKE must NOT create a Match in Step 20");
    });

    it("3. Idempotent LIKE: liking again succeeds without creating duplicate rows", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.liked, true);

      const count = await prisma.profileInteraction.count({
        where: { actorUserId: userAId, targetUserId: userBId }
      });
      assert.equal(count, 1, "There must be exactly 1 interaction record");
    });

    it("4. Self-LIKE is rejected (400)", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userAId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 400);
    });

    it("5. Malformed candidate UUID is rejected (400)", async () => {
      const res = await request(app)
        .post("/api/discovery/not-a-valid-uuid/like")
        .set("Cookie", userACookie);

      assert.equal(res.status, 400);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PASS Action Tests
  // ---------------------------------------------------------------------------
  describe("2. PASS Action", () => {
    it("6. Unauthenticated PASS is rejected (401)", async () => {
      const res = await request(app).post(`/api/discovery/${userCId}/pass`);
      assert.equal(res.status, 401);
    });

    it("7. Authenticated user can PASS an eligible candidate", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userCId}/pass`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.passed, true);
    });

    it("8. Idempotent PASS: passing again succeeds without duplicate rows", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userCId}/pass`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.passed, true);

      const count = await prisma.profileInteraction.count({
        where: { actorUserId: userAId, targetUserId: userCId }
      });
      assert.equal(count, 1);
    });

    it("9. Self-PASS is rejected (400)", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userAId}/pass`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 400);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. State Transitions (LIKE overwrites PASS, PASS overwrites LIKE)
  // ---------------------------------------------------------------------------
  describe("3. State Transitions & Mutual Exclusivity", () => {
    it("10. PASS overwrites a previous LIKE on the same candidate", async () => {
      // User A currently likes User B -> now passes User B
      const resPass = await request(app)
        .post(`/api/discovery/${userBId}/pass`)
        .set("Cookie", userACookie);

      assert.equal(resPass.status, 200);
      assert.equal(resPass.body.passed, true);

      // Check database state
      const interaction = await prisma.profileInteraction.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: userAId,
            targetUserId: userBId
          }
        }
      });
      assert.ok(interaction);
      assert.equal(interaction.action, "PASS");
    });

    it("11. LIKE overwrites a previous PASS on the same candidate", async () => {
      // User A currently passes User B -> now likes User B
      const resLike = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      assert.equal(resLike.status, 200);
      assert.equal(resLike.body.liked, true);

      // Check database state
      const interaction = await prisma.profileInteraction.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: userAId,
            targetUserId: userBId
          }
        }
      });
      assert.ok(interaction);
      assert.equal(interaction.action, "LIKE");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Undo Actions (DELETE LIKE & DELETE PASS)
  // ---------------------------------------------------------------------------
  describe("4. Undo Action (DELETE)", () => {
    it("12. DELETE /api/discovery/:id/like removes user's own like", async () => {
      const res = await request(app)
        .delete(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.unliked, true);

      // Verify removal
      const check = await prisma.profileInteraction.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: userAId,
            targetUserId: userBId
          }
        }
      });
      assert.equal(check, null);
    });

    it("13. DELETE /api/discovery/:id/pass removes user's own pass", async () => {
      const res = await request(app)
        .delete(`/api/discovery/${userCId}/pass`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.unpassed, true);

      // Verify removal
      const check = await prisma.profileInteraction.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: userAId,
            targetUserId: userCId
          }
        }
      });
      assert.equal(check, null);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Own Action Query (GET /api/discovery/:id/action)
  // ---------------------------------------------------------------------------
  describe("5. Own Action Query", () => {
    it("14. GET /api/discovery/:id/action returns NONE when no action exists", async () => {
      const res = await request(app)
        .get(`/api/discovery/${userBId}/action`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.action, "NONE");
    });

    it("15. GET /api/discovery/:id/action returns LIKE when liked", async () => {
      await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      const res = await request(app)
        .get(`/api/discovery/${userBId}/action`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.action, "LIKE");
    });

    it("16. User B querying User A action does NOT reveal User A's like", async () => {
      // User A likes User B. User B queries action toward User A -> must return NONE!
      const res = await request(app)
        .get(`/api/discovery/${userAId}/action`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.action, "NONE", "User B must not see User A's incoming like");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Like With Reason
  // ---------------------------------------------------------------------------
  describe("6. Like With Reason", () => {
    it("17. LIKE with valid supported reason (SHARED_INTEREST) succeeds", async () => {
      // Users A and B share Photography
      const res = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie)
        .send({
          reasonType: "SHARED_INTEREST"
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.liked, true);

      const interaction = await prisma.profileInteraction.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: userAId,
            targetUserId: userBId
          }
        }
      });
      assert.equal(interaction?.reasonType, "SHARED_INTEREST");
    });

    it("18. LIKE with unsupported reason (e.g. SHARED_INTEREST when no interest shared) is rejected (400)", async () => {
      // User C has no shared interests with User A
      const res = await request(app)
        .post(`/api/discovery/${userCId}/like`)
        .set("Cookie", userACookie)
        .send({
          reasonType: "SHARED_INTEREST"
        });

      assert.equal(res.status, 400);
      assert.match(res.body.error.message, /not supported/i);
    });

    it("19. Unsupported reason type rejected by schema (400)", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie)
        .send({
          reasonType: "UNSUPPORTED_REASON_TYPE"
        });

      assert.equal(res.status, 400);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Eligibility & Safety Constraints
  // ---------------------------------------------------------------------------
  describe("7. Eligibility & Safety Constraints", () => {
    it("20. Blocked candidate cannot be liked", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBlockedId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 404);
    });

    it("21. Suspended candidate cannot be liked", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userSuspendedId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 404);
    });

    it("22. Hidden candidate (isDiscoverable=false) cannot be liked", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userHiddenId}/like`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 404);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. OWASP BOLA & Security Tests
  // ---------------------------------------------------------------------------
  describe("8. Security & Authorization", () => {
    it("23. Actor cannot spoof caller ID via request payload (.strict())", async () => {
      const res = await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie)
        .send({
          actorUserId: userCId // attempt to like on behalf of User C
        });

      assert.equal(res.status, 400);
    });

    it("24. User A cannot delete User C's like toward User B", async () => {
      // First, User C likes User B
      await request(app)
        .post(`/api/discovery/${userBId}/like`)
        .set("Cookie", userCCookie);

      // User A attempts to delete like toward User B
      // This will only affect User A's outgoing like (which currently is liked or none), but CANNOT affect C's like!
      await request(app)
        .delete(`/api/discovery/${userBId}/like`)
        .set("Cookie", userACookie);

      // User C's like toward User B must still be intact!
      const cLike = await prisma.profileInteraction.findUnique({
        where: {
          actorUserId_targetUserId: {
            actorUserId: userCId,
            targetUserId: userBId
          }
        }
      });
      assert.ok(cLike);
      assert.equal(cLike.action, "LIKE");
    });
  });
});
