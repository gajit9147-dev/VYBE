import crypto from "node:crypto";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashClientIp(ip: string | undefined): string {
  const normalizedIp = (ip ?? "127.0.0.1").trim();
  return crypto.createHash("sha256").update(normalizedIp).digest("hex");
}

export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.SESSION_TTL_SECONDS * 1000
  };
}

export function getSessionExpiryDate(): Date {
  return new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);
}
