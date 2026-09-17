import type { IncomingMessage, Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { verifySession } from "../services/auth.service.js";
import {
  checkMessageRateLimit,
  markConversationAsRead,
  sendMessage
} from "../services/conversation.service.js";
import { realtimeService } from "../services/realtime.service.js";

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  const map: Record<string, string> = {};
  for (const item of header.split(";")) {
    const [key, ...vals] = item.trim().split("=");
    if (key) {
      try {
        map[key] = decodeURIComponent(vals.join("="));
      } catch {
        map[key] = vals.join("=");
      }
    }
  }
  return map;
}

// Helper to determine allowed origins strictly
function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  if (env.WS_ALLOWED_ORIGINS) {
    for (const o of env.WS_ALLOWED_ORIGINS.split(",")) {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  if (env.CORS_ORIGIN) {
    origins.add(env.CORS_ORIGIN);
  }

  try {
    const base = new URL(env.APP_BASE_URL);
    origins.add(base.origin);
  } catch {
    // Ignore invalid base url
  }

  if (env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:4000");
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://127.0.0.1:4000");
    origins.add("http://127.0.0.1:5173");
  }

  return origins;
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // Non-browser clients or tests without origin header
    return env.NODE_ENV !== "production";
  }

  const allowed = getAllowedOrigins();
  return allowed.has(origin);
}

export function extractSessionTokenFromWsRequest(req: IncomingMessage): string | undefined {
  // 1. From Cookie header
  if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies[env.SESSION_COOKIE_NAME]) {
      return cookies[env.SESSION_COOKIE_NAME];
    }
  }

  // 2. From Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return undefined;
}

export function createWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 64 * 1024 // 64 KB maximum payload limit to prevent DoS
  });

  server.on("upgrade", async (req: IncomingMessage, socket, head) => {
    const { pathname } = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);

    if (pathname !== "/ws") {
      // Not our WebSocket endpoint
      return;
    }

    const origin = req.headers.origin;

    // OWASP: Explicit Origin validation
    if (!isOriginAllowed(origin)) {
      logger.warn({ origin, ip: req.socket.remoteAddress }, "WebSocket connection rejected: unauthorized origin");
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    // OWASP: Authenticate during handshake before connection acceptance
    const token = extractSessionTokenFromWsRequest(req);
    if (!token) {
      logger.warn({ ip: req.socket.remoteAddress }, "WebSocket connection rejected: missing session token");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    const auth = await verifySession(token);
    if (!auth) {
      logger.warn({ ip: req.socket.remoteAddress }, "WebSocket connection rejected: invalid or expired session");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, auth);
    });
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage, auth: { user: { id: string }; sessionId: string }) => {
    const userId = auth.user.id;
    const socketId = crypto.randomUUID();

    const clientSocket = {
      id: socketId,
      userId,
      sessionId: auth.sessionId,
      ws,
      isAlive: true
    };

    realtimeService.registerSocket(clientSocket);
    logger.info({ userId, socketId }, "WebSocket client connected");

    ws.on("pong", () => {
      clientSocket.isAlive = true;
    });

    ws.on("message", async (data: Buffer | string) => {
      let messageStr: string;
      if (typeof data === "string") {
        messageStr = data;
      } else {
        messageStr = data.toString("utf8");
      }

      let parsed: any;
      try {
        parsed = JSON.parse(messageStr);
      } catch {
        logger.warn({ userId, socketId }, "WebSocket message parse failed: malformed JSON");
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", code: "BAD_REQUEST", message: "Malformed JSON payload" }));
        }
        return;
      }

      if (!parsed || typeof parsed !== "object" || typeof parsed.type !== "string") {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", code: "BAD_REQUEST", message: "Message must contain type field" }));
        }
        return;
      }

      // Explicit event type allowlist
      const ALLOWED_CLIENT_EVENTS = ["message.send", "message.read", "ping"];
      if (!ALLOWED_CLIENT_EVENTS.includes(parsed.type)) {
        logger.warn({ userId, type: parsed.type }, "WebSocket rejected unknown event type");
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "error", code: "INVALID_EVENT", message: `Unknown event type: ${parsed.type}` }));
        }
        return;
      }

      try {
        switch (parsed.type) {
          case "ping": {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "pong" }));
            }
            break;
          }

          case "message.send": {
            const { conversationId, content } = parsed;
            if (!conversationId || typeof conversationId !== "string" || typeof content !== "string") {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    code: "VALIDATION_ERROR",
                    message: "conversationId and content must be valid strings"
                  })
                );
              }
              return;
            }

            // Rate limit check
            try {
              checkMessageRateLimit(userId);
            } catch (err: any) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "error", code: "RATE_LIMITED", message: err.message }));
              }
              return;
            }

            // Action-level authorization and persistent commit
            const created = await sendMessage(conversationId, userId, content);
            // Confirm to sender
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "message.created", message: created }));
            }
            break;
          }

          case "message.read": {
            const { conversationId } = parsed;
            if (!conversationId || typeof conversationId !== "string") {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    code: "VALIDATION_ERROR",
                    message: "conversationId must be a valid string"
                  })
                );
              }
              return;
            }

            const readResult = await markConversationAsRead(conversationId, userId);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "message.read", ...readResult }));
            }
            break;
          }
        }
      } catch (err: any) {
        logger.warn({ userId, type: parsed.type, err: err.message }, "WebSocket action failed");
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "error",
              code: err.statusCode === 403 ? "FORBIDDEN" : err.statusCode === 404 ? "NOT_FOUND" : "BAD_REQUEST",
              message: err.message || "An error occurred processing WebSocket message"
            })
          );
        }
      }
    });

    ws.on("close", (code, reason) => {
      realtimeService.unregisterSocket(userId, socketId);
      logger.info({ userId, socketId, code, reason: reason?.toString() }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ userId, socketId, err: err.message }, "WebSocket error encountered");
      realtimeService.unregisterSocket(userId, socketId);
    });
  });

  // Heartbeat interval to prune stale connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const socket = ws as WebSocket & { isAlive?: boolean };
      if (socket.isAlive === false) {
        return ws.terminate();
      }
      socket.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}
