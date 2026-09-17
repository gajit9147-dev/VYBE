/**
 * Validates and sanitizes redirect paths to strictly allow internal application routes,
 * preventing open redirect vulnerabilities (e.g. //evil.com, https://evil.com, javascript:).
 */
export function getSafeRedirectUrl(
  rawRedirect: string | null | undefined,
  fallback = "/app"
): string {
  if (!rawRedirect) return fallback;

  try {
    const decoded = decodeURIComponent(rawRedirect).trim();

    // Must be a relative path starting with a single forward slash
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.startsWith("/\\") &&
      !decoded.includes("://") &&
      !decoded.toLowerCase().startsWith("javascript:")
    ) {
      return decoded;
    }
  } catch {
    // Malformed URI encoding
    return fallback;
  }

  return fallback;
}
