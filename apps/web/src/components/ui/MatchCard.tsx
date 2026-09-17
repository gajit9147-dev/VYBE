import React from "react";
import { GlassCard } from "./GlassCard";
import { GlassAvatar } from "./GlassAvatar";
import { GlassButton } from "./GlassButton";

export interface MatchCardProps {
  name: string;
  avatarUrl?: string;
  matchScore?: number;
  commonInterests?: string[];
  matchedAt?: string;
  className?: string;
  onChatClick?: () => void;
  onProfileClick?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  name,
  avatarUrl,
  matchScore,
  commonInterests = [],
  matchedAt,
  className = "",
  onChatClick,
  onProfileClick
}) => {
  return (
    <GlassCard variant="interactive" padding="md" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <GlassAvatar
          src={avatarUrl}
          fallbackName={name}
          size="lg"
          isOnline
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white truncate">{name}</h3>
            {matchScore !== undefined && (
              <span className="text-xs font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                {matchScore}% Vibe
              </span>
            )}
          </div>
          {matchedAt && <p className="text-xs text-slate-400 mt-0.5">Matched {matchedAt}</p>}
        </div>
      </div>

      {commonInterests.length > 0 && (
        <div className="text-xs text-slate-400">
          <span className="text-slate-500">Shared: </span>
          {commonInterests.join(", ")}
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <GlassButton
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={onProfileClick}
        >
          View Profile
        </GlassButton>
        <GlassButton
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={onChatClick}
        >
          Message
        </GlassButton>
      </div>
    </GlassCard>
  );
};
