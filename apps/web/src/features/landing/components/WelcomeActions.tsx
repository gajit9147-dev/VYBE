import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { GlassButton } from "@/components/ui/GlassButton";

export const WelcomeActions: React.FC = () => {
  const { user, authStatus } = useAuth();

  // Loading State placeholder to avoid layout shifts
  if (authStatus === "AUTH_LOADING") {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md pt-2 animate-pulse">
        <div className="h-12 w-full sm:w-44 rounded-full bg-white/10 border border-white/10" />
        <div className="h-12 w-full sm:w-36 rounded-full bg-white/5 border border-white/10" />
      </div>
    );
  }

  // Authenticated and Email Verified
  if (authStatus === "AUTHENTICATED_VERIFIED" && user) {
    const displayName = user.email ? user.email.split("@")[0] : "Member";

    return (
      <div className="flex flex-col items-start gap-3 w-full max-w-md pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full vybe-glass-subtle text-xs text-pink-300 font-medium border border-pink-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span>Signed in as <strong className="text-white font-semibold">{displayName}</strong></span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <Link to="/app" className="w-full sm:w-auto">
            <GlassButton
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              }
            >
              Enter VYBE
            </GlassButton>
          </Link>

          <Link to="/app" className="w-full sm:w-auto">
            <GlassButton variant="secondary" size="lg" fullWidth>
              Go to Dashboard
            </GlassButton>
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated but Email Unverified
  if (authStatus === "AUTHENTICATED_UNVERIFIED" && user) {
    return (
      <div className="flex flex-col items-start gap-3 w-full max-w-md pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-xs text-amber-300 font-medium border border-amber-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          <span>Verification required for {user.email || "your account"}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <Link to="/auth/verify-email" className="w-full sm:w-auto">
            <GlassButton
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              Complete Verification
            </GlassButton>
          </Link>

          <Link to="/auth/login" className="w-full sm:w-auto">
            <GlassButton variant="ghost" size="lg" fullWidth>
              Switch Account
            </GlassButton>
          </Link>
        </div>
      </div>
    );
  }

  // Unauthenticated (or recoverable error state)
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full max-w-md pt-2">
      <Link to="/auth/register" className="w-full sm:w-auto">
        <GlassButton
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          }
        >
          Create Account
        </GlassButton>
      </Link>

      <Link to="/auth/login" className="w-full sm:w-auto">
        <GlassButton
          variant="secondary"
          size="lg"
          fullWidth
        >
          Sign In
        </GlassButton>
      </Link>
    </div>
  );
};
