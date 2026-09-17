import React from "react";
import { VYBELogo } from "@/components/ui/VYBELogo";
import { WelcomeActions } from "./WelcomeActions";

export const WelcomeHero: React.FC = () => {
  return (
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 sm:space-y-7 max-w-xl mx-auto lg:mx-0">
      {/* Brand Mark (Prominent on Mobile & Hero Anchor) */}
      <div className="flex flex-col items-center lg:items-start">
        <VYBELogo size="lg" showTagline={false} asLink={false} />
      </div>

      {/* Question-First Differentiation Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full vybe-glass-subtle border border-pink-500/20 text-xs font-medium text-pink-300 shadow-sm backdrop-blur-md">
        <svg className="w-3.5 h-3.5 text-pink-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>Start with what you think. Connect through what you share.</span>
      </div>

      {/* Primary Headline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] sm:leading-[1.1]">
        Real People.{" "}
        <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent block sm:inline">
          Meaningful Connections.
        </span>
      </h1>

      {/* Supporting Copy */}
      <p className="text-base sm:text-lg text-slate-300/90 font-normal leading-relaxed max-w-lg">
        Discover people through shared answers, interests, and the things that actually matter — not just photos.
      </p>

      {/* Action Buttons */}
      <div className="w-full pt-1">
        <WelcomeActions />
      </div>

      {/* Trust & Safety Signal */}
      <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-400">
        <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Built around consent, privacy, and meaningful conversations.</span>
      </div>
    </div>
  );
};
