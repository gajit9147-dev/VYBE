import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { ToastContext, ToastItem } from "./ToastContext";
import { Toast } from "./Toast";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: "success", title, message }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: "error", title, message }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: "warning", title, message }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: "info", title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, dismissToast, success, error, warning, info }}
    >
      {children}

      {typeof document !== "undefined" &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2.5 pointer-events-none items-end"
          >
            {toasts.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};
