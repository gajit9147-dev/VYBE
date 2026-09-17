import React from "react";
import { ProtectedRoute, ProtectedRouteProps } from "./ProtectedRoute";

/**
 * Route guard strictly requiring both an active authenticated session
 * and a confirmed/verified email address.
 */
export const VerifiedRoute: React.FC<Omit<ProtectedRouteProps, "requireVerified">> = ({
  children
}) => {
  return <ProtectedRoute requireVerified={true}>{children}</ProtectedRoute>;
};
