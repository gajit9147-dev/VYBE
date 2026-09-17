import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassSpinner } from "@/components/ui/GlassSpinner";
import { AuthHeader } from "./AuthHeader";
import { useVerifyEmailToken, useAuth, AUTH_QUERY_KEY } from "../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/services/api/errors";
import { VerifyEmailResponse, SafeUser } from "../types/authTypes";

interface VerifyEmailConfirmProps {
  token: string;
}

type ConfirmState = "verifying" | "success" | "expired" | "invalid" | "rate_limited" | "error";

export const VerifyEmailConfirm: React.FC<VerifyEmailConfirmProps> = ({ token }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refetchUser } = useAuth();
  const verifyMutation = useVerifyEmailToken();
  const [status, setStatus] = useState<ConfirmState>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<VerifyEmailResponse | null>(null);

  // Prevent double-invocation in React StrictMode
  const verifiedRef = useRef(false);

  const handleContinue = async () => {
    queryClient.setQueryData(AUTH_QUERY_KEY, (old: SafeUser | null | undefined) => {
      if (!old) return old;
      return { ...old, isVerified: true };
    });
    await refetchUser();
    navigate("/app", { replace: true });
  };

  useEffect(() => {
    if (!token || verifiedRef.current) return;
    verifiedRef.current = true;

    async function executeVerification() {
      try {
        const result = await verifyMutation.mutateAsync(token);
        setVerifyResult(result);
        setStatus("success");
        queryClient.setQueryData(AUTH_QUERY_KEY, (old: SafeUser | null | undefined) => {
          if (!old) return old;
          return { ...old, isVerified: true };
        });
        await refetchUser();
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          if (err.status === 429) {
            setStatus("rate_limited");
            setErrorMessage("Too many verification attempts. Please wait a moment and try again.");
          } else if (err.message.toLowerCase().includes("expired")) {
            setStatus("expired");
            setErrorMessage("This verification link has expired.");
          } else if (
            err.message.toLowerCase().includes("invalid") ||
            err.message.toLowerCase().includes("already used")
          ) {
            setStatus("invalid");
            setErrorMessage("This verification link is invalid or has already been used.");
          } else {
            setStatus("error");
            setErrorMessage(err.message || "Unable to verify email link.");
          }
        } else {
          setStatus("error");
          setErrorMessage("Network error occurred. Please check your connection and try again.");
        }
      }
    }

    executeVerification();
  }, [token, verifyMutation, refetchUser]);

  return (
    <div className="w-full">
      <AuthHeader
        title={status === "success" ? "Email verified" : "Email verification"}
        subtitle={
          status === "verifying"
            ? "Verifying your security credentials..."
            : status === "success"
            ? "Your account is activated and ready."
            : "Review the verification outcome below."
        }
      />

      <GlassCard variant="strong" padding="lg" className="w-full flex flex-col items-center text-center space-y-6">
        {/* Loading state */}
        {status === "verifying" && (
          <div className="flex flex-col items-center space-y-4 py-4" role="status" aria-live="polite">
            <GlassSpinner size="lg" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">Validating token...</h2>
              <p className="text-xs text-slate-400">Please wait while we confirm your email</p>
            </div>
          </div>
        )}

        {/* Success state */}
        {status === "success" && (
          <div className="flex flex-col items-center space-y-4 w-full" role="status" aria-live="polite">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">Verified Successfully</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {verifyResult?.email ? (
                  <>
                    <span className="text-white font-medium">{verifyResult.email}</span> has been confirmed.
                  </>
                ) : (
                  "Your email address has been verified successfully."
                )}
              </p>
            </div>

            <div className="w-full pt-2">
              <GlassButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleContinue}
                className="min-h-12 font-medium"
              >
                <span>Continue to VYBE</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </GlassButton>
            </div>
          </div>
        )}

        {/* Expired state */}
        {status === "expired" && (
          <div className="flex flex-col items-center space-y-4 w-full" role="alert" aria-live="assertive">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">Link Expired</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                {errorMessage || "This verification link has expired for your security."}
              </p>
            </div>

            <div className="w-full pt-2 space-y-3">
              <GlassButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate("/auth/verify-email", { replace: true })}
                className="min-h-12 font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                <span>Request a new link</span>
              </GlassButton>
            </div>
          </div>
        )}

        {/* Invalid or error state */}
        {(status === "invalid" || status === "rate_limited" || status === "error") && (
          <div className="flex flex-col items-center space-y-4 w-full" role="alert" aria-live="assertive">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {status === "rate_limited" ? "Too Many Attempts" : "Verification Failed"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
                {errorMessage}
              </p>
            </div>

            <div className="w-full pt-2 space-y-3">
              <GlassButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate("/auth/verify-email", { replace: true })}
                className="min-h-12 font-medium"
              >
                <span>Return to Verification</span>
              </GlassButton>

              <GlassButton
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => navigate("/auth/login", { replace: true })}
                className="text-xs text-slate-400"
              >
                <span>Back to Sign In</span>
              </GlassButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
