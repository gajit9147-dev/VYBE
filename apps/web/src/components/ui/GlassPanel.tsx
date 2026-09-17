import React from "react";

export type GlassPanelVariant = "default" | "strong" | "subtle" | "interactive";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant;
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<GlassPanelVariant, string> = {
  default: "vybe-glass rounded-2xl",
  strong: "vybe-glass-strong rounded-2xl",
  subtle: "vybe-glass-subtle rounded-xl",
  interactive: "vybe-glass vybe-glass-interactive rounded-2xl cursor-pointer"
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
