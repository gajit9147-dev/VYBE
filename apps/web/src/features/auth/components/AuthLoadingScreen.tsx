import React from "react";
import { VYBELogo } from "@/components/ui/VYBELogo";

export interface AuthLoadingScreenProps {
  message?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = "Verifying credentials..."
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl selection:bg-rose-500 selection:text-white"
    >
      {/* Cinematic ambient glow */}
      <div
        aria-hidden="true"
        className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 blur-3xl pointer-events-none motion-reduce:animate-none animate-pulse"
      />

      {/* Frosted Glass Content Capsule */}
      <div className="relative z-10 flex flex-col items-center max-w-xs w-full p-8 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl text-center space-y-5">
        <VYBELogo size="md" variant="full" />

        {/* Minimal Subtle Pulse Line / Indicator */}
        <div className="w-full space-y-2">
          <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear] motion-reduce:animate-none" />
          </div>
          <p className="text-xs text-slate-300 font-medium tracking-wide">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
