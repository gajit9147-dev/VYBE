import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, LoginFormData } from "../schemas/authSchemas";
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
    setFormError(null);
    setFieldErrors({});

    // Client-side Zod validation
    const validation = loginSchema.safeParse(formData);
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
      await login(validation.data);

      toast.success("Welcome back to VYBE.", "Signed In");

      // Redirect to intended page or default /app
      const rawRedirect = searchParams.get("redirect");
      const destination =
        rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
          ? decodeURIComponent(rawRedirect)
          : "/app";

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setFormError("Email or password is incorrect.");
        } else if (err.status === 429) {
          setFormError("Too many attempts. Please wait a moment before trying again.");
        } else {
          setFormError(err.message || "Unable to sign in. Please try again.");
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
            <span
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer select-none"
              onClick={() => toast.info("Password reset will be enabled in an upcoming step.", "Password Recovery")}
            >
              Forgot password?
            </span>
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
          {isLoggingIn ? "Signing In..." : "Sign In"}
        </GlassButton>

        <p className="text-center text-xs text-slate-400 pt-2">
          Don&apos;t have an account?{" "}
          <Link
            to={`/auth/register${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
            className="text-pink-400 font-semibold hover:text-pink-300 hover:underline transition-colors"
          >
            Create account
          </Link>
        </p>
      </form>
    </GlassCard>
  );
};
