import React from "react";
import { Link, Outlet } from "react-router-dom";

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-pink-500 selection:text-white">
      {/* Header Shell */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
            aria-label="VYBE Home"
          >
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-400 bg-clip-text text-transparent">
              VYBE
            </span>
          </Link>

          {/* Minimal placeholder navigation for Step 01 */}
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              to="/app"
              className="text-slate-300 hover:text-white transition-colors"
            >
              App
            </Link>
            <Link
              to="/auth/login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/auth/register"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer Shell */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>Real People. Meaningful Connections.</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} VYBE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
