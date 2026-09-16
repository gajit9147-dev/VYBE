import { Router } from "express";
import {
  handleGetCandidateProfile,
  handleGetDiscoveryFeed,
  handleRecordDiscoveryEvent
} from "../controllers/discovery.controller.js";
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

// GET /api/discovery - Candidate discovery feed with cursor pagination
discoveryRouter.get("/", authenticate, discoveryFeedLimiter, handleGetDiscoveryFeed);

// POST /api/discovery/events - Record telemetry on candidates (VIEW, SKIP, etc.)
discoveryRouter.post("/events", authenticate, discoveryEventLimiter, handleRecordDiscoveryEvent);

// GET /api/discovery/:userId - Discovery-safe candidate profile with object-level authorization
discoveryRouter.get("/:userId", authenticate, discoveryFeedLimiter, handleGetCandidateProfile);
