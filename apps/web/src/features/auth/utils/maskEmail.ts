/**
 * Safely masks an email address for public display without exposing full account identifiers.
 * Example: ajeet@gmail.com -> a••••@gmail.com
 * Example: test@example.com -> t•••@example.com
 */
export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return "••••@••••.•••";
  }

  const parts = email.trim().split("@");
  if (parts.length !== 2) {
    return "••••@••••.•••";
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) {
    return "••••@••••.•••";
  }

  const firstChar = localPart.charAt(0);
  const maskedLocal = firstChar + "•".repeat(Math.max(3, Math.min(localPart.length - 1, 6)));

  return `${maskedLocal}@${domainPart}`;
}
