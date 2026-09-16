import type { MatchReasonType } from "../../generated/prisma/client.js";

export interface GeneratedMatchReason {
  type: MatchReasonType;
  text: string;
  metadata?: Record<string, any>;
}

export function generateMatchReasons(actor: any, candidate: any): GeneratedMatchReason[] {
  const reasons: GeneratedMatchReason[] = [];

  const actorProfile = actor.profile;
  const candidateProfile = candidate.profile;

  if (!actorProfile || !candidateProfile) {
    return reasons;
  }

  // 1. Shared Interests
  const actorInterests = (actorProfile.interests || []).map((pi: any) => ({
    id: pi.interest?.id,
    name: pi.interest?.name
  }));
  const candidateInterests = (candidateProfile.interests || []).map((pi: any) => ({
    id: pi.interest?.id,
    name: pi.interest?.name
  }));

  const candidateInterestIds = new Set(candidateInterests.map((ci: any) => ci.id));
  const sharedInterests = actorInterests.filter((ai: any) => candidateInterestIds.has(ai.id));

  if (sharedInterests.length > 0) {
    const names = sharedInterests.map((si: any) => si.name);
    let text = "";
    if (names.length === 1) {
      text = `You both enjoy ${names[0]}.`;
    } else if (names.length === 2) {
      text = `You both enjoy ${names[0]} and ${names[1]}.`;
    } else {
      text = `You both enjoy ${names[0]}, ${names[1]}, and ${names.length - 2} more.`;
    }

    reasons.push({
      type: "SHARED_INTEREST",
      text,
      metadata: { sharedInterestIds: sharedInterests.map((si: any) => si.id) }
    });
  }

  // 2. Shared Relationship Intent
  const actorIntents = (actorProfile.relationshipIntents || []).map((ri: any) => ({
    id: ri.intent?.id,
    label: ri.intent?.label
  }));
  const candidateIntents = (candidateProfile.relationshipIntents || []).map((ri: any) => ({
    id: ri.intent?.id,
    label: ri.intent?.label
  }));

  const candidateIntentIds = new Set(candidateIntents.map((ci: any) => ci.id));
  const sharedIntents = actorIntents.filter((ai: any) => candidateIntentIds.has(ai.id));

  if (sharedIntents.length > 0) {
    const intentLabel = sharedIntents[0].label;
    reasons.push({
      type: "RELATIONSHIP_INTENT",
      text: `You're both looking for ${intentLabel.toLowerCase()}.`,
      metadata: { intentId: sharedIntents[0].id }
    });
  }

  // 3. Shared Answers (Strictly PUBLIC or DISCOVERY only - NEVER PRIVATE)
  const actorQA = (actor.questionAnswers || []).filter((qa: any) =>
    ["PUBLIC", "DISCOVERY"].includes(qa.visibility)
  );
  const candidateQA = (candidate.questionAnswers || []).filter((qa: any) =>
    ["PUBLIC", "DISCOVERY"].includes(qa.visibility)
  );

  const candidateQuestionIds = new Set(candidateQA.map((qa: any) => qa.questionId));
  const sharedQAs = actorQA.filter((qa: any) => candidateQuestionIds.has(qa.questionId));

  if (sharedQAs.length > 0) {
    const firstCategory = sharedQAs[0].question?.category || "personality";
    const formattedCategory = firstCategory.toLowerCase().replace(/_/g, " ");
    reasons.push({
      type: "SHARED_ANSWER",
      text: `You both shared perspectives on ${formattedCategory}.`,
      metadata: { sharedQuestionIds: sharedQAs.map((qa: any) => qa.questionId) }
    });
  }

  // 4. Preference & Location Alignment
  if (
    actorProfile.city &&
    candidateProfile.city &&
    actorProfile.city.trim().toLowerCase() === candidateProfile.city.trim().toLowerCase()
  ) {
    reasons.push({
      type: "PREFERENCE_ALIGNMENT",
      text: `You're both located in ${actorProfile.city.trim()}.`,
      metadata: { city: actorProfile.city.trim() }
    });
  }

  // 5. Profile Signal fallback if reasons < 1
  if (reasons.length === 0) {
    reasons.push({
      type: "PROFILE_SIGNAL",
      text: "You both expressed mutual interest in each other's profiles."
    });
  }

  // Cap at max 5 reasons
  return reasons.slice(0, 5);
}
