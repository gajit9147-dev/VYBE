export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => ["auth", "me"] as const,
  verification: () => ["auth", "email-verification"] as const,
  verificationStatus: (email?: string) =>
    ["auth", "email-verification", "status", email ?? "me"] as const,
  profile: (userId?: string) => ["profile", userId ?? "me"] as const,
  phoneStatus: () => [...authKeys.all, "phone-status"] as const,
};
