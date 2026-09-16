import { prisma } from "../config/db.js";
import type { InteractionReasonType } from "../schemas/interactions.schema.js";
import { AppError } from "../utils/app-error.js";
import { canInteractWithCandidate } from "./discovery.service.js";
import { generateMatchReasons } from "./match-reason.service.js";

export async function recordLike(
  actorUserId: string,
  candidateId: string,
  reasonType?: InteractionReasonType
) {
  const { actor, candidate } = await canInteractWithCandidate(actorUserId, candidateId);

  // Validate reasonType if supplied
  if (reasonType && actor.profile && candidate.profile) {
    if (reasonType === "SHARED_INTEREST") {
      const actorSlugs = new Set(actor.profile.interests.map((i: any) => i.interest.slug));
      const hasShared = candidate.profile.interests.some((i: any) =>
        actorSlugs.has(i.interest.slug)
      );
      if (!hasShared) {
        throw new AppError("Selected reason is not supported by shared profile data", 400);
      }
    } else if (reasonType === "SHARED_ANSWER") {
      const actorQIds = new Set(actor.questionAnswers.map((qa: any) => qa.questionId));
      const hasShared = candidate.questionAnswers.some((qa: any) => actorQIds.has(qa.questionId));
      if (!hasShared) {
        throw new AppError("Selected reason is not supported by shared profile data", 400);
      }
    } else if (reasonType === "RELATIONSHIP_INTENT") {
      const actorIntents = new Set(
        actor.profile.relationshipIntents.map((ri: any) => ri.intent.id)
      );
      const hasShared = candidate.profile.relationshipIntents.some((ri: any) =>
        actorIntents.has(ri.intent.id)
      );
      if (!hasShared) {
        throw new AppError("Selected reason is not supported by shared profile data", 400);
      }
    } else if (reasonType === "PROFILE_PROMPT") {
      if (!candidate.profile.prompts || candidate.profile.prompts.length === 0) {
        throw new AppError("Selected reason is not supported by candidate profile data", 400);
      }
    }
  }

  let createdMatchId: string | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.profileInteraction.upsert({
      where: {
        actorUserId_targetUserId: {
          actorUserId,
          targetUserId: candidateId
        }
      },
      create: {
        actorUserId,
        targetUserId: candidateId,
        action: "LIKE",
        reasonType: reasonType ?? null
      },
      update: {
        action: "LIKE",
        reasonType: reasonType ?? null
      }
    });

    await tx.discoveryEvent.create({
      data: {
        userId: actorUserId,
        candidateUserId: candidateId,
        eventType: "LIKE",
        metadata: reasonType ? { reasonType } : undefined
      }
    });

    // Check for reciprocal LIKE
    const reciprocal = await tx.profileInteraction.findUnique({
      where: {
        actorUserId_targetUserId: {
          actorUserId: candidateId,
          targetUserId: actorUserId
        }
      }
    });

    if (reciprocal && reciprocal.action === "LIKE") {
      // Deterministic user ordering: user1Id = min(A, B), user2Id = max(A, B)
      const [user1Id, user2Id] =
        actorUserId < candidateId ? [actorUserId, candidateId] : [candidateId, actorUserId];

      // Check if Match already exists (ACTIVE or UNMATCHED)
      const existingMatch = await tx.match.findUnique({
        where: {
          user1Id_user2Id: {
            user1Id,
            user2Id
          }
        }
      });

      if (!existingMatch) {
        // Generate deterministic reasons based on real DB data
        const reasons = generateMatchReasons(actor, candidate);

        try {
          const newMatch = await tx.match.create({
            data: {
              user1Id,
              user2Id,
              status: "ACTIVE",
              reasons: {
                create: reasons.map((r) => ({
                  type: r.type,
                  text: r.text,
                  metadata: r.metadata ?? undefined
                }))
              },
              events: {
                create: {
                  actorUserId,
                  type: "MATCH_CREATED"
                }
              }
            }
          });

          createdMatchId = newMatch.id;
        } catch (err: any) {
          // Handle concurrent reciprocal likes where both transactions attempt to create the match
          if (err.code === "P2002") {
            const found = await tx.match.findUnique({
              where: { user1Id_user2Id: { user1Id, user2Id } }
            });
            if (found) {
              createdMatchId = found.id;
            }
          } else {
            throw err;
          }
        }
      } else if (existingMatch.status === "ACTIVE") {
        createdMatchId = existingMatch.id;
      }
    }
  });

  return {
    success: true,
    liked: true,
    ...(createdMatchId ? { match: { id: createdMatchId, isMatch: true } } : {})
  };
}

export async function recordPass(actorUserId: string, candidateId: string) {
  await canInteractWithCandidate(actorUserId, candidateId);

  await prisma.$transaction(async (tx) => {
    await tx.profileInteraction.upsert({
      where: {
        actorUserId_targetUserId: {
          actorUserId,
          targetUserId: candidateId
        }
      },
      create: {
        actorUserId,
        targetUserId: candidateId,
        action: "PASS",
        reasonType: null
      },
      update: {
        action: "PASS",
        reasonType: null
      }
    });

    await tx.discoveryEvent.create({
      data: {
        userId: actorUserId,
        candidateUserId: candidateId,
        eventType: "PASS"
      }
    });
  });

  return {
    success: true,
    passed: true
  };
}

export async function removeLike(actorUserId: string, candidateId: string) {
  if (actorUserId === candidateId) {
    throw new AppError("Invalid operation on self", 400);
  }

  const existing = await prisma.profileInteraction.findUnique({
    where: {
      actorUserId_targetUserId: {
        actorUserId,
        targetUserId: candidateId
      }
    }
  });

  if (!existing || existing.action !== "LIKE") {
    return {
      success: true,
      unliked: false,
      message: "No active like found"
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.profileInteraction.delete({
      where: {
        actorUserId_targetUserId: {
          actorUserId,
          targetUserId: candidateId
        }
      }
    });

    await tx.discoveryEvent.create({
      data: {
        userId: actorUserId,
        candidateUserId: candidateId,
        eventType: "UNLIKE"
      }
    });
  });

  return {
    success: true,
    unliked: true
  };
}

export async function removePass(actorUserId: string, candidateId: string) {
  if (actorUserId === candidateId) {
    throw new AppError("Invalid operation on self", 400);
  }

  const existing = await prisma.profileInteraction.findUnique({
    where: {
      actorUserId_targetUserId: {
        actorUserId,
        targetUserId: candidateId
      }
    }
  });

  if (!existing || existing.action !== "PASS") {
    return {
      success: true,
      unpassed: false,
      message: "No active pass found"
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.profileInteraction.delete({
      where: {
        actorUserId_targetUserId: {
          actorUserId,
          targetUserId: candidateId
        }
      }
    });

    await tx.discoveryEvent.create({
      data: {
        userId: actorUserId,
        candidateUserId: candidateId,
        eventType: "UNPASS"
      }
    });
  });

  return {
    success: true,
    unpassed: true
  };
}

export async function getOwnAction(actorUserId: string, candidateId: string) {
  if (actorUserId === candidateId) {
    throw new AppError("Invalid operation on self", 400);
  }

  const interaction = await prisma.profileInteraction.findUnique({
    where: {
      actorUserId_targetUserId: {
        actorUserId,
        targetUserId: candidateId
      }
    },
    select: {
      action: true
    }
  });

  return {
    action: interaction ? interaction.action : "NONE"
  };
}
