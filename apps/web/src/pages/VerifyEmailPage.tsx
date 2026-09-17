import React from "react";
import { useSearchParams, useLocation, Navigate } from "react-router-dom";
import { VerifyEmailCard } from "@/features/auth/components/VerifyEmailCard";
import { VerifyEmailConfirm } from "@/features/auth/components/VerifyEmailConfirm";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoading } from "@/components/feedback/PageLoading";

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  const token = searchParams.get("token");
  const isPreview = searchParams.get("preview") === "true";
  const initialEmail =
    (location.state as { email?: string } | null)?.email ||
    user?.email ||
    (isPreview ? (searchParams.get("email") || "alex.rivera@vybe.io") : undefined);

  // If a token is provided in URL query parameters, allow direct token consumption immediately
  if (token) {
    return <VerifyEmailConfirm token={token} />;
  }

  if (isLoading && !isPreview) {
    return <PageLoading message="Checking verification status..." />;
  }

  // If user is unauthenticated and there is no token (and not in preview mode), redirect to login
  if (!isAuthenticated && !isPreview) {
    return <Navigate to="/auth/login" replace />;
  }

  // If user is authenticated and already verified (and not in preview mode), redirect to /app
  if (user?.isVerified && !isPreview) {
    return <Navigate to="/app" replace />;
  }

  return <VerifyEmailCard initialEmail={initialEmail} />;
};
