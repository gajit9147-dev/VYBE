import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthLoadingScreen } from "./AuthLoadingScreen";
import { getSafeRedirectUrl } from "../utils/safeRedirect";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { WifiOff, RefreshCw } from "lucide-react";

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireVerified?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerified = true
}) => {
  const { authStatus, refetchUser, isLoading } = useAuth();
  const location = useLocation();

  if (authStatus === "AUTH_LOADING") {
    return <AuthLoadingScreen message="Verifying session..." />;
  }

  // Recoverable connection error — does not destroy session or kick user out
  if (authStatus === "AUTH_ERROR") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl">
        <GlassCard variant="strong" padding="lg" className="max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <WifiOff className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">Unable to Connect</h2>
            <p className="text-xs text-slate-300">
              Could not reach the VYBE server. Your session is safe. Please check your internet connection and try again.
            </p>
          </div>
          <GlassButton
            variant="primary"
            size="md"
            fullWidth
            onClick={() => refetchUser()}
            isLoading={isLoading}
            className="min-h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Try again</span>
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (authStatus === "UNAUTHENTICATED") {
    const targetPath = getSafeRedirectUrl(location.pathname + location.search, "/app");
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(targetPath)}`} replace />;
  }

  if (requireVerified && authStatus === "AUTHENTICATED_UNVERIFIED") {
    return <Navigate to="/auth/verify-email" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
