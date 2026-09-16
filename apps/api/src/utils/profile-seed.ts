import { prisma } from "../config/db.js";

/**
 * Idempotently seeds standard interest categories, interests, prompt templates,
 * and relationship intents into the database for test suites and development.
 */
export async function ensureDefaultProfileSeeds(): Promise<{
  interests: { id: string; name: string; slug: string }[];
  templates: { id: string; question: string; category: string }[];
  intents: { id: string; code: string; label: string }[];
  questions: { id: string; questionText: string; category: string }[];
}> {
  // 1. Seed Categories & Interests
  let category = await prisma.interestCategory.findFirst({
    where: { name: "Lifestyle & Hobbies" }
  });

  if (!category) {
    category = await prisma.interestCategory.create({
      data: {
        name: "Lifestyle & Hobbies",
        iconKey: "sparkles"
      }
    });
  }

  const defaultInterests = [
    { name: "Photography", slug: "photography" },
    { name: "Hiking", slug: "hiking" },
    { name: "Coffee", slug: "coffee" },
    { name: "Music", slug: "music" },
    { name: "Cooking", slug: "cooking" },
    { name: "Gaming", slug: "gaming" }
  ];

  for (const item of defaultInterests) {
    await prisma.interest.upsert({
      where: { slug: item.slug },
      update: { isActive: true },
      create: {
        categoryId: category.id,
        name: item.name,
        slug: item.slug,
        isActive: true
      }
    });
  }

  // 2. Seed Prompt Templates
  const defaultTemplates = [
    {
      category: "VALUES" as const,
      question: "A life goal of mine is...",
      displayOrder: 1
    },
    {
      category: "DATE_IDEAS" as const,
      question: "Together, we could...",
      displayOrder: 2
    },
    {
      category: "HUMOR" as const,
      question: "My simple pleasures...",
      displayOrder: 3
    }
  ];

  for (const t of defaultTemplates) {
    const existing = await prisma.promptTemplate.findFirst({
      where: { question: t.question }
    });
    if (!existing) {
      await prisma.promptTemplate.create({
        data: {
          category: t.category,
          question: t.question,
          displayOrder: t.displayOrder,
          isActive: true
        }
      });
    }
  }

  // 3. Seed Relationship Intents
  const defaultIntents = [
    {
      code: "LONG_TERM",
      label: "Long-term relationship",
      description: "Looking for something serious and long-lasting."
    },
    {
      code: "SHORT_TERM",
      label: "Short-term relationship",
      description: "Looking for casual fun and open to seeing what happens."
    },
    {
      code: "NEW_FRIENDS",
      label: "New friends",
      description: "Looking to expand my social circle."
    }
  ];

  for (const intent of defaultIntents) {
    await prisma.relationshipIntent.upsert({
      where: { code: intent.code },
      update: { label: intent.label, description: intent.description },
      create: {
        code: intent.code,
        label: intent.label,
        description: intent.description
      }
    });
  }

  // 4. Seed Open-Ended Questions
  const defaultQuestions = [
    {
      questionText: "What is a core value you will never compromise on?",
      category: "VALUES" as const,
      displayOrder: 1,
      isActive: true
    },
    {
      questionText: "How do you spend your ideal Sunday morning?",
      category: "LIFESTYLE" as const,
      displayOrder: 2,
      isActive: true
    },
    {
      questionText: "Are you an introvert, extrovert, or ambivert, and how does it show?",
      category: "PERSONALITY" as const,
      displayOrder: 3,
      isActive: true
    },
    {
      questionText: "What does healthy communication in a relationship look like to you?",
      category: "RELATIONSHIPS" as const,
      displayOrder: 4,
      isActive: true
    },
    {
      questionText: "What is the most spontaneous thing you've ever done?",
      category: "FUN" as const,
      displayOrder: 5,
      isActive: true
    },
    {
      questionText: "What is a life lesson that changed the way you see the world?",
      category: "DEEP" as const,
      displayOrder: 6,
      isActive: true
    },
    {
      questionText: "What is a small everyday ritual that keeps you grounded?",
      category: "DAILY_LIFE" as const,
      displayOrder: 7,
      isActive: true
    },
    {
      questionText: "Deprecated question that should be hidden.",
      category: "FUN" as const,
      displayOrder: 99,
      isActive: false
    }
  ];

  for (const q of defaultQuestions) {
    const existing = await prisma.question.findFirst({
      where: { questionText: q.questionText }
    });
    if (!existing) {
      await prisma.question.create({
        data: q
      });
    } else {
      await prisma.question.update({
        where: { id: existing.id },
        data: { isActive: q.isActive, displayOrder: q.displayOrder }
      });
    }
  }

  const interests = await prisma.interest.findMany({ where: { isActive: true } });
  const templates = await prisma.promptTemplate.findMany({ where: { isActive: true } });
  const intents = await prisma.relationshipIntent.findMany();
  const questions = await prisma.question.findMany({ where: { isActive: true } });

  return { interests, templates, intents, questions };
}
