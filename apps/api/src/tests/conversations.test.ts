import assert from "node:assert/strict";
import http from "node:http";
import { after, before, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { WebSocket } from "ws";

import { app } from "../app.js";
import { disconnectDatabase, prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { disconnectRedis } from "../config/redis.js";
import { resetRateLimitStore } from "../middleware/rate-limiter.js";
import { resetMessageRateLimits } from "../services/conversation.service.js";
import { realtimeService } from "../services/realtime.service.js";
import { ensureDefaultProfileSeeds } from "../utils/profile-seed.js";
import { createWebSocketServer } from "../websocket/websocket.server.js";

describe("VYBE Step 22 — Chat & Conversations Foundation", () => {
  const timestamp = Date.now();
  const testPassword = "ValidPassword123!";

  let server: http.Server;
  let serverPort: number;

  let userAId: string;
  let userACookie: string;
  let userAToken: string;

  let userBId: string;
  let userBCookie: string;
  let userBToken: string;

  let userCId: string;
  let userCCookie: string;
  let userCToken: string;

  let userBlockedId: string;
  let userBlockedCookie: string;

  let activeMatchId: string;
  let activeConversationId: string;

  const createdUserIds: string[] = [];

  function extractToken(cookie: string): string {
    const match = cookie.match(new RegExp(`${env.SESSION_COOKIE_NAME}=([^;]+)`));
    return match ? match[1] : "";
  }

  async function registerAndInitUser(params: {
    email: string;
    displayName: string;
    birthDate: string;
    gender: "MAN" | "WOMAN" | "NON_BINARY";
    interestedInGenders?: ("MAN" | "WOMAN" | "NON_BINARY")[];
  }): Promise<{ id: string; cookie: string; token: string }> {
    const resReg = await request(app)
      .post("/api/auth/register")
      .send({ email: params.email, password: testPassword });
    assert.equal(resReg.status, 201);
    const id = resReg.body.user.id;
    createdUserIds.push(id);

    const cookieHeader = resReg.headers["set-cookie"];
    const cookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader).split(";")[0];
    const token = extractToken(cookie);

    await request(app)
      .patch("/api/profile/me")
      .set("Cookie", cookie)
      .send({
        displayName: params.displayName,
        birthDate: params.birthDate,
        gender: params.gender,
        bio: `Bio for ${params.displayName}`,
        city: "San Francisco",
        isDiscoverable: true
      });

    return { id, cookie, token };
  }

  before(async () => {
    await ensureDefaultProfileSeeds();

    // Start local HTTP server with attached WebSocket server for live WS tests
    server = http.createServer(app);
    createWebSocketServer(server);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        serverPort = typeof addr === "object" && addr ? addr.port : 4000;
        resolve();
      });
    });

    // Create User A
    const a = await registerAndInitUser({
      email: `chat_a_${timestamp}@vybetest.com`,
      displayName: "User A",
      birthDate: "1998-05-10",
      gender: "MAN",
      interestedInGenders: ["WOMAN"]
    });
    userAId = a.id;
    userACookie = a.cookie;
    userAToken = a.token;

    // Create User B
    const b = await registerAndInitUser({
      email: `chat_b_${timestamp}@vybetest.com`,
      displayName: "User B",
      birthDate: "2000-08-15",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userBId = b.id;
    userBCookie = b.cookie;
    userBToken = b.token;

    // Create User C (unrelated / third user)
    const c = await registerAndInitUser({
      email: `chat_c_${timestamp}@vybetest.com`,
      displayName: "User C",
      birthDate: "1999-04-12",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userCId = c.id;
    userCCookie = c.cookie;
    userCToken = c.token;

    // Create mutual match between A and B
    const likeRes1 = await request(app).post(`/api/discovery/${userBId}/like`).set("Cookie", userACookie);
    assert.equal(likeRes1.status, 200);

    const likeRes2 = await request(app).post(`/api/discovery/${userAId}/like`).set("Cookie", userBCookie);
    assert.equal(likeRes2.status, 200);
    assert.equal(likeRes2.body.matched, true);
    activeMatchId = likeRes2.body.match.id;

    // Create Blocked User
    const blk = await registerAndInitUser({
      email: `chat_blk_${timestamp}@vybetest.com`,
      displayName: "Blocked User",
      birthDate: "2000-02-14",
      gender: "WOMAN",
      interestedInGenders: ["MAN"]
    });
    userBlockedId = blk.id;
    userBlockedCookie = blk.cookie;
    await prisma.userBlock.create({
      data: {
        blockerUserId: userAId,
        blockedUserId: userBlockedId
      }
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const uid of createdUserIds) {
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    await realtimeService.cleanup();
    await disconnectDatabase();
    await disconnectRedis();
  });

  beforeEach(() => {
    resetRateLimitStore();
    resetMessageRateLimits();
  });

  // ---------------------------------------------------------------------------
  // 1. Conversation Creation & Retrieval Lifecycle
  // ---------------------------------------------------------------------------
  describe("1. Conversation Lifecycle & Creation", () => {
    it("1. Cannot create conversation with someoneElse arbitrary userId payload", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Cookie", userACookie)
        .send({ userId: userBId });

      assert.equal(res.status, 400, "Must reject arbitrary userId payload");
    });

    it("2. User C cannot create or access conversation for Match A<->B", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Cookie", userCCookie)
        .send({ matchId: activeMatchId });

      assert.equal(res.status, 403, "User C must be forbidden from accessing Match A<->B conversation");
    });

    it("3. User A creates conversation for active Match A<->B", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Cookie", userACookie)
        .send({ matchId: activeMatchId });

      assert.equal(res.status, 200);
      assert.ok(res.body.id);
      assert.equal(res.body.matchId, activeMatchId);
      assert.equal(res.body.status, "ACTIVE");
      assert.equal(res.body.otherUser.id, userBId);
      assert.equal(res.body.otherUser.email, undefined);
      assert.equal(res.body.otherUser.phoneNumber, undefined);

      activeConversationId = res.body.id;
    });

    it("4. Conversation creation is idempotent (does not create duplicate)", async () => {
      const res = await request(app)
        .post("/api/conversations")
        .set("Cookie", userBCookie)
        .send({ matchId: activeMatchId });

      assert.equal(res.status, 200);
      assert.equal(res.body.id, activeConversationId);
      assert.equal(res.body.otherUser.id, userAId);
    });

    it("5. GET /api/conversations returns list with partner info and unreadCount", async () => {
      const res = await request(app).get("/api/conversations").set("Cookie", userACookie);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
      assert.equal(res.body.items.length, 1);
      assert.equal(res.body.items[0].id, activeConversationId);
      assert.equal(res.body.items[0].otherUser.id, userBId);
      assert.equal(res.body.items[0].unreadCount, 0);
    });

    it("6. GET /api/conversations/:id for A and B is allowed, C is denied (404/403)", async () => {
      const resA = await request(app)
        .get(`/api/conversations/${activeConversationId}`)
        .set("Cookie", userACookie);
      assert.equal(resA.status, 200);

      const resB = await request(app)
        .get(`/api/conversations/${activeConversationId}`)
        .set("Cookie", userBCookie);
      assert.equal(resB.status, 200);

      const resC = await request(app)
        .get(`/api/conversations/${activeConversationId}`)
        .set("Cookie", userCCookie);
      assert.equal(resC.status, 404, "Must not reveal existence to non-member");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Messaging, Validation & History
  // ---------------------------------------------------------------------------
  describe("2. Messaging, Validation & History", () => {
    let message1Id: string;

    it("7. User C cannot send a message to Conversation A<->B", async () => {
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userCCookie)
        .send({ content: "Unauthorized intrusion" });

      assert.equal(res.status, 404);
    });

    it("8. Message validation: rejects empty or whitespace-only content", async () => {
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userACookie)
        .send({ content: "   " });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /empty/i);
    });

    it("9. Message validation: rejects oversized content (> 4000 characters)", async () => {
      const oversized = "A".repeat(4001);
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userACookie)
        .send({ content: oversized });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /exceed/i);
    });

    it("10. User A sends valid message -> persisted and updates conversation lastMessageAt", async () => {
      const content = "Hey B! Excited to connect on VYBE!";
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userACookie)
        .send({ content });

      assert.equal(res.status, 201);
      assert.ok(res.body.id);
      assert.equal(res.body.conversationId, activeConversationId);
      assert.equal(res.body.senderId, userAId);
      assert.equal(res.body.content, content);
      assert.equal(res.body.deleted, false);
      assert.ok(res.body.createdAt);

      message1Id = res.body.id;

      // Verify conversation metadata updated in DB
      const conv = await prisma.conversation.findUnique({ where: { id: activeConversationId } });
      assert.equal(conv?.lastMessageId, message1Id);
      assert.ok(conv?.lastMessageAt);
    });

    it("11. User B sees unread count = 1 in conversation list", async () => {
      const res = await request(app).get("/api/conversations").set("Cookie", userBCookie);
      assert.equal(res.status, 200);
      const item = res.body.items.find((i: any) => i.id === activeConversationId);
      assert.ok(item);
      assert.equal(item.unreadCount, 1);
      assert.equal(item.lastMessage.id, message1Id);
    });

    it("12. User B fetches message history with cursor pagination", async () => {
      const res = await request(app)
        .get(`/api/conversations/${activeConversationId}/messages?limit=10`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
      assert.equal(res.body.items.length, 1);
      assert.equal(res.body.items[0].id, message1Id);
    });

    it("13. User C cannot fetch message history for Conversation A<->B", async () => {
      const res = await request(app)
        .get(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userCCookie);

      assert.equal(res.status, 404);
    });

    it("14. User B marks conversation as read -> unread count resets to 0", async () => {
      const resRead = await request(app)
        .post(`/api/conversations/${activeConversationId}/read`)
        .set("Cookie", userBCookie);

      assert.equal(resRead.status, 200);
      assert.equal(resRead.body.success, true);

      const resList = await request(app).get("/api/conversations").set("Cookie", userBCookie);
      const item = resList.body.items.find((i: any) => i.id === activeConversationId);
      assert.equal(item.unreadCount, 0);
    });

    it("15. HTML/script payload is stored safely as raw text without execution or alteration", async () => {
      const malicious = "<script>alert('xss');</script><img src='x' onerror='steal()' />";
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userBCookie)
        .send({ content: malicious });

      assert.equal(res.status, 201);
      assert.equal(res.body.content, malicious);

      // Verify in DB directly
      const msg = await prisma.message.findUnique({ where: { id: res.body.id } });
      assert.equal(msg?.content, malicious);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Message Ownership: Edit & Soft Delete
  // ---------------------------------------------------------------------------
  describe("3. Message Ownership: Edit & Delete", () => {
    let messageToEditId: string;

    before(async () => {
      const res = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userACookie)
        .send({ content: "Initial message to edit" });
      messageToEditId = res.body.id;
    });

    it("16. User B cannot edit User A's message (403)", async () => {
      const res = await request(app)
        .patch(`/api/messages/${messageToEditId}`)
        .set("Cookie", userBCookie)
        .send({ content: "Tampered by B" });

      assert.equal(res.status, 403);
    });

    it("17. User C cannot edit User A's message (403)", async () => {
      const res = await request(app)
        .patch(`/api/messages/${messageToEditId}`)
        .set("Cookie", userCCookie)
        .send({ content: "Tampered by C" });

      assert.equal(res.status, 403);
    });

    it("18. User A edits own message within 15 minutes window -> success with editedAt", async () => {
      const updatedText = "Edited by original sender User A";
      const res = await request(app)
        .patch(`/api/messages/${messageToEditId}`)
        .set("Cookie", userACookie)
        .send({ content: updatedText });

      assert.equal(res.status, 200);
      assert.equal(res.body.id, messageToEditId);
      assert.equal(res.body.content, updatedText);
      assert.ok(res.body.editedAt);
    });

    it("19. Cannot edit message if edit window has expired (> 15 minutes)", async () => {
      // Simulate 16 minutes old message in DB
      const oldSentAt = new Date(Date.now() - 16 * 60 * 1000);
      await prisma.message.update({
        where: { id: messageToEditId },
        data: { sentAt: oldSentAt }
      });

      const res = await request(app)
        .patch(`/api/messages/${messageToEditId}`)
        .set("Cookie", userACookie)
        .send({ content: "Trying to edit expired message" });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /minutes/i);

      // Restore sentAt for subsequent assertions
      await prisma.message.update({
        where: { id: messageToEditId },
        data: { sentAt: new Date() }
      });
    });

    it("20. User B cannot delete User A's message (403)", async () => {
      const res = await request(app)
        .delete(`/api/messages/${messageToEditId}`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 403);
    });

    it("21. User A soft-deletes own message -> content is null, deleted is true", async () => {
      const res = await request(app)
        .delete(`/api/messages/${messageToEditId}`)
        .set("Cookie", userACookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.id, messageToEditId);
      assert.equal(res.body.content, null);
      assert.equal(res.body.deleted, true);

      // Verify row is preserved in DB (soft-deleted)
      const inDb = await prisma.message.findUnique({ where: { id: messageToEditId } });
      assert.ok(inDb, "Row must not be permanently deleted from DB");
      assert.ok(inDb?.deletedAt);
    });

    it("22. Soft-deleted message content is hidden in message history", async () => {
      const res = await request(app)
        .get(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userBCookie);

      assert.equal(res.status, 200);
      const deletedItem = res.body.items.find((i: any) => i.id === messageToEditId);
      assert.ok(deletedItem);
      assert.equal(deletedItem.content, null);
      assert.equal(deletedItem.deleted, true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. WebSocket Security & Real-Time Protocol
  // ---------------------------------------------------------------------------
  describe("4. WebSocket Security & Handshake", () => {
    it("23. Unauthenticated WebSocket handshake is rejected (401)", async () => {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${serverPort}/ws`);
        ws.on("open", () => {
          ws.close();
          reject(new Error("Unauthenticated WebSocket should not open"));
        });
        ws.on("unexpected-response", (_req, res) => {
          assert.equal(res.statusCode, 401);
          resolve();
        });
        ws.on("error", () => {
          // Handshake rejection produces error
          resolve();
        });
      });
    });

    it("24. Unauthorized Origin is rejected (403)", async () => {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${serverPort}/ws`, {
          headers: {
            Cookie: `${env.SESSION_COOKIE_NAME}=${userAToken}`,
            Origin: "https://evil-unauthorized-site.com"
          }
        });
        ws.on("open", () => {
          ws.close();
          reject(new Error("Unauthorized Origin should not be accepted"));
        });
        ws.on("unexpected-response", (_req, res) => {
          assert.equal(res.statusCode, 403);
          resolve();
        });
        ws.on("error", () => {
          resolve();
        });
      });
    });

    it("25. Valid Origin and valid session is accepted", async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}/ws`, {
        headers: {
          Cookie: `${env.SESSION_COOKIE_NAME}=${userAToken}`,
          Origin: "http://localhost:3000"
        }
      });

      await new Promise<void>((resolve, reject) => {
        ws.on("open", () => {
          ws.close();
          resolve();
        });
        ws.on("error", reject);
      });
    });

    it("26. Expired session WebSocket connection is rejected (401)", async () => {
      // Create a temporary user with expired session
      const temp = await registerAndInitUser({
        email: `ws_expired_${timestamp}@vybetest.com`,
        displayName: "Expired User",
        birthDate: "1995-01-01",
        gender: "MAN"
      });

      // Expire session in DB
      const session = await prisma.userSession.findFirst({
        where: { userId: temp.id }
      });
      if (session) {
        await prisma.userSession.update({
          where: { id: session.id },
          data: { expiresAt: new Date(Date.now() - 10000) }
        });
      }

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${serverPort}/ws`, {
          headers: {
            Cookie: `${env.SESSION_COOKIE_NAME}=${temp.token}`,
            Origin: "http://localhost:3000"
          }
        });
        ws.on("open", () => {
          ws.close();
          reject(new Error("Expired session socket should not open"));
        });
        ws.on("unexpected-response", (_req, res) => {
          assert.equal(res.statusCode, 401);
          resolve();
        });
        ws.on("error", () => resolve());
      });
    });

    it("27. Logging out closes that user's active WebSocket connection", async () => {
      const ws = new WebSocket(`ws://localhost:${serverPort}/ws`, {
        headers: {
          Cookie: `${env.SESSION_COOKIE_NAME}=${userAToken}`,
          Origin: "http://localhost:3000"
        }
      });

      await new Promise<void>((resolve) => ws.on("open", () => resolve()));

      const closePromise = new Promise<number>((resolve) => {
        ws.on("close", (code) => resolve(code));
      });

      // User A logs out
      await request(app).post("/api/auth/logout").set("Cookie", userACookie);

      const closeCode = await closePromise;
      assert.equal(closeCode, 1008);

      // Re-login User A so other tests can proceed
      const loginRes = await request(app).post("/api/auth/login").send({
        email: `chat_a_${timestamp}@vybetest.com`,
        password: testPassword
      });
      const cookieHeader = loginRes.headers["set-cookie"];
      userACookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader).split(";")[0];
      userAToken = extractToken(userACookie);
    });

    it("28. Real-time message exchange between User A and User B via WebSocket", async () => {
      const wsA = new WebSocket(`ws://localhost:${serverPort}/ws`, {
        headers: {
          Cookie: `${env.SESSION_COOKIE_NAME}=${userAToken}`,
          Origin: "http://localhost:3000"
        }
      });

      const wsB = new WebSocket(`ws://localhost:${serverPort}/ws`, {
        headers: {
          Cookie: `${env.SESSION_COOKIE_NAME}=${userBToken}`,
          Origin: "http://localhost:3000"
        }
      });

      await Promise.all([
        new Promise<void>((res) => wsA.on("open", () => res())),
        new Promise<void>((res) => wsB.on("open", () => res()))
      ]);

      const bMessagePromise = new Promise<any>((resolve) => {
        wsB.on("message", (data) => {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === "message.created") {
            resolve(parsed);
          }
        });
      });

      const content = "Real-time message sent over WebSocket!";
      wsA.send(
        JSON.stringify({
          type: "message.send",
          conversationId: activeConversationId,
          content
        })
      );

      const received = await bMessagePromise;
      assert.equal(received.type, "message.created");
      assert.equal(received.message.content, content);
      assert.equal(received.message.senderId, userAId);

      wsA.close();
      wsB.close();
    });

    it("29. WebSocket action-level authorization: User C cannot send to Conversation A<->B", async () => {
      const wsC = new WebSocket(`ws://localhost:${serverPort}/ws`, {
        headers: {
          Cookie: `${env.SESSION_COOKIE_NAME}=${userCToken}`,
          Origin: "http://localhost:3000"
        }
      });

      await new Promise<void>((res) => wsC.on("open", () => res()));

      const errorPromise = new Promise<any>((resolve) => {
        wsC.on("message", (data) => {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === "error") {
            resolve(parsed);
          }
        });
      });

      wsC.send(
        JSON.stringify({
          type: "message.send",
          conversationId: activeConversationId,
          content: "Intrusion attempt"
        })
      );

      const errorEvent = await errorPromise;
      assert.equal(errorEvent.type, "error");
      assert.equal(errorEvent.code, "NOT_FOUND");

      wsC.close();
    });

    it("30. Malformed JSON over WebSocket returns error event and preserves server stability", async () => {
      const wsA = new WebSocket(`ws://localhost:${serverPort}/ws`, {
        headers: {
          Cookie: `${env.SESSION_COOKIE_NAME}=${userAToken}`,
          Origin: "http://localhost:3000"
        }
      });

      await new Promise<void>((res) => wsA.on("open", () => res()));

      const errorPromise = new Promise<any>((resolve) => {
        wsA.on("message", (data) => {
          const parsed = JSON.parse(data.toString());
          resolve(parsed);
        });
      });

      wsA.send("NOT_A_VALID_JSON{:::broken");

      const response = await errorPromise;
      assert.equal(response.type, "error");
      assert.equal(response.code, "BAD_REQUEST");

      wsA.close();
    });

    it("31. Invalid event type rejected with INVALID_EVENT error", async () => {
      const wsA = new WebSocket(`ws://localhost:${serverPort}/ws`, {
        headers: {
          Cookie: `${env.SESSION_COOKIE_NAME}=${userAToken}`,
          Origin: "http://localhost:3000"
        }
      });

      await new Promise<void>((res) => wsA.on("open", () => res()));

      const errorPromise = new Promise<any>((resolve) => {
        wsA.on("message", (data) => {
          const parsed = JSON.parse(data.toString());
          resolve(parsed);
        });
      });

      wsA.send(JSON.stringify({ type: "arbitrary.malicious.event" }));

      const response = await errorPromise;
      assert.equal(response.type, "error");
      assert.equal(response.code, "INVALID_EVENT");

      wsA.close();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Safety: Unmatch & Block Policies
  // ---------------------------------------------------------------------------
  describe("5. Safety: Block & Unmatch Restrictions", () => {
    it("32. Cannot create conversation with blocked user", async () => {
      // User A and blocked user
      const fakeMatch = await prisma.match.create({
        data: {
          user1Id: userAId,
          user2Id: userBlockedId,
          status: "ACTIVE"
        }
      });

      const res = await request(app)
        .post("/api/conversations")
        .set("Cookie", userACookie)
        .send({ matchId: fakeMatch.id });

      assert.equal(res.status, 404, "Must reject conversation with blocked user");
      await prisma.match.delete({ where: { id: fakeMatch.id } });
    });

    it("33. When connection unmatches, conversation becomes CLOSED and messaging stops", async () => {
      // User A unmatches User B
      const unmatchRes = await request(app)
        .delete(`/api/matches/${activeMatchId}`)
        .set("Cookie", userACookie);

      assert.equal(unmatchRes.status, 200);

      // Verify conversation status is now CLOSED in DB
      const conv = await prisma.conversation.findUnique({ where: { id: activeConversationId } });
      assert.equal(conv?.status, "CLOSED");

      // Verify new messages are rejected
      const sendRes = await request(app)
        .post(`/api/conversations/${activeConversationId}/messages`)
        .set("Cookie", userACookie)
        .send({ content: "Message after unmatch" });

      assert.equal(sendRes.status, 400);
      assert.match(sendRes.body.message, /closed|inactive/i);
    });
  });
});
