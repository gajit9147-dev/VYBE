import React from "react";
import { GlassCard } from "./GlassCard";

export interface QuestionCardProps {
  question: string;
  answer?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  category?: string;
  className?: string;
  action?: React.ReactNode;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  authorName,
  authorPhotoUrl,
  category,
  className = "",
  action
}) => {
  return (
    <GlassCard variant="default" padding="md" className={`space-y-4 ${className}`}>
      {category && (
        <span className="text-[11px] font-semibold tracking-wider uppercase text-pink-400">
          {category}
        </span>
      )}

      <div>
        <h3 className="text-base font-semibold text-white tracking-tight leading-snug">
          &ldquo;{question}&rdquo;
        </h3>
        {answer ? (
          <p className="mt-2.5 text-sm text-slate-300 italic border-l-2 border-pink-500/50 pl-3 py-0.5">
            {answer}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Tap to answer this prompt...</p>
        )}
      </div>

      {(authorName || action) && (
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          {authorName && (
            <div className="flex items-center gap-2">
              {authorPhotoUrl ? (
                <img
                  src={authorPhotoUrl}
                  alt={authorName}
                  className="w-6 h-6 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-slate-400">{authorName}</span>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
    </GlassCard>
  );
};
