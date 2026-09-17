import React from "react";
import { GlassCard } from "./GlassCard";
import { GlassBadge } from "./GlassBadge";

export interface ProfileCardProps {
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  imageUrl?: string;
  intent?: string;
  interests?: string[];
  isVerified?: boolean;
  className?: string;
  footerAction?: React.ReactNode;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  age,
  location,
  bio,
  imageUrl,
  intent,
  interests = [],
  isVerified = false,
  className = "",
  footerAction
}) => {
  return (
    <GlassCard padding="none" variant="strong" className={`relative group max-w-sm w-full ${className}`}>
      {/* Profile Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-slate-500 font-medium">
            No Photo Available
          </div>
        )}

        {/* Ambient Dark Gradient Vignette for bottom text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          {intent && (
            <GlassBadge variant="peach" size="sm">
              {intent}
            </GlassBadge>
          )}
          {isVerified && (
            <GlassBadge variant="pink" size="sm">
              Verified
            </GlassBadge>
          )}
        </div>

        {/* Bottom Profile Details */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold tracking-tight">{name}</h2>
            {age !== undefined && <span className="text-lg text-slate-300 font-medium">{age}</span>}
          </div>

          {location && <p className="text-xs text-slate-400 mt-0.5">{location}</p>}

          {bio && <p className="text-xs text-slate-300 mt-2 line-clamp-2">{bio}</p>}

          {interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {interests.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 backdrop-blur-md text-slate-200 border border-white/10"
                >
                  {item}
                </span>
              ))}
              {interests.length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/5 text-slate-400">
                  +{interests.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {footerAction && <div className="p-3 border-t border-white/10 bg-slate-950/40">{footerAction}</div>}
    </GlassCard>
  );
};
