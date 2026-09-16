import { Router } from "express";
import { handleListSystemRelationshipIntents } from "../controllers/relationship-intents.controller.js";

export const relationshipIntentsRouter = Router();

// GET /api/relationship-intents - List system-defined relationship intents
relationshipIntentsRouter.get("/", handleListSystemRelationshipIntents);
