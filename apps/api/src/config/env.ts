import "dotenv/config";

import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGIN: z.string().url().optional(),
  DATABASE_URL: z.string().min(1).default("postgresql://vybe:vybe_local_password_change_me@127.0.0.1:5432/vybe?schema=public"),
  SESSION_COOKIE_NAME: z.string().min(1).default("vybe_session"),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(60).default(30 * 24 * 60 * 60),
  APP_BASE_URL: z.string().min(1).default("http://localhost:4000"),
  EMAIL_FROM: z.string().default("VYBE <no-reply@vybe.app>"),
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: z.coerce.number().int().min(1).default(24),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnvironment.error.message}`);
}

export const env = parsedEnvironment.data;
