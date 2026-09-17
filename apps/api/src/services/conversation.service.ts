import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { calculateAge } from "../utils/profile.js";
import { realtimeService, type RealtimeMessageDto } from "./realtime.service.js";

// In-memory rate limiting map for message sending (per user)
interface UserRateLimit {
  count: number;
  resetTime: number;
}
const messageRateLimits = new Map<string, UserRateLimit>();

export function checkMessageRateLimit(userId: string): void {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = env.MESSAGE_RATE_LIMIT_PER_MINUTE;

  const record = messageRateLimits.get(userId);
  if (!record || now > record.resetTime) {
    messageRateLimits.set(userId, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (record.count >= max) {
    throw new AppError("Message rate limit exceeded. Please wait a moment before sending more messages.", 429);
  }

  record.count += 1;
}

export function resetMessageRateLimits(): void {
  messageRateLimits.clear();
}

function mapSafePartnerDto(user: any) {
  if (!user || !user.profile) {
    return {
      id: user?.id ?? "",
      displayName: "Unknown User",
      username: "",
      age: 0,
      photos: []
    };
  }

  const profile = user.profile;
  const age = profile.birthDate ? calculateAge(new Date(profile.birthDate)) : 0;

  return {
    id: user.id,
    displayName: profile.displayName,
    username: profile.username,
    age,
    photos: (profile.photos || []).map((p: any) => ({
      id: p.id,
      cdnUrl: p.cdnUrl,
      displayOrder: p.displayOrder,
      isPrimary: p.isPrimary
    }))
  };
}

function toSafeMessageDto(m: any): RealtimeMessageDto {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    type: m.messageType || "TEXT",
    content: m.deletedAt ? null : m.content,
    deleted: Boolean(m.deletedAt),
    createdAt: (m.sentAt || m.createdAt).toISOString(),
    editedAt: m.editedAt ? m.editedAt.toISOString() : null
  };
}

async function verifyNoBlocksOrReports(user1Id: string, user2Id: string): Promise<void> {
  const isBlocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerUserId: user1Id, blockedUserId: user2Id },
        { blockerUserId: user2Id, blockedUserId: user1Id }
      ]
    }
  });

  if (isBlocked) {
    throw new AppError("Conversation is not available", 404);
  }

  const isReported = await prisma.userReport.findFirst({
    where: {
      OR: [
        { reporterUserId: user1Id, reportedUserId: user2Id },
        { reporterUserId: user2Id, reportedUserId: user1Id }
      ],
      status: { not: "DISMISSED" }
    }
  });

  if (isReported) {
    throw new AppError("Conversation is not available", 404);
  }
}

export async function getOrCreateConversation(matchId: string, requestingUserId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!match) {
    throw new AppError("Match not found", 404);
  }

  // Caller must be one of the match participants
  if (match.user1Id !== requestingUserId && match.user2Id !== requestingUserId) {
    throw new AppError("You do not have access to this conversation", 403);
  }

  if (match.status !== "ACTIVE") {
    throw new AppError("Cannot start conversation for an inactive match", 400);
  }

  const partnerId = match.user1Id === requestingUserId ? match.user2Id : match.user1Id;
  await verifyNoBlocksOrReports(requestingUserId, partnerId);

  // Check if conversation already exists
  let conversation = await prisma.conversation.findUnique({
    where: { matchId },
    include: {
      user1: {
        include: {
          profile: {
            include: {
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      user2: {
        include: {
          profile: {
            include: {
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      }
    }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        matchId,
        user1Id: match.user1Id,
        user2Id: match.user2Id,
        status: "ACTIVE"
      },
      include: {
        user1: {
          include: {
            profile: {
              include: {
                photos: { orderBy: { displayOrder: "asc" } }
              }
            }
          }
        },
        user2: {
          include: {
            profile: {
              include: {
                photos: { orderBy: { displayOrder: "asc" } }
              }
            }
          }
        }
      }
    });
  }

  const partner = conversation.user1Id === requestingUserId ? conversation.user2 : conversation.user1;
  const userLastReadAt = conversation.user1Id === requestingUserId ? conversation.user1LastReadAt : conversation.user2LastReadAt;

  // Compute unread messages count
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: requestingUserId },
      deletedAt: null,
      ...(userLastReadAt ? { sentAt: { gt: userLastReadAt } } : {})
    }
  });

  return {
    id: conversation.id,
    matchId: conversation.matchId,
    status: conversation.status,
    otherUser: mapSafePartnerDto(partner),
    lastMessage: null,
    unreadCount,
    lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
    createdAt: conversation.createdAt.toISOString()
  };
}

