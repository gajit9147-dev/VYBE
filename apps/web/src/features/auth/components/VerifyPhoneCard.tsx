import React, { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock3,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassButton, GlassCard } from "@/components/ui";
import { PageLoading } from "@/components/feedback/PageLoading";
import { ApiClientError } from "@/services/api/errors";
import { maskPhone } from "../utils/maskPhone";
import {
  usePhoneStatus,
  useSendPhoneOtp,
  useVerifyPhoneOtp,
} from "../hooks/useAuth";
import {
  phoneOtpVerificationSchema,
  phoneVerificationSchema,
} from "../schemas/phoneSchemas";
import { AuthHeader } from "./AuthHeader";
import { OtpInput } from "./OtpInput";
import { PhoneInput } from "./PhoneInput";

const RESEND_COOLDOWN_SECONDS = 60;

type VerificationStep = "phone" | "otp";

function getPhoneErrorMessage(
  error: unknown,
  action: "send" | "verify",
): string {
  if (!(error instanceof ApiClientError)) {
    return action === "verify"
      ? "We could not verify that code. Please try again."
      : "We could not send a code. Please try again.";
  }

  if (error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.status === 409) {
    return "That phone number is already linked to another VYBE account.";
  }

  if (error.status === 429) {
    return "Too many requests. Please wait before trying again.";
  }

  if (error.status === 400 && action === "verify") {
    const message = error.message.toLowerCase();
    if (message.includes("attempt")) {
      return "Too many incorrect attempts. Request a new code and try again.";
    }
    if (message.includes("expired")) {
      return "This code has expired. Request a new code to continue.";
    }
    if (message.includes("invalid") || message.includes("code")) {
      return "That code is incorrect. Please check it and try again.";
    }
  }

  if (error.kind === "NETWORK_ERROR") {
    return "Unable to connect to VYBE. Check your connection and try again.";
  }

  return error.status === 400
    ? "Please check the phone number and try again."
    : "Something went wrong. Please try again.";
}

function getValidationMessage(result: {
  success: boolean;
  error?: { issues: Array<{ message: string }> };
}): string {
  return result.success
    ? ""
    : result.error?.issues[0]?.message || "Please check your details.";
}

export const VerifyPhoneCard: React.FC = () => {
  const navigate = useNavigate();
  const phoneStatusQuery = usePhoneStatus();
  const sendPhoneOtpMutation = useSendPhoneOtp();
  const verifyPhoneOtpMutation = useVerifyPhoneOtp();
  const [step, setStep] = useState<VerificationStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | undefined>();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!showSuccess) return;

    const timer = window.setTimeout(
      () => navigate("/app", { replace: true }),
      900,
    );
    return () => window.clearTimeout(timer);
  }, [navigate, showSuccess]);

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setPhoneError(undefined);

    const validation = phoneVerificationSchema.safeParse({ phoneNumber });
    if (!validation.success) {
      setPhoneError(getValidationMessage(validation));
      return;
    }

    try {
      const response = await sendPhoneOtpMutation.mutateAsync(validation.data);
      setMaskedPhone(response.phoneNumber || maskPhone(phoneNumber));
      setOtp("");
      setOtpError(undefined);
      setStep("otp");
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error: unknown) {
      setErrorMessage(getPhoneErrorMessage(error, "send"));
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || sendPhoneOtpMutation.isPending) return;

    setErrorMessage(null);
    try {
      const response = await sendPhoneOtpMutation.mutateAsync({ phoneNumber });
      setMaskedPhone(
        response.phoneNumber || maskedPhone || maskPhone(phoneNumber),
      );
      setOtp("");
      setOtpError(undefined);
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error: unknown) {
      setErrorMessage(getPhoneErrorMessage(error, "send"));
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setOtpError(undefined);

    const validation = phoneOtpVerificationSchema.safeParse({
      phoneNumber,
      otp,
    });
    if (!validation.success) {
      setOtpError(getValidationMessage(validation));
      return;
    }

    try {
      await verifyPhoneOtpMutation.mutateAsync(validation.data);
      setShowSuccess(true);
    } catch (error: unknown) {
      setErrorMessage(getPhoneErrorMessage(error, "verify"));
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setOtp("");
    setOtpError(undefined);
    setMaskedPhone(null);
    setErrorMessage(null);
    setCooldownSeconds(0);
  };

  if (phoneStatusQuery.isLoading) {
    return <PageLoading message="Checking phone verification status..." />;
  }

  if (phoneStatusQuery.data?.isPhoneVerified || showSuccess) {
    return (
      <div className="w-full">
        <AuthHeader
          title="Phone verified"
          subtitle="Your account is ready for meaningful connections."
        />
        <GlassCard
          variant="strong"
          padding="lg"
          className="w-full space-y-6 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/10">
            <CheckCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Phone verified
            </h2>
            <p className="text-sm text-slate-300">
              {phoneStatusQuery.data?.phoneNumber ||
                maskedPhone ||
                "Your phone number is verified."}
            </p>
          </div>
          <GlassButton
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate("/app", { replace: true })}
          >
            Continue to VYBE
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AuthHeader
        title={step === "phone" ? "Verify your phone" : "Enter your code"}
        subtitle={
          step === "phone"
            ? "Add a verified number so your VYBE connections stay genuine."
            : "Enter the six-digit code we sent to your phone."
        }
      />

      <GlassCard variant="strong" padding="lg" className="w-full space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20 text-pink-300 shadow-lg shadow-pink-500/10">
          {step === "phone" ? (
            <Phone className="h-7 w-7" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          )}
        </div>

        {errorMessage && (
          <div
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-left text-xs text-rose-200"
            role="alert"
            aria-live="assertive"
          >
            <span className="leading-5">{errorMessage}</span>
          </div>
        )}

        {step === "phone" ? (
          <form className="space-y-5" onSubmit={handleSendCode} noValidate>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              error={phoneError}
              disabled={sendPhoneOtpMutation.isPending}
              required
              autoFocus
            />
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={sendPhoneOtpMutation.isPending}
            >
              Send verification code
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </GlassButton>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleVerify} noValidate>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  Code sent to
                </p>
                <p className="truncate text-sm font-medium text-white">
                  {maskedPhone || maskPhone(phoneNumber)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleChangeNumber}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-pink-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                disabled={verifyPhoneOtpMutation.isPending}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Change number
              </button>
            </div>

            <OtpInput
              value={otp}
              onChange={setOtp}
              error={otpError}
              disabled={verifyPhoneOtpMutation.isPending}
              autoFocus
            />

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={verifyPhoneOtpMutation.isPending}
            >
              Verify phone
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </GlassButton>

            <div className="flex flex-col items-center gap-2 text-center text-xs text-slate-400 sm:flex-row sm:justify-between sm:text-left">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {cooldownSeconds > 0
                  ? `Resend available in ${cooldownSeconds}s`
                  : "Didn't receive a code?"}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || sendPhoneOtpMutation.isPending}
                className="inline-flex items-center gap-1.5 font-medium text-pink-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${sendPhoneOtpMutation.isPending ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Resend code
              </button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
};
