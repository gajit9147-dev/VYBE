import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { ensureDefaultProfileSeeds } from "../utils/profile-seed.js";

describe("VYBE Step 17 — Interests and Relationship Preferences API", () => {
  const timestamp = Date.now();
  const userAEmail = `pref_a_${timestamp}@vybetest.com`;
  const userBEmail = `pref_b_${timestamp}@vybetest.com`;
  const testPassword = "PreferencesTestPass123!";

  let userAId = "";
  let userACookie = "";
  let userBId = "";
  let userBCookie = "";

  let seedInterests: { id: string; name: string; slug: string }[] = [];
  let seedIntents: { id: string; code: string; label: string }[] = [];

  before(async () => {
    resetRateLimitStore();

    // Ensure database has default seeds
    const seeds = await ensureDefaultProfileSeeds();
    seedInterests = seeds.interests;
    seedIntents = seeds.intents;

    // Register User A
    const resA = await request(app)
      .post("/api/auth/register")
      .send({ email: userAEmail, password: testPassword });
    assert.equal(resA.status, 201);
    userAId = resA.body.user.id;
    const cookieA = resA.headers["set-cookie"];
    userACookie = (Array.isArray(cookieA) ? cookieA[0] : cookieA).split(";")[0];

    // Initialize User A's profile
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        displayName: "User Alpha",
        birthDate: "1996-05-15",
        gender: "MAN",
        bio: "Alpha test user bio"
      });

    // Register User B
    const resB = await request(app)
      .post("/api/auth/register")
      .send({ email: userBEmail, password: testPassword });
    assert.equal(resB.status, 201);
    userBId = resB.body.user.id;
    const cookieB = resB.headers["set-cookie"];
    userBCookie = (Array.isArray(cookieB) ? cookieB[0] : cookieB).split(";")[0];

    // Initialize User B's profile
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userBCookie)
      .send({
        displayName: "User Beta",
        birthDate: "1998-08-20",
        gender: "WOMAN",
        bio: "Beta test user bio"
      });
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
  // A. Interests Tests
  // ---------------------------------------------------------------------------
  describe("A. Normalized Interests", () => {
    it("1. GET /api/interests returns system-defined active interests with categories", async () => {
      const res = await request(app).get("/api/interests");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.interests));
      assert.ok(res.body.interests.length > 0);

      const first = res.body.interests[0];
      assert.ok(first.id);
      assert.ok(first.name);
      assert.ok(first.slug);
      assert.ok(first.category);
      assert.ok(first.category.name);
    });

    it("2. GET /api/profile/interests requires authentication", async () => {
      const res = await request(app).get("/api/profile/interests");
      assert.equal(res.status, 401);
    });

    it("3. POST /api/profile/interests allows user to add an interest", async () => {
      const targetInterest = seedInterests[0];
      const res = await request(app)
        .post("/api/profile/interests")
        .set("Cookie", userACookie)
        .send({ interestId: targetInterest.id });

      assert.equal(res.status, 201);
      assert.equal(res.body.interest.interestId, targetInterest.id);
      assert.equal(res.body.interest.name, targetInterest.name);
    });

    it("4. POST /api/profile/interests prevents duplicate interest addition (409 Conflict)", async () => {
      const targetInterest = seedInterests[0];
      const res = await request(app)
        .post("/api/profile/interests")
        .set("Cookie", userACookie)
        .send({ interestId: targetInterest.id });

      assert.equal(res.status, 409);
      assert.match(res.body.error.message, /already added/i);
    });

    it("5. POST /api/profile/interests rejects invalid UUID or non-existent interest", async () => {
      const resInvalid = await request(app)
        .post("/api/profile/interests")
        .set("Cookie", userACookie)
        .send({ interestId: "not-a-uuid" });
      assert.equal(resInvalid.status, 400);

      const resNotFound = await request(app)
        .post("/api/profile/interests")
        .set("Cookie", userACookie)
        .send({ interestId: "a0000000-0000-4000-8000-000000000000" });
      assert.equal(resNotFound.status, 404);
    });

    it("6. GET /api/profile/interests returns user's associated interests", async () => {
      const res = await request(app)
        .get("/api/profile/interests")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.interests));
      const hasAddedInterest = res.body.interests.some(
        (i: { interestId: string }) => i.interestId === seedInterests[0].id
      );
      assert.ok(hasAddedInterest);
    });

    it("7. IDOR Protection: User B cannot delete User A's interest", async () => {
      // User A added seedInterests[0], but User B hasn't added it
      const res = await request(app)
        .delete(`/api/profile/interests/${seedInterests[0].id}`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 404);
      assert.match(res.body.error.message, /not associated with your profile/i);
    });

    it("8. DELETE /api/profile/interests/:interestId removes interest from own profile", async () => {
      const res = await request(app)
        .delete(`/api/profile/interests/${seedInterests[0].id}`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify removal
      const checkRes = await request(app)
        .get("/api/profile/interests")
        .set("Cookie", userACookie);
      const stillHas = checkRes.body.interests.some(
        (i: { interestId: string }) => i.interestId === seedInterests[0].id
      );
      assert.equal(stillHas, false);
    });
  });

  // ---------------------------------------------------------------------------
  // B. Relationship Intent Tests
  // ---------------------------------------------------------------------------
  describe("B. Controlled Relationship Intent", () => {
    it("1. GET /api/relationship-intents returns system-defined relationship intents", async () => {
      const res = await request(app).get("/api/relationship-intents");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.intents));
      assert.ok(res.body.intents.length > 0);

      const first = res.body.intents[0];
      assert.ok(first.id);
      assert.ok(first.code);
      assert.ok(first.label);
      assert.ok(first.description);
    });

    it("2. GET /api/profile/relationship-intents requires authentication", async () => {
      const res = await request(app).get("/api/profile/relationship-intents");
      assert.equal(res.status, 401);
    });

    it("3. PUT /api/profile/relationship-intents sets user relationship intents", async () => {
      assert.ok(seedIntents.length >= 2, "Requires at least 2 seeded intents");
      const chosenIntents = [seedIntents[0].id, seedIntents[1].id];

      const res = await request(app)
        .put("/api/profile/relationship-intents")
        .set("Cookie", userACookie)
        .send({
          intentIds: chosenIntents,
          primaryIntentId: seedIntents[0].id,
          customClarification: "Looking for something meaningful."
        });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.relationshipIntents));
      assert.equal(res.body.relationshipIntents.length, 2);

      const primary = res.body.relationshipIntents.find((i: { isPrimary: boolean }) => i.isPrimary);
      assert.ok(primary);
      assert.equal(primary.intentId, seedIntents[0].id);
      assert.equal(primary.customClarification, "Looking for something meaningful.");
    });

    it("4. PUT /api/profile/relationship-intents rejects primaryIntentId not in intentIds", async () => {
      const res = await request(app)
        .put("/api/profile/relationship-intents")
        .set("Cookie", userACookie)
        .send({
          intentIds: [seedIntents[0].id],
          primaryIntentId: seedIntents[1].id // not in intentIds
        });

      assert.equal(res.status, 400);
    });

    it("5. PUT /api/profile/relationship-intents rejects nonexistent intent ID", async () => {
      const res = await request(app)
        .put("/api/profile/relationship-intents")
        .set("Cookie", userACookie)
        .send({
          intentIds: ["a0000000-0000-4000-8000-000000000000"]
        });

      assert.equal(res.status, 400);
    });

    it("6. GET /api/profile/relationship-intents returns saved relationship intents", async () => {
      const res = await request(app)
        .get("/api/profile/relationship-intents")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.relationshipIntents));
      assert.equal(res.body.relationshipIntents.length, 2);
    });
  });

  // ---------------------------------------------------------------------------
  // C. Discovery Preferences Tests
  // ---------------------------------------------------------------------------
  describe("C. Discovery Preferences", () => {
    it("1. GET /api/profile/preferences requires authentication", async () => {
      const res = await request(app).get("/api/profile/preferences");
      assert.equal(res.status, 401);
    });

    it("2. GET /api/profile/preferences returns default discovery preferences", async () => {
      const res = await request(app)
        .get("/api/profile/preferences")
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.ok(res.body.preferences);
      assert.equal(typeof res.body.preferences.minAge, "number");
      assert.equal(typeof res.body.preferences.maxAge, "number");
      assert.equal(typeof res.body.preferences.maxDistanceKm, "number");
      assert.ok(Array.isArray(res.body.preferences.interestedInGenders));
      assert.equal(typeof res.body.preferences.isDiscoveryPaused, "boolean");
    });

    it("3. PUT /api/profile/preferences updates discovery settings and pauses discovery", async () => {
      const res = await request(app)
        .put("/api/profile/preferences")
        .set("Cookie", userACookie)
        .send({
          minAge: 24,
          maxAge: 36,
          isAgeDealbreaker: true,
          maxDistanceKm: 75,
          isDistanceDealbreaker: true,
          interestedInGenders: ["WOMAN"],
          isDiscoveryPaused: true
        });

      assert.equal(res.status, 200);
      const p = res.body.preferences;
      assert.equal(p.minAge, 24);
      assert.equal(p.maxAge, 36);
      assert.equal(p.isAgeDealbreaker, true);
      assert.equal(p.maxDistanceKm, 75);
      assert.equal(p.isDistanceDealbreaker, true);
      assert.deepEqual(p.interestedInGenders, ["WOMAN"]);
      assert.equal(p.isDiscoveryPaused, true);
    });

    it("4. PUT /api/profile/preferences rejects inverted age ranges (minAge > maxAge)", async () => {
      const res = await request(app)
        .put("/api/profile/preferences")
        .set("Cookie", userACookie)
        .send({
          minAge: 40,
          maxAge: 25
        });

      assert.equal(res.status, 400);
      assert.match(res.body.error.message, /Minimum age cannot be greater than maximum age/i);
    });

    it("5. PUT /api/profile/preferences rejects underage bound (< 18)", async () => {
      const res = await request(app)
        .put("/api/profile/preferences")
        .set("Cookie", userACookie)
        .send({
          minAge: 16,
          maxAge: 25
        });

      assert.equal(res.status, 400);
    });

    it("6. PUT /api/profile/preferences rejects distance <= 0", async () => {
      const resZero = await request(app)
        .put("/api/profile/preferences")
        .set("Cookie", userACookie)
        .send({ maxDistanceKm: 0 });
      assert.equal(resZero.status, 400);

      const resNegative = await request(app)
        .put("/api/profile/preferences")
        .set("Cookie", userACookie)
        .send({ maxDistanceKm: -15 });
      assert.equal(resNegative.status, 400);
    });

    it("7. PUT /api/profile/preferences rejects unauthorized mass-assignment / extra fields (.strict())", async () => {
      const res = await request(app)
        .put("/api/profile/preferences")
        .set("Cookie", userACookie)
        .send({
          minAge: 25,
          maxAge: 35,
          role: "ADMIN",
          isVerified: true,
          latitude: 37.7749,
          longitude: -122.4194
        });

      assert.equal(res.status, 400);
    });

    it("8. Privacy Guarantee: Public profile GET /api/profile/:id does not expose preferences or settings", async () => {
      const res = await request(app)
        .get(`/api/profile/${userAId}`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      assert.ok(res.body.profile);
      assert.equal(res.body.profile.discoveryPreferences, undefined);
      assert.equal(res.body.profile.minAge, undefined);
      assert.equal(res.body.profile.maxAge, undefined);
      assert.equal(res.body.profile.maxDistanceKm, undefined);
      assert.equal(res.body.profile.isDiscoveryPaused, undefined);
    });
  });
});
