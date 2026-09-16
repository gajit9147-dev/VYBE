import type { NextFunction, Request, Response } from "express";
import { setRelationshipIntentsSchema } from "../schemas/interests.schema.js";
import * as relationshipIntentsService from "../services/relationship-intents.service.js";
import { AppError } from "../utils/app-error.js";

export async function handleListSystemRelationshipIntents(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const intents = await relationshipIntentsService.listSystemRelationshipIntents();
    res.status(200).json({ intents });
  } catch (error) {
    next(error);
  }
}

export async function handleGetUserRelationshipIntents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const relationshipIntents =
      await relationshipIntentsService.getUserRelationshipIntents(userId);
    res.status(200).json({ relationshipIntents });
  } catch (error) {
    next(error);
  }
}

export async function handleSetUserRelationshipIntents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = setRelationshipIntentsSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid relationship intent payload";
      throw new AppError(message, 400, parsed.error.issues);
    }

    const relationshipIntents =
      await relationshipIntentsService.setUserRelationshipIntents(userId, parsed.data);

    res.status(200).json({
      message: "Relationship intents updated successfully",
      relationshipIntents
    });
  } catch (error) {
    next(error);
  }
}
