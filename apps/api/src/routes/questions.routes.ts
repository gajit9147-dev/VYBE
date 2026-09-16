import { Router } from "express";
import { handleListQuestions } from "../controllers/questions.controller.js";

export const questionsRouter = Router();

// GET /api/questions - List system questions with pagination and optional category filtering
questionsRouter.get("/", handleListQuestions);
