import { z } from "zod";

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid("Invalid cursor format").optional()
});

export const matchParamSchema = z.object({
  matchId: z.string().uuid("Invalid match ID format")
});

export const unmatchBodySchema = z
  .object({
    reasonCode: z.string().max(48).optional()
  })
  .strict();

export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
export type MatchParams = z.infer<typeof matchParamSchema>;
export type UnmatchBody = z.infer<typeof unmatchBodySchema>;
