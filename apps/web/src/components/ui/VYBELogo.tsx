import React from "react";
import { Link } from "react-router-dom";

export type VYBELogoSize = "sm" | "md" | "lg";
export type VYBELogoVariant = "full" | "compact";

export interface VYBELogoProps {
  variant?: VYBELogoVariant;
  size?: VYBELogoSize;
  showTagline?: boolean;
  asLink?: boolean;
  className?: string;
}

const sizeMap = {
  sm: {
    wordmark: "text-xl",
    compact: "w-7 h-7 text-sm rounded-lg",
    tagline: "text-[10px]"
  },
  md: {
    wordmark: "text-2xl",
    compact: "w-9 h-9 text-base rounded-xl",
    tagline: "text-xs"
  },
  lg: {
    wordmark: "text-3xl sm:text-4xl",
    compact: "w-12 h-12 text-xl rounded-2xl",
    tagline: "text-sm"
  }
};

export const VYBELogo: React.FC<VYBELogoProps> = ({
  variant = "full",
  size = "md",
  showTagline = false,
  asLink = true,
  className = ""
}) => {
  const config = sizeMap[size];

  const content = (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="inline-flex items-center gap-2">
        {variant === "compact" ? (
          <div
            className={`inline-flex items-center justify-center font-black bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white shadow-[0_0_16px_rgba(244,63,94,0.35)] border border-pink-400/30 ${config.compact}`}
          >
            V
          </div>
        ) : (
          <span
            className={`font-black tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-purple-400 bg-clip-text text-transparent ${config.wordmark}`}
          >
            VYBE
          </span>
        )}
      </div>

      {showTagline && variant === "full" && (
        <span className={`text-slate-400 font-medium tracking-tight mt-0.5 ${config.tagline}`}>
          Real People. Meaningful Connections.
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to="/"
        className="inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg p-0.5 hover:opacity-95 transition-opacity"
        aria-label="VYBE Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
