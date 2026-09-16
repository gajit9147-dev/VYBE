import { Router } from "express";
import {
  handleGetCandidateProfile,
  handleGetDiscoveryFeed,
  handleRecordDiscoveryEvent
} from "../controllers/discovery.controller.js";
import {
  handleGetOwnAction,
  handleLikeCandidate,
  handlePassCandidate,
  handleRemoveLike,
  handleRemovePass
} from "../controllers/interactions.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";

export const discoveryRouter = Router();

// Rate limiter for feed retrieval: 60 requests per 15 minutes per IP
const discoveryFeedLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many discovery requests. Please try again later.",
  keyPrefix: "discovery_feed"
});

// Rate limiter for discovery events: 120 requests per 15 minutes per IP
const discoveryEventLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many discovery event submissions. Please try again later.",
  keyPrefix: "discovery_event"
});

// Rate limiter for likes and passes: 100 requests per 15 minutes per IP
const interactionsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many interaction attempts. Please slow down.",
  keyPrefix: "discovery_interaction"
});

// GET /api/discovery - Candidate discovery feed with cursor pagination
discoveryRouter.get("/", authenticate, discoveryFeedLimiter, handleGetDiscoveryFeed);

// POST /api/discovery/events - Record telemetry on candidates (VIEW, SKIP, etc.)
discoveryRouter.post("/events", authenticate, discoveryEventLimiter, handleRecordDiscoveryEvent);

// Actions: Like, Pass, and Action State
discoveryRouter.post("/:candidateId/like", authenticate, interactionsLimiter, handleLikeCandidate);
discoveryRouter.delete("/:candidateId/like", authenticate, interactionsLimiter, handleRemoveLike);
discoveryRouter.post("/:candidateId/pass", authenticate, interactionsLimiter, handlePassCandidate);
discoveryRouter.delete("/:candidateId/pass", authenticate, interactionsLimiter, handleRemovePass);
discoveryRouter.get("/:candidateId/action", authenticate, interactionsLimiter, handleGetOwnAction);

// GET /api/discovery/:userId - Discovery-safe candidate profile with object-level authorization
discoveryRouter.get("/:userId", authenticate, discoveryFeedLimiter, handleGetCandidateProfile);
