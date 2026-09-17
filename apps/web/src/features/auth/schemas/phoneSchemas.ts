import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(25, "Phone number is too long")
  .refine(
    (value) => {
      const cleaned = value.replace(/[\s\-().]/g, "");
      return /^\+?[1-9]\d{6,14}$/.test(cleaned);
    },
    {
      message: "Please enter a valid international phone number",
    },
  );

export const otpSchema = z
  .string()
  .trim()
  .length(6, "Verification code must be exactly 6 digits")
  .regex(/^\d{6}$/, "Verification code must contain only numbers");

export const phoneVerificationSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const phoneOtpVerificationSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otp: otpSchema,
});

export type PhoneVerificationFormData = z.infer<typeof phoneVerificationSchema>;

export type PhoneOtpVerificationFormData = z.infer<
  typeof phoneOtpVerificationSchema
>;
