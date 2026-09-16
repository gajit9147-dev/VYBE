import { Router } from "express";
import {
  handleGetMatch,
  handleListMatches,
  handleUnmatch
} from "../controllers/matches.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";

export const matchesRouter = Router();

// Rate limiter for matches endpoints: 100 requests per 15 minutes per IP
const matchesLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many match requests. Please slow down.",
  keyPrefix: "matches"
});

// All match routes require authentication and rate limiting
matchesRouter.use(authenticate);
matchesRouter.use(matchesLimiter);

// GET /api/matches - Retrieve cursor-paginated active matches
matchesRouter.get("/", handleListMatches);

// GET /api/matches/:matchId - Retrieve a single match with object-level authorization
matchesRouter.get("/:matchId", handleGetMatch);

// DELETE /api/matches/:matchId - Unmatch from a connection
matchesRouter.delete("/:matchId", handleUnmatch);
