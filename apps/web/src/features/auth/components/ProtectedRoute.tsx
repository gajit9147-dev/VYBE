import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PageLoading } from "@/components/feedback/PageLoading";

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    // Preserve intended destination path in search params
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?redirect=${redirectPath}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
