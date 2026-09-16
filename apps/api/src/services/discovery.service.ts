import { prisma } from "../config/db.js";
import type {
  CreateDiscoveryEventInput,
  DiscoveryQuery
} from "../schemas/discovery.schema.js";
import { AppError } from "../utils/app-error.js";
import { calculateAge } from "../utils/profile.js";
import {
  evaluateDiscoveryCandidate,
  type CandidateEvaluationContext,
  type UserEvaluationContext
} from "./discovery-reasons.service.js";

export async function getDiscoveryExclusions(userId: string): Promise<Set<string>> {
  const excluded = new Set<string>();
  excluded.add(userId);

  // 1. Blocks in both directions
  const [blocksGiven, blocksReceived] = await Promise.all([
    prisma.userBlock.findMany({
      where: { blockerUserId: userId },
      select: { blockedUserId: true }
    }),
    prisma.userBlock.findMany({
      where: { blockedUserId: userId },
      select: { blockerUserId: true }
    })
  ]);

  for (const b of blocksGiven) excluded.add(b.blockedUserId);
  for (const b of blocksReceived) excluded.add(b.blockerUserId);

  // 2. Reports in both directions (pending, in review, actioned)
  const [reportsFiled, reportsReceived] = await Promise.all([
    prisma.userReport.findMany({
      where: { reporterUserId: userId, status: { not: "DISMISSED" } },
      select: { reportedUserId: true }
    }),
    prisma.userReport.findMany({
      where: { reportedUserId: userId, status: { not: "DISMISSED" } },
      select: { reporterUserId: true }
    })
  ]);

  for (const r of reportsFiled) excluded.add(r.reportedUserId);
  for (const r of reportsReceived) excluded.add(r.reporterUserId);

  // 3. Recently skipped candidates (within the past 7 days)
  const recentSkips = await prisma.discoveryEvent.findMany({
    where: {
      userId,
      eventType: "SKIP",
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    select: { candidateUserId: true }
  });

  for (const s of recentSkips) excluded.add(s.candidateUserId);

  return excluded;
}

export async function getDiscoveryFeed(userId: string, query: DiscoveryQuery) {
  const limit = query.limit || 20;

  // 1. Fetch authenticated user context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          interests: { include: { interest: true } },
          relationshipIntents: { include: { intent: true } }
        }
      },
      discoveryPreferences: true,
      settings: true,
      questionAnswers: {
        include: { question: true }
      }
    }
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new AppError("Active account not found", 404);
  }

  if (!user.profile) {
    throw new AppError("Profile not found. Please complete your profile first.", 404);
  }

  if (user.settings?.isDiscoveryPaused) {
    return {
      items: [],
      nextCursor: null,
      message: "Discovery is currently paused on your account. Resume in profile preferences to see new people."
    };
  }

  const userAge = calculateAge(user.profile.birthDate);

  const userContext: UserEvaluationContext = {
    userId: user.id,
    interests: user.profile.interests.map((pi) => ({
      id: pi.interest.id,
      name: pi.interest.name,
      slug: pi.interest.slug
    })),
    relationshipIntents: user.profile.relationshipIntents.map((ri) => ({
      id: ri.intent.id,
      code: ri.intent.code,
      label: ri.intent.label
    })),
    questionAnswers: user.questionAnswers.map((qa) => ({
      questionId: qa.questionId,
      category: qa.question.category,
      visibility: qa.visibility
    })),
    gender: user.profile.gender,
    age: userAge
  };

  // User preferences
  const userMinAge = user.discoveryPreferences?.minAge ?? 18;
  const userMaxAge = user.discoveryPreferences?.maxAge ?? 45;
  const userInterestedGenders = user.discoveryPreferences?.interestedInGenders ?? [
    "WOMAN",
    "MAN",
    "NON_BINARY"
  ];
  const userPreferredIntentIds = new Set(user.discoveryPreferences?.relationshipIntentIds ?? []);
  const isUserIntentDealbreaker = user.discoveryPreferences?.isIntentDealbreaker ?? false;

  // 2. Fetch exclusion list
  const excludedUserIds = await getDiscoveryExclusions(userId);

  // 3. Query candidate database pool
  const rawCandidates = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excludedUserIds) },
      status: "ACTIVE",
      deletedAt: null,
      profile: {
        isDiscoverable: true,
        isIncognito: false,
        gender: { in: userInterestedGenders }
      },
      settings: {
        isDiscoveryPaused: false
      }
    },
    include: {
      profile: {
        include: {
          photos: {
            where: { deletedAt: null },
            orderBy: { displayOrder: "asc" }
          },
          interests: { include: { interest: true } },
          relationshipIntents: { include: { intent: true } }
        }
      },
      discoveryPreferences: true,
      questionAnswers: {
        include: { question: true }
      }
    },
    take: 100 // Fetch sufficient candidates for in-memory eligibility evaluation
  });

  // 4. Server-Side Eligibility & Two-Way Matching Evaluation
  const evaluatedCandidates: {
    candidate: (typeof rawCandidates)[0];
    candidateAge: number;
    score: number;
    reasons: { type: string; text: string }[];
  }[] = [];

  for (const c of rawCandidates) {
    if (!c.profile) continue;

    const candidateAge = calculateAge(c.profile.birthDate);

    // Rule A: Candidate age within user preferences
    if (candidateAge < userMinAge || candidateAge > userMaxAge) {
      continue;
    }

    // Rule B: Two-way age dealbreaker: candidate preferences respected
    if (c.discoveryPreferences) {
      const cMinAge = c.discoveryPreferences.minAge;
      const cMaxAge = c.discoveryPreferences.maxAge;
      if (c.discoveryPreferences.isAgeDealbreaker) {
        if (userAge < cMinAge || userAge > cMaxAge) {
          continue;
        }
      }

      // Rule C: Two-way gender preference
      if (
        c.discoveryPreferences.interestedInGenders &&
        !c.discoveryPreferences.interestedInGenders.includes(user.profile.gender)
      ) {
        continue;
      }

      // Rule D: Relationship intent dealbreaker
      if (isUserIntentDealbreaker && userPreferredIntentIds.size > 0) {
        const candidateIntents = c.profile.relationshipIntents.map((ri) => ri.intent.id);
        const hasMatchingIntent = candidateIntents.some((id) => userPreferredIntentIds.has(id));
        if (!hasMatchingIntent) {
          continue;
        }
      }
    }

    const candidateContext: CandidateEvaluationContext = {
      userId: c.id,
      interests: c.profile.interests.map((pi) => ({
        id: pi.interest.id,
        name: pi.interest.name,
        slug: pi.interest.slug
      })),
      relationshipIntents: c.profile.relationshipIntents.map((ri) => ({
        id: ri.intent.id,
        code: ri.intent.code,
        label: ri.intent.label
      })),
      questionAnswers: c.questionAnswers.map((qa) => ({
        questionId: qa.questionId,
        category: qa.question.category,
        visibility: qa.visibility
      })),
      gender: c.profile.gender,
      age: candidateAge,
      completionScore: c.profile.completionScore,
      hasPhotos: c.profile.photos.length > 0,
      hasBio: !!c.profile.bio
    };

    const evaluation = evaluateDiscoveryCandidate(userContext, candidateContext);

    evaluatedCandidates.push({
      candidate: c,
      candidateAge,
      score: evaluation.score,
      reasons: evaluation.reasons
    });
  }

  // 5. Modular internal ranking (never expose raw scores or percentage numbers)
  evaluatedCandidates.sort((a, b) => b.score - a.score);

  // 6. Pagination handling
  const pageCandidates = evaluatedCandidates.slice(0, limit);
  const hasMore = evaluatedCandidates.length > limit;
  const nextCursor = hasMore && pageCandidates.length > 0
    ? Buffer.from(pageCandidates[pageCandidates.length - 1].candidate.id).toString("base64")
    : null;

  // 7. Format safe public DTOs (omits email, phone, DOB, coordinates, internal IDs)
  const items = pageCandidates.map(({ candidate: c, candidateAge, reasons }) => ({
    user: {
      id: c.id,
      displayName: c.profile!.displayName,
      username: c.profile!.username,
      age: candidateAge,
      gender: c.profile!.gender,
      city: c.profile!.city,
      bio: c.profile!.bio,
      photos: c.profile!.photos.map((p) => ({
        id: p.id,
        cdnUrl: p.cdnUrl,
        displayOrder: p.displayOrder,
        isPrimary: p.isPrimary
      })),
      interests: c.profile!.interests.map((pi) => pi.interest.name),
      relationshipIntents: c.profile!.relationshipIntents.map((ri) => ri.intent.label)
    },
    reasons
  }));

  return {
    items,
    nextCursor
  };
}

