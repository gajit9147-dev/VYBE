import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { GlassIconButton } from "./GlassIconButton";

export interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: "right" | "bottom";
  className?: string;
}

export const GlassSheet: React.FC<GlassSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = "right",
  className = ""
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBottom = side === "bottom";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
      />

      {/* Sheet Content Container */}
      <div
        ref={sheetRef}
        className={`relative z-10 flex flex-col border-white/15 bg-slate-900/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${
          isBottom
            ? "w-full max-h-[85vh] mt-auto rounded-t-3xl border-t p-6"
            : "ml-auto h-full w-full sm:max-w-md border-l p-6"
        } ${className}`}
      >
        {/* Mobile drag handle for bottom sheet */}
        {isBottom && (
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />
        )}

        <div className="flex items-start justify-between gap-4 shrink-0">
          <div>
            {title && (
              <h2 id={titleId} className="text-xl font-bold text-white tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-1 text-xs text-slate-400">
                {description}
              </p>
            )}
          </div>

          <GlassIconButton
            aria-label="Close sheet"
            icon={<X className="w-4 h-4" />}
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
};
