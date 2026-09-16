import { Router } from "express";
import { z } from "zod";
import {
  handleGetVerificationStatus,
  handleSendVerification,
  handleVerifyEmail
} from "../controllers/email-verification.controller.js";
import { optionalAuthenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";
import { validateBody } from "../middleware/validate.js";

export const emailVerificationRouter = Router();

// Rate limiter for sending verification emails: 5 requests per 15 minutes
const sendVerificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many email verification requests from this IP. Please try again later.",
  keyPrefix: "ev_send"
});

// Rate limiter for verifying tokens: 20 attempts per 15 minutes (brute-force defense)
const verifyTokenLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many verification attempts from this IP. Please try again later.",
  keyPrefix: "ev_verify"
});

const sendBodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format").max(255).optional()
});

emailVerificationRouter.post(
  "/send",
  sendVerificationLimiter,
  optionalAuthenticate,
  validateBody(sendBodySchema),
  handleSendVerification
);

emailVerificationRouter.get(
  "/verify",
  verifyTokenLimiter,
  handleVerifyEmail
);

emailVerificationRouter.get(
  "/status",
  optionalAuthenticate,
  handleGetVerificationStatus
);
