import { z } from "zod";

export const DiscoveryEventTypeEnum = z.enum([
  "VIEW",
  "SKIP",
  "OPEN_PROFILE",
  "REPORT",
  "BLOCK",
  "OTHER"
]);

export const discoveryQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(20),
  cursor: z.string().trim().optional()
});

export const createDiscoveryEventSchema = z
  .object({
    candidateUserId: z.string().uuid("Candidate user ID must be a valid UUID"),
    eventType: DiscoveryEventTypeEnum,
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;
export type CreateDiscoveryEventInput = z.infer<typeof createDiscoveryEventSchema>;
