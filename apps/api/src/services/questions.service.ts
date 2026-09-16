import { prisma } from "../config/db.js";
import type {
  CreateAnswerInput,
  ListQuestionsQuery,
  UpdateAnswerInput
} from "../schemas/questions.schema.js";
import { AppError } from "../utils/app-error.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function listActiveQuestions(query: ListQuestionsQuery) {
  const { category, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(category ? { category } : {})
  };

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      select: {
        id: true,
        questionText: true,
        category: true,
        displayOrder: true,
        createdAt: true
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      skip,
      take: limit
    })
  ]);

  return {
    questions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function listUserAnswers(userId: string) {
  const answers = await prisma.userQuestionAnswer.findMany({
    where: { userId },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          category: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return answers.map((a) => ({
    id: a.id,
    questionId: a.questionId,
    questionText: a.question.questionText,
    category: a.question.category,
    answer: a.answer,
    visibility: a.visibility,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));
}

export async function createUserAnswer(userId: string, input: CreateAnswerInput) {
  const question = await prisma.question.findUnique({
    where: { id: input.questionId }
  });

  if (!question || !question.isActive) {
    throw new AppError("Question not found or inactive", 404);
  }

  const existing = await prisma.userQuestionAnswer.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId: input.questionId
      }
    }
  });

  if (existing) {
    throw new AppError("You have already answered this question", 409);
  }

  const created = await prisma.userQuestionAnswer.create({
    data: {
      userId,
      questionId: input.questionId,
      answer: input.answer,
      visibility: input.visibility,
      moderationStatus: "APPROVED"
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          category: true
        }
      }
    }
  });

  return {
    id: created.id,
    questionId: created.questionId,
    questionText: created.question.questionText,
    category: created.question.category,
    answer: created.answer,
    visibility: created.visibility,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  };
}

export async function updateUserAnswer(
  userId: string,
  answerId: string,
  input: UpdateAnswerInput
) {
  const answer = await prisma.userQuestionAnswer.findUnique({
    where: { id: answerId }
  });

  if (!answer || answer.userId !== userId) {
    throw new AppError("Answer not found", 404);
  }

  const updated = await prisma.userQuestionAnswer.update({
    where: { id: answerId },
    data: {
      ...(input.answer !== undefined && { answer: input.answer }),
      ...(input.visibility !== undefined && { visibility: input.visibility })
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          category: true
        }
      }
    }
  });

  return {
    id: updated.id,
    questionId: updated.questionId,
    questionText: updated.question.questionText,
    category: updated.question.category,
    answer: updated.answer,
    visibility: updated.visibility,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}

export async function deleteUserAnswer(userId: string, answerId: string) {
  const answer = await prisma.userQuestionAnswer.findUnique({
    where: { id: answerId }
  });

  if (!answer || answer.userId !== userId) {
    throw new AppError("Answer not found", 404);
  }

  await prisma.userQuestionAnswer.delete({
    where: { id: answerId }
  });

  return {
    success: true,
    message: "Answer deleted successfully"
  };
}

export async function getPublicUserAnswers(identifier: string, viewerUserId?: string) {
  const isUuid = UUID_REGEX.test(identifier);

  const profile = await prisma.profile.findFirst({
    where: {
      OR: isUuid
        ? [{ id: identifier }, { userId: identifier }, { username: identifier }]
        : [{ username: identifier }],
      deletedAt: null
    },
    select: {
      userId: true,
      isDiscoverable: true,
      isIncognito: true
    }
  });

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  const isOwner = viewerUserId === profile.userId;

  if (!isOwner && (!profile.isDiscoverable || profile.isIncognito)) {
    throw new AppError("This profile is private or not discoverable", 404);
  }

  const allowedVisibilities = isOwner
    ? undefined
    : ["PUBLIC", "DISCOVERY"];

  const answers = await prisma.userQuestionAnswer.findMany({
    where: {
      userId: profile.userId,
      ...(allowedVisibilities ? { visibility: { in: allowedVisibilities as any } } : {})
    },
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          category: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return answers.map((a) => ({
    id: a.id,
    questionId: a.questionId,
    questionText: a.question.questionText,
    category: a.question.category,
    answer: a.answer,
    visibility: a.visibility,
    createdAt: a.createdAt
  }));
}
