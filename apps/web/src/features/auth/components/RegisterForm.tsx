import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { registerSchema, RegisterFormData } from "../schemas/authSchemas";
import { PasswordField } from "./PasswordField";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useToast } from "@/components/feedback";
import { ApiClientError } from "@/services/api/errors";

export const RegisterForm: React.FC = () => {
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Client-side Zod validation
    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Partial<Record<keyof RegisterFormData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormData;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await register({
        email: validation.data.email,
        password: validation.data.password
      });

      toast.success("Account created successfully. Welcome to VYBE!", "Account Created");

      const rawRedirect = searchParams.get("redirect");
      const destination =
        rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
          ? decodeURIComponent(rawRedirect)
          : "/app";

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409 || err.message?.toLowerCase().includes("already registered") || err.message?.toLowerCase().includes("already exists")) {
          setFormError("An account with this email already exists.");
        } else if (err.status === 429) {
          setFormError("Too many attempts. Please wait a moment before trying again.");
        } else {
          setFormError(err.message || "Unable to create account. Please try again.");
        }
      } else {
        setFormError("We couldn't connect to the server. Please check your connection.");
      }
    }
  };

  return (
    <GlassCard variant="strong" padding="lg" className="w-full">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{formError}</p>
          </div>
        )}

        <GlassInput
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          leftIcon={<Mail className="w-4 h-4" />}
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={fieldErrors.email}
          disabled={isRegistering}
        />

        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          description="Minimum 8 characters with at least one number or symbol."
          required
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={fieldErrors.password}
          disabled={isRegistering}
        />

        <PasswordField
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          error={fieldErrors.confirmPassword}
          disabled={isRegistering}
        />

        <GlassButton
          fullWidth
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isRegistering}
          className="mt-2"
        >
          {isRegistering ? "Creating Account..." : "Create Account"}
        </GlassButton>

        <p className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{" "}
          <Link
            to={`/auth/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
            className="text-pink-400 font-semibold hover:text-pink-300 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </GlassCard>
  );
};
