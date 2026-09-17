import React from "react";
import { GlowOrb } from "./GlowOrb";

interface LiquidBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({
  className = "",
  children
}) => {
  return (
    <div className={`relative min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden ${className}`}>
      {/* Background Atmosphere Layers */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      >
        {/* Top-left Purple glow */}
        <GlowOrb
          color="purple"
          size="xl"
          className="-top-32 -left-32 opacity-70"
        />

        {/* Top-right Pink/Rose glow */}
        <GlowOrb
          color="pink"
          size="xl"
          className="-top-20 -right-20 opacity-60"
        />

        {/* Mid-center subtle peach atmosphere */}
        <GlowOrb
          color="peach"
          size="lg"
          className="top-1/3 left-1/2 -translate-x-1/2 opacity-30"
        />

        {/* Bottom-right Blue glow */}
        <GlowOrb
          color="blue"
          size="xl"
          className="bottom-0 right-1/4 opacity-40"
        />

        {/* Soft Vignette Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#030712]/50 to-[#030712]/90" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
