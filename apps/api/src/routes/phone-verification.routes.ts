import { Router } from "express";
import {
  handleGetPhoneStatus,
  handleRemovePhone,
  handleSendOtp,
  handleVerifyOtp
} from "../controllers/phone-verification.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";
import { validateBody } from "../middleware/validate.js";
import {
  removePhoneSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema
} from "../schemas/phone-verification.schema.js";

export const phoneVerificationRouter = Router();

// Route-level rate limiter: 20 phone auth requests per 15 minutes per IP
const phoneHttpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many phone verification requests from this network. Please try again later.",
  keyPrefix: "phone_http"
});

// All phone endpoints require an authenticated session
phoneVerificationRouter.use(authenticate);

// POST /api/auth/phone/send-otp
phoneVerificationRouter.post(
  "/send-otp",
  phoneHttpLimiter,
  validateBody(sendPhoneOtpSchema),
  handleSendOtp
);

// POST /api/auth/phone/verify-otp
phoneVerificationRouter.post(
  "/verify-otp",
  phoneHttpLimiter,
  validateBody(verifyPhoneOtpSchema),
  handleVerifyOtp
);

// GET /api/auth/phone/status
phoneVerificationRouter.get(
  "/status",
  handleGetPhoneStatus
);

// DELETE /api/auth/phone/remove
phoneVerificationRouter.delete(
  "/remove",
  validateBody(removePhoneSchema),
  handleRemovePhone
);
