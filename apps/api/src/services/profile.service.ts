import { prisma } from "../config/db.js";
import { logger } from "../config/logger.js";
import type { UpdateProfileInput } from "../schemas/profile.schema.js";
import { AppError } from "../utils/app-error.js";
import { calculateAge } from "../utils/profile.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface PublicProfileResult {
  id: string;
  displayName: string;
  username: string | null;
  age: number | null;
  gender: string;
  pronouns: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  heightCm: number | null;
  occupation: string | null;
  company: string | null;
  education: string | null;
  drinking: string | null;
  smoking: string | null;
  exercise: string | null;
  starSign: string | null;
  languages: string[];
  photos: {
    id: string;
    cdnUrl: string;
    displayOrder: number;
    isPrimary: boolean;
  }[];
  interests: {
    id: string;
    name: string;
    slug: string;
  }[];
  relationshipIntents: {
    code: string;
    label: string;
    description: string;
    isPrimary: boolean;
    customClarification: string | null;
  }[];
  prompts: {
    templateId: string;
    question: string;
    category: string;
    answerText: string;
    displayOrder: number;
  }[];
}

export interface OwnProfileResult extends PublicProfileResult {
  birthDate: string;
  isDiscoverable: boolean;
  showAge: boolean;
  showDistance: boolean;
  crossedPathOptIn: boolean;
  completionScore: number;
}

/**
 * Calculates profile completion score based on filled sections.
 */
function computeCompletionScore(params: {
  displayName?: string | null;
  bio?: string | null;
  photosCount: number;
  interestsCount: number;
  promptsCount: number;
  city?: string | null;
  gender?: string | null;
  birthDate?: Date | null;
}): number {
  let score = 0;
  if (params.displayName) score += 15;
  if (params.birthDate) score += 15;
  if (params.gender) score += 10;
  if (params.photosCount > 0) score += Math.min(params.photosCount * 10, 30);
  if (params.bio && params.bio.length >= 10) score += 10;
  if (params.interestsCount >= 3) score += 10;
  if (params.promptsCount >= 1) score += 10;
  return Math.min(score, 100);
}

/**
 * Retrieves the full profile of the currently authenticated user.
 */
export async function getOwnProfile(userId: string): Promise<OwnProfileResult | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      photos: {
        orderBy: { displayOrder: "asc" }
      },
      interests: {
        include: { interest: true },
        orderBy: { rank: "asc" }
      },
      relationshipIntents: {
        include: { intent: true }
      },
      prompts: {
        include: { template: true },
        orderBy: { displayOrder: "asc" }
      }
    }
  });

  if (!profile || profile.deletedAt) {
    return null;
  }

  const age = calculateAge(profile.birthDate);

  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    birthDate: profile.birthDate.toISOString().split("T")[0],
    age,
    gender: profile.gender,
    pronouns: profile.pronouns,
    bio: profile.bio,
    city: profile.city,
    country: profile.country,
    heightCm: profile.heightCm,
    occupation: profile.occupation,
    company: profile.company,
    education: profile.education,
    drinking: profile.drinking,
    smoking: profile.smoking,
    exercise: profile.exercise,
    starSign: profile.starSign,
    languages: profile.languages,
    isDiscoverable: profile.isDiscoverable,
    showAge: profile.showAge,
    showDistance: profile.showDistance,
    crossedPathOptIn: profile.crossedPathOptIn,
    completionScore: profile.completionScore,
    photos: profile.photos.map((p) => ({
      id: p.id,
      cdnUrl: p.cdnUrl,
      displayOrder: p.displayOrder,
      isPrimary: p.isPrimary
    })),
    interests: profile.interests.map((pi) => ({
      id: pi.interest.id,
      name: pi.interest.name,
      slug: pi.interest.slug
    })),
    relationshipIntents: profile.relationshipIntents.map((ri) => ({
      code: ri.intent.code,
      label: ri.intent.label,
      description: ri.intent.description,
      isPrimary: ri.isPrimary,
      customClarification: ri.customClarification
    })),
    prompts: profile.prompts.map((pr) => ({
      templateId: pr.templateId,
      question: pr.template.question,
      category: pr.template.category,
      answerText: pr.answerText,
      displayOrder: pr.displayOrder
    }))
  };
}

