import { Router } from "express";
import {
  createConversation,
  deleteMessage,
  getConversation,
  getMessages,
  listConversations,
  markAsRead,
  patchMessage,
  postMessage
} from "../controllers/conversation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimiter } from "../middleware/rate-limiter.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createConversationSchema,
  editMessageSchema,
  listConversationsQuerySchema,
  messageHistoryQuerySchema,
  sendMessageSchema
} from "../schemas/conversation.schema.js";

export const conversationsRouter = Router();
export const messagesRouter = Router();

// Rate limiter for conversations: 120 requests per minute per IP
const conversationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many conversation requests. Please slow down.",
  keyPrefix: "conversations"
});

// Conversations routes: Authenticated and rate-limited
conversationsRouter.use(authenticate);
conversationsRouter.use(conversationLimiter);

// POST /api/conversations - Create or fetch conversation for an active match
conversationsRouter.post("/", validateBody(createConversationSchema), createConversation);

// GET /api/conversations - List conversations for authenticated user
conversationsRouter.get("/", validateQuery(listConversationsQuerySchema), listConversations);

// GET /api/conversations/:conversationId - Single conversation details
conversationsRouter.get("/:conversationId", getConversation);

// GET /api/conversations/:conversationId/messages - Cursor-paginated message history
conversationsRouter.get("/:conversationId/messages", validateQuery(messageHistoryQuerySchema), getMessages);

// POST /api/conversations/:conversationId/messages - Send text message
conversationsRouter.post("/:conversationId/messages", validateBody(sendMessageSchema), postMessage);

// POST /api/conversations/:conversationId/read - Mark conversation messages as read
conversationsRouter.post("/:conversationId/read", markAsRead);

// Messages routes: Authenticated and rate-limited
messagesRouter.use(authenticate);
messagesRouter.use(conversationLimiter);

// PATCH /api/messages/:messageId - Edit sender's message
messagesRouter.patch("/:messageId", validateBody(editMessageSchema), patchMessage);

// DELETE /api/messages/:messageId - Soft delete sender's message
messagesRouter.delete("/:messageId", deleteMessage);
