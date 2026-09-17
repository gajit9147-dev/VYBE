import { z } from "zod";
import { env } from "../config/env.js";

export const conversationParamSchema = z.object({
  conversationId: z.string().uuid("Invalid conversationId format")
});

export const messageParamSchema = z.object({
  messageId: z.string().uuid("Invalid messageId format")
});

export const createConversationSchema = z
  .object({
    matchId: z.string().uuid("Invalid matchId format")
  })
  .strict();

export const listConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional()
});

export const sendMessageSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Message content cannot be empty")
      .max(env.MESSAGE_MAX_LENGTH, `Message cannot exceed ${env.MESSAGE_MAX_LENGTH} characters`)
  })
  .strict();

export const editMessageSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Message content cannot be empty")
      .max(env.MESSAGE_MAX_LENGTH, `Message cannot exceed ${env.MESSAGE_MAX_LENGTH} characters`)
  })
  .strict();

export const messageHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(50),
  cursor: z.string().uuid().optional()
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type MessageHistoryQuery = z.infer<typeof messageHistoryQuerySchema>;
