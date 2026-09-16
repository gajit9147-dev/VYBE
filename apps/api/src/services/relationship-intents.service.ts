import { prisma } from "../config/db.js";
import type { SetRelationshipIntentsInput } from "../schemas/interests.schema.js";
import { AppError } from "../utils/app-error.js";

export async function listSystemRelationshipIntents() {
  const intents = await prisma.relationshipIntent.findMany({
    select: {
      id: true,
      code: true,
      label: true,
      description: true
    },
    orderBy: { label: "asc" }
  });

  return intents;
}

export async function getUserRelationshipIntents(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create a profile first.", 404);
  }

  const profileIntents = await prisma.profileRelationshipIntent.findMany({
    where: { profileId: profile.id },
    include: {
      intent: {
        select: {
          id: true,
          code: true,
          label: true,
          description: true
        }
      }
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
  });

  return profileIntents.map((pi) => ({
    intentId: pi.intentId,
    code: pi.intent.code,
    label: pi.intent.label,
    description: pi.intent.description,
    isPrimary: pi.isPrimary,
    customClarification: pi.customClarification
  }));
}

export async function setUserRelationshipIntents(
  userId: string,
  input: SetRelationshipIntentsInput
) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create a profile first.", 404);
  }

  // Verify all requested intents exist
  const existingIntents = await prisma.relationshipIntent.findMany({
    where: { id: { in: input.intentIds } },
    select: { id: true }
  });

  if (existingIntents.length !== input.intentIds.length) {
    throw new AppError("One or more selected relationship intents do not exist", 400);
  }

  const primaryIntentId = input.primaryIntentId ?? input.intentIds[0];

  return prisma.$transaction(async (tx) => {
    // Remove previous selections
    await tx.profileRelationshipIntent.deleteMany({
      where: { profileId: profile.id }
    });

    // Create new records
    for (const intentId of input.intentIds) {
      await tx.profileRelationshipIntent.create({
        data: {
          profileId: profile.id,
          intentId,
          isPrimary: intentId === primaryIntentId,
          customClarification: input.customClarification ?? null
        }
      });
    }

    const updated = await tx.profileRelationshipIntent.findMany({
      where: { profileId: profile.id },
      include: {
        intent: {
          select: {
            id: true,
            code: true,
            label: true,
            description: true
          }
        }
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
    });

    return updated.map((pi) => ({
      intentId: pi.intentId,
      code: pi.intent.code,
      label: pi.intent.label,
      description: pi.intent.description,
      isPrimary: pi.isPrimary,
      customClarification: pi.customClarification
    }));
  });
}