/**
 * Updates or initializes the authenticated user's profile with validation,
 * username uniqueness checks, relationship handling, and audit logging.
 */
export async function updateOwnProfile(
  userId: string,
  input: UpdateProfileInput,
  ipHash?: string
): Promise<OwnProfileResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("Active account not found", 404);
  }

  // Check username uniqueness if provided
  if (input.username) {
    const existingWithUsername = await prisma.profile.findFirst({
      where: {
        username: input.username,
        userId: { not: userId }
      }
    });

    if (existingWithUsername) {
      throw new AppError("This username is already taken. Please choose another.", 409);
    }
  }

  // Validate interests if provided
  if (input.interestIds && input.interestIds.length > 0) {
    const uniqueIds = [...new Set(input.interestIds)];
    const existingInterests = await prisma.interest.findMany({
      where: {
        id: { in: uniqueIds },
        isActive: true
      }
    });

    if (existingInterests.length !== uniqueIds.length) {
      throw new AppError("One or more selected interests are invalid or inactive", 400);
    }
  }

  // Validate relationship intent if provided
  if (input.relationshipIntentId) {
    const existingIntent = await prisma.relationshipIntent.findUnique({
      where: { id: input.relationshipIntentId }
    });

    if (!existingIntent) {
      throw new AppError("Selected relationship intent is invalid", 400);
    }
  }

  // Validate prompt templates if provided
  if (input.prompts && input.prompts.length > 0) {
    const templateIds = [...new Set(input.prompts.map((p) => p.templateId))];
    const existingTemplates = await prisma.promptTemplate.findMany({
      where: {
        id: { in: templateIds },
        isActive: true
      }
    });

    if (existingTemplates.length !== templateIds.length) {
      throw new AppError("One or more selected prompt templates are invalid or inactive", 400);
    }
  }

  // Fetch current profile to record audit differences
  const currentProfile = await prisma.profile.findUnique({
    where: { userId }
  });

  const auditLogsToCreate: {
    userId: string;
    action: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    ipHash?: string;
  }[] = [];

  if (currentProfile) {
    // Check username change
    if (input.username !== undefined && input.username !== currentProfile.username) {
      auditLogsToCreate.push({
        userId,
        action: "USERNAME_CHANGE",
        field: "username",
        oldValue: currentProfile.username,
        newValue: input.username ?? null,
        ipHash
      });
      logger.info(
        { userId, action: "USERNAME_CHANGE" },
        "Profile audit event: username updated"
      );
    }

    // Check date of birth change
    if (
      input.birthDate !== undefined &&
      currentProfile.birthDate.toISOString().split("T")[0] !==
        input.birthDate.toISOString().split("T")[0]
    ) {
      auditLogsToCreate.push({
        userId,
        action: "DOB_CHANGE",
        field: "birthDate",
        oldValue: currentProfile.birthDate.toISOString().split("T")[0],
        newValue: input.birthDate.toISOString().split("T")[0],
        ipHash
      });
      logger.info(
        { userId, action: "DOB_CHANGE" },
        "Profile audit event: birthDate updated"
      );
    }

    // Check visibility change
    if (
      input.isDiscoverable !== undefined &&
      input.isDiscoverable !== currentProfile.isDiscoverable
    ) {
      auditLogsToCreate.push({
        userId,
        action: "VISIBILITY_CHANGE",
        field: "isDiscoverable",
        oldValue: String(currentProfile.isDiscoverable),
        newValue: String(input.isDiscoverable),
        ipHash
      });
      logger.info(
        { userId, action: "VISIBILITY_CHANGE" },
        "Profile audit event: visibility updated"
      );
    }
  }

  // Execute database updates inside an atomic transaction
  await prisma.$transaction(async (tx) => {
    // Record audit entries
    if (auditLogsToCreate.length > 0) {
      await tx.profileAuditLog.createMany({
        data: auditLogsToCreate
      });
    }

    // Prepare core profile data
    const coreData = {
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.username !== undefined && { username: input.username }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.pronouns !== undefined && { pronouns: input.pronouns }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.heightCm !== undefined && { heightCm: input.heightCm }),
      ...(input.occupation !== undefined && { occupation: input.occupation }),
      ...(input.company !== undefined && { company: input.company }),
      ...(input.education !== undefined && { education: input.education }),
      ...(input.drinking !== undefined && { drinking: input.drinking }),
      ...(input.smoking !== undefined && { smoking: input.smoking }),
      ...(input.exercise !== undefined && { exercise: input.exercise }),
      ...(input.starSign !== undefined && { starSign: input.starSign }),
      ...(input.languages !== undefined && { languages: input.languages }),
      ...(input.isDiscoverable !== undefined && { isDiscoverable: input.isDiscoverable }),
      ...(input.showAge !== undefined && { showAge: input.showAge }),
      ...(input.showDistance !== undefined && { showDistance: input.showDistance }),
      ...(input.crossedPathOptIn !== undefined && { crossedPathOptIn: input.crossedPathOptIn })
    };

    let profileRecord;

    if (currentProfile) {
      profileRecord = await tx.profile.update({
        where: { id: currentProfile.id },
        data: coreData
      });
    } else {
      // If initial creation, ensure required defaults
      profileRecord = await tx.profile.create({
        data: {
          userId,
          displayName: input.displayName || "Member",
          birthDate: input.birthDate || new Date("2000-01-01"),
          gender: input.gender || "OTHER",
          ...coreData
        }
      });
    }

    const profileId = profileRecord.id;

    // Handle interests update
    if (input.interestIds !== undefined) {
      const uniqueIds = [...new Set(input.interestIds)];
      await tx.profileInterest.deleteMany({
        where: { profileId }
      });
      if (uniqueIds.length > 0) {
        await tx.profileInterest.createMany({
          data: uniqueIds.map((interestId, index) => ({
            profileId,
            interestId,
            rank: index
          }))
        });
      }
    }

    // Handle relationship intents update
    if (input.relationshipIntentId !== undefined) {
      await tx.profileRelationshipIntent.deleteMany({
        where: { profileId }
      });
      if (input.relationshipIntentId) {
        await tx.profileRelationshipIntent.create({
          data: {
            profileId,
            intentId: input.relationshipIntentId,
            isPrimary: true,
            customClarification: input.relationshipIntentClarification ?? null
          }
        });
      }
    }

    // Handle prompts update
    if (input.prompts !== undefined) {
      await tx.profilePrompt.deleteMany({
        where: { profileId }
      });
      if (input.prompts.length > 0) {
        await tx.profilePrompt.createMany({
          data: input.prompts.map((prompt, index) => ({
            profileId,
            templateId: prompt.templateId,
            answerText: prompt.answerText,
            displayOrder: index
          }))
        });
      }
    }

    // Handle photos update
    if (input.photos !== undefined) {
      await tx.profilePhoto.deleteMany({
        where: { profileId }
      });
      if (input.photos.length > 0) {
        await tx.profilePhoto.createMany({
          data: input.photos.map((p, index) => ({
            profileId,
            storageKey: p.storageKey,
            cdnUrl: p.cdnUrl,
            displayOrder: p.displayOrder ?? index,
            isPrimary: p.isPrimary ?? index === 0,
            width: 800,
            height: 1000,
            fileSizeBytes: 102400
          }))
        });
      }
    }

    // Recompute completion score
    const photosCount = input.photos !== undefined ? input.photos.length : (await tx.profilePhoto.count({ where: { profileId } }));
    const interestsCount = input.interestIds !== undefined ? input.interestIds.length : (await tx.profileInterest.count({ where: { profileId } }));
    const promptsCount = input.prompts !== undefined ? input.prompts.length : (await tx.profilePrompt.count({ where: { profileId } }));

    const completionScore = computeCompletionScore({
      displayName: profileRecord.displayName,
      bio: profileRecord.bio,
      photosCount,
      interestsCount,
      promptsCount,
      city: profileRecord.city,
      gender: profileRecord.gender,
      birthDate: profileRecord.birthDate
    });

    await tx.profile.update({
      where: { id: profileId },
      data: { completionScore }
    });
  });

  const updated = await getOwnProfile(userId);
  if (!updated) {
    throw new AppError("Failed to load updated profile", 500);
  }

  return updated;
}

