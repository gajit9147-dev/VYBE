import React from "react";
import { GlassPanel, GlassPanelProps, GlassPanelVariant } from "./GlassPanel";

export interface GlassCardProps extends GlassPanelProps {
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8"
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    return (
      <GlassPanel
        ref={ref}
        variant={variant as GlassPanelVariant}
        className={`overflow-hidden ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </GlassPanel>
    );
  }
);

GlassCard.displayName = "GlassCard";

export const GlassCardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`mb-4 flex items-center justify-between gap-4 ${className}`} {...props}>
    {children}
  </div>
);

export const GlassCardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`space-y-3 ${className}`} {...props}>
    {children}
  </div>
);

export const GlassCardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4 ${className}`} {...props}>
    {children}
  </div>
);
