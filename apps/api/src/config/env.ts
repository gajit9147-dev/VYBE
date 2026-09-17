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
  SMTP_PASS: z.string().optional(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  PHONE_OTP_TTL_MINUTES: z.coerce.number().int().min(1).max(30).default(5),
  PHONE_OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  PHONE_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(10).max(300).default(60),
  SMS_PROVIDER: z.enum(["memory", "twilio"]).default("memory"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["memory", "s3"]).default("memory"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_CDN_URL: z.string().default("https://cdn.vybe.app"),
  MAX_PHOTO_FILE_SIZE_BYTES: z.coerce.number().int().default(5 * 1024 * 1024),
  MAX_PHOTOS_PER_USER: z.coerce.number().int().min(1).max(20).default(6),
  WS_ALLOWED_ORIGINS: z.string().optional(),
  MESSAGE_MAX_LENGTH: z.coerce.number().int().min(1).max(20000).default(4000),
  MESSAGE_EDIT_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  MESSAGE_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(600).default(60)
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnvironment.error.message}`);
}

export const env = parsedEnvironment.data;
