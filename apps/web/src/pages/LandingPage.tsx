import React from "react";
import { Link } from "react-router-dom";

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-pink-500/20 bg-pink-500/10 text-xs text-pink-400 font-medium">
        <span>Frontend Architecture Initialized</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-2xl bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
        Real People. Meaningful Connections.
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl">
        VYBE is a question-first platform built on authenticity and real connections.
      </p>

      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <Link
          to="/auth/register"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium shadow-lg hover:opacity-95 transition-opacity"
        >
          Get Started
        </Link>
        <Link
          to="/auth/login"
          className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-200 font-medium hover:bg-slate-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};
