import React, { useState } from "react";

export interface GlassTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const positionStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2"
};

export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  content,
  children,
  position = "top",
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-nowrap rounded-lg border border-white/15 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-100 shadow-xl backdrop-blur-md transition-opacity duration-150 animate-in fade-in ${
            positionStyles[position]
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
