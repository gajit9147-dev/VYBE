import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, LoginFormData } from "../schemas/authSchemas";
import { getSafeRedirectUrl } from "../utils/safeRedirect";
import { PasswordField } from "./PasswordField";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useToast } from "@/components/feedback";
import { ApiClientError } from "@/services/api/errors";

export const LoginForm: React.FC = () => {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against duplicate submissions
    if (isLoggingIn) return;

    setFormError(null);
    setFieldErrors({});

    // Normalize email consistently with registration flow
    const normalizedEmail = formData.email.trim().toLowerCase();

    // Client-side Zod validation
    const validation = loginSchema.safeParse({
      email: normalizedEmail,
      password: formData.password
    });

    if (!validation.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      const res = await login(validation.data);

      toast.success("Welcome back to VYBE.", "Signed In");

      // If user has not verified their email, direct them to verification flow
      if (!res.user.isVerified) {
        navigate("/auth/verify-email", {
          replace: true,
          state: { email: normalizedEmail }
        });
        return;
      }

      // Safe intended destination restoration (prevents open redirects)
      const destination = getSafeRedirectUrl(searchParams.get("redirect"), "/app");
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          // Safe generic message — never reveals whether email exists or password was wrong
          setFormError("Email or password is incorrect.");
        } else if (err.status === 423) {
          setFormError("Account is temporarily locked due to excessive failed attempts. Please try again later.");
        } else if (err.status === 429) {
          setFormError("Too many sign-in attempts. Please wait and try again.");
        } else if (err.status && err.status >= 500) {
          setFormError("Something went wrong on our side. Please try again.");
        } else {
          setFormError(err.message || "Unable to sign in. Please try again.");
        }
      } else {
        // Network failure / offline
        setFormError("We couldn't connect right now. Please try again.");
      }
    }
  };

  const registerRedirect = searchParams.get("redirect");
  const registerLink = registerRedirect
    ? `/auth/register?redirect=${encodeURIComponent(registerRedirect)}`
    : "/auth/register";

  return (
    <GlassCard variant="strong" padding="lg" className="w-full">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
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
          disabled={isLoggingIn}
        />

        <div>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={fieldErrors.password}
            disabled={isLoggingIn}
          />

          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors select-none focus-visible:ring-1 focus-visible:ring-pink-500 rounded outline-none"
              onClick={() => toast.info("Password recovery will be available soon.", "Password Recovery")}
            >
              Forgot password?
            </button>
          </div>
        </div>

        <GlassButton
          fullWidth
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoggingIn}
          className="mt-2"
        >
          {isLoggingIn ? "Signing in..." : "Sign In"}
        </GlassButton>

        <p className="text-center text-xs text-slate-400 pt-2">
          Don&apos;t have an account?{" "}
          <Link
            to={registerLink}
            className="text-pink-400 font-semibold hover:text-pink-300 hover:underline transition-colors focus-visible:ring-1 focus-visible:ring-pink-500 rounded outline-none"
          >
            Create account
          </Link>
        </p>
      </form>
    </GlassCard>
  );
};
