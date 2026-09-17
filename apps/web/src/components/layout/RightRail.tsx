import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";

export interface RightRailProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export const RightRail: React.FC<RightRailProps> = ({
  title,
  className = "",
  children
}) => {
  return (
    <aside
      aria-label="Contextual panel"
      className={`hidden xl:block w-80 shrink-0 py-6 pr-6 pl-2 ${className}`}
    >
      <div className="sticky top-20 space-y-4">
        {title && (
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            {title}
          </h3>
        )}
        <GlassCard variant="default" padding="md" className="space-y-4">
          {children}
        </GlassCard>
      </div>
    </aside>
  );
};
