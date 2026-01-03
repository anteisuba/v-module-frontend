// components/ui/FormField.tsx
// 基于原则 05：防错设计 + 06：识别优于回忆

"use client";

import { ReactNode, isValidElement, cloneElement } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}

export default function FormField({
  label,
  required = false,
  helpText,
  error,
  children,
  id,
  className = "",
}: FormFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-xs font-medium text-black"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div
        className={[
          "relative",
          error && "ring-1 ring-red-500 rounded-lg",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isValidElement(children)
          ? cloneElement(children as React.ReactElement<any>, {
              id: fieldId,
              "aria-invalid": error ? "true" : undefined,
              "aria-describedby": [
                error ? errorId : null,
                helpText ? helpId : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined,
              className: [
                (children.props as { className?: string })?.className,
                error && "border-red-500",
              ]
                .filter(Boolean)
                .join(" "),
            })
          : children}
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

