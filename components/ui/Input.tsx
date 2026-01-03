// components/ui/Input.tsx
// 基于原则 04：一致性与标准 + 06：识别优于回忆

"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helpText, error, className = "", ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const baseInputClasses = "w-full rounded-lg border bg-white px-3 py-2 text-xs text-black placeholder:text-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-1";
    const borderClasses = error
      ? "border-red-500 focus:border-red-500"
      : "border-black/10 focus:border-black/30";

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-black"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
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
            className="text-[10px] text-black/50"
          >
            {helpText}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-xs text-red-600 flex items-center gap-1"
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

