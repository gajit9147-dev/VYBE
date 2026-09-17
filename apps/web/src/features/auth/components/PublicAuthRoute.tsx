import React from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthLoadingScreen } from "./AuthLoadingScreen";
import { getSafeRedirectUrl } from "../utils/safeRedirect";

export interface GuestOnlyRouteProps {
  children?: React.ReactNode;
}

/**
 * Route guard for guest-only public auth pages (/auth/login, /auth/register).
 * Prevents authenticated users from viewing login/register forms.
 */
export const GuestOnlyRoute: React.FC<GuestOnlyRouteProps> = ({ children }) => {
  const { authStatus } = useAuth();
  const [searchParams] = useSearchParams();

  if (authStatus === "AUTH_LOADING") {
    return <AuthLoadingScreen message="Checking session..." />;
  }

  if (authStatus === "AUTHENTICATED_UNVERIFIED") {
    return <Navigate to="/auth/verify-email" replace />;
  }

  if (authStatus === "AUTHENTICATED_VERIFIED") {
    const safeTarget = getSafeRedirectUrl(searchParams.get("redirect"), "/app");
    return <Navigate to={safeTarget} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

// Backwards compatibility alias
export const PublicAuthRoute = GuestOnlyRoute;
