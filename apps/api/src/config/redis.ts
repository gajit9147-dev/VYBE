import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let isConnected = false;

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    if (env.NODE_ENV === "test" || times > 3) {
      return null; // Don't keep retrying in test or when offline
    }
    return Math.min(times * 100, 2000);
  }
});

redis.on("connect", () => {
  isConnected = true;
  logger.info({ host: env.REDIS_HOST, port: env.REDIS_PORT }, "Redis connected successfully");
});

redis.on("ready", () => {
  isConnected = true;
});

redis.on("error", (err: Error) => {
  isConnected = false;
  if (env.NODE_ENV !== "test") {
    logger.warn({ err: err.message }, "Redis connection error, fallback in-memory store will be used");
  }
});

redis.on("close", () => {
  isConnected = false;
});

export function isRedisConnected(): boolean {
  return isConnected && redis.status === "ready";
}

export async function ensureRedisConnection(): Promise<boolean> {
  if (isRedisConnected()) {
    return true;
  }
  try {
    if (redis.status === "wait" || redis.status === "close") {
      await redis.connect();
      return true;
    }
    return redis.status === "ready";
  } catch (error) {
    isConnected = false;
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.status !== "end" && redis.status !== "close") {
      await redis.quit();
    }
  } catch {
    redis.disconnect();
  } finally {
    isConnected = false;
  }
}
