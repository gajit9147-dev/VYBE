import { prisma } from "../config/db.js";

/**
 * Idempotently seeds standard interest categories, interests, prompt templates,
 * and relationship intents into the database for test suites and development.
 */
export async function ensureDefaultProfileSeeds(): Promise<{
  interests: { id: string; name: string; slug: string }[];
  templates: { id: string; question: string; category: string }[];
  intents: { id: string; code: string; label: string }[];
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

  const interests = await prisma.interest.findMany({ where: { isActive: true } });
  const templates = await prisma.promptTemplate.findMany({ where: { isActive: true } });
  const intents = await prisma.relationshipIntent.findMany();

  return { interests, templates, intents };
}
