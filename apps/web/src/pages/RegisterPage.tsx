import React from "react";
import { Link } from "react-router-dom";

export const RegisterPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create an Account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Join VYBE to discover authentic and meaningful connections.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300">
              Email address
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
              disabled
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
              disabled
            />
          </div>

          <button
            type="button"
            className="w-full mt-2 rounded-xl bg-purple-600/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-600 transition-colors"
          >
            Create Account (Step 01 Placeholder)
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-purple-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