export async function getDiscoveryCandidateProfile(userId: string, candidateUserId: string) {
  if (userId === candidateUserId) {
    throw new AppError("Cannot view own profile through discovery candidate endpoint", 400);
  }

  const exclusions = await getDiscoveryExclusions(userId);
  if (exclusions.has(candidateUserId)) {
    throw new AppError("Candidate profile not found or unavailable", 404);
  }

  const candidate = await prisma.user.findUnique({
    where: { id: candidateUserId },
    include: {
      profile: {
        include: {
          photos: {
            where: { deletedAt: null },
            orderBy: { displayOrder: "asc" }
          },
          interests: { include: { interest: true } },
          relationshipIntents: { include: { intent: true } }
        }
      },
      discoveryPreferences: true,
      settings: true,
      questionAnswers: {
        where: {
          visibility: { in: ["PUBLIC", "DISCOVERY"] }
        },
        include: { question: true }
      }
    }
  });

  if (
    !candidate ||
    candidate.status !== "ACTIVE" ||
    candidate.deletedAt ||
    !candidate.profile ||
    !candidate.profile.isDiscoverable ||
    candidate.profile.isIncognito ||
    candidate.settings?.isDiscoveryPaused
  ) {
    throw new AppError("Candidate profile not found or unavailable", 404);
  }

  // Get user context to evaluate reasons
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          interests: { include: { interest: true } },
          relationshipIntents: { include: { intent: true } }
        }
      },
      questionAnswers: { include: { question: true } }
    }
  });

  if (!user || !user.profile) {
    throw new AppError("Profile not found", 404);
  }

  const userAge = calculateAge(user.profile.birthDate);
  const candidateAge = calculateAge(candidate.profile.birthDate);

  const userContext: UserEvaluationContext = {
    userId: user.id,
    interests: user.profile.interests.map((pi) => ({
      id: pi.interest.id,
      name: pi.interest.name,
      slug: pi.interest.slug
    })),
    relationshipIntents: user.profile.relationshipIntents.map((ri) => ({
      id: ri.intent.id,
      code: ri.intent.code,
      label: ri.intent.label
    })),
    questionAnswers: user.questionAnswers.map((qa) => ({
      questionId: qa.questionId,
      category: qa.question.category,
      visibility: qa.visibility
    })),
    gender: user.profile.gender,
    age: userAge
  };

  const candidateContext: CandidateEvaluationContext = {
    userId: candidate.id,
    interests: candidate.profile.interests.map((pi) => ({
      id: pi.interest.id,
      name: pi.interest.name,
      slug: pi.interest.slug
    })),
    relationshipIntents: candidate.profile.relationshipIntents.map((ri) => ({
      id: ri.intent.id,
      code: ri.intent.code,
      label: ri.intent.label
    })),
    questionAnswers: candidate.questionAnswers.map((qa) => ({
      questionId: qa.questionId,
      category: qa.question.category,
      visibility: qa.visibility
    })),
    gender: candidate.profile.gender,
    age: candidateAge,
    completionScore: candidate.profile.completionScore,
    hasPhotos: candidate.profile.photos.length > 0,
    hasBio: !!candidate.profile.bio
  };

  const evaluation = evaluateDiscoveryCandidate(userContext, candidateContext);

  return {
    user: {
      id: candidate.id,
      displayName: candidate.profile.displayName,
      username: candidate.profile.username,
      age: candidateAge,
      gender: candidate.profile.gender,
      city: candidate.profile.city,
      bio: candidate.profile.bio,
      photos: candidate.profile.photos.map((p) => ({
        id: p.id,
        cdnUrl: p.cdnUrl,
        displayOrder: p.displayOrder,
        isPrimary: p.isPrimary
      })),
      interests: candidate.profile.interests.map((pi) => pi.interest.name),
      relationshipIntents: candidate.profile.relationshipIntents.map((ri) => ri.intent.label),
      answers: candidate.questionAnswers.map((qa) => ({
        id: qa.id,
        questionText: qa.question.questionText,
        category: qa.question.category,
        answer: qa.answer
      }))
    },
    reasons: evaluation.reasons
  };
}

export async function recordDiscoveryEvent(userId: string, input: CreateDiscoveryEventInput) {
  if (userId === input.candidateUserId) {
    throw new AppError("Cannot record discovery event on yourself", 400);
  }

  const candidate = await prisma.user.findUnique({
    where: { id: input.candidateUserId },
    select: { id: true }
  });

  if (!candidate) {
    throw new AppError("Candidate user not found", 404);
  }

  const event = await prisma.discoveryEvent.create({
    data: {
      userId,
      candidateUserId: input.candidateUserId,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as any) : undefined
    }
  });

  return {
    success: true,
    eventId: event.id
  };
}
