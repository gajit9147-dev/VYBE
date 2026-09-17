import { z } from "zod";
import type { ProfileGender } from "../types/profileTypes";

const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
const genders: [ProfileGender, ...ProfileGender[]] = [
  "WOMAN",
  "MAN",
  "NON_BINARY",
  "GENDERQUEER",
  "OTHER",
];

function calculateAge(dateString: string): number {
  const birthDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

const optionalProfileText = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const basicProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name must not exceed 50 characters"),
  username: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || usernamePattern.test(value),
      "Username must be 3-30 characters using letters, numbers, or underscores",
    ),
  birthDate: z
    .string()
    .trim()
    .refine(
      (value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()),
      "Enter a valid date of birth",
    )
    .refine(
      (value) => calculateAge(value) >= 18,
      "You must be at least 18 years old to use VYBE",
    )
    .refine((value) => calculateAge(value) <= 120, "Date of birth is invalid"),
  gender: z.enum(genders, { message: "Select a gender" }),
  pronouns: optionalProfileText(32, "Pronouns must not exceed 32 characters"),
  bio: optionalProfileText(500, "Bio must not exceed 500 characters"),
  city: optionalProfileText(100, "City must not exceed 100 characters"),
  country: optionalProfileText(100, "Country must not exceed 100 characters"),
});

export type BasicProfileFormData = z.infer<typeof basicProfileSchema>;
