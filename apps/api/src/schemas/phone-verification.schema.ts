import { z } from "zod";
import { normalizePhoneNumber } from "../utils/phone.js";

/**
 * Validates and transforms a phone number into canonical E.164 format.
 */
const phoneNumberSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(25, "Phone number is too long")
  .transform((val, ctx) => {
    try {
      return normalizePhoneNumber(val);
    } catch (err: unknown) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : "Invalid phone number format"
      });
      return z.NEVER;
    }
  });

export const sendPhoneOtpSchema = z.object({
  phoneNumber: phoneNumberSchema
});

export const verifyPhoneOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otp: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers")
});

export const removePhoneSchema = z.object({
  password: z
    .string()
    .min(1, "Password is required for re-authentication to remove phone number")
});

export type SendPhoneOtpInput = z.infer<typeof sendPhoneOtpSchema>;
export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;
export type RemovePhoneInput = z.infer<typeof removePhoneSchema>;
