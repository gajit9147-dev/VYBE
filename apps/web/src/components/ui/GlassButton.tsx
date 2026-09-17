import React from "react";
import { LoadingSpinner } from "../feedback/LoadingSpinner";

export type GlassButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type GlassButtonSize = "sm" | "md" | "lg";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-[0_6px_24px_rgba(244,63,94,0.40),inset_0_1.5px_2px_rgba(255,255,255,0.50)] hover:shadow-[0_8px_32px_rgba(244,63,94,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.65)] border border-pink-400/40 border-t-white/40 hover:opacity-95 active:scale-[0.98]",
  secondary:
    "vybe-glass-capsule text-white hover:border-white/35 active:scale-[0.98]",
  ghost:
    "bg-transparent text-slate-200 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 active:scale-[0.98]",
  danger:
    "bg-red-500/20 border border-red-500/35 border-t-red-400/50 text-red-200 hover:bg-red-500/30 hover:border-red-500/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-[0.98]",
  success:
    "bg-emerald-500/20 border border-emerald-500/35 border-t-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 hover:border-emerald-500/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] active:scale-[0.98]"
};

const sizeStyles: Record<GlassButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs font-medium rounded-full gap-1.5 tracking-[-0.01em]",
  md: "px-5 py-2.5 text-sm font-medium rounded-full gap-2 tracking-[-0.01em]",
  lg: "px-7 py-3.5 text-base font-semibold rounded-full gap-2.5 tracking-[-0.015em]"
};

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${
          isDisabled ? "opacity-50 pointer-events-none" : ""
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size={size === "lg" ? "md" : "sm"} className="text-current mr-2" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";
