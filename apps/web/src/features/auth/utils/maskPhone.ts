export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }

  const cleaned = phone.trim();

  if (cleaned.length <= 5) {
    return "+******";
  }

  const visibleStart = cleaned.slice(0, 3);
  const visibleEnd = cleaned.slice(-4);
  const maskedLength = Math.max(
    3,
    cleaned.length - visibleStart.length - visibleEnd.length,
  );

  return `${visibleStart}${"•".repeat(maskedLength)}${visibleEnd}`;
}
