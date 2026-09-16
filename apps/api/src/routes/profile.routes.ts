import { Router } from "express";
import {
  handleGetMe,
  handleGetPublicProfile,
  handlePatchMe
} from "../controllers/profile.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";
import { validateBody } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/profile.schema.js";

export const profileRouter = Router();

// Rate limiter for profile modifications: 30 requests per 15 minutes per IP
const profileUpdateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many profile update requests. Please try again later.",
  keyPrefix: "profile_update"
});

// GET /api/profile/me - Authenticated user's full profile
profileRouter.get("/me", authenticate, handleGetMe);

// PATCH /api/profile/me - Update authenticated user's profile
profileRouter.patch(
  "/me",
  authenticate,
  profileUpdateLimiter,
  validateBody(updateProfileSchema),
  handlePatchMe
);

// GET /api/profile/:id - Public profile view (by UUID or username)
profileRouter.get("/:id", optionalAuthenticate, handleGetPublicProfile);
