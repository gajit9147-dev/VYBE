import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";

export const WelcomeVisual: React.FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto select-none" aria-label="Product preview card showing sample connection illustration">
      {/* Ambient Glow Aura behind the card for cinematic liquid depth */}
      <div
        className="absolute -inset-4 bg-gradient-to-tr from-pink-500/20 via-purple-500/15 to-blue-500/20 rounded-3xl blur-2xl opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Accent Capsule: Top Right */}
      <div className="absolute -top-3.5 right-4 z-20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full vybe-glass-capsule text-[11px] font-semibold tracking-wider text-pink-300 border border-pink-500/30 uppercase shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" aria-hidden="true" />
          <span>Sample Connection</span>
        </div>
      </div>

      {/* Main Preview Glass Card */}
      <GlassCard
        variant="strong"
        padding="none"
        className="relative z-10 rounded-2xl border border-white/20 bg-slate-950/60 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Top Header Strip with Avatar, Name & Location */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            {/* Stylized Abstract Liquid Silhouette Avatar (No real photos) */}
            <div className="relative shrink-0">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-500/30 via-pink-600/25 to-purple-800/40 border border-pink-400/40 p-0.5 flex items-center justify-center shadow-inner"
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-[14px] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-pink-300/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              {/* Online indicator */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950"
                title="Active"
              />
            </div>

            {/* Profile Overview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  Ananya, 25
                </h2>
                <span className="inline-flex items-center text-pink-400" title="Verified Profile">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Bengaluru • Product Designer</span>
              </p>
            </div>
          </div>
        </div>

        {/* Question-First Discovery Highlight */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="rounded-xl p-4 bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-pink-300">
                Conversation Starter
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 mb-2">
              &ldquo;My ideal Sunday looks like...&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed italic">
              &ldquo;Early morning filter coffee, playing old vinyl records, and getting lost discussing books that changed how we see the world.&rdquo;
            </p>
          </div>

          {/* Interests & Shared Values */}
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-2">
              Shared Passions & Interests
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <GlassBadge variant="peach" size="sm">
                Filter Coffee
              </GlassBadge>
              <GlassBadge variant="purple" size="sm">
                Indie Cinema
              </GlassBadge>
              <GlassBadge variant="pink" size="sm">
                Vinyl Records
              </GlassBadge>
              <GlassBadge variant="blue" size="sm">
                Weekend Treks
              </GlassBadge>
            </div>
          </div>
        </div>

        {/* Bottom Card Footer: Question-first differentiation footnote */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4 text-pink-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium text-slate-300">Connect through shared answers</span>
          </div>

          <span className="text-[11px] text-pink-400 font-medium">
            Question-First
          </span>
        </div>
      </GlassCard>

      {/* Floating Micro-Pill: Bottom Left */}
      <div className="absolute -bottom-3 left-4 z-20 hidden sm:block">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full vybe-glass-subtle text-[11px] font-medium text-slate-300 border border-white/15 shadow-lg">
          <svg className="w-3.5 h-3.5 text-pink-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span>Meaningful discovery before swiping</span>
        </div>
      </div>
    </div>
  );
};
