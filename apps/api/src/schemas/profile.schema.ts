import { z } from "zod";
import {
  calculateAge,
  isReservedUsername,
  MAXIMUM_AGE,
  MINIMUM_AGE,
  normalizeUsername,
  sanitizeText
} from "../utils/profile.js";

const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must not exceed 30 characters")
  .regex(usernameRegex, "Username can only contain alphanumeric characters and underscores")
  .transform((val) => normalizeUsername(val))
  .refine((val) => !isReservedUsername(val), {
    message: "This username is reserved and cannot be claimed"
  });

export const birthDateSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const parsed = new Date(val);
      return !isNaN(parsed.getTime());
    },
    { message: "Date of birth must be a valid date string (e.g. YYYY-MM-DD)" }
  )
  .transform((val) => new Date(val))
  .refine(
    (date) => {
      const age = calculateAge(date);
      return age >= MINIMUM_AGE;
    },
    { message: `You must be at least ${MINIMUM_AGE} years old to use VYBE` }
  )
  .refine(
    (date) => {
      const age = calculateAge(date);
      return age <= MAXIMUM_AGE;
    },
    { message: "Date of birth is invalid" }
  );

export const photoInputSchema = z
  .object({
    storageKey: z.string().trim().min(1).max(255),
    cdnUrl: z.string().trim().url("Photo CDN URL must be a valid URL").max(512),
    displayOrder: z.number().int().min(0).max(10).default(0),
    isPrimary: z.boolean().default(false)
  })
  .strict();

export const promptAnswerInputSchema = z
  .object({
    templateId: z.string().uuid("Invalid prompt template ID"),
    answerText: z
      .string()
      .trim()
      .min(1, "Answer text cannot be empty")
      .max(500, "Answer text must not exceed 500 characters")
      .transform(sanitizeText)
  })
  .strict();

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "Display name cannot be empty")
      .max(50, "Display name must not exceed 50 characters")
      .transform(sanitizeText)
      .optional(),
    username: usernameSchema.optional(),
    birthDate: birthDateSchema.optional(),
    gender: z.enum(["WOMAN", "MAN", "NON_BINARY", "GENDERQUEER", "OTHER"]).optional(),
    pronouns: z
      .string()
      .trim()
      .max(32, "Pronouns must not exceed 32 characters")
      .transform(sanitizeText)
      .nullable()
      .optional(),
    bio: z
      .string()
      .trim()
      .max(500, "Bio must not exceed 500 characters")
      .transform(sanitizeText)
      .nullable()
      .optional(),
    city: z
      .string()
      .trim()
      .max(100, "City must not exceed 100 characters")
      .transform(sanitizeText)
      .nullable()
      .optional(),
    country: z
      .string()
      .trim()
      .max(100, "Country must not exceed 100 characters")
      .transform(sanitizeText)
      .nullable()
      .optional(),
    heightCm: z.number().int().min(50).max(260).nullable().optional(),
    occupation: z.string().trim().max(100).transform(sanitizeText).nullable().optional(),
    company: z.string().trim().max(100).transform(sanitizeText).nullable().optional(),
    education: z.string().trim().max(100).transform(sanitizeText).nullable().optional(),
    drinking: z.enum(["NEVER", "SOCIALLY", "REGULARLY", "SOBER"]).nullable().optional(),
    smoking: z.enum(["NEVER", "SOCIALLY", "REGULARLY"]).nullable().optional(),
    exercise: z.enum(["DAILY", "OFTEN", "SOMETIMES", "RARELY"]).nullable().optional(),
    starSign: z.string().trim().max(20).nullable().optional(),
    languages: z.array(z.string().trim().max(40)).max(20).optional(),
    isDiscoverable: z.boolean().optional(),
    showAge: z.boolean().optional(),
    showDistance: z.boolean().optional(),
    crossedPathOptIn: z.boolean().optional(),
    interestIds: z.array(z.string().uuid("Invalid interest ID")).max(15).optional(),
    relationshipIntentId: z.string().uuid("Invalid relationship intent ID").nullable().optional(),
    relationshipIntentClarification: z
      .string()
      .trim()
      .max(150)
      .transform(sanitizeText)
      .nullable()
      .optional(),
    prompts: z.array(promptAnswerInputSchema).max(5).optional(),
    photos: z.array(photoInputSchema).max(9).optional()
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
