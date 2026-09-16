import { z } from "zod";

export const InteractionReasonTypeEnum = z.enum([
  "SHARED_INTEREST",
  "SHARED_ANSWER",
  "RELATIONSHIP_INTENT",
  "PROFILE_PROMPT",
  "OTHER"
]);

export const likeInputSchema = z
  .object({
    reasonType: InteractionReasonTypeEnum.optional()
  })
  .strict();

export const candidateParamSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID format")
});

export type InteractionReasonType = z.infer<typeof InteractionReasonTypeEnum>;
export type LikeInput = z.infer<typeof likeInputSchema>;
