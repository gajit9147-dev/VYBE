import React from "react";

export type SkeletonVariant = "text" | "circular" | "rectangular" | "card";

export interface GlassSkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  className = ""
}) => {
  const variantStyles: Record<SkeletonVariant, string> = {
    text: "h-4 w-full rounded-md",
    circular: "rounded-full aspect-square",
    rectangular: "w-full h-24 rounded-2xl",
    card: "w-full h-64 rounded-3xl"
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined
  };

  return (
    <div
      role="status"
      aria-label="Loading content"
      style={style}
      className={`relative overflow-hidden bg-white/5 border border-white/5 backdrop-blur-md animate-pulse ${
        variantStyles[variant]
      } ${className}`}
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
};
