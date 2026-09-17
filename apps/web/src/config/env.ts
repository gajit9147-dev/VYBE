import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:4000"),
  MODE: z.string().default("development"),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false)
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

if (!parsed.success) {
  // Gracefully handle or warn rather than crashing silently
  console.error("Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid frontend environment configuration.");
}

export const env = parsed.data;
