import type { NextFunction, Request, Response } from "express";
import {
  createAnswerSchema,
  listQuestionsQuerySchema,
  updateAnswerSchema
} from "../schemas/questions.schema.js";
import * as questionsService from "../services/questions.service.js";
import { AppError } from "../utils/app-error.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleListQuestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsedQuery = listQuestionsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      const message = parsedQuery.error.issues[0]?.message || "Invalid query parameters";
      throw new AppError(message, 400, parsedQuery.error.issues);
    }

    const result = await questionsService.listActiveQuestions(parsedQuery.data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleListUserAnswers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const answers = await questionsService.listUserAnswers(userId);
    res.status(200).json({ answers });
  } catch (error) {
    next(error);
  }
}

export async function handleCreateUserAnswer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = createAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid answer payload";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const answer = await questionsService.createUserAnswer(userId, parsed.data);
    res.status(201).json({
      message: "Answer saved successfully",
      answer
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateUserAnswer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const answerId = req.params.answerId as string;
    if (!answerId || !UUID_REGEX.test(answerId)) {
      throw new AppError("Invalid answer ID format", 400);
    }

    const parsed = updateAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid update payload";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const answer = await questionsService.updateUserAnswer(userId, answerId, parsed.data);
    res.status(200).json({
      message: "Answer updated successfully",
      answer
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteUserAnswer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const answerId = req.params.answerId as string;
    if (!answerId || !UUID_REGEX.test(answerId)) {
      throw new AppError("Invalid answer ID format", 400);
    }

    const result = await questionsService.deleteUserAnswer(userId, answerId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetPublicUserAnswers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const identifier = req.params.id as string;
    if (!identifier) {
      throw new AppError("Profile identifier required", 400);
    }

    const viewerUserId = req.user?.id;
    const answers = await questionsService.getPublicUserAnswers(identifier, viewerUserId);
    res.status(200).json({ answers });
  } catch (error) {
    next(error);
  }
}
