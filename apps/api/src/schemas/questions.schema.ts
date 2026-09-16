import { z } from "zod";
import { sanitizeText } from "../utils/profile.js";

export const QuestionCategoryEnum = z.enum([
  "VALUES",
  "LIFESTYLE",
  "PERSONALITY",
  "RELATIONSHIPS",
  "FUN",
  "DEEP",
  "DAILY_LIFE"
]);

export const AnswerVisibilityEnum = z.enum([
  "PUBLIC",
  "DISCOVERY",
  "MATCHES_ONLY",
  "PRIVATE"
]);

export const listQuestionsQuerySchema = z.object({
  category: QuestionCategoryEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const createAnswerSchema = z
  .object({
    questionId: z.string().uuid("Question ID must be a valid UUID"),
    answer: z
      .string()
      .trim()
      .min(2, "Answer must be at least 2 characters")
      .max(500, "Answer cannot exceed 500 characters")
      .transform((val) => sanitizeText(val)),
    visibility: AnswerVisibilityEnum.default("PUBLIC")
  })
  .strict();

export const updateAnswerSchema = z
  .object({
    answer: z
      .string()
      .trim()
      .min(2, "Answer must be at least 2 characters")
      .max(500, "Answer cannot exceed 500 characters")
      .transform((val) => sanitizeText(val))
      .optional(),
    visibility: AnswerVisibilityEnum.optional()
  })
  .strict()
  .refine((data) => data.answer !== undefined || data.visibility !== undefined, {
    message: "At least one field (answer or visibility) must be provided to update"
  });

export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerInput = z.infer<typeof updateAnswerSchema>;
