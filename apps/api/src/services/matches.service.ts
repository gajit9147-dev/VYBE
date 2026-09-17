import { prisma } from "../config/db.js";
import { AppError } from "../utils/app-error.js";
import { calculateAge } from "../utils/profile.js";
import { realtimeService } from "./realtime.service.js";

function mapSafePartnerDto(user: any) {
  if (!user || !user.profile) {
    return {
      id: user?.id ?? "",
      displayName: "Unknown User",
      username: "",
      age: 0,
      gender: "UNKNOWN",
      city: null,
      bio: null,
      photos: [],
      interests: [],
      relationshipIntents: []
    };
  }

  const profile = user.profile;
  const age = profile.birthDate ? calculateAge(new Date(profile.birthDate)) : 0;

  return {
    id: user.id,
    displayName: profile.displayName,
    username: profile.username,
    age,
    gender: profile.gender,
    city: profile.city,
    bio: profile.bio,
    photos: (profile.photos || []).map((p: any) => ({
      id: p.id,
      cdnUrl: p.cdnUrl,
      displayOrder: p.displayOrder,
      isPrimary: p.isPrimary
    })),
    interests: (profile.interests || []).map((pi: any) => pi.interest?.name || ""),
    relationshipIntents: (profile.relationshipIntents || []).map(
      (ri: any) => ri.intent?.label || ""
    )
  };
}

export async function getUserActiveMatches(userId: string, limit = 20, cursor?: string) {
  const take = limit + 1;

  const matches = await prisma.match.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ user1Id: userId }, { user2Id: userId }]
    },
    include: {
      user1: {
        include: {
          profile: {
            include: {
              interests: { include: { interest: true } },
              relationshipIntents: { include: { intent: true } },
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      user2: {
        include: {
          profile: {
            include: {
              interests: { include: { interest: true } },
              relationshipIntents: { include: { intent: true } },
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      reasons: true
    },
    orderBy: [{ matchedAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1
        }
      : {})
  });

  const hasNextPage = matches.length > limit;
  const itemsToReturn = hasNextPage ? matches.slice(0, limit) : matches;
  const nextCursor = hasNextPage ? itemsToReturn[itemsToReturn.length - 1].id : null;

  const formattedItems = itemsToReturn.map((m) => {
    const partner = m.user1Id === userId ? m.user2 : m.user1;
    return {
      id: m.id,
      user: mapSafePartnerDto(partner),
      reasons: m.reasons.map((r) => ({
        id: r.id,
        type: r.type,
        text: r.text
      })),
      createdAt: m.matchedAt.toISOString()
    };
  });

  return {
    items: formattedItems,
    nextCursor
  };
}

export async function getMatchById(matchId: string, requestingUserId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      user1: {
        include: {
          profile: {
            include: {
              interests: { include: { interest: true } },
              relationshipIntents: { include: { intent: true } },
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      user2: {
        include: {
          profile: {
            include: {
              interests: { include: { interest: true } },
              relationshipIntents: { include: { intent: true } },
              photos: { orderBy: { displayOrder: "asc" } }
            }
          }
        }
      },
      reasons: true
    }
  });

  if (!match) {
    throw new AppError("Match not found", 404);
  }

  // Object-level authorization check: caller must be one of the participants
  if (match.user1Id !== requestingUserId && match.user2Id !== requestingUserId) {
    throw new AppError("You do not have access to this match", 403);
  }

  const partner = match.user1Id === requestingUserId ? match.user2 : match.user1;

  return {
    id: match.id,
    status: match.status,
    matchedAt: match.matchedAt.toISOString(),
    user: mapSafePartnerDto(partner),
    reasons: match.reasons.map((r) => ({
      id: r.id,
      type: r.type,
      text: r.text
    }))
  };
}

export async function unmatchUser(
  matchId: string,
  requestingUserId: string,
  reasonCode?: string
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!match) {
    throw new AppError("Match not found", 404);
  }

  // Object-level authorization check: only a match participant can unmatch
  if (match.user1Id !== requestingUserId && match.user2Id !== requestingUserId) {
    throw new AppError("You do not have permission to unmatch this connection", 403);
  }

  // Idempotent check
  if (match.status === "UNMATCHED") {
    return {
      success: true,
      unmatched: true,
      status: "UNMATCHED"
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "UNMATCHED",
        closedAt: new Date(),
        closedByUserId: requestingUserId,
        unmatchReasonCode: reasonCode ?? null
      }
    });

    await tx.matchEvent.create({
      data: {
        matchId,
        actorUserId: requestingUserId,
        type: "MATCH_UNMATCHED",
        metadata: reasonCode ? { reasonCode } : undefined
      }
    });

    await tx.conversation.updateMany({
      where: { matchId, status: "ACTIVE" },
      data: { status: "CLOSED" }
    });
  });

  const partnerId = match.user1Id === requestingUserId ? match.user2Id : match.user1Id;
  const conv = await prisma.conversation.findUnique({ where: { matchId } });
  if (conv) {
    await realtimeService.publishEvent({
      type: "conversation.updated",
      conversationId: conv.id,
      status: "CLOSED",
      recipientIds: [match.user1Id, match.user2Id]
    });
  }

  return {
    success: true,
    unmatched: true,
    status: "UNMATCHED"
  };
}
