import React, { useId, useState } from "react";
import { GlassInput, GlassSelect, SelectOption } from "@/components/ui";

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const countryOptions: SelectOption[] = [
  { value: "+91", label: "India (+91)" },
  { value: "+1", label: "United States (+1)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+971", label: "United Arab Emirates (+971)" },
];

const defaultCountryCode = "+91";

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  autoFocus = false,
  className = "",
}) => {
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [localNumber, setLocalNumber] = useState(() =>
    value.startsWith(defaultCountryCode)
      ? value.slice(defaultCountryCode.length)
      : value,
  );
  const inputId = useId();

  const handleCountryChange = (nextCountryCode: string) => {
    setCountryCode(nextCountryCode);
    const digits = localNumber.replace(/\D/g, "");
    onChange(digits ? `${nextCountryCode}${digits}` : "");
  };

  const handlePhoneChange = (nextValue: string) => {
    const digits = nextValue.replace(/\D/g, "");
    setLocalNumber(digits);
    onChange(digits ? `${countryCode}${digits}` : "");
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.6fr)] gap-3">
        <GlassSelect
          id={`${inputId}-country`}
          label="Country"
          value={countryCode}
          onChange={(event) => handleCountryChange(event.target.value)}
          options={countryOptions}
          disabled={disabled}
          required={required}
        />
        <GlassInput
          id={inputId}
          label="Phone number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="98765 43210"
          value={localNumber}
          onChange={(event) => handlePhoneChange(event.target.value)}
          error={error}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          aria-label="Phone number"
        />
      </div>
    </div>
  );
};
