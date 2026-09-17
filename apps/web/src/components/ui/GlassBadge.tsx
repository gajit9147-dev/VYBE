import React from "react";

export type GlassBadgeVariant =
  | "default"
  | "pink"
  | "peach"
  | "purple"
  | "blue"
  | "success"
  | "warning"
  | "danger";

export type GlassBadgeSize = "sm" | "md";

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: GlassBadgeVariant;
  size?: GlassBadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<GlassBadgeVariant, string> = {
  default: "vybe-glass-capsule text-white border-white/25 border-t-white/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]",
  pink: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  peach: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  danger: "bg-red-500/15 text-red-300 border-red-500/30"
};

const dotColors: Record<GlassBadgeVariant, string> = {
  default: "bg-slate-400",
  pink: "bg-rose-400",
  peach: "bg-orange-400",
  purple: "bg-purple-400",
  blue: "bg-sky-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400"
};

const sizeStyles: Record<GlassBadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5"
};

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-md transition-colors ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