export async function getUserConversations(userId: string, limit = 20, cursor?: string) {
  const take = limit + 1;

  // First fetch blocks to filter out
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [{ blockerUserId: userId }, { blockedUserId: userId }]
    }
  });
  const blockedUserIds = new Set<string>();
  for (const b of blocks) {
    if (b.blockerUserId === userId) blockedUserIds.add(b.blockedUserId);
    if (b.blockedUserId === userId) blockedUserIds.add(b.blockerUserId);
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }]
    },
    include: {
      user1: {
        include: {
          profile: {
            include: {
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      user2: {
        include: {
          profile: {
            include: {
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1
      }
    },
    orderBy: [
      { lastMessageAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" }
    ],
    take,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1
        }
      : {})
  });

  // Filter out any conversation with blocked partner
  const visibleConversations = conversations.filter((c) => {
    const partnerId = c.user1Id === userId ? c.user2Id : c.user1Id;
    return !blockedUserIds.has(partnerId);
  });

  const hasNextPage = visibleConversations.length > limit;
  const itemsToReturn = hasNextPage ? visibleConversations.slice(0, limit) : visibleConversations;
  const nextCursor = hasNextPage ? itemsToReturn[itemsToReturn.length - 1].id : null;

  const items = await Promise.all(
    itemsToReturn.map(async (c) => {
      const isUser1 = c.user1Id === userId;
      const partner = isUser1 ? c.user2 : c.user1;
      const userLastReadAt = isUser1 ? c.user1LastReadAt : c.user2LastReadAt;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          deletedAt: null,
          ...(userLastReadAt ? { sentAt: { gt: userLastReadAt } } : {})
        }
      });

      const lastMsg = c.messages[0] ? toSafeMessageDto(c.messages[0]) : null;

      return {
        id: c.id,
        matchId: c.matchId,
        status: c.status,
        otherUser: mapSafePartnerDto(partner),
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.content,
              deleted: lastMsg.deleted,
              createdAt: lastMsg.createdAt
            }
          : null,
        unreadCount,
        lastMessageAt: c.lastMessageAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString()
      };
    })
  );

  return {
    items,
    nextCursor
  };
}

export async function getConversationById(conversationId: string, requestingUserId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      user1: {
        include: {
          profile: {
            include: {
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      user2: {
        include: {
          profile: {
            include: {
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1
      }
    }
  });

  // Authorization-safe: if not found or user not member, return 404
  if (!conversation || (conversation.user1Id !== requestingUserId && conversation.user2Id !== requestingUserId)) {
    throw new AppError("Conversation not found", 404);
  }

  const partnerId = conversation.user1Id === requestingUserId ? conversation.user2Id : conversation.user1Id;
  await verifyNoBlocksOrReports(requestingUserId, partnerId);

  const isUser1 = conversation.user1Id === requestingUserId;
  const partner = isUser1 ? conversation.user2 : conversation.user1;
  const userLastReadAt = isUser1 ? conversation.user1LastReadAt : conversation.user2LastReadAt;

  const unreadCount = await prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: requestingUserId },
      deletedAt: null,
      ...(userLastReadAt ? { sentAt: { gt: userLastReadAt } } : {})
    }
  });

  const lastMsg = conversation.messages[0] ? toSafeMessageDto(conversation.messages[0]) : null;

  return {
    id: conversation.id,
    matchId: conversation.matchId,
    status: conversation.status,
    otherUser: mapSafePartnerDto(partner),
    lastMessage: lastMsg
      ? {
          id: lastMsg.id,
          content: lastMsg.content,
          deleted: lastMsg.deleted,
          createdAt: lastMsg.createdAt
        }
      : null,
    unreadCount,
    lastReadAt: userLastReadAt?.toISOString() || null,
    lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
    createdAt: conversation.createdAt.toISOString()
  };
}

export async function getConversationMessages(
  conversationId: string,
  requestingUserId: string,
  limit = 50,
  cursor?: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation || (conversation.user1Id !== requestingUserId && conversation.user2Id !== requestingUserId)) {
    throw new AppError("Conversation not found", 404);
  }

  const partnerId = conversation.user1Id === requestingUserId ? conversation.user2Id : conversation.user1Id;
  await verifyNoBlocksOrReports(requestingUserId, partnerId);

  const take = limit + 1;
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ sentAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1
        }
      : {})
  });

  const hasNextPage = messages.length > limit;
  const itemsToReturn = hasNextPage ? messages.slice(0, limit) : messages;
  const nextCursor = hasNextPage ? itemsToReturn[itemsToReturn.length - 1].id : null;

  return {
    items: itemsToReturn.map(toSafeMessageDto),
    nextCursor
  };
}

