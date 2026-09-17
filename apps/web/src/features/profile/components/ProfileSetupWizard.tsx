import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  GlassBadge,
  GlassButton,
  GlassCard,
  GlassErrorState,
  GlassProgress,
} from "@/components/ui";
import { PageLoading } from "@/components/feedback/PageLoading";
import { ApiClientError } from "@/services/api/errors";
import { useOwnProfile, useUpdateProfile } from "../hooks/useProfile";
import type { ProfileUpdateInput } from "../types/profileTypes";
import { BasicProfileStep } from "./BasicProfileStep";

const setupSteps = [
  { id: "basic", label: "Basic profile" },
  { id: "photos", label: "Photos" },
  { id: "interests", label: "Interests" },
  { id: "intent", label: "Relationship intent" },
  { id: "preferences", label: "Discovery preferences" },
  { id: "questions", label: "Questions & answers" },
  { id: "complete", label: "Complete" },
] as const;

function getUpdateErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401)
      return "Your session has expired. Please sign in again.";
    if (error.status === 409)
      return "That username is already taken. Please choose another.";
    if (error.status === 400)
      return error.message || "Please check your profile details.";
    if (error.kind === "NETWORK_ERROR")
      return "Unable to connect to VYBE. Check your connection and try again.";
  }
  return "We could not save your profile. Please try again.";
}

export const ProfileSetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const profileQuery = useOwnProfile();
  const updateProfileMutation = useUpdateProfile();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);

  if (profileQuery.isLoading) {
    return <PageLoading message="Loading your profile setup..." />;
  }

  if (profileQuery.isError) {
    return (
      <GlassErrorState
        title="Profile setup unavailable"
        message="We could not load your profile details right now."
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  const currentStep = setupSteps[currentStepIndex];
  const isBasicStep = currentStep.id === "basic";

  const handleBasicSubmit = async (
    data: ProfileUpdateInput,
  ): Promise<boolean> => {
    setUpdateError(null);
    try {
      await updateProfileMutation.mutateAsync(data);
      setCurrentStepIndex(1);
      return true;
    } catch (error: unknown) {
      setUpdateError(getUpdateErrorMessage(error));
      return false;
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <GlassCard variant="strong" padding="md" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <GlassBadge variant="pink" size="sm" dot>
                Profile setup
              </GlassBadge>
              <span className="text-xs text-slate-500">
                Step {currentStepIndex + 1} of {setupSteps.length}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {currentStep.label}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Build a profile that feels like you. You can refine it as your
              VYBE evolves.
            </p>
          </div>
          <Sparkles
            className="hidden h-7 w-7 text-pink-300 sm:block"
            aria-hidden="true"
          />
        </div>
        <GlassProgress
          value={currentStepIndex + 1}
          max={setupSteps.length}
          label="Setup progress"
          showLabel
          size="sm"
        />
      </GlassCard>

      {isBasicStep ? (
        <GlassCard variant="strong" padding="lg">
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Start with the basics
            </h2>
            <p className="text-xs leading-relaxed text-slate-400">
              These details help people find a real starting point for
              conversation.
            </p>
          </div>
          <BasicProfileStep
            profile={profileQuery.data ?? null}
            isSaving={updateProfileMutation.isPending}
            errorMessage={updateError}
            onSubmit={handleBasicSubmit}
          />
        </GlassCard>
      ) : (
        <GlassCard
          variant="strong"
          padding="lg"
          className="space-y-6 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Basics saved</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400">
              The next setup stage will be added here. Your basic profile is
              safely saved and ready for the next step.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={() => setCurrentStepIndex(0)}
              leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            >
              Review basics
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              onClick={() => navigate("/app")}
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Continue to VYBE
            </GlassButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
