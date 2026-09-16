import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { isRedisConnected, redis } from "../config/redis.js";
import { AppError } from "../utils/app-error.js";
import { verifyPassword } from "../utils/password.js";
import {
  generateNumericOtp,
  hashOtp,
  hashPhoneNumber,
  maskPhoneNumber,
  normalizePhoneNumber
} from "../utils/phone.js";
import {
  checkSendOtpRateLimits,
  checkVerifyOtpRateLimits
} from "./phone-rate-limiter.service.js";
import { smsProvider } from "./sms/sms.provider.js";

export interface SendOtpResult {
  message: string;
  phoneNumber: string | null;
}

export interface VerifyOtpResult {
  message: string;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  phoneVerifiedAt: string;
}

export interface PhoneStatusResult {
  isPhoneVerified: boolean;
  phoneNumber: string | null;
  phoneVerifiedAt: string | null;
}

export interface RemovePhoneResult {
  message: string;
  isPhoneVerified: boolean;
}

/**
 * Sends a cryptographically secure 6-digit OTP to the specified phone number.
 * Enforces:
 * - E.164 normalization
 * - Independent rate-limiting (Phone, IP, User)
 * - Resend cooldown
 * - Invalidation of prior tokens
 * - Storage of only SHA-256 hash
 * - Zero logging of raw OTP
 */
export async function sendOtp(params: {
  userId: string;
  phoneNumber: string;
  ip: string;
}): Promise<SendOtpResult> {
  const { userId, ip } = params;
  const normalizedPhone = normalizePhoneNumber(params.phoneNumber);

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("Active account not found", 404);
  }

  // Check if this exact number is already verified on this account
  if (user.phoneNumber === normalizedPhone && user.phoneVerifiedAt !== null) {
    throw new AppError("This phone number is already verified for your account.", 400);
  }

  // Check if another account has already claimed and verified this phone number
  const existingVerified = await prisma.user.findFirst({
    where: {
      phoneNumber: normalizedPhone,
      phoneVerifiedAt: { not: null },
      id: { not: userId }
    }
  });

  if (existingVerified) {
    throw new AppError("This phone number cannot be used. It is already registered to another verified account.", 409);
  }

  // Multi-dimensional independent rate limiting
  await checkSendOtpRateLimits({
    phoneNumber: normalizedPhone,
    ip,
    userId
  });

  // Enforce resend cooldown (e.g. 60 seconds)
  const cooldownMs = env.PHONE_RESEND_COOLDOWN_SECONDS * 1000;
  const lastToken = await prisma.phoneVerificationToken.findFirst({
    where: {
      userId,
      phoneNumber: normalizedPhone
    },
    orderBy: { createdAt: "desc" }
  });

  if (lastToken) {
    const elapsed = Date.now() - lastToken.createdAt.getTime();
    if (elapsed < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      throw new AppError(
        `Please wait ${remainingSeconds} seconds before requesting another verification code.`,
        429
      );
    }
  }

  const now = new Date();

  // Invalidate any existing unconsumed tokens for this user in DB
  await prisma.phoneVerificationToken.updateMany({
    where: {
      userId,
      usedAt: null
    },
    data: {
      usedAt: now
    }
  });

  const phoneKeyHash = hashPhoneNumber(normalizedPhone);
  const redisOtpKey = `otp:pending:${userId}:${phoneKeyHash}`;

  // Invalidate prior Redis temporary OTP state if present
  if (isRedisConnected()) {
    try {
      await redis.del(redisOtpKey);
    } catch {
      // Redis cleanup fallback
    }
  }

  // Generate cryptographically secure 6-digit numeric OTP
  const rawOtp = generateNumericOtp();
  const otpHash = hashOtp(rawOtp);
  const ttlMs = env.PHONE_OTP_TTL_MINUTES * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  // Store in PostgreSQL database (only hashed OTP is stored)
  await prisma.phoneVerificationToken.create({
    data: {
      userId,
      phoneNumber: normalizedPhone,
      otpHash,
      attempts: 0,
      maxAttempts: env.PHONE_OTP_MAX_ATTEMPTS,
      expiresAt
    }
  });

  // Store protected OTP representation temporarily in Redis with exact TTL
  if (isRedisConnected()) {
    try {
      await redis.set(
        redisOtpKey,
        JSON.stringify({
          otpHash,
          attempts: 0,
          maxAttempts: env.PHONE_OTP_MAX_ATTEMPTS,
          expiresAt: expiresAt.toISOString()
        }),
        "EX",
        env.PHONE_OTP_TTL_MINUTES * 60
      );
    } catch {
      // Redis is safe cache/temporary state layer; fallback seamlessly to PostgreSQL
    }
  }

  // Dispatch via SMS provider abstraction (provider never logs raw OTP)
  await smsProvider.sendSms({
    to: normalizedPhone,
    message: `Your VYBE verification code is ${rawOtp}. Valid for ${env.PHONE_OTP_TTL_MINUTES} minutes. Never share this code.`
  });

  return {
    message: "Verification code sent successfully.",
    phoneNumber: maskPhoneNumber(normalizedPhone)
  };
}

