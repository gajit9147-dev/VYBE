import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { GlassIconButton } from "./GlassIconButton";

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdropClick?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl"
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnBackdropClick = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  // Escape key listener & Body scroll lock
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeOnBackdropClick ? onClose : undefined}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog Box */}
      <div
        ref={modalRef}
        className={`relative z-10 w-full rounded-2xl border border-white/15 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-2xl transition-all animate-in zoom-in-95 ${sizeStyles[size]}`}
      >
        <div className="flex items-start justify-between gap-4">
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
            aria-label="Close dialog"
            icon={<X className="w-4 h-4" />}
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};
