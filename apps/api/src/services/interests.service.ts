import { prisma } from "../config/db.js";
import { AppError } from "../utils/app-error.js";

const MAX_USER_INTERESTS = 15;

export async function listSystemInterests(categoryId?: string) {
  const interests = await prisma.interest.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {})
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          iconKey: true
        }
      }
    },
    orderBy: [
      { category: { name: "asc" } },
      { name: "asc" }
    ]
  });

  return interests.map((interest) => ({
    id: interest.id,
    name: interest.name,
    slug: interest.slug,
    category: interest.category
  }));
}

export async function listUserInterests(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create a profile first.", 404);
  }

  const profileInterests = await prisma.profileInterest.findMany({
    where: { profileId: profile.id },
    include: {
      interest: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              iconKey: true
            }
          }
        }
      }
    },
    orderBy: { rank: "asc" }
  });

  return profileInterests.map((pi) => ({
    interestId: pi.interestId,
    rank: pi.rank,
    name: pi.interest.name,
    slug: pi.interest.slug,
    category: pi.interest.category
  }));
}

export async function addUserInterest(userId: string, interestId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create a profile first.", 404);
  }

  const interest = await prisma.interest.findUnique({
    where: { id: interestId }
  });

  if (!interest || !interest.isActive) {
    throw new AppError("Interest not found or inactive", 404);
  }

  const existing = await prisma.profileInterest.findUnique({
    where: {
      profileId_interestId: {
        profileId: profile.id,
        interestId
      }
    }
  });

  if (existing) {
    throw new AppError("Interest is already added to your profile", 409);
  }

  const currentCount = await prisma.profileInterest.count({
    where: { profileId: profile.id }
  });

  if (currentCount >= MAX_USER_INTERESTS) {
    throw new AppError(`Cannot add more than ${MAX_USER_INTERESTS} interests`, 400);
  }

  const created = await prisma.profileInterest.create({
    data: {
      profileId: profile.id,
      interestId,
      rank: currentCount
    },
    include: {
      interest: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              iconKey: true
            }
          }
        }
      }
    }
  });

  return {
    interestId: created.interestId,
    rank: created.rank,
    name: created.interest.name,
    slug: created.interest.slug,
    category: created.interest.category
  };
}

export async function removeUserInterest(userId: string, interestId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create a profile first.", 404);
  }

  const existing = await prisma.profileInterest.findUnique({
    where: {
      profileId_interestId: {
        profileId: profile.id,
        interestId
      }
    }
  });

  if (!existing) {
    throw new AppError("Interest is not associated with your profile", 404);
  }

  await prisma.profileInterest.delete({
    where: {
      profileId_interestId: {
        profileId: profile.id,
        interestId
      }
    }
  });

  return {
    success: true,
    message: "Interest removed from profile successfully"
  };
}
