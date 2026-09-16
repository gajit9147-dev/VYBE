import { isRedisConnected, redis } from "../config/redis.js";
import { AppError } from "../utils/app-error.js";
import { hashPhoneNumber } from "../utils/phone.js";

interface MemoryLimitRecord {
  count: number;
  resetAt: number;
}

const inMemoryLimits = new Map<string, MemoryLimitRecord>();

export interface RateLimitCheckOptions {
  key: string;
  max: number;
  windowSeconds: number;
  errorMessage?: string;
}

/**
 * Checks and increments an independent rate-limit bucket.
 * Uses Redis if available, falling back seamlessly to memory store.
 */
export async function checkRateLimit(options: RateLimitCheckOptions): Promise<void> {
  const {
    key,
    max,
    windowSeconds,
    errorMessage = "Too many requests. Please try again later."
  } = options;

  if (isRedisConnected()) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (current > max) {
        const ttl = await redis.ttl(key);
        throw new AppError(errorMessage, 429);
      }
      return;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      // Redis command error - fallback to memory store
    }
  }

  // In-memory fallback
  const now = Date.now();
  const existing = inMemoryLimits.get(key);

  if (!existing || now > existing.resetAt) {
    inMemoryLimits.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000
    });
    return;
  }

  if (existing.count >= max) {
    throw new AppError(errorMessage, 429);
  }

  existing.count += 1;
}

/**
 * Checks independent rate limits for sending OTP across 3 dimensions:
 * 1. Phone number (independent bucket)
 * 2. IP address (independent bucket)
 * 3. User account (independent bucket, if authenticated)
 */
export async function checkSendOtpRateLimits(params: {
  phoneNumber: string;
  ip: string;
  userId?: string;
}): Promise<void> {
  const { phoneNumber, ip, userId } = params;
  const phoneKeyHash = hashPhoneNumber(phoneNumber);

  // 1. Independent Phone Number limit: 5 requests per 15 minutes (900 seconds)
  await checkRateLimit({
    key: `rl:phone:send:${phoneKeyHash}`,
    max: 5,
    windowSeconds: 15 * 60,
    errorMessage: "Too many OTP requests for this phone number. Please wait before trying again."
  });

  // 2. Independent IP Address limit: 10 requests per 15 minutes
  await checkRateLimit({
    key: `rl:ip:send:${ip}`,
    max: 10,
    windowSeconds: 15 * 60,
    errorMessage: "Too many requests from this network. Please wait before trying again."
  });

  // 3. Independent User Account limit: 5 requests per 15 minutes
  if (userId) {
    await checkRateLimit({
      key: `rl:user:send:${userId}`,
      max: 5,
      windowSeconds: 15 * 60,
      errorMessage: "Too many OTP requests from this account. Please wait before trying again."
    });
  }
}

/**
 * Checks independent rate limits for verifying OTP across 3 dimensions:
 * 1. Phone number (independent bucket)
 * 2. IP address (independent bucket)
 * 3. User account (independent bucket, if authenticated)
 */
export async function checkVerifyOtpRateLimits(params: {
  phoneNumber: string;
  ip: string;
  userId?: string;
}): Promise<void> {
  const { phoneNumber, ip, userId } = params;
  const phoneKeyHash = hashPhoneNumber(phoneNumber);

  // 1. Independent Phone Number limit: 10 verification attempts per 15 minutes
  await checkRateLimit({
    key: `rl:phone:verify:${phoneKeyHash}`,
    max: 10,
    windowSeconds: 15 * 60,
    errorMessage: "Too many verification attempts for this phone number. Please try again later."
  });

  // 2. Independent IP Address limit: 20 verification attempts per 15 minutes
  await checkRateLimit({
    key: `rl:ip:verify:${ip}`,
    max: 20,
    windowSeconds: 15 * 60,
    errorMessage: "Too many verification attempts from this network. Please try again later."
  });

  // 3. Independent User Account limit: 10 verification attempts per 15 minutes
  if (userId) {
    await checkRateLimit({
      key: `rl:user:verify:${userId}`,
      max: 10,
      windowSeconds: 15 * 60,
      errorMessage: "Too many verification attempts from this account. Please try again later."
    });
  }
}

/**
 * Resets memory rate-limit store for testing teardown.
 */
export function resetPhoneRateLimits(): void {
  inMemoryLimits.clear();
}
