import React, { useId } from "react";

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  (
    {
      label,
      description,
      error,
      id,
      disabled,
      required,
      className = "",
      containerClassName = "",
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const descId = `${textareaId}-desc`;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={textareaId} className="vybe-label block text-slate-200">
            {label}
            {required && <span className="text-pink-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : description ? descId : undefined}
          className={`w-full rounded-xl bg-slate-900/50 backdrop-blur-md border px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all duration-150 outline-none resize-y ${
            error
              ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-white/10 focus:border-pink-500/80 focus:ring-2 focus:ring-pink-500/20 hover:border-white/20"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-950/40" : ""} ${className}`}
          {...props}
        />

        {description && !error && (
          <p id={descId} className="text-xs text-slate-400">
            {description}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-xs font-medium text-red-400 flex items-center gap-1">
            <span aria-hidden="true">•</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = "GlassTextarea";