/**
 * Verifies a submitted 6-digit OTP against the stored hash.
 * Enforces:
 * - Single-use consumption
 * - Strict attempt limits
 * - Expiration check
 * - Immediate invalidation
 * - Atomic state transition
 */
export async function verifyOtp(params: {
  userId: string;
  phoneNumber: string;
  otp: string;
  ip: string;
}): Promise<VerifyOtpResult> {
  const { userId, otp, ip } = params;
  const normalizedPhone = normalizePhoneNumber(params.phoneNumber);

  // Multi-dimensional independent rate limiting
  await checkVerifyOtpRateLimits({
    phoneNumber: normalizedPhone,
    ip,
    userId
  });

  // Fetch the latest active token record for this user and normalized number
  const tokenRecord = await prisma.phoneVerificationToken.findFirst({
    where: {
      userId,
      phoneNumber: normalizedPhone,
      usedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (!tokenRecord) {
    throw new AppError("Invalid or expired verification code.", 400);
  }

  const now = new Date();

  // Check if max attempts reached previously
  if (tokenRecord.attempts >= tokenRecord.maxAttempts) {
    await prisma.phoneVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: now }
    });
    throw new AppError("Maximum verification attempts exceeded. Please request a new code.", 400);
  }

  // Check expiration
  if (tokenRecord.expiresAt < now) {
    await prisma.phoneVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: now }
    });
    throw new AppError("Verification code has expired. Please request a new code.", 400);
  }

  // Verify hash
  const inputHash = hashOtp(otp);
  if (inputHash !== tokenRecord.otpHash) {
    const updatedAttempts = tokenRecord.attempts + 1;
    const isExceeded = updatedAttempts >= tokenRecord.maxAttempts;

    await prisma.phoneVerificationToken.update({
      where: { id: tokenRecord.id },
      data: {
        attempts: updatedAttempts,
        usedAt: isExceeded ? now : null
      }
    });

    if (isRedisConnected()) {
      try {
        const phoneKeyHash = hashPhoneNumber(normalizedPhone);
        const redisOtpKey = `otp:pending:${userId}:${phoneKeyHash}`;
        if (isExceeded) {
          await redis.del(redisOtpKey);
        } else {
          const cached = await redis.get(redisOtpKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.attempts = updatedAttempts;
            const remainingTtl = await redis.ttl(redisOtpKey);
            if (remainingTtl > 0) {
              await redis.set(redisOtpKey, JSON.stringify(parsed), "EX", remainingTtl);
            }
          }
        }
      } catch {
        // Redis fallback
      }
    }

    if (isExceeded) {
      throw new AppError("Maximum verification attempts exceeded. Please request a new code.", 400);
    }

    const remainingAttempts = tokenRecord.maxAttempts - updatedAttempts;
    throw new AppError(`Invalid verification code. ${remainingAttempts} attempt(s) remaining.`, 400);
  }

  // Hash matched! Check that no other user claimed this phone while verification was pending
  const conflictingUser = await prisma.user.findFirst({
    where: {
      phoneNumber: normalizedPhone,
      phoneVerifiedAt: { not: null },
      id: { not: userId }
    }
  });

  if (conflictingUser) {
    await prisma.phoneVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: now }
    });
    if (isRedisConnected()) {
      try {
        const phoneKeyHash = hashPhoneNumber(normalizedPhone);
        await redis.del(`otp:pending:${userId}:${phoneKeyHash}`);
      } catch {
        // Redis fallback
      }
    }
    throw new AppError("This phone number is already verified with another account.", 409);
  }

  // Atomically update user phone and invalidate all pending tokens for this user
  await prisma.$transaction(async (tx) => {
    // 1. Consume current token
    await tx.phoneVerificationToken.update({
      where: { id: tokenRecord.id },
      data: {
        usedAt: now
      }
    });

    // 2. Invalidate any other tokens
    await tx.phoneVerificationToken.updateMany({
      where: {
        userId,
        usedAt: null,
        id: { not: tokenRecord.id }
      },
      data: {
        usedAt: now
      }
    });

    // 3. Update User phone number and phoneVerifiedAt (leaves email/identity verification intact)
    await tx.user.update({
      where: { id: userId },
      data: {
        phoneNumber: normalizedPhone,
        phoneVerifiedAt: now
      }
    });
  });

  // Clean up Redis temporary OTP state upon successful verification
  if (isRedisConnected()) {
    try {
      const phoneKeyHash = hashPhoneNumber(normalizedPhone);
      await redis.del(`otp:pending:${userId}:${phoneKeyHash}`);
    } catch {
      // Redis cleanup fallback
    }
  }

  return {
    message: "Phone number verified successfully.",
    phoneNumber: maskPhoneNumber(normalizedPhone),
    isPhoneVerified: true,
    phoneVerifiedAt: now.toISOString()
  };
}

