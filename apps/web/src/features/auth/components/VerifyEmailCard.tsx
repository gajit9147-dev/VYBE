import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle, RefreshCw, AlertCircle, LogOut, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { AuthHeader } from "./AuthHeader";
import { maskEmail } from "../utils/maskEmail";
import {
  useAuth,
  useSendVerificationEmail,
  useEmailVerificationStatus,
  AUTH_QUERY_KEY
} from "../hooks/useAuth";
import { ApiClientError } from "@/services/api/errors";
import { SafeUser } from "../types/authTypes";

interface VerifyEmailCardProps {
  initialEmail?: string;
}

export const VerifyEmailCard: React.FC<VerifyEmailCardProps> = ({ initialEmail }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, isLoggingOut, refetchUser } = useAuth();
  const sendVerificationMutation = useSendVerificationEmail();

  const userEmail = user?.email || initialEmail || "";
  const maskedUserEmail = maskEmail(userEmail);

  // Status check query
  const { data: statusData, refetch: refetchStatus, isFetching: isCheckingStatus } =
    useEmailVerificationStatus(userEmail || undefined);

  // Cooldown countdown state
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  // In development mode, check if the in-memory provider has the latest link
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    async function fetchDevLink() {
      try {
        const res = await fetch("http://localhost:4000/api/auth/email-verification/dev-latest-link", {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.verificationUrl) {
            setDevLink(data.verificationUrl);
          }
        }
      } catch {
        // Silently ignore
      }
    }
    fetchDevLink();
  }, [successMessage, userEmail]);

  // Cooldown interval timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResend = async () => {
    if (cooldownSeconds > 0 || sendVerificationMutation.isPending) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await sendVerificationMutation.mutateAsync(userEmail || undefined);
      setSuccessMessage(res.message || "Verification link sent! Please check your inbox.");
      setCooldownSeconds(60); // 60-second cooldown per backend rule
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 429) {
          const match = err.message.match(/(\d+)\s*seconds/i);
          const secs = match ? parseInt(match[1], 10) : 60;
          setCooldownSeconds(secs);
          setErrorMessage(`Too many requests. Please wait ${secs} seconds.`);
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to send verification email. Please try again.");
      }
    }
  };

  const handleContinueToApp = async () => {
    queryClient.setQueryData(AUTH_QUERY_KEY, (old: SafeUser | null | undefined) => {
      if (!old) return old;
      return { ...old, isVerified: true };
    });
    await refetchUser();
    navigate("/app", { replace: true });
  };

  const handleCheckStatus = async () => {
    setErrorMessage(null);
    try {
      const [newStatus, newUser] = await Promise.all([refetchStatus(), refetchUser()]);
      if (newStatus.data?.isVerified || newUser.data?.isVerified) {
        queryClient.setQueryData(AUTH_QUERY_KEY, (old: SafeUser | null | undefined) => {
          if (!old) return old;
          return { ...old, isVerified: true };
        });
        await refetchUser();
        navigate("/app", { replace: true });
      } else {
        setErrorMessage("Your email has not been verified yet. Please click the link in your email.");
      }
    } catch {
      setErrorMessage("Could not verify status. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/auth/login", { replace: true });
    } catch {
      navigate("/auth/login", { replace: true });
    }
  };

  const isAlreadyVerified = Boolean(user?.isVerified || statusData?.isVerified);

  if (isAlreadyVerified) {
    return (
      <div className="w-full">
        <AuthHeader
          title="Email verified"
          subtitle="Your account is activated and ready."
        />
        <GlassCard variant="strong" padding="lg" className="w-full flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Verified Successfully</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {maskedUserEmail ? `${maskedUserEmail} is verified.` : "Your email address has been verified."}
            </p>
          </div>
          <div className="w-full pt-2">
            <GlassButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleContinueToApp}
              className="min-h-12 font-medium"
            >
              <span>Continue to VYBE</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AuthHeader
        title="Verify your email"
        subtitle="Follow the link sent to your inbox to activate your VYBE account."
      />

      <GlassCard variant="strong" padding="lg" className="w-full flex flex-col items-center text-center space-y-6">
        {/* Decorative Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-500/10">
            <Mail className="w-8 h-8" />
          </div>
        </div>

        {/* Masked Email Badge */}
        {userEmail && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{maskedUserEmail}</span>
          </div>
        )}

        {/* Feedback Notifications */}
        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="w-full p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-left text-xs text-emerald-200"
          >
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="w-full p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-left text-xs text-rose-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Development Mode Helper Banner */}
        {import.meta.env.DEV && devLink && (
          <div className="w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-start gap-2 text-left text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Dev Mode: Simulated Email Captured</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              No live SMTP service is configured in <code>apps/api/.env</code>. Your verification link was captured by the in-memory provider:
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  const parsed = new URL(devLink);
                  navigate(`${parsed.pathname}${parsed.search}`);
                } catch {
                  window.location.href = devLink;
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Click to complete email verification</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-1">
          <GlassButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCheckStatus}
            isLoading={isCheckingStatus}
            className="min-h-12 text-sm font-medium"
          >
            I&apos;ve verified my email
          </GlassButton>

          <GlassButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleResend}
            disabled={cooldownSeconds > 0 || sendVerificationMutation.isPending}
            isLoading={sendVerificationMutation.isPending}
            className="min-h-11 text-xs font-medium text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${sendVerificationMutation.isPending ? "animate-spin" : ""}`} />
            {cooldownSeconds > 0
              ? `Resend available in ${cooldownSeconds}s`
              : "Resend verification email"}
          </GlassButton>
        </div>

        {/* Helpful context */}
        <p className="text-xs text-slate-400 leading-normal">
          Didn&apos;t receive the email? Check your spam or junk folder, or request a new link above.
        </p>

        {/* Secondary sign out / switch account */}
        <div className="pt-2 border-t border-white/5 w-full flex justify-center">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out and use another account</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
