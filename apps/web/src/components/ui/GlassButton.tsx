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
    "bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:shadow-[0_0_26px_rgba(244,63,94,0.5)] border border-pink-400/30 hover:opacity-95 active:scale-[0.98]",
  secondary:
    "vybe-glass text-slate-100 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]",
  ghost:
    "bg-transparent text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 active:scale-[0.98]",
  danger:
    "bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 hover:border-red-500/50 active:scale-[0.98]",
  success:
    "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/50 active:scale-[0.98]"
};

const sizeStyles: Record<GlassButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm font-medium rounded-xl gap-2",
  lg: "px-6 py-3 text-base font-semibold rounded-2xl gap-2.5"
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
