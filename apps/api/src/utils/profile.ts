export const MINIMUM_AGE = 18;
export const MAXIMUM_AGE = 120;

export const RESERVED_USERNAMES = new Set([
  "about",
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "bot",
  "contact",
  "dashboard",
  "delete",
  "dev",
  "developer",
  "discover",
  "explore",
  "help",
  "home",
  "info",
  "login",
  "logout",
  "match",
  "matches",
  "me",
  "messages",
  "mod",
  "moderator",
  "null",
  "official",
  "password",
  "phone",
  "privacy",
  "profile",
  "register",
  "remove",
  "root",
  "security",
  "settings",
  "signup",
  "status",
  "support",
  "system",
  "terms",
  "test",
  "undefined",
  "user",
  "users",
  "verify",
  "vybe"
]);

/**
 * Calculates accurate age from a birth date.
 */
export function calculateAge(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Normalizes username to lowercase and trims whitespace.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Validates whether a username is reserved by the system.
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(username));
}

/**
 * Strips HTML tags and controls characters to prevent XSS / markup injection.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // strip non-printable ASCII control chars
    .trim();
}
