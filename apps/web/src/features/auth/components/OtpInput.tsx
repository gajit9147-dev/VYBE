import React, { ClipboardEvent, KeyboardEvent, useEffect, useRef } from "react";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}

const OTP_LENGTH = 6;

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  autoFocus = false,
  ariaLabel = "Six digit verification code",
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
  const errorId = "otp-input-error";

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const focusCell = (index: number) => {
    inputRefs.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))]?.focus();
  };

  const updateDigit = (index: number, nextDigit: string) => {
    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, cellIndex) =>
      cellIndex === index ? nextDigit : digits[cellIndex] || "",
    );
    onChange(nextDigits.join(""));
  };

  const handleChange = (index: number, rawValue: string) => {
    const nextDigit = rawValue.replace(/\D/g, "").slice(-1);
    updateDigit(index, nextDigit);
    if (nextDigit && index < OTP_LENGTH - 1) {
      focusCell(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusCell(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusCell(index + 1);
      return;
    }

    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      updateDigit(index - 1, "");
      focusCell(index - 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pastedDigits) return;

    onChange(pastedDigits);
    focusCell(Math.min(pastedDigits.length, OTP_LENGTH - 1));
  };

  return (
    <div
      className="w-full"
      role="group"
      aria-label={ariaLabel}
      aria-describedby={error ? errorId : undefined}
    >
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digits[index] || ""}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`${ariaLabel}, digit ${index + 1} of ${OTP_LENGTH}`}
            aria-invalid={Boolean(error)}
            className={`h-12 min-w-0 rounded-2xl border bg-gradient-to-b from-white/[0.08] to-slate-950/60 text-center text-lg font-semibold tracking-wide text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-xl outline-none transition-all duration-150 focus:border-white/45 focus:ring-2 focus:ring-pink-500/25 ${
              error ? "border-red-500/60" : "border-white/15 border-t-white/30"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          />
        ))}
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-2 text-xs font-medium text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
