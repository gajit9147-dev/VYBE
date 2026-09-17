import React from "react";
import { Link, Outlet } from "react-router-dom";
import { LiquidBackground } from "@/components/layout/LiquidBackground";
import { VYBELogo } from "@/components/ui/VYBELogo";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAuth } from "@/features/auth";

export const PublicLayout: React.FC = () => {
  const { user, authStatus } = useAuth();

  return (
    <LiquidBackground>
      <div className="min-h-screen flex flex-col antialiased selection:bg-rose-500 selection:text-white">
        {/* Public Header */}
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#030712]/75 backdrop-blur-xl transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <VYBELogo size="md" showTagline={false} />

            <nav aria-label="Main Navigation" className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
              <Link
                to="/design-system"
                className="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 border border-pink-500/20 transition-colors"
              >
                Design System
              </Link>

              {authStatus === "AUTHENTICATED_VERIFIED" && user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-xs text-slate-300 font-medium">
                    {user.email ? user.email.split("@")[0] : "Account"}
                  </span>
                  <Link to="/app">
                    <GlassButton variant="primary" size="sm">
                      Enter App
                    </GlassButton>
                  </Link>
                </div>
              ) : authStatus === "AUTHENTICATED_UNVERIFIED" ? (
                <Link to="/auth/verify-email">
                  <GlassButton variant="primary" size="sm">
                    Verify Email
                  </GlassButton>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/auth/login"
                    className="text-slate-300 hover:text-white transition-colors px-2 py-1"
                  >
                    Sign In
                  </Link>
                  <Link to="/auth/register">
                    <GlassButton variant="primary" size="sm">
                      Create Account
                    </GlassButton>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </header>

        {/* Public Content Outlet */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <Outlet />
        </main>

        {/* Public Footer */}
        <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-medium text-slate-300">Real People. Meaningful Connections.</p>
            <p className="text-slate-600">&copy; {new Date().getFullYear()} VYBE. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </LiquidBackground>
  );
};
