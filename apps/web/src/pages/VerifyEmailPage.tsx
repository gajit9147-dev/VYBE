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
  const initialEmail = (location.state as { email?: string } | null)?.email || user?.email || undefined;

  if (isLoading) {
    return <PageLoading message="Checking verification status..." />;
  }

  // If a token is provided in URL query parameters, allow direct token consumption
  if (token) {
    return <VerifyEmailConfirm token={token} />;
  }

  // If user is unauthenticated and there is no token, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // If user is authenticated and already verified, redirect to /app
  if (user?.isVerified) {
    return <Navigate to="/app" replace />;
  }

  return <VerifyEmailCard initialEmail={initialEmail} />;
};
