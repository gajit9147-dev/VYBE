import { Router } from "express";
import {
  handleAddUserInterest,
  handleListUserInterests,
  handleRemoveUserInterest
} from "../controllers/interests.controller.js";
import {
  handleGetUserPreferences,
  handleUpdateUserPreferences
} from "../controllers/preferences.controller.js";
import {
  handleGetMe,
  handleGetPublicProfile,
  handlePatchMe
} from "../controllers/profile.controller.js";
import {
  handleCreateUserAnswer,
  handleDeleteUserAnswer,
  handleGetPublicUserAnswers,
  handleListUserAnswers,
  handleUpdateUserAnswer
} from "../controllers/questions.controller.js";
import {
  handleGetUserRelationshipIntents,
  handleSetUserRelationshipIntents
} from "../controllers/relationship-intents.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";
import { validateBody } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/profile.schema.js";

import { photoRouter } from "./photo.routes.js";

export const profileRouter = Router();

// Sub-router for photo management: /api/profile/photos/*
profileRouter.use("/photos", photoRouter);

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

// Interests endpoints for profile
profileRouter.get("/interests", authenticate, handleListUserInterests);
profileRouter.post("/interests", authenticate, handleAddUserInterest);
profileRouter.delete("/interests/:interestId", authenticate, handleRemoveUserInterest);

// Relationship intents endpoints for profile
profileRouter.get("/relationship-intents", authenticate, handleGetUserRelationshipIntents);
profileRouter.put("/relationship-intents", authenticate, handleSetUserRelationshipIntents);

// Discovery preferences endpoints
profileRouter.get("/preferences", authenticate, handleGetUserPreferences);
profileRouter.put("/preferences", authenticate, handleUpdateUserPreferences);

// User Question Answers endpoints
profileRouter.get("/answers", authenticate, handleListUserAnswers);
profileRouter.post("/answers", authenticate, handleCreateUserAnswer);
profileRouter.patch("/answers/:answerId", authenticate, handleUpdateUserAnswer);
profileRouter.delete("/answers/:answerId", authenticate, handleDeleteUserAnswer);

// Public user answers endpoint
profileRouter.get("/:id/answers", optionalAuthenticate, handleGetPublicUserAnswers);

// GET /api/profile/:id - Public profile view (by UUID or username)
// NOTE: Must be defined after all explicit sub-paths to prevent route shadowing
profileRouter.get("/:id", optionalAuthenticate, handleGetPublicProfile);