/**
 * Returns privacy-masked phone verification status for an authenticated user.
 */
export async function getPhoneStatus(userId: string): Promise<PhoneStatusResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phoneNumber: true,
      phoneVerifiedAt: true,
      status: true,
      deletedAt: true
    }
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("Account not found", 404);
  }

  return {
    isPhoneVerified: user.phoneVerifiedAt !== null,
    phoneNumber: maskPhoneNumber(user.phoneNumber),
    phoneVerifiedAt: user.phoneVerifiedAt ? user.phoneVerifiedAt.toISOString() : null
  };
}

/**
 * Removes a phone number from an authenticated user account.
 * Requires re-authentication via password.
 * Invalidates all previous phone tokens.
 */
export async function removePhone(params: {
  userId: string;
  password: string;
}): Promise<RemovePhoneResult> {
  const { userId, password } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      authCredential: true
    }
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("Account not found", 404);
  }

  if (!user.authCredential) {
    throw new AppError("Authentication credentials not configured", 400);
  }

  // Verify password for re-authentication
  const isValid = await verifyPassword(user.authCredential.passwordHash, password);
  if (!isValid) {
    throw new AppError("Invalid password. Re-authentication is required to remove your phone number.", 401);
  }

  if (!user.phoneNumber) {
    throw new AppError("No phone number is associated with this account.", 400);
  }

  const now = new Date();

  // Atomically remove phone from user and invalidate all tokens
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        phoneNumber: null,
        phoneVerifiedAt: null
      }
    });

    await tx.phoneVerificationToken.updateMany({
      where: {
        userId,
        usedAt: null
      },
      data: {
        usedAt: now
      }
    });
  });

  if (isRedisConnected() && user.phoneNumber) {
    try {
      const phoneKeyHash = hashPhoneNumber(user.phoneNumber);
      await redis.del(`otp:pending:${userId}:${phoneKeyHash}`);
    } catch {
      // Redis cleanup fallback
    }
  }

  return {
    message: "Phone number removed successfully.",
    isPhoneVerified: false
  };
}
