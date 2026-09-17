import type { NextFunction, Request, Response } from "express";
import * as conversationService from "../services/conversation.service.js";
import { conversationParamSchema, messageParamSchema } from "../schemas/conversation.schema.js";
import { AppError } from "../utils/app-error.js";

export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { matchId } = req.body;
    const conversation = await conversationService.getOrCreateConversation(matchId, userId);
    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    const result = await conversationService.getUserConversations(userId, limit, cursor);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsed = conversationParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Invalid conversation ID format", 400, parsed.error.issues);
    }

    const conversation = await conversationService.getConversationById(parsed.data.conversationId, userId);
    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsed = conversationParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Invalid conversation ID format", 400, parsed.error.issues);
    }
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    const result = await conversationService.getConversationMessages(
      parsed.data.conversationId,
      userId,
      limit,
      cursor
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function postMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsed = conversationParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Invalid conversation ID format", 400, parsed.error.issues);
    }
    const { content } = req.body;

    const message = await conversationService.sendMessage(parsed.data.conversationId, userId, content);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
}

export async function patchMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsed = messageParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Invalid message ID format", 400, parsed.error.issues);
    }
    const { content } = req.body;

    const updated = await conversationService.editMessage(parsed.data.messageId, userId, content);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsed = messageParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Invalid message ID format", 400, parsed.error.issues);
    }

    const deleted = await conversationService.deleteMessage(parsed.data.messageId, userId);
    res.status(200).json(deleted);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const parsed = conversationParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Invalid conversation ID format", 400, parsed.error.issues);
    }

    const result = await conversationService.markConversationAsRead(parsed.data.conversationId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
