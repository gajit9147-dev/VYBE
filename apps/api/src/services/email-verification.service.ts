import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { emailProvider } from "./email/email.provider.js";
import { createVerificationEmailTemplate } from "./email/templates.js";

// Cooldown between verification email requests per user/email: 60 seconds
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface SendVerificationResult {
  message: string;
}

export interface VerifyEmailResult {
  message: string;
  email: string | null;
  isVerified: boolean;
  verifiedAt: string;
}

export interface VerificationStatusResult {
  email: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
}

export async function sendVerificationEmail(options: {
  userId?: string;
  email?: string;
}): Promise<SendVerificationResult> {
  const { userId, email } = options;

  if (!userId && !email) {
    throw new AppError("A valid user or email is required", 400);
  }

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email: email?.toLowerCase().trim() } });

  // Return generic success message to prevent user enumeration
  if (!user || !user.email || user.status !== "ACTIVE" || user.deletedAt) {
    return {
      message: "If an active account exists with that email, a verification link has been sent."
    };
  }

  if (user.emailVerifiedAt !== null) {
    return {
      message: "Email is already verified."
    };
  }

  // Check resend cooldown: last token created within RESEND_COOLDOWN_MS
  const lastToken = await prisma.emailVerificationToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  if (lastToken) {
    const elapsed = Date.now() - lastToken.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new AppError(
        `Please wait ${remainingSeconds} seconds before requesting another verification email.`,
        429
      );
    }
  }

  // Generate 32-byte cryptographically secure token
  const rawToken = generateVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expiresInHours = env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS;
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  // Store only the token hash in PostgreSQL
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  // Construct verification URL without hardcoding production host
  const verificationUrl = `${env.APP_BASE_URL}/api/auth/email-verification/verify?token=${encodeURIComponent(rawToken)}`;
  const emailContent = createVerificationEmailTemplate(verificationUrl, expiresInHours);

  // Dispatch email (raw token never logged)
  await emailProvider.send({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  });

  return {
    message: "If an active account exists with that email, a verification link has been sent."
  };
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  if (!token || typeof token !== "string" || token.trim().length < 32) {
    throw new AppError("Invalid verification token format", 400);
  }

  const tokenHash = hashVerificationToken(token.trim());

  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!tokenRecord || tokenRecord.usedAt !== null) {
    throw new AppError("Invalid or already used verification token", 400);
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new AppError("Verification token has expired", 400);
  }

  const now = new Date();

  // Atomically update user state, mark token consumed, and invalidate all other tokens for this user
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: tokenRecord.userId },
      data: {
        emailVerifiedAt: now
      }
    });

    await tx.emailVerificationToken.update({
      where: { id: tokenRecord.id },
      data: {
        usedAt: now
      }
    });

    // Invalidate all other pending tokens for this user
    await tx.emailVerificationToken.updateMany({
      where: {
        userId: tokenRecord.userId,
        usedAt: null,
        id: { not: tokenRecord.id }
      },
      data: {
        usedAt: now
      }
    });
  });

  return {
    message: "Email verified successfully.",
    email: tokenRecord.user.email,
    isVerified: true,
    verifiedAt: now.toISOString()
  };
}

export async function getVerificationStatus(options: {
  userId?: string;
  email?: string;
}): Promise<VerificationStatusResult> {
  const { userId, email } = options;

  if (!userId && !email) {
    throw new AppError("Authentication required or email must be specified", 400);
  }

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email: email?.toLowerCase().trim() } });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("Account not found", 404);
  }

  return {
    email: user.email,
    isVerified: user.emailVerifiedAt !== null,
    verifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null
  };
}
