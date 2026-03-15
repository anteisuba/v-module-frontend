// components/ui/Input.tsx
// 基于原则 04：一致性与标准 + 06：识别优于回忆

"use client";

import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helpText, error, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const baseInputClasses =
      "editorial-input text-sm leading-relaxed";
    const borderClasses = error
      ? "!border-[#9a4b3d]"
      : "";

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] uppercase tracking-[0.22em] text-[color:var(--editorial-muted)]"
          >
            {label}
            {props.required && <span className="ml-1 text-[color:#9a4b3d]">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`${baseInputClasses} ${borderClasses} ${className}`}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={[
              error ? errorId : null,
              helpText ? helpId : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined}
            {...props}
          />
        </div>

        {helpText && !error && (
          <p
            id={helpId}
            className="text-[11px] leading-5 text-[color:var(--editorial-muted)]"
          >
            {helpText}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="flex items-center gap-1 text-xs text-[color:#9a4b3d]"
            role="alert"
          >
            <span>⚠</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
