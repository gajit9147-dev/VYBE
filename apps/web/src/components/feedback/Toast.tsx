import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { ToastItem, ToastType } from "./ToastContext";

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const toastTypeStyles: Record<ToastType, { border: string; bg: string; icon: React.ReactNode; text: string }> = {
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    text: "text-emerald-200"
  },
  error: {
    border: "border-rose-500/30",
    bg: "bg-rose-950/80 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
    icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    text: "text-rose-200"
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-950/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    text: "text-amber-200"
  },
  info: {
    border: "border-sky-500/30",
    bg: "bg-sky-950/80 shadow-[0_0_20px_rgba(14,165,233,0.2)]",
    icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    text: "text-sky-200"
  }
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const config = toastTypeStyles[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-2xl border p-4 backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-bottom-2 ${config.border} ${config.bg}`}
    >
      <div className="pt-0.5">{config.icon}</div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold text-white tracking-tight">
            {toast.title}
          </h4>
        )}
        <p className={`text-xs leading-relaxed ${toast.title ? "mt-0.5 text-slate-300" : config.text}`}>
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="p-1 -mr-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
