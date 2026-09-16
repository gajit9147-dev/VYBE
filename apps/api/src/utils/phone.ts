import crypto from "node:crypto";

/**
 * Strict E.164 format validator:
 * - Leading '+'
 * - Non-zero leading country calling code digit
 * - Total length of digits between 7 and 15
 */
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Normalizes input string to canonical E.164 format:
 * - Trims leading/trailing whitespace
 * - Removes dashes, spaces, parentheses, dots
 * - Ensures leading '+'
 * - Throws or returns normalized string
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== "string") {
    throw new Error("Phone number must be a non-empty string");
  }

  // Remove common delimiter characters: spaces, dashes, parens, periods
  let cleaned = rawPhone.trim().replace(/[\s\-().]/g, "");

  // If user entered double zero international prefix '00', replace with '+'
  if (cleaned.startsWith("00")) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  // Ensure leading plus
  if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }

  if (!E164_REGEX.test(cleaned)) {
    throw new Error("Invalid phone number format. Must be a valid international number in E.164 format (e.g. +14155552671)");
  }

  return cleaned;
}

/**
 * Validates whether a phone number matches E.164 standard.
 */
export function isValidE164(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }
  return E164_REGEX.test(phone.trim());
}

/**
 * Masks a phone number for privacy-safe responses:
 * Keeps country code prefix and last 4 digits visible, masking all middle digits.
 * Example: "+14155552671" -> "+1******2671"
 */
export function maskPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }

  const cleaned = phone.trim();
  if (cleaned.length <= 5) {
    return "+******";
  }

  const visibleStart = cleaned.slice(0, 2); // e.g. "+1" or "+4"
  const visibleEnd = cleaned.slice(-4);    // e.g. "2671"
  const maskedLength = Math.max(2, cleaned.length - visibleStart.length - visibleEnd.length);
  const stars = "*".repeat(maskedLength);

  return `${visibleStart}${stars}${visibleEnd}`;
}

/**
 * Generates a SHA-256 hash of a phone number for audit logging or privacy-preserving lookups.
 */
export function hashPhoneNumber(phone: string): string {
  return crypto.createHash("sha256").update(phone.trim()).digest("hex");
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP (100000 - 999999).
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes a 6-digit OTP using SHA-256 for secure database/Redis storage.
 * Raw OTP is never persisted.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}
