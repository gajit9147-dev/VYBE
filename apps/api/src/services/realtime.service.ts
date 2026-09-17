import { EventEmitter } from "node:events";
import type { WebSocket } from "ws";
import { isRedisConnected, redis } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

export interface RealtimeMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content: string | null;
  deleted: boolean;
  createdAt: string;
  editedAt?: string | null;
}

export type RealtimeEvent =
  | {
      type: "message.created";
      conversationId: string;
      message: RealtimeMessageDto;
      recipientId: string;
      senderId: string;
    }
  | {
      type: "message.updated";
      conversationId: string;
      message: RealtimeMessageDto;
      recipientId: string;
      senderId: string;
    }
  | {
      type: "message.deleted";
      conversationId: string;
      message: RealtimeMessageDto;
      recipientId: string;
      senderId: string;
    }
  | {
      type: "message.read";
      conversationId: string;
      userId: string;
      lastReadAt: string;
      recipientId: string;
    }
  | {
      type: "conversation.updated";
      conversationId: string;
      status: string;
      recipientIds: string[];
    };

export interface AuthenticatedSocket {
  id: string;
  userId: string;
  sessionId: string;
  ws: WebSocket;
  isAlive: boolean;
}

const REDIS_CHAT_CHANNEL = "vybe:chat:events";

class RealtimeService {
  private userSockets = new Map<string, Map<string, AuthenticatedSocket>>();
  private localEmitter = new EventEmitter();
  private redisSub: Redis | null = null;
  private isSubscribed = false;

  constructor() {
    this.initRedisSub();
  }

  private initRedisSub() {
    if (env.NODE_ENV === "test") {
      // In test mode, use the local event emitter
      return;
    }

    try {
      this.redisSub = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 100, 2000);
        }
      });

      this.redisSub.on("error", (err) => {
        logger.warn({ err: err.message }, "Redis pub/sub subscriber error, using local fallback");
      });

      this.redisSub.on("message", (_channel, message) => {
        try {
          const event: RealtimeEvent = JSON.parse(message);
          this.deliverEventLocally(event);
        } catch (err: any) {
          logger.warn({ err: err.message }, "Failed to parse Redis pub/sub event");
        }
      });

      this.redisSub.connect().then(() => {
        if (this.redisSub && this.redisSub.status === "ready") {
          this.redisSub.subscribe(REDIS_CHAT_CHANNEL, (err) => {
            if (!err) {
              this.isSubscribed = true;
              logger.info("RealtimeService subscribed to Redis chat channel");
            }
          });
        }
      }).catch(() => {
        // Fallback to local
      });
    } catch {
      // Fallback to local
    }
  }

  public registerSocket(socket: AuthenticatedSocket) {
    if (!this.userSockets.has(socket.userId)) {
      this.userSockets.set(socket.userId, new Map());
    }
    this.userSockets.get(socket.userId)!.set(socket.id, socket);

    logger.debug({ userId: socket.userId, socketId: socket.id }, "WebSocket registered for user");
  }

  public unregisterSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    logger.debug({ userId, socketId }, "WebSocket unregistered for user");
  }

  public disconnectUserSockets(userId: string, reason = "Session revoked or logged out") {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    for (const [_, socket] of sockets) {
      try {
        socket.ws.close(1008, reason);
      } catch {
        // Ignore close errors
      }
    }
    this.userSockets.delete(userId);
    logger.info({ userId, count: sockets.size }, "Closed all active WebSockets for user");
  }

  public async publishEvent(event: RealtimeEvent): Promise<void> {
    const payload = JSON.stringify(event);

    if (this.isSubscribed && isRedisConnected()) {
      try {
        await redis.publish(REDIS_CHAT_CHANNEL, payload);
        return;
      } catch (err: any) {
        logger.warn({ err: err.message }, "Failed to publish event to Redis, delivering locally");
      }
    }

    // Deliver locally (in-memory fallback for test and single-instance)
    this.deliverEventLocally(event);
  }

  private deliverEventLocally(event: RealtimeEvent) {
    // Deliver to targeted recipients
    if (event.type === "conversation.updated") {
      for (const recipientId of event.recipientIds) {
        this.sendToUser(recipientId, event);
      }
      return;
    }

    // For message events, send to both recipient and sender
    if ("recipientId" in event) {
      this.sendToUser(event.recipientId, event);
    }
    if ("senderId" in event && event.senderId !== event.recipientId) {
      this.sendToUser(event.senderId, event);
    }
  }

  public sendToUser(userId: string, payload: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;

    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    for (const [_, socket] of sockets) {
      if (socket.ws.readyState === socket.ws.OPEN) {
        try {
          socket.ws.send(data);
        } catch (err: any) {
          logger.warn({ socketId: socket.id, userId, err: err.message }, "Failed to send WS message to socket");
        }
      }
    }
  }

  public getConnectedUserCount(): number {
    return this.userSockets.size;
  }

  public isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  public async cleanup() {
    if (this.redisSub) {
      try {
        await this.redisSub.quit();
      } catch {
        this.redisSub.disconnect();
      }
      this.redisSub = null;
      this.isSubscribed = false;
    }
  }
}

export const realtimeService = new RealtimeService();
