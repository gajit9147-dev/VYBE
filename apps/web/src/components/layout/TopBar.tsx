import React from "react";
import { Sparkles } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";

export interface TopBarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  actions,
  className = ""
}) => {
  return (
    <header
      className={`hidden lg:flex items-center justify-between h-16 px-8 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-20 shrink-0 ${className}`}
    >
      <div>
        {title && <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <GlassBadge variant="pink" size="sm" dot>
          <Sparkles className="w-3 h-3 mr-1 inline" />
          Liquid Glass
        </GlassBadge>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
};
