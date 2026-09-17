import React, { useId } from "react";

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      description,
      error,
      leftIcon,
      rightIcon,
      id,
      disabled,
      required,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const descId = `${inputId}-desc`;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="vybe-label block text-slate-200"
            >
              {label}
              {required && <span className="text-pink-500 ml-1" aria-hidden="true">*</span>}
            </label>
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className={`w-full rounded-2xl bg-gradient-to-b from-white/[0.08] to-slate-950/60 backdrop-blur-xl border px-4 py-3 text-sm text-white placeholder-slate-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] transition-all duration-150 outline-none ${
              leftIcon ? "pl-11" : ""
            } ${rightIcon ? "pr-11" : ""} ${
              error
                ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/25"
                : "border-white/15 border-t-white/30 focus:border-white/45 focus:ring-2 focus:ring-pink-500/25 hover:border-white/25"
            } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-950/40" : ""} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

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

GlassInput.displayName = "GlassInput";
