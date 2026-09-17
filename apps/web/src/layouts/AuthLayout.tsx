import React from "react";
import { Outlet } from "react-router-dom";
import { LiquidBackground } from "@/components/layout/LiquidBackground";
import { VYBELogo } from "@/components/ui/VYBELogo";

export const AuthLayout: React.FC = () => {
  return (
    <LiquidBackground>
      <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 antialiased selection:bg-rose-500 selection:text-white">
        {/* Top Header with Brand */}
        <header className="w-full max-w-md mx-auto pt-6 sm:pt-10 flex flex-col items-center text-center">
          <VYBELogo size="lg" showTagline />
        </header>

        {/* Centered Auth Card Outlet */}
        <main className="w-full max-w-md my-auto py-8">
          <Outlet />
        </main>

        {/* Minimal Footer */}
        <footer className="w-full max-w-md mx-auto pb-6 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} VYBE. Protected by end-to-end session security.</p>
        </footer>
      </div>
    </LiquidBackground>
  );
};
