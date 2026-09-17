import React from "react";
import { Link, Outlet } from "react-router-dom";
import { LiquidBackground } from "@/components/layout/LiquidBackground";
import { VYBELogo } from "@/components/ui/VYBELogo";
import { GlassButton } from "@/components/ui/GlassButton";

export const PublicLayout: React.FC = () => {
  return (
    <LiquidBackground>
      <div className="min-h-screen flex flex-col antialiased selection:bg-rose-500 selection:text-white">
        {/* Public Header */}
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#030712]/75 backdrop-blur-xl transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <VYBELogo size="md" showTagline={false} />

            <nav className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
              <Link
                to="/design-system"
                className="px-2.5 py-1 rounded-lg text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 border border-pink-500/20 transition-colors"
              >
                Design System
              </Link>
              <Link
                to="/auth/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link to="/auth/register">
                <GlassButton variant="primary" size="sm">
                  Get Started
                </GlassButton>
              </Link>
            </nav>
          </div>
        </header>

        {/* Public Content Outlet */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