/**
 * Retrieves the public profile of a user by UUID or unique username.
 * Enforces privacy filtering:
 * - Omits email, phone number, password, internal IDs
 * - Hides exact date of birth (calculates age server-side, respects showAge)
 * - Returns 404 if profile is not discoverable or deleted
 */
export async function getPublicProfile(
  identifier: string,
  requesterUserId?: string
): Promise<PublicProfileResult> {
  const isUuid = UUID_REGEX.test(identifier);

  const profile = await prisma.profile.findFirst({
    where: {
      OR: isUuid ? [{ id: identifier }, { username: identifier }] : [{ username: identifier }],
      deletedAt: null
    },
    include: {
      user: {
        select: {
          id: true,
          status: true,
          deletedAt: true
        }
      },
      photos: {
        where: { deletedAt: null },
        orderBy: { displayOrder: "asc" }
      },
      interests: {
        include: { interest: true },
        orderBy: { rank: "asc" }
      },
      relationshipIntents: {
        include: { intent: true }
      },
      prompts: {
        include: { template: true },
        orderBy: { displayOrder: "asc" }
      }
    }
  });

  if (!profile || profile.user.status !== "ACTIVE" || profile.user.deletedAt) {
    throw new AppError("Profile not found", 404);
  }

  const isOwner = requesterUserId === profile.userId;

  // If user disabled discoverability or incognito is enabled, hide from others
  if ((!profile.isDiscoverable || profile.isIncognito) && !isOwner) {
    throw new AppError("This profile is private or not discoverable", 404);
  }

  // Calculate age server-side, but only show if showAge is enabled (or requester is owner)
  const age = profile.showAge || isOwner ? calculateAge(profile.birthDate) : null;

  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    age,
    gender: profile.gender,
    pronouns: profile.pronouns,
    bio: profile.bio,
    city: profile.city,
    country: profile.country,
    heightCm: profile.heightCm,
    occupation: profile.occupation,
    company: profile.company,
    education: profile.education,
    drinking: profile.drinking,
    smoking: profile.smoking,
    exercise: profile.exercise,
    starSign: profile.starSign,
    languages: profile.languages,
    photos: profile.photos.map((p) => ({
      id: p.id,
      cdnUrl: p.cdnUrl,
      displayOrder: p.displayOrder,
      isPrimary: p.isPrimary
    })),
    interests: profile.interests.map((pi) => ({
      id: pi.interest.id,
      name: pi.interest.name,
      slug: pi.interest.slug
    })),
    relationshipIntents: profile.relationshipIntents.map((ri) => ({
      code: ri.intent.code,
      label: ri.intent.label,
      description: ri.intent.description,
      isPrimary: ri.isPrimary,
      customClarification: ri.customClarification
    })),
    prompts: profile.prompts.map((pr) => ({
      templateId: pr.templateId,
      question: pr.template.question,
      category: pr.template.category,
      answerText: pr.answerText,
      displayOrder: pr.displayOrder
    }))
  };
}
