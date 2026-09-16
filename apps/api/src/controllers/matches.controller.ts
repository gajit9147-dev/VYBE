import type { NextFunction, Request, Response } from "express";
import {
  listMatchesQuerySchema,
  matchParamSchema,
  unmatchBodySchema
} from "../schemas/matches.schema.js";
import * as matchesService from "../services/matches.service.js";
import { AppError } from "../utils/app-error.js";

export async function handleListMatches(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsedQuery = listMatchesQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      const message = parsedQuery.error.issues[0]?.message || "Invalid query parameters";
      throw new AppError(message, 400, parsedQuery.error.issues);
    }

    const { limit, cursor } = parsedQuery.data;
    const result = await matchesService.getUserActiveMatches(userId, limit, cursor);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleGetMatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsedParams = matchParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      const message = parsedParams.error.issues[0]?.message || "Invalid match ID format";
      throw new AppError(message, 400, parsedParams.error.issues);
    }

    const result = await matchesService.getMatchById(parsedParams.data.matchId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleUnmatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsedParams = matchParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      const message = parsedParams.error.issues[0]?.message || "Invalid match ID format";
      throw new AppError(message, 400, parsedParams.error.issues);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const parsedBody = unmatchBodySchema.safeParse(body);
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message || "Invalid unmatch payload";
      throw new AppError(message, 400, parsedBody.error.issues);
    }

    const result = await matchesService.unmatchUser(
      parsedParams.data.matchId,
      userId,
      parsedBody.data.reasonCode
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
