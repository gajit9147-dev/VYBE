import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle, RefreshCw, AlertCircle, LogOut } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { AuthHeader } from "./AuthHeader";
import { maskEmail } from "../utils/maskEmail";
import {
  useAuth,
  useSendVerificationEmail,
  useEmailVerificationStatus
} from "../hooks/useAuth";
import { ApiClientError } from "@/services/api/errors";

interface VerifyEmailCardProps {
  initialEmail?: string;
}

export const VerifyEmailCard: React.FC<VerifyEmailCardProps> = ({ initialEmail }) => {
  const navigate = useNavigate();
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

  // If status query or user shows verified, automatically navigate to /app
  useEffect(() => {
    if (user?.isVerified || statusData?.isVerified) {
      navigate("/app", { replace: true });
    }
  }, [user?.isVerified, statusData?.isVerified, navigate]);

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

  const handleCheckStatus = async () => {
    setErrorMessage(null);
    try {
      const [newStatus, newUser] = await Promise.all([refetchStatus(), refetchUser()]);
      if (newStatus.data?.isVerified || newUser.data?.isVerified) {
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
