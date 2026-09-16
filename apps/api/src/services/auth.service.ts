import { prisma } from "../config/db.js";
import { type LoginInput, type RegisterInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  generateSessionToken,
  getSessionExpiryDate,
  hashClientIp,
  hashSessionToken
} from "../utils/session.js";

// Standard dummy hash used for constant-time comparison when email is not found
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHQxMjM0NTY3OA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export interface SafeUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
}

export interface AuthResult {
  user: SafeUser;
  sessionToken: string;
}

function toSafeUser(user: {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export async function register(data: RegisterInput, meta: ClientMeta): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(data.password);
  const sessionToken = generateSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const ipHash = hashClientIp(meta.ip);
  const expiresAt = getSessionExpiryDate();

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        status: "ACTIVE",
        role: "MEMBER",
        isVerified: false
      }
    });

    await tx.authCredential.create({
      data: {
        userId: newUser.id,
        passwordHash,
        passwordAlgo: "argon2id"
      }
    });

    await tx.userSession.create({
      data: {
        userId: newUser.id,
        refreshTokenHash: tokenHash,
        ipHash,
        userAgent: meta.userAgent ?? null,
        expiresAt,
        isRevoked: false
      }
    });

    return newUser;
  });

  return {
    user: toSafeUser(user),
    sessionToken
  };
}

export async function login(data: LoginInput, meta: ClientMeta): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { authCredential: true }
  });

  if (!user || !user.authCredential || user.status !== "ACTIVE" || user.deletedAt) {
    await verifyPassword(DUMMY_HASH, data.password);
    throw new AppError("Invalid email or password", 401);
  }

  const { authCredential } = user;

  if (authCredential.lockedUntil && authCredential.lockedUntil > new Date()) {
    throw new AppError("Account is temporarily locked due to excessive failed attempts. Please try again later.", 423);
  }

  const isValidPassword = await verifyPassword(authCredential.passwordHash, data.password);

  if (!isValidPassword) {
    const failedAttempts = authCredential.failedAttempts + 1;
    const shouldLock = failedAttempts >= 5;
    const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.authCredential.update({
      where: { id: authCredential.id },
      data: {
        failedAttempts,
        lockedUntil
      }
    });

    throw new AppError("Invalid email or password", 401);
  }

  if (authCredential.failedAttempts > 0 || authCredential.lockedUntil) {
    await prisma.authCredential.update({
      where: { id: authCredential.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null
      }
    });
  }

  const sessionToken = generateSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const ipHash = hashClientIp(meta.ip);
  const expiresAt = getSessionExpiryDate();

  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: tokenHash,
      ipHash,
      userAgent: meta.userAgent ?? null,
      expiresAt,
      isRevoked: false
    }
  });

  return {
    user: toSafeUser(user),
    sessionToken
  };
}

export async function logout(sessionToken: string | undefined): Promise<void> {
  if (!sessionToken) {
    return;
  }

  const tokenHash = hashSessionToken(sessionToken);

  await prisma.userSession.updateMany({
    where: {
      refreshTokenHash: tokenHash,
      isRevoked: false
    },
    data: {
      isRevoked: true,
      revokedAt: new Date()
    }
  });
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: {
      userId,
      isRevoked: false
    },
    data: {
      isRevoked: true,
      revokedAt: new Date()
    }
  });
}

export async function verifySession(sessionToken: string | undefined): Promise<{ user: SafeUser; sessionId: string } | null> {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);

  const session = await prisma.userSession.findUnique({
    where: { refreshTokenHash: tokenHash },
    include: { user: true }
  });

  if (!session || session.isRevoked || session.expiresAt <= new Date()) {
    return null;
  }

  if (session.user.status !== "ACTIVE" || session.user.deletedAt) {
    return null;
  }

  return {
    user: toSafeUser(session.user),
    sessionId: session.id
  };
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("User not found", 404);
  }

  return toSafeUser(user);
}
