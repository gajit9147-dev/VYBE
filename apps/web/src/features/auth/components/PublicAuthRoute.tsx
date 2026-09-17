import React from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PageLoading } from "@/components/feedback/PageLoading";

export const PublicAuthRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return <PageLoading message="Checking authentication status..." />;
  }

  if (isAuthenticated) {
    if (user && !user.isVerified) {
      return <Navigate to="/auth/verify-email" replace />;
    }

    const rawRedirect = searchParams.get("redirect");
    // Ensure redirect is an internal app path to prevent open redirect vulnerabilities
    const redirectUrl =
      rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
        ? decodeURIComponent(rawRedirect)
        : "/app";

    return <Navigate to={redirectUrl} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
