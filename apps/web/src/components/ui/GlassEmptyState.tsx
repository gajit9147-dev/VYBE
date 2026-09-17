import React from "react";
import { Sparkles } from "lucide-react";
import { GlassPanel } from "./GlassPanel";

export interface GlassEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const GlassEmptyState: React.FC<GlassEmptyStateProps> = ({
  icon = <Sparkles className="w-8 h-8 text-pink-400/80" />,
  title,
  description,
  action,
  className = ""
}) => {
  return (
    <GlassPanel
      variant="subtle"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(244,63,94,0.15)]">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>

      {description && (
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </GlassPanel>
  );
};
