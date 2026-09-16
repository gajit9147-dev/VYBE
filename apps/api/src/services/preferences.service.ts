import { prisma } from "../config/db.js";
import type { UpdateDiscoveryPreferencesInput } from "../schemas/interests.schema.js";
import { AppError } from "../utils/app-error.js";

export async function getUserPreferences(userId: string) {
  let prefs = await prisma.discoveryPreference.findUnique({
    where: { userId }
  });

  if (!prefs) {
    prefs = await prisma.discoveryPreference.create({
      data: { userId }
    });
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { isDiscoveryPaused: true }
  });

  return {
    minAge: prefs.minAge,
    maxAge: prefs.maxAge,
    isAgeDealbreaker: prefs.isAgeDealbreaker,
    maxDistanceKm: prefs.maxDistanceKm,
    isDistanceDealbreaker: prefs.isDistanceDealbreaker,
    interestedInGenders: prefs.interestedInGenders,
    relationshipIntentIds: prefs.relationshipIntentIds,
    isIntentDealbreaker: prefs.isIntentDealbreaker,
    verifiedProfilesOnly: prefs.verifiedProfilesOnly,
    hasBioOnly: prefs.hasBioOnly,
    isDiscoveryPaused: settings?.isDiscoveryPaused ?? false
  };
}

export async function updateUserPreferences(
  userId: string,
  input: UpdateDiscoveryPreferencesInput
) {
  // Validate relationshipIntentIds if provided
  if (input.relationshipIntentIds && input.relationshipIntentIds.length > 0) {
    const existingIntents = await prisma.relationshipIntent.findMany({
      where: { id: { in: input.relationshipIntentIds } },
      select: { id: true }
    });

    if (existingIntents.length !== input.relationshipIntentIds.length) {
      throw new AppError("One or more relationship intent IDs are invalid", 400);
    }
  }

  const { isDiscoveryPaused, ...discoveryFields } = input;

  return prisma.$transaction(async (tx) => {
    if (isDiscoveryPaused !== undefined) {
      await tx.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          isDiscoveryPaused
        },
        update: {
          isDiscoveryPaused
        }
      });
    }

    const updatedPrefs = await tx.discoveryPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...discoveryFields
      },
      update: {
        ...discoveryFields
      }
    });

    const currentSettings = await tx.userSettings.findUnique({
      where: { userId },
      select: { isDiscoveryPaused: true }
    });

    return {
      minAge: updatedPrefs.minAge,
      maxAge: updatedPrefs.maxAge,
      isAgeDealbreaker: updatedPrefs.isAgeDealbreaker,
      maxDistanceKm: updatedPrefs.maxDistanceKm,
      isDistanceDealbreaker: updatedPrefs.isDistanceDealbreaker,
      interestedInGenders: updatedPrefs.interestedInGenders,
      relationshipIntentIds: updatedPrefs.relationshipIntentIds,
      isIntentDealbreaker: updatedPrefs.isIntentDealbreaker,
      verifiedProfilesOnly: updatedPrefs.verifiedProfilesOnly,
      hasBioOnly: updatedPrefs.hasBioOnly,
      isDiscoveryPaused: currentSettings?.isDiscoveryPaused ?? false
    };
  });
}
