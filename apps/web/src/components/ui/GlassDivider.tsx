import React from "react";

export interface GlassDividerProps {
  orientation?: "horizontal" | "vertical";
  label?: string;
  className?: string;
}

export const GlassDivider: React.FC<GlassDividerProps> = ({
  orientation = "horizontal",
  label,
  className = ""
}) => {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`w-px self-stretch bg-gradient-to-b from-transparent via-white/10 to-transparent ${className}`}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={`flex items-center gap-4 my-4 w-full ${className}`}
      >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-white/10" />
        <span className="text-xs font-medium text-slate-400 select-none uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/10 to-white/10" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      className={`h-px w-full my-4 bg-gradient-to-r from-transparent via-white/10 to-transparent ${className}`}
    />
  );
};
