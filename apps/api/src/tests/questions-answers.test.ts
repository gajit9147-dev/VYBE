import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { ensureDefaultProfileSeeds } from "../utils/profile-seed.js";

describe("VYBE Step 18 — Questions & Answers API", () => {
  const timestamp = Date.now();
  const userAEmail = `qa_a_${timestamp}@vybetest.com`;
  const userBEmail = `qa_b_${timestamp}@vybetest.com`;
  const testPassword = "QAPassword123!";

  let userAId = "";
  let userACookie = "";
  let userAProfileId = "";

  let userBId = "";
  let userBCookie = "";
  let userBProfileId = "";

  let seedQuestions: { id: string; questionText: string; category: string }[] = [];

  before(async () => {
    resetRateLimitStore();

    // Ensure database has default seeds including questions
    const seeds = await ensureDefaultProfileSeeds();
    seedQuestions = seeds.questions;

    // Register User A
    const resA = await request(app)
      .post("/api/auth/register")
      .send({ email: userAEmail, password: testPassword });
    assert.equal(resA.status, 201);
    userAId = resA.body.user.id;
    const cookieA = resA.headers["set-cookie"];
    userACookie = (Array.isArray(cookieA) ? cookieA[0] : cookieA).split(";")[0];

    // Initialize User A Profile
    const profA = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        displayName: "QA User Alpha",
        birthDate: "1995-04-12",
        gender: "MAN",
        bio: "Alpha QA Tester"
      });
    assert.equal(profA.status, 200);
    userAProfileId = profA.body.profile.id;

    // Register User B
    const resB = await request(app)
      .post("/api/auth/register")
      .send({ email: userBEmail, password: testPassword });
    assert.equal(resB.status, 201);
    userBId = resB.body.user.id;
    const cookieB = resB.headers["set-cookie"];
    userBCookie = (Array.isArray(cookieB) ? cookieB[0] : cookieB).split(";")[0];

    // Initialize User B Profile
    const profB = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userBCookie)
      .send({
        displayName: "QA User Beta",
        birthDate: "1997-09-24",
        gender: "WOMAN",
        bio: "Beta QA Tester"
      });
    assert.equal(profB.status, 200);
    userBProfileId = profB.body.profile.id;
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
  });

  // ---------------------------------------------------------------------------
  // 1. Question System & Catalogue Tests
  // ---------------------------------------------------------------------------
  describe("1. Question System", () => {
    it("1. GET /api/questions lists active system questions with pagination metadata", async () => {
      const res = await request(app).get("/api/questions?page=1&limit=5");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.questions));
      assert.ok(res.body.questions.length > 0);
      assert.ok(res.body.questions.length <= 5);
      assert.ok(res.body.pagination);
      assert.equal(res.body.pagination.page, 1);
      assert.equal(res.body.pagination.limit, 5);
      assert.ok(res.body.pagination.total >= seedQuestions.length);

      const q = res.body.questions[0];
      assert.ok(q.id);
      assert.ok(q.questionText);
      assert.ok(q.category);
    });

    it("2. GET /api/questions filters by category correctly", async () => {
      const res = await request(app).get("/api/questions?category=VALUES");
      assert.equal(res.status, 200);
      assert.ok(res.body.questions.length > 0);
      for (const q of res.body.questions) {
        assert.equal(q.category, "VALUES");
      }
    });

    it("3. GET /api/questions rejects invalid category", async () => {
      const res = await request(app).get("/api/questions?category=INVALID_CATEGORY");
      assert.equal(res.status, 400);
    });

    it("4. Inactive questions are not returned in active list", async () => {
      const res = await request(app).get("/api/questions?limit=100");
      assert.equal(res.status, 200);
      const hasDeprecated = res.body.questions.some((q: { questionText: string }) =>
        q.questionText.includes("Deprecated question")
      );
      assert.equal(hasDeprecated, false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. User Answers CRUD & Validation Tests
  // ---------------------------------------------------------------------------
  describe("2. User Answers Management", () => {
    let createdAnswerId = "";

    it("1. GET /api/profile/answers requires authentication", async () => {
      const res = await request(app).get("/api/profile/answers");
      assert.equal(res.status, 401);
    });

    it("2. POST /api/profile/answers creates a new answer", async () => {
      const targetQuestion = seedQuestions[0];
      const res = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: targetQuestion.id,
          answer: "Integrity and kindness in all circumstances.",
          visibility: "PUBLIC"
        });

      assert.equal(res.status, 201);
      assert.ok(res.body.answer);
      assert.equal(res.body.answer.questionId, targetQuestion.id);
      assert.equal(res.body.answer.answer, "Integrity and kindness in all circumstances.");
      assert.equal(res.body.answer.visibility, "PUBLIC");
      createdAnswerId = res.body.answer.id;
    });

    it("3. Duplicate answer on the same question is rejected (409 Conflict)", async () => {
      const targetQuestion = seedQuestions[0];
      const res = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: targetQuestion.id,
          answer: "Trying to answer again."
        });

      assert.equal(res.status, 409);
      assert.match(res.body.error.message, /already answered/i);
    });

    it("4. Empty or whitespace-only answer is rejected (400 Bad Request)", async () => {
      const targetQuestion = seedQuestions[1];
      const resEmpty = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: targetQuestion.id,
          answer: "   "
        });

      assert.equal(resEmpty.status, 400);
    });

    it("5. Oversized answer (> 500 characters) is rejected (400 Bad Request)", async () => {
      const targetQuestion = seedQuestions[1];
      const oversizedText = "A".repeat(501);
      const res = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: targetQuestion.id,
          answer: oversizedText
        });

      assert.equal(res.status, 400);
    });

    it("6. Non-existent question ID is rejected (404 Not Found)", async () => {
      const res = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: "a0000000-0000-4000-8000-000000000000",
          answer: "Valid answer text"
        });

      assert.equal(res.status, 404);
    });

    it("7. Mass assignment / extra fields rejected by .strict() (400 Bad Request)", async () => {
      const targetQuestion = seedQuestions[1];
      const res = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: targetQuestion.id,
          answer: "Valid text",
          moderationStatus: "REJECTED",
          userId: "b0000000-0000-4000-8000-000000000000",
          role: "ADMIN"
        });

      assert.equal(res.status, 400);
    });

    it("8. GET /api/profile/answers returns user's answers list", async () => {
      const res = await request(app)
        .get("/api/profile/answers")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.answers));
      const hasAnswer = res.body.answers.some(
        (a: { id: string }) => a.id === createdAnswerId
      );
      assert.ok(hasAnswer);
    });

    it("9. PATCH /api/profile/answers/:answerId updates answer text and visibility", async () => {
      const res = await request(app)
        .patch(`/api/profile/answers/${createdAnswerId}`)
        .set("Cookie", userACookie)
        .send({
          answer: "Updated answer text about integrity.",
          visibility: "DISCOVERY"
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.answer.answer, "Updated answer text about integrity.");
      assert.equal(res.body.answer.visibility, "DISCOVERY");
    });

    it("10. IDOR Protection: User B cannot PATCH User A's answer", async () => {
      const res = await request(app)
        .patch(`/api/profile/answers/${createdAnswerId}`)
        .set("Cookie", userBCookie)
        .send({
          answer: "Hacked by User B"
        });

      assert.equal(res.status, 404);
    });

    it("11. IDOR Protection: User B cannot DELETE User A's answer", async () => {
      const res = await request(app)
        .delete(`/api/profile/answers/${createdAnswerId}`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 404);
    });

    it("12. DELETE /api/profile/answers/:answerId removes answer successfully", async () => {
      const res = await request(app)
        .delete(`/api/profile/answers/${createdAnswerId}`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify it's no longer in list
      const checkRes = await request(app)
        .get("/api/profile/answers")
        .set("Cookie", userACookie);
      const stillThere = checkRes.body.answers.some(
        (a: { id: string }) => a.id === createdAnswerId
      );
      assert.equal(stillThere, false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Visibility and Privacy Tests
  // ---------------------------------------------------------------------------
  describe("3. Visibility & Privacy", () => {
    let publicAnswerId = "";
    let privateAnswerId = "";

    before(async () => {
      // Create a PUBLIC answer for User A
      const resPublic = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: seedQuestions[0].id,
          answer: "This is a public answer for discovery.",
          visibility: "PUBLIC"
        });
      assert.equal(resPublic.status, 201);
      publicAnswerId = resPublic.body.answer.id;

      // Create a PRIVATE answer for User A
      const resPrivate = await request(app)
        .post("/api/profile/answers")
        .set("Cookie", userACookie)
        .send({
          questionId: seedQuestions[1].id,
          answer: "This is a strictly private reflection.",
          visibility: "PRIVATE"
        });
      assert.equal(resPrivate.status, 201);
      privateAnswerId = resPrivate.body.answer.id;
    });

    it("1. Public answer inspection hides PRIVATE answers from other users", async () => {
      // User B inspects User A's answers
      const res = await request(app)
        .get(`/api/profile/${userAProfileId}/answers`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.answers));

      const hasPublic = res.body.answers.some(
        (a: { id: string }) => a.id === publicAnswerId
      );
      const hasPrivate = res.body.answers.some(
        (a: { id: string }) => a.id === privateAnswerId
      );

      assert.equal(hasPublic, true, "PUBLIC answer should be visible to other users");
      assert.equal(hasPrivate, false, "PRIVATE answer must NEVER be exposed to other users");
    });

    it("2. Owner can see their own PRIVATE answers via public answers route", async () => {
      const res = await request(app)
        .get(`/api/profile/${userAProfileId}/answers`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      const hasPrivate = res.body.answers.some(
        (a: { id: string }) => a.id === privateAnswerId
      );
      assert.equal(hasPrivate, true, "Owner must be able to view their own private answer");
    });

    it("3. Privacy Verification: Public answers route leaks NO credentials or private user metadata", async () => {
      const res = await request(app)
        .get(`/api/profile/${userAProfileId}/answers`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      for (const ans of res.body.answers) {
        assert.equal(ans.userId, undefined);
        assert.equal(ans.email, undefined);
        assert.equal(ans.phoneNumber, undefined);
        assert.equal(ans.passwordHash, undefined);
        assert.equal(ans.moderationStatus, undefined);
        assert.equal(ans.coordinates, undefined);
      }
    });
  });
});
