import React from "react";

export interface GlassProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  variant?: "pink" | "gradient" | "blue";
  className?: string;
  label?: string;
}

const variantGradients = {
  pink: "bg-gradient-to-r from-rose-500 to-pink-500",
  gradient: "bg-gradient-to-r from-rose-500 via-purple-500 to-sky-400",
  blue: "bg-gradient-to-r from-sky-500 to-indigo-500"
};

export const GlassProgress: React.FC<GlassProgressProps> = ({
  value,
  max = 100,
  showLabel = false,
  size = "md",
  variant = "gradient",
  className = "",
  label
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span>{label}</span>
          {showLabel && <span>{percentage}%</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${percentage}% progress`}
        className={`w-full overflow-hidden rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md ${
          size === "sm" ? "h-1.5" : "h-2.5"
        }`}
      >
        <div
          style={{ width: `${percentage}%` }}
          className={`h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.4)] ${
            variantGradients[variant]
          }`}
        />
      </div>
    </div>
  );
};
