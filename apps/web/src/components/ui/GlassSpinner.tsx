import React from "react";

export interface GlassSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2.5",
  lg: "w-12 h-12 border-3"
};

export const GlassSpinner: React.FC<GlassSpinnerProps> = ({
  size = "md",
  className = "",
  label = "Loading..."
}) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-pink-500/20 border-t-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-spin`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};
