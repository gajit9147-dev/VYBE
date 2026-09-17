import React from "react";
import { Link } from "react-router-dom";

export const LoginPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-white">Sign In</h1>
        <p className="mt-2 text-sm text-slate-400">
          Welcome back to VYBE. Please enter your credentials.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
              disabled
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
              disabled
            />
          </div>

          <button
            type="button"
            className="w-full mt-2 rounded-xl bg-pink-600/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
          >
            Sign In (Step 01 Placeholder)
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link to="/auth/register" className="text-pink-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
