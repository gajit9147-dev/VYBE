import React from "react";
import { GlassButtonVariant } from "./GlassButton";

export type GlassIconButtonSize = "sm" | "md" | "lg";
export type GlassIconButtonShape = "circle" | "rounded";

export interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string; // strictly required for accessibility
  icon: React.ReactNode;
  variant?: GlassButtonVariant;
  size?: GlassIconButtonSize;
  shape?: GlassIconButtonShape;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-[0_0_16px_rgba(244,63,94,0.35)] border border-pink-400/30 hover:opacity-90 active:scale-95",
  secondary:
    "vybe-glass text-slate-100 hover:bg-white/10 hover:border-white/20 active:scale-95",
  ghost:
    "bg-transparent text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 active:scale-95",
  danger:
    "bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 active:scale-95",
  success:
    "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 active:scale-95"
};

const sizeStyles: Record<GlassIconButtonSize, string> = {
  sm: "w-8 h-8 p-1.5",
  md: "w-10 h-10 p-2.5",
  lg: "w-12 h-12 p-3"
};

export const GlassIconButton = React.forwardRef<HTMLButtonElement, GlassIconButtonProps>(
  (
    {
      "aria-label": ariaLabel,
      icon,
      variant = "secondary",
      size = "md",
      shape = "circle",
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${shape === "circle" ? "rounded-full" : "rounded-xl"} ${
          disabled ? "opacity-50 pointer-events-none" : ""
        } ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

GlassIconButton.displayName = "GlassIconButton";
