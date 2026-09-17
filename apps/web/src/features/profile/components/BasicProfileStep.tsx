import React, { FormEvent, useState } from "react";
import { ArrowRight, CalendarDays, MapPin, UserRound } from "lucide-react";
import {
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTextarea,
} from "@/components/ui";
import {
  basicProfileSchema,
  BasicProfileFormData,
} from "../schemas/profileSchemas";
import type { OwnProfile, ProfileUpdateInput } from "../types/profileTypes";

interface BasicProfileStepProps {
  profile: OwnProfile | null;
  isSaving: boolean;
  errorMessage?: string | null;
  onSubmit: (data: ProfileUpdateInput) => Promise<boolean>;
}

const genderOptions = [
  { value: "WOMAN", label: "Woman" },
  { value: "MAN", label: "Man" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "GENDERQUEER", label: "Genderqueer" },
  { value: "OTHER", label: "Other" },
];

function getInitialValues(profile: OwnProfile | null): BasicProfileFormData {
  return {
    displayName: profile?.displayName || "",
    username: profile?.username || "",
    birthDate: profile?.birthDate || "",
    gender: (profile?.gender as BasicProfileFormData["gender"]) || "OTHER",
    pronouns: profile?.pronouns || "",
    bio: profile?.bio || "",
    city: profile?.city || "",
    country: profile?.country || "",
  };
}

export const BasicProfileStep: React.FC<BasicProfileStepProps> = ({
  profile,
  isSaving,
  errorMessage,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<BasicProfileFormData>(() =>
    getInitialValues(profile),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof BasicProfileFormData, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = <Field extends keyof BasicProfileFormData>(
    field: Field,
    value: BasicProfileFormData[Field],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    const validation = basicProfileSchema.safeParse(formData);
    if (!validation.success) {
      const nextErrors: Partial<Record<keyof BasicProfileFormData, string>> =
        {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof BasicProfileFormData;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      });
      setFieldErrors(nextErrors);
      return;
    }

    const saved = await onSubmit({
      displayName: validation.data.displayName,
      username: validation.data.username || undefined,
      birthDate: validation.data.birthDate,
      gender: validation.data.gender,
      pronouns: validation.data.pronouns || null,
      bio: validation.data.bio || null,
      city: validation.data.city || null,
      country: validation.data.country || null,
    });

    if (!saved)
      setSubmitError(
        errorMessage || "We could not save your profile. Please try again.",
      );
  };

  const visibleError = submitError || errorMessage;

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {visibleError && (
        <div
          className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs text-rose-200"
          role="alert"
          aria-live="assertive"
        >
          {visibleError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <GlassInput
          label="Display name"
          placeholder="How should VYBE introduce you?"
          autoComplete="name"
          required
          leftIcon={<UserRound className="h-4 w-4" aria-hidden="true" />}
          value={formData.displayName}
          onChange={(event) => handleChange("displayName", event.target.value)}
          error={fieldErrors.displayName}
          disabled={isSaving}
        />
        <GlassInput
          label="Username"
          placeholder="your_vybe"
          autoComplete="username"
          description="Optional. Letters, numbers, and underscores only."
          value={formData.username}
          onChange={(event) => handleChange("username", event.target.value)}
          error={fieldErrors.username}
          disabled={isSaving}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <GlassInput
          label="Date of birth"
          type="date"
          required
          leftIcon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          value={formData.birthDate}
          onChange={(event) => handleChange("birthDate", event.target.value)}
          error={fieldErrors.birthDate}
          disabled={isSaving}
        />
        <GlassSelect
          label="Gender"
          required
          options={genderOptions}
          value={formData.gender}
          onChange={(event) =>
            handleChange(
              "gender",
              event.target.value as BasicProfileFormData["gender"],
            )
          }
          error={fieldErrors.gender}
          disabled={isSaving}
        />
      </div>

      <GlassInput
        label="Pronouns"
        placeholder="e.g. she/her"
        value={formData.pronouns}
        onChange={(event) => handleChange("pronouns", event.target.value)}
        error={fieldErrors.pronouns}
        disabled={isSaving}
      />

      <GlassTextarea
        label="About you"
        placeholder="Share a little about what makes you, you."
        description={`${formData.bio.length}/500 characters`}
        rows={4}
        value={formData.bio}
        onChange={(event) => handleChange("bio", event.target.value)}
        error={fieldErrors.bio}
        disabled={isSaving}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <GlassInput
          label="City"
          placeholder="Your city"
          autoComplete="address-level2"
          leftIcon={<MapPin className="h-4 w-4" aria-hidden="true" />}
          value={formData.city}
          onChange={(event) => handleChange("city", event.target.value)}
          error={fieldErrors.city}
          disabled={isSaving}
        />
        <GlassInput
          label="Country"
          placeholder="Your country"
          autoComplete="country-name"
          value={formData.country}
          onChange={(event) => handleChange("country", event.target.value)}
          error={fieldErrors.country}
          disabled={isSaving}
        />
      </div>

      <GlassButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSaving}
        rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
      >
        Continue
      </GlassButton>
    </form>
  );
};
