import { z } from "zod";
import { sanitizeText } from "../utils/profile.js";

const GenderEnum = z.enum(["WOMAN", "MAN", "NON_BINARY", "GENDERQUEER", "OTHER"]);

export const addProfileInterestSchema = z
  .object({
    interestId: z.string().uuid("Interest ID must be a valid UUID")
  })
  .strict();

export const setRelationshipIntentsSchema = z
  .object({
    intentIds: z
      .array(z.string().uuid("Intent ID must be a valid UUID"))
      .min(1, "At least one relationship intent must be selected")
      .max(5, "At most 5 relationship intents can be selected"),
    primaryIntentId: z.string().uuid("Primary intent ID must be a valid UUID").optional(),
    customClarification: z
      .string()
      .trim()
      .max(150, "Custom clarification must not exceed 150 characters")
      .transform((val) => sanitizeText(val))
      .optional()
  })
  .strict()
  .refine(
    (data) => {
      if (data.primaryIntentId) {
        return data.intentIds.includes(data.primaryIntentId);
      }
      return true;
    },
    {
      message: "primaryIntentId must be one of the selected intentIds",
      path: ["primaryIntentId"]
    }
  );

export const updateDiscoveryPreferencesSchema = z
  .object({
    minAge: z
      .number()
      .int("Minimum age must be an integer")
      .min(18, "Minimum age must be at least 18")
      .max(120, "Minimum age cannot exceed 120")
      .optional(),
    maxAge: z
      .number()
      .int("Maximum age must be an integer")
      .min(18, "Maximum age must be at least 18")
      .max(120, "Maximum age cannot exceed 120")
      .optional(),
    isAgeDealbreaker: z.boolean().optional(),
    maxDistanceKm: z
      .number()
      .int("Distance must be an integer")
      .min(1, "Maximum distance must be at least 1 km")
      .max(500, "Maximum distance cannot exceed 500 km")
      .optional(),
    isDistanceDealbreaker: z.boolean().optional(),
    interestedInGenders: z
      .array(GenderEnum)
      .min(1, "Must specify at least one interested gender")
      .optional(),
    relationshipIntentIds: z
      .array(z.string().uuid("Intent ID must be a valid UUID"))
      .optional(),
    isIntentDealbreaker: z.boolean().optional(),
    verifiedProfilesOnly: z.boolean().optional(),
    hasBioOnly: z.boolean().optional(),
    isDiscoveryPaused: z.boolean().optional()
  })
  .strict()
  .refine(
    (data) => {
      if (data.minAge !== undefined && data.maxAge !== undefined) {
        return data.minAge <= data.maxAge;
      }
      return true;
    },
    {
      message: "Minimum age cannot be greater than maximum age",
      path: ["minAge"]
    }
  );

export type AddProfileInterestInput = z.infer<typeof addProfileInterestSchema>;
export type SetRelationshipIntentsInput = z.infer<typeof setRelationshipIntentsSchema>;
export type UpdateDiscoveryPreferencesInput = z.infer<typeof updateDiscoveryPreferencesSchema>;
