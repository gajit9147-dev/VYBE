import React from "react";
import { X } from "lucide-react";

export interface GlassChipProps {
  label: string;
  isSelected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const GlassChip: React.FC<GlassChipProps> = ({
  label,
  isSelected = false,
  onToggle,
  onRemove,
  leftIcon,
  disabled = false,
  className = ""
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={isSelected}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
        isSelected
          ? "bg-rose-500/25 border-rose-400/50 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
      } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${className}`}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{label}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove();
            }
          }}
          className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );
};
