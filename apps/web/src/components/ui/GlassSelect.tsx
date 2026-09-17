import React, { useId } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  options?: SelectOption[];
  containerClassName?: string;
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  (
    {
      label,
      description,
      error,
      options = [],
      id,
      disabled,
      required,
      className = "",
      containerClassName = "",
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const descId = `${selectId}-desc`;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="vybe-label block text-slate-200">
            {label}
            {required && <span className="text-pink-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className={`w-full appearance-none rounded-xl bg-slate-900/60 backdrop-blur-md border px-3.5 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 transition-all duration-150 outline-none cursor-pointer ${
              error
                ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-white/10 focus:border-pink-500/80 focus:ring-2 focus:ring-pink-500/20 hover:border-white/20"
            } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-950/40" : ""} ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          <div className="absolute right-3.5 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
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

GlassSelect.displayName = "GlassSelect";
