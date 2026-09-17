import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { GlassInput, GlassInputProps } from "@/components/ui/GlassInput";

export interface PasswordFieldProps extends Omit<GlassInputProps, "type" | "rightIcon" | "leftIcon"> {
  label?: string;
  autoComplete?: "current-password" | "new-password";
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = "Password", autoComplete = "current-password", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <GlassInput
        ref={ref}
        label={label}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
        rightIcon={
          <button
            type="button"
            tabIndex={0}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto focus-visible:ring-2 focus-visible:ring-pink-500 outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordField.displayName = "PasswordField";
