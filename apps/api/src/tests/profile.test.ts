import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { ensureDefaultProfileSeeds } from "../utils/profile-seed.js";

describe("VYBE User Profile API", () => {
  const timestamp = Date.now();
  const userAEmail = `profile_a_${timestamp}@vybetest.com`;
  const userBEmail = `profile_b_${timestamp}@vybetest.com`;
  const testPassword = "ProfilePassword123!";

  let userAId = "";
  let userACookie = "";
  let userBId = "";
  let userBCookie = "";

  let seedInterests: { id: string; name: string; slug: string }[] = [];
  let seedTemplates: { id: string; question: string; category: string }[] = [];
  let seedIntents: { id: string; code: string; label: string }[] = [];

  before(async () => {
    resetRateLimitStore();

    // Seed interests, prompts, and relationship intents
    const seeds = await ensureDefaultProfileSeeds();
    seedInterests = seeds.interests;
    seedTemplates = seeds.templates;
    seedIntents = seeds.intents;

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
  });

  it("1. GET /api/profile/me initially returns null profile for newly registered user", async () => {
    const res = await request(app)
      .get("/api/profile/me")
      .set("Cookie", userACookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.profile, null);
    assert.ok(res.body.message);
  });

  it("2. GET /api/profile/me rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/profile/me");
    assert.equal(res.status, 401);
  });

  it("3. PATCH /api/profile/me enforces minimum age of 18 years", async () => {
    // Attempting to register birthDate showing age < 18
    const underAgeBirthDate = new Date();
    underAgeBirthDate.setFullYear(underAgeBirthDate.getFullYear() - 16);
    const dateString = underAgeBirthDate.toISOString().split("T")[0];

    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        displayName: "Youngster",
        birthDate: dateString,
        gender: "WOMAN"
      });

    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body.error).includes("at least 18 years old"));
  });

  it("4. PATCH /api/profile/me rejects invalid date of birth format", async () => {
    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        displayName: "Invalid Date",
        birthDate: "not-a-date"
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it("5. PATCH /api/profile/me rejects invalid username characters and length", async () => {
    // Too short (< 3 chars)
    const resShort = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ username: "ab" });
    assert.equal(resShort.status, 400);

    // Invalid special characters
    const resSpecial = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ username: "john.doe!" });
    assert.equal(resSpecial.status, 400);
  });

  it("6. PATCH /api/profile/me rejects reserved usernames", async () => {
    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ username: "admin" });

    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body.error).includes("reserved"));
  });

  it("7. PATCH /api/profile/me rejects unknown/unexpected fields (strict schema)", async () => {
    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        displayName: "Hacker",
        role: "COMMUNITY_CREATOR", // forbidden
        isVerified: true,          // forbidden
        status: "BANNED"           // forbidden
      });

    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body.error).includes("Unrecognized key"));
  });

  it("8. PATCH /api/profile/me rejects bio exceeding 500 characters", async () => {
    const longBio = "A".repeat(501);
    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ bio: longBio });

    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body.error).includes("500 characters"));
  });

  let userAProfileId = "";

  it("9. PATCH /api/profile/me successfully creates User A profile and derives age server-side", async () => {
    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        displayName: "Ajeet Designer",
        username: "Ajeet_Design", // Mixed case to test normalization
        birthDate: "1998-05-15",
        gender: "MAN",
        pronouns: "he/him",
        bio: "Passionate about modern UX and creative tech.",
        city: "San Francisco",
        country: "United States",
        heightCm: 180,
        occupation: "Product Designer",
        company: "VYBE Studio",
        drinking: "SOCIALLY",
        exercise: "DAILY",
        isDiscoverable: true,
        showAge: true,
        interestIds: [seedInterests[0].id, seedInterests[1].id],
        relationshipIntentId: seedIntents[0].id,
        prompts: [
          {
            templateId: seedTemplates[0].id,
            answerText: "Build something people love."
          }
        ],
        photos: [
          {
            storageKey: "photos/user_a_1.jpg",
            cdnUrl: "https://cdn.vybe.app/photos/user_a_1.jpg",
            displayOrder: 0,
            isPrimary: true
          }
        ]
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.profile);
    userAProfileId = res.body.profile.id;

    // Verify username was normalized to lowercase
    assert.equal(res.body.profile.username, "ajeet_design");
    assert.equal(res.body.profile.displayName, "Ajeet Designer");
    assert.equal(res.body.profile.city, "San Francisco");
    assert.equal(res.body.profile.country, "United States");

    // Verify server-side derived age (1998 -> >= 26)
    assert.ok(typeof res.body.profile.age === "number");
    assert.ok(res.body.profile.age >= 26);

    // Verify relations populated
    assert.equal(res.body.profile.interests.length, 2);
    assert.equal(res.body.profile.prompts.length, 1);
    assert.equal(res.body.profile.photos.length, 1);
    assert.equal(res.body.profile.relationshipIntents.length, 1);

    // SECURITY CHECK: Email, phone, password hash must NEVER be in profile response
    assert.equal(res.body.profile.email, undefined);
    assert.equal(res.body.profile.phoneNumber, undefined);
    assert.equal(res.body.profile.passwordHash, undefined);
    assert.equal(res.body.profile.userId, undefined);
  });

  it("10. GET /api/profile/me returns User A's populated profile", async () => {
    const res = await request(app)
      .get("/api/profile/me")
      .set("Cookie", userACookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.profile.id, userAProfileId);
    assert.equal(res.body.profile.username, "ajeet_design");
    assert.equal(res.body.profile.birthDate, "1998-05-15");
    assert.ok(res.body.profile.age >= 26);
    assert.ok(res.body.profile.completionScore > 50);

    // Security check
    assert.equal(res.body.profile.email, undefined);
    assert.equal(res.body.profile.phoneNumber, undefined);
  });

  it("11. username uniqueness prevents User B from claiming User A's username", async () => {
    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userBCookie)
      .send({
        displayName: "User B",
        username: "ajeet_design", // User A's username
        birthDate: "1995-10-20",
        gender: "WOMAN"
      });

    assert.equal(res.status, 409);
    assert.ok(res.body.error.message.includes("already taken"));
  });

  it("12. User B can create their own profile with a unique username (IDOR protection)", async () => {
    const res = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userBCookie)
      .send({
        displayName: "User B Unique",
        username: "user_b_rock",
        birthDate: "1997-08-10",
        gender: "WOMAN",
        city: "New York",
        country: "United States"
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.profile.username, "user_b_rock");

    // Verify User A's profile was not affected
    const userAProfile = await prisma.profile.findUnique({ where: { id: userAProfileId } });
    assert.equal(userAProfile?.displayName, "Ajeet Designer");
  });

  it("13. GET /api/profile/:id returns public profile with strict privacy filtering", async () => {
    // Request by UUID
    const resByUuid = await request(app).get(`/api/profile/${userAProfileId}`);
    assert.equal(resByUuid.status, 200);
    assert.ok(resByUuid.body.profile);

    const publicProfile = resByUuid.body.profile;
    assert.equal(publicProfile.displayName, "Ajeet Designer");
    assert.equal(publicProfile.username, "ajeet_design");
    assert.equal(publicProfile.city, "San Francisco");
    assert.equal(publicProfile.country, "United States");
    assert.ok(typeof publicProfile.age === "number");

    // PRIVACY VERIFICATIONS:
    // 1. Exact birthDate must NEVER be in public profile
    assert.equal(publicProfile.birthDate, undefined);
    // 2. Email must NEVER be in public profile
    assert.equal(publicProfile.email, undefined);
    // 3. Phone must NEVER be in public profile
    assert.equal(publicProfile.phoneNumber, undefined);
    // 4. Internal user ID must NEVER be in public profile
    assert.equal(publicProfile.userId, undefined);
    // 5. Audit logs or password must NEVER be in public profile
    assert.equal(publicProfile.password, undefined);
    assert.equal(publicProfile.passwordHash, undefined);

    // Request by username
    const resByUsername = await request(app).get("/api/profile/ajeet_design");
    assert.equal(resByUsername.status, 200);
    assert.equal(resByUsername.body.profile.id, userAProfileId);
  });

  it("14. showAge setting controls whether derived age is exposed publicly", async () => {
    // Turn off showAge for User A
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ showAge: false });

    // When requested publicly by unauthenticated user, age must be null
    const resPublic = await request(app).get(`/api/profile/${userAProfileId}`);
    assert.equal(resPublic.status, 200);
    assert.equal(resPublic.body.profile.age, null);

    // Turn showAge back on
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ showAge: true });
  });

  it("15. isDiscoverable setting hides profile from public lookups when disabled", async () => {
    // Disable discoverability for User A
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ isDiscoverable: false });

    // Request by User B should return 404 (private profile)
    const resHidden = await request(app)
      .get(`/api/profile/${userAProfileId}`)
      .set("Cookie", userBCookie);
    assert.equal(resHidden.status, 404);

    // Owner (User A) can still view their own public profile
    const resOwner = await request(app)
      .get(`/api/profile/${userAProfileId}`)
      .set("Cookie", userACookie);
    assert.equal(resOwner.status, 200);

    // Re-enable discoverability
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({ isDiscoverable: true });
  });

  it("16. interests and prompts can be added, updated, and removed cleanly", async () => {
    // Update interests to only 1 interest
    const res1 = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        interestIds: [seedInterests[2].id]
      });

    assert.equal(res1.status, 200);
    assert.equal(res1.body.profile.interests.length, 1);
    assert.equal(res1.body.profile.interests[0].id, seedInterests[2].id);

    // Remove all prompts
    const res2 = await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        prompts: []
      });

    assert.equal(res2.status, 200);
    assert.equal(res2.body.profile.prompts.length, 0);
  });

  it("17. audit logs record security-sensitive profile changes (username, birthDate, visibility)", async () => {
    // Change username and birthDate
    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", userACookie)
      .send({
        username: "ajeet_updated",
        birthDate: "1998-06-20",
        isDiscoverable: false
      });

    // Verify records in profile_audit_logs table
    const auditLogs = await prisma.profileAuditLog.findMany({
      where: { userId: userAId },
      orderBy: { createdAt: "desc" }
    });

    assert.ok(auditLogs.length >= 3);
    const actions = auditLogs.map((log) => log.action);
    assert.ok(actions.includes("USERNAME_CHANGE"));
    assert.ok(actions.includes("DOB_CHANGE"));
    assert.ok(actions.includes("VISIBILITY_CHANGE"));
  });
});
