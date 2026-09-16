import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { MemoryStorageProvider, storageProvider } from "../services/storage/storage.provider.js";

// Valid 1x1 PNG image buffer
const VALID_PNG_BUFFER = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex"
);

// Valid 1x1 JPEG image buffer
const VALID_JPEG_BUFFER = Buffer.from(
  "ffd8ffe000104a46494600010101004800480000ffdb004300030202020202030202020303030304060404040404080606050609080a0a090809090a0c0f0c0a0b0e0b09090d110d0e0f101011100a0c12131210130f101010ffc00011080001000103012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda000c03010002110311003f00bf00ffd9",
  "hex"
);

// Valid WebP image buffer
const VALID_WEBP_BUFFER = Buffer.from(
  "524946461a00000057454250565038200e000000d001009d012a0100010002003425a400037000fe",
  "hex"
);

describe("VYBE Profile Photo Management API", () => {
  const timestamp = Date.now();
  const userAEmail = `photo_a_${timestamp}@vybetest.com`;
  const userBEmail = `photo_b_${timestamp}@vybetest.com`;
  const testPassword = "PhotoPassword123!";

  let userAId = "";
  let userACookie = "";
  let userBId = "";
  let userBCookie = "";

  const memoryStorage = storageProvider as MemoryStorageProvider;

  before(async () => {
    resetRateLimitStore();
    if (memoryStorage.clear) {
      memoryStorage.clear();
    }

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

  it("1. unauthenticated photo upload is rejected with 401", async () => {
    const res = await request(app)
      .post("/api/profile/photos")
      .attach("photo", VALID_PNG_BUFFER, "photo.png");

    assert.equal(res.status, 401);
  });

  it("2. upload without file returns 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie);

    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body.error).includes("file is required"));
  });

  it("3. upload of fake image (text disguised with .jpg extension) is rejected by magic bytes verification", async () => {
    const fakeImageBuffer = Buffer.from("echo 'Not a real image file';");
    const res = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie)
      .attach("photo", fakeImageBuffer, "avatar.jpg");

    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body.error).includes("Unsupported image format"));
  });

  it("4. upload of non-image MIME file (executable/script) is rejected", async () => {
    const scriptBuffer = Buffer.from("#!/bin/bash\necho malicious;\n");
    const res = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie)
      .attach("photo", scriptBuffer, "script.sh");

    assert.equal(res.status, 400);
    assert.ok(JSON.stringify(res.body.error).includes("Unsupported image format"));
  });

  it("5. oversized photo (> 5MB) is rejected", async () => {
    // 5.5 MB fake buffer starting with JPEG header
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024);
    oversizedBuffer[0] = 0xff;
    oversizedBuffer[1] = 0xd8;
    oversizedBuffer[2] = 0xff;

    const res = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie)
      .attach("photo", oversizedBuffer, "huge.jpg");

    assert.equal(res.status, 400);
  });

  let userAPhoto1Id = "";

  it("6. authenticated upload of valid PNG succeeds and is automatically set as primary", async () => {
    const res = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie)
      .attach("photo", VALID_PNG_BUFFER, "primary.png");

    assert.equal(res.status, 201);
    assert.ok(res.body.photo);
    userAPhoto1Id = res.body.photo.id;

    assert.equal(res.body.photo.isPrimary, true);
    assert.equal(res.body.photo.displayOrder, 0);
    assert.ok(res.body.photo.cdnUrl.includes(".png"));
    assert.ok(res.body.photo.width > 0);
    assert.ok(res.body.photo.height > 0);

    // SECURITY CHECK: Verify no image binary / base64 is stored in PostgreSQL
    const dbRecord = await prisma.profilePhoto.findUnique({
      where: { id: userAPhoto1Id }
    });
    assert.ok(dbRecord);
    assert.equal(dbRecord.fileSizeBytes, VALID_PNG_BUFFER.length);
    // Raw binary / buffer must not be in PostgreSQL
    assert.equal((dbRecord as Record<string, unknown>).buffer, undefined);
    assert.equal((dbRecord as Record<string, unknown>).data, undefined);

    // Verify object exists in storage provider
    const existsInStorage = await memoryStorage.has(dbRecord.storageKey);
    assert.equal(existsInStorage, true);
  });

  let userAPhoto2Id = "";

  it("7. uploading second photo (JPEG) succeeds, gets next display order, and is not primary", async () => {
    const res = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie)
      .attach("photo", VALID_JPEG_BUFFER, "second.jpg");

    assert.equal(res.status, 201);
    assert.ok(res.body.photo);
    userAPhoto2Id = res.body.photo.id;

    assert.equal(res.body.photo.isPrimary, false);
    assert.equal(res.body.photo.displayOrder, 1);
    assert.ok(res.body.photo.cdnUrl.includes(".jpg"));
  });

  let userAPhoto3Id = "";

  it("8. uploading third photo (WebP) succeeds and lists all 3 photos ordered by displayOrder", async () => {
    const resUpload = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie)
      .attach("photo", VALID_WEBP_BUFFER, "third.webp");

    assert.equal(resUpload.status, 201);
    userAPhoto3Id = resUpload.body.photo.id;

    const resList = await request(app)
      .get("/api/profile/photos")
      .set("Cookie", userACookie);

    assert.equal(resList.status, 200);
    assert.equal(resList.body.photos.length, 3);
    assert.equal(resList.body.photos[0].id, userAPhoto1Id);
    assert.equal(resList.body.photos[0].isPrimary, true);
    assert.equal(resList.body.photos[1].id, userAPhoto2Id);
    assert.equal(resList.body.photos[2].id, userAPhoto3Id);
  });

  it("9. IDOR protection prevents User B from viewing, modifying, or deleting User A's photo", async () => {
    // User B attempts to set User A's photo as primary
    const resPrimary = await request(app)
      .patch(`/api/profile/photos/${userAPhoto1Id}/primary`)
      .set("Cookie", userBCookie);
    assert.equal(resPrimary.status, 404);

    // User B attempts to update User A's photo
    const resUpdate = await request(app)
      .patch(`/api/profile/photos/${userAPhoto1Id}`)
      .set("Cookie", userBCookie)
      .send({ displayOrder: 9 });
    assert.equal(resUpdate.status, 404);

    // User B attempts to delete User A's photo
    const resDelete = await request(app)
      .delete(`/api/profile/photos/${userAPhoto1Id}`)
      .set("Cookie", userBCookie);
    assert.equal(resDelete.status, 404);

    // User B attempts to reorder User A's photo
    const resReorder = await request(app)
      .patch("/api/profile/photos/reorder")
      .set("Cookie", userBCookie)
      .send({
        orders: [{ photoId: userAPhoto1Id, displayOrder: 0 }]
      });
    assert.equal(resReorder.status, 403);
  });

  it("10. PATCH /api/profile/photos/:photoId/primary updates primary photo atomically", async () => {
    // Set photo 2 as primary
    const res = await request(app)
      .patch(`/api/profile/photos/${userAPhoto2Id}/primary`)
      .set("Cookie", userACookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.photo.id, userAPhoto2Id);
    assert.equal(res.body.photo.isPrimary, true);

    // Verify photo 1 is no longer primary
    const list = await request(app)
      .get("/api/profile/photos")
      .set("Cookie", userACookie);

    const p1 = list.body.photos.find((p: { id: string }) => p.id === userAPhoto1Id);
    const p2 = list.body.photos.find((p: { id: string }) => p.id === userAPhoto2Id);
    assert.equal(p1.isPrimary, false);
    assert.equal(p2.isPrimary, true);
  });

  it("11. PATCH /api/profile/photos/reorder updates display orders cleanly", async () => {
    const res = await request(app)
      .patch("/api/profile/photos/reorder")
      .set("Cookie", userACookie)
      .send({
        orders: [
          { photoId: userAPhoto3Id, displayOrder: 0 },
          { photoId: userAPhoto1Id, displayOrder: 1 },
          { photoId: userAPhoto2Id, displayOrder: 2 }
        ]
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.photos[0].id, userAPhoto3Id);
    assert.equal(res.body.photos[1].id, userAPhoto1Id);
    assert.equal(res.body.photos[2].id, userAPhoto2Id);
  });

  it("12. DELETE primary photo removes it and safely promotes next photo to primary", async () => {
    // Current primary is photo 2
    const res = await request(app)
      .delete(`/api/profile/photos/${userAPhoto2Id}`)
      .set("Cookie", userACookie);

    assert.equal(res.status, 200);
    assert.ok(res.body.promotedPrimaryId);

    // Verify photo 2 is removed
    const list = await request(app)
      .get("/api/profile/photos")
      .set("Cookie", userACookie);

    assert.equal(list.body.photos.length, 2);
    assert.equal(list.body.photos.some((p: { id: string }) => p.id === userAPhoto2Id), false);

    // Verify another photo was promoted to primary
    const primaryPhotos = list.body.photos.filter((p: { isPrimary: boolean }) => p.isPrimary);
    assert.equal(primaryPhotos.length, 1);
    assert.equal(primaryPhotos[0].id, res.body.promotedPrimaryId);
  });

  it("13. invalid photo ID returns 400 Bad Request or 404 Not Found", async () => {
    const resInvalidUuid = await request(app)
      .delete("/api/profile/photos/not-a-uuid")
      .set("Cookie", userACookie);
    assert.equal(resInvalidUuid.status, 404);

    const resNonExistent = await request(app)
      .delete("/api/profile/photos/00000000-0000-0000-0000-000000000000")
      .set("Cookie", userACookie);
    assert.equal(resNonExistent.status, 404);
  });

  it("14. maximum photo limit (6 photos) is strictly enforced", async () => {
    // User A currently has 2 photos. Upload 4 more to reach the 6 limit
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post("/api/profile/photos")
        .set("Cookie", userACookie)
        .attach("photo", VALID_PNG_BUFFER, `fill_${i}.png`);
      assert.equal(res.status, 201);
    }

    // 7th photo upload must fail with 400 Maximum photo limit reached
    const resExceeded = await request(app)
      .post("/api/profile/photos")
      .set("Cookie", userACookie)
      .attach("photo", VALID_PNG_BUFFER, "exceeded.png");

    assert.equal(resExceeded.status, 400);
    assert.ok(JSON.stringify(resExceeded.body.error).includes("Maximum photo limit reached"));
  });
});
