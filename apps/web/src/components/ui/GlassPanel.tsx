import React from "react";

export type GlassPanelVariant = "default" | "strong" | "subtle" | "interactive" | "capsule";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant;
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<GlassPanelVariant, string> = {
  default: "vybe-glass rounded-[28px]",
  strong: "vybe-glass-strong rounded-[28px]",
  subtle: "vybe-glass-subtle rounded-2xl",
  interactive: "vybe-glass vybe-glass-interactive rounded-[28px] cursor-pointer",
  capsule: "vybe-glass-capsule rounded-full"
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ variant = "default", as: Component = "div", className = "", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
