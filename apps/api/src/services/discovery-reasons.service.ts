export type DiscoveryReasonType =
  | "SHARED_INTEREST"
  | "SHARED_ANSWER"
  | "RELATIONSHIP_INTENT"
  | "PREFERENCE_ALIGNMENT"
  | "PROFILE_SIGNAL";

export interface DiscoveryReason {
  type: DiscoveryReasonType;
  text: string;
}

export interface UserEvaluationContext {
  userId: string;
  interests: { id: string; name: string; slug: string }[];
  relationshipIntents: { id: string; code: string; label: string }[];
  questionAnswers: { questionId: string; category: string; visibility: string }[];
  gender: string;
  age: number;
}

export interface CandidateEvaluationContext {
  userId: string;
  interests: { id: string; name: string; slug: string }[];
  relationshipIntents: { id: string; code: string; label: string }[];
  questionAnswers: { questionId: string; category: string; visibility: string }[];
  gender: string;
  age: number;
  completionScore: number;
  hasPhotos: boolean;
  hasBio: boolean;
}

export interface EvaluationResult {
  score: number;
  reasons: DiscoveryReason[];
}

export function evaluateDiscoveryCandidate(
  user: UserEvaluationContext,
  candidate: CandidateEvaluationContext
): EvaluationResult {
  let score = 0;
  const reasons: DiscoveryReason[] = [];

  // 1. Shared Interests
  const userInterestSlugs = new Set(user.interests.map((i) => i.slug));
  const sharedInterests = candidate.interests.filter((i) => userInterestSlugs.has(i.slug));

  if (sharedInterests.length > 0) {
    score += Math.min(sharedInterests.length * 10, 30);
    const names = sharedInterests.map((i) => i.name);
    let text = "";
    if (names.length === 1) {
      text = `You both enjoy ${names[0]}`;
    } else if (names.length === 2) {
      text = `You both enjoy ${names[0]} and ${names[1]}`;
    } else {
      text = `You share ${names.length} interests, including ${names[0]} and ${names[1]}`;
    }
    reasons.push({
      type: "SHARED_INTEREST",
      text
    });
  }

  // 2. Relationship Intent Alignment
  const userIntentIds = new Set(user.relationshipIntents.map((ri) => ri.id));
  const matchingIntents = candidate.relationshipIntents.filter((ri) => userIntentIds.has(ri.id));

  if (matchingIntents.length > 0) {
    score += 30;
    const label = matchingIntents[0].label;
    reasons.push({
      type: "RELATIONSHIP_INTENT",
      text: `You are both looking for a ${label.toLowerCase()}`
    });
  }

  // 3. Shared Discoverable Question Answers
  const userQuestionMap = new Map<string, string>();
  for (const qa of user.questionAnswers) {
    if (qa.visibility === "PUBLIC" || qa.visibility === "DISCOVERY") {
      userQuestionMap.set(qa.questionId, qa.category);
    }
  }

  const sharedCategories = new Set<string>();
  let sharedQaCount = 0;
  for (const cqa of candidate.questionAnswers) {
    if (
      (cqa.visibility === "PUBLIC" || cqa.visibility === "DISCOVERY") &&
      userQuestionMap.has(cqa.questionId)
    ) {
      sharedQaCount++;
      sharedCategories.add(cqa.category);
    }
  }

  if (sharedQaCount > 0) {
    score += Math.min(sharedQaCount * 10, 20);
    const categoryList = Array.from(sharedCategories);
    const categoryLabel =
      categoryList.length > 0
        ? categoryList[0].toLowerCase().replace("_", " ")
        : "lifestyle and values";
    reasons.push({
      type: "SHARED_ANSWER",
      text: `You both answered questions about ${categoryLabel}`
    });
  }

  // 4. Preference Alignment Signal
  score += 20;
  if (reasons.length < 2) {
    reasons.push({
      type: "PREFERENCE_ALIGNMENT",
      text: "Your discovery preferences align"
    });
  }

  // 5. Profile Completeness Signal
  score += Math.round((candidate.completionScore || 0) / 10);

  // Return top 2-3 reasons
  return {
    score,
    reasons: reasons.slice(0, 3)
  };
}
