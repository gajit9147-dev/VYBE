import React, { useState } from "react";
import { Check } from "lucide-react";

export type GlassAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface GlassAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackName?: string;
  size?: GlassAvatarSize;
  isOnline?: boolean;
  isVerified?: boolean;
  className?: string;
}

const sizeMap: Record<GlassAvatarSize, { container: string; text: string; badge: string; check: string }> = {
  xs: { container: "w-6 h-6", text: "text-[10px]", badge: "w-2 h-2", check: "w-2 h-2" },
  sm: { container: "w-8 h-8", text: "text-xs", badge: "w-2.5 h-2.5", check: "w-2.5 h-2.5" },
  md: { container: "w-10 h-10", text: "text-sm", badge: "w-3 h-3", check: "w-3 h-3" },
  lg: { container: "w-14 h-14", text: "text-base", badge: "w-3.5 h-3.5", check: "w-3.5 h-3.5" },
  xl: { container: "w-20 h-20", text: "text-xl", badge: "w-4 h-4", check: "w-4 h-4" },
  "2xl": { container: "w-28 h-28", text: "text-3xl", badge: "w-5 h-5", check: "w-5 h-5" }
};

export const GlassAvatar: React.FC<GlassAvatarProps> = ({
  src,
  alt,
  fallbackName = "User",
  size = "md",
  isOnline = false,
  isVerified = false,
  className = ""
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeConfig = sizeMap[size];

  const initials = fallbackName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

  return (
    <div className={`relative inline-block shrink-0 ${sizeConfig.container} ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden border border-white/15 bg-slate-900 shadow-md flex items-center justify-center">
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || fallbackName}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className={`font-bold text-slate-300 select-none ${sizeConfig.text}`}>
            {initials}
          </span>
        )}
      </div>

      {/* Online indicator */}
      {isOnline && (
        <span
          aria-label="Online"
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-slate-950 ${sizeConfig.badge}`}
        />
      )}

      {/* Verified indicator badge */}
      {isVerified && !isOnline && (
        <span
          aria-label="Verified profile"
          className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-rose-500 text-white flex items-center justify-center ring-2 ring-slate-950 p-0.5 ${sizeConfig.badge}`}
        >
          <Check className={sizeConfig.check} strokeWidth={3} />
        </span>
      )}
    </div>
  );
};