export async function sendMessage(conversationId: string, requestingUserId: string, content: string) {
  checkMessageRateLimit(requestingUserId);

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new AppError("Message content cannot be empty", 400);
  }
  if (trimmedContent.length > env.MESSAGE_MAX_LENGTH) {
    throw new AppError(`Message exceeds maximum length of ${env.MESSAGE_MAX_LENGTH} characters`, 400);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { match: true }
  });

  if (!conversation || (conversation.user1Id !== requestingUserId && conversation.user2Id !== requestingUserId)) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.status !== "ACTIVE") {
    throw new AppError("Cannot send message in a closed conversation", 400);
  }

  if (!conversation.match || conversation.match.status !== "ACTIVE") {
    throw new AppError("Cannot send message because match is no longer active", 400);
  }

  const partnerId = conversation.user1Id === requestingUserId ? conversation.user2Id : conversation.user1Id;
  await verifyNoBlocksOrReports(requestingUserId, partnerId);

  const now = new Date();

  // Atomically persist message and update conversation metadata
  const createdMessage = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId: requestingUserId,
        messageType: "TEXT",
        content: trimmedContent,
        deliveryStatus: "SENT",
        sentAt: now
      }
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: msg.id,
        lastMessageAt: now
      }
    });

    return msg;
  });

  const safeDto = toSafeMessageDto(createdMessage);

  // Publish real-time event
  await realtimeService.publishEvent({
    type: "message.created",
    conversationId,
    message: safeDto,
    recipientId: partnerId,
    senderId: requestingUserId
  });

  return safeDto;
}

export async function editMessage(messageId: string, requestingUserId: string, newContent: string) {
  const trimmedContent = newContent.trim();
  if (!trimmedContent) {
    throw new AppError("Message content cannot be empty", 400);
  }
  if (trimmedContent.length > env.MESSAGE_MAX_LENGTH) {
    throw new AppError(`Message exceeds maximum length of ${env.MESSAGE_MAX_LENGTH} characters`, 400);
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: { match: true }
      }
    }
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  // Object-level ownership check: only the sender can edit
  if (message.senderId !== requestingUserId) {
    throw new AppError("You can only edit your own messages", 403);
  }

  if (message.deletedAt) {
    throw new AppError("Cannot edit a deleted message", 400);
  }

  if (message.conversation.status !== "ACTIVE" || message.conversation.match.status !== "ACTIVE") {
    throw new AppError("Cannot edit message in an inactive conversation", 400);
  }

  // Enforce edit time window (configurable, default 15 minutes)
  const editWindowMs = env.MESSAGE_EDIT_WINDOW_MINUTES * 60 * 1000;
  const elapsed = Date.now() - message.sentAt.getTime();
  if (elapsed > editWindowMs) {
    throw new AppError(`Messages can only be edited within ${env.MESSAGE_EDIT_WINDOW_MINUTES} minutes of sending`, 400);
  }

  const partnerId = message.conversation.user1Id === requestingUserId ? message.conversation.user2Id : message.conversation.user1Id;
  await verifyNoBlocksOrReports(requestingUserId, partnerId);

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: trimmedContent,
      editedAt: new Date()
    }
  });

  const safeDto = toSafeMessageDto(updated);

  await realtimeService.publishEvent({
    type: "message.updated",
    conversationId: message.conversationId,
    message: safeDto,
    recipientId: partnerId,
    senderId: requestingUserId
  });

  return safeDto;
}

export async function deleteMessage(messageId: string, requestingUserId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: { match: true }
      }
    }
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  // Object-level ownership check: only the sender can delete
  if (message.senderId !== requestingUserId) {
    throw new AppError("You can only delete your own messages", 403);
  }

  if (message.conversation.status !== "ACTIVE" || message.conversation.match.status !== "ACTIVE") {
    throw new AppError("Cannot delete message in an inactive conversation", 400);
  }

  const partnerId = message.conversation.user1Id === requestingUserId ? message.conversation.user2Id : message.conversation.user1Id;
  await verifyNoBlocksOrReports(requestingUserId, partnerId);

  // Soft deletion: preserve audit row, clear content for output
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date()
    }
  });

  const safeDto = toSafeMessageDto(updated);

  await realtimeService.publishEvent({
    type: "message.deleted",
    conversationId: message.conversationId,
    message: safeDto,
    recipientId: partnerId,
    senderId: requestingUserId
  });

  return safeDto;
}

export async function markConversationAsRead(conversationId: string, requestingUserId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation || (conversation.user1Id !== requestingUserId && conversation.user2Id !== requestingUserId)) {
    throw new AppError("Conversation not found", 404);
  }

  const now = new Date();
  const isUser1 = conversation.user1Id === requestingUserId;
  const partnerId = isUser1 ? conversation.user2Id : conversation.user1Id;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: isUser1 ? { user1LastReadAt: now } : { user2LastReadAt: now }
  });

  // Mark all unread incoming messages as READ
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: requestingUserId },
      deliveryStatus: { not: "READ" }
    },
    data: {
      deliveryStatus: "READ"
    }
  });

  await realtimeService.publishEvent({
    type: "message.read",
    conversationId,
    userId: requestingUserId,
    lastReadAt: now.toISOString(),
    recipientId: partnerId
  });

  return {
    success: true,
    conversationId,
    lastReadAt: now.toISOString()
  };
}
