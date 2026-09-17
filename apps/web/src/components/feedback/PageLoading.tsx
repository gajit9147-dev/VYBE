import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = "Loading VYBE..."
}) => {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
};
