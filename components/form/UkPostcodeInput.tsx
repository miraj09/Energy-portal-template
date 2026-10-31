"use client";

import { useState } from "react";
import {
  getUkPostcodeFormatError,
  UK_POSTCODE_PLACEHOLDER,
} from "@/lib/validation/ukPostcode";

interface UkPostcodeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
  /**
   * Parent sets this after Apply/Save so the format error appears even when
   * the user never left the field.
   */
  showError?: boolean;
}

/**
 * Optional UK postcode field. Blank is allowed. Any other value must match
 * a UK postcode, and the error is shown after blur or when `showError` is set.
 */
export function UkPostcodeInput({
  id,
  value,
  onChange,
  className,
  showError = false,
}: UkPostcodeInputProps) {
  const [hasBlurred, setHasBlurred] = useState(false);
  const formatError = getUkPostcodeFormatError(value);
  const visibleError = hasBlurred || showError ? formatError : null;

  return (
    <>
      <input
        id={id}
        type="text"
        autoComplete="postal-code"
        value={value}
        placeholder={UK_POSTCODE_PLACEHOLDER}
        aria-invalid={visibleError ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setHasBlurred(true)}
        className={`${className}${visibleError ? " !border-red-500" : ""}`}
      />
      {visibleError ? (
        <p className="text-red-500 text-xs mt-1">{visibleError}</p>
      ) : null}
    </>
  );
}
