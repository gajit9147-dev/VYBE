import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { GlassButton } from "./GlassButton";

export interface GlassErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const GlassErrorState: React.FC<GlassErrorStateProps> = ({
  title = "Something went wrong",
  message = "We couldn't complete this action. Please check your connection and try again.",
  onRetry,
  retryLabel = "Try Again",
  secondaryAction,
  className = ""
}) => {
  return (
    <GlassPanel
      variant="subtle"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto border-red-500/20 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.2)]">
        <AlertCircle className="w-8 h-8" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>

      <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xs leading-relaxed">
        {message}
      </p>

      {(onRetry || secondaryAction) && (
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {onRetry && (
            <GlassButton
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={onRetry}
            >
              {retryLabel}
            </GlassButton>
          )}
          {secondaryAction}
        </div>
      )}
    </GlassPanel>
  );
};
