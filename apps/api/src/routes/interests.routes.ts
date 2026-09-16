import { Router } from "express";
import { handleListSystemInterests } from "../controllers/interests.controller.js";

export const interestsRouter = Router();

// GET /api/interests - List system-defined active interests
interestsRouter.get("/", handleListSystemInterests);
