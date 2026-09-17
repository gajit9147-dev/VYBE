import React from "react";

export type GlowOrbColor = "pink" | "peach" | "purple" | "blue";
export type GlowOrbSize = "sm" | "md" | "lg" | "xl";

interface GlowOrbProps {
  color?: GlowOrbColor;
  size?: GlowOrbSize;
  className?: string;
  style?: React.CSSProperties;
}

const colorStyles: Record<GlowOrbColor, string> = {
  pink: "bg-rose-500/15 shadow-[0_0_120px_40px_rgba(244,63,94,0.18)]",
  peach: "bg-orange-500/15 shadow-[0_0_120px_40px_rgba(251,146,60,0.18)]",
  purple: "bg-purple-600/15 shadow-[0_0_120px_40px_rgba(168,85,247,0.18)]",
  blue: "bg-sky-500/15 shadow-[0_0_120px_40px_rgba(56,189,248,0.18)]"
};

const sizeStyles: Record<GlowOrbSize, string> = {
  sm: "w-48 h-48 blur-2xl",
  md: "w-72 h-72 blur-3xl",
  lg: "w-96 h-96 blur-3xl",
  xl: "w-[32rem] h-[32rem] blur-[100px]"
};

export const GlowOrb: React.FC<GlowOrbProps> = ({
  color = "pink",
  size = "md",
  className = "",
  style
}) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute rounded-full pointer-events-none transform-gpu ${colorStyles[color]} ${sizeStyles[size]} ${className}`}
      style={style}
    />
  );
};
