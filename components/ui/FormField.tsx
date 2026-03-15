// components/ui/FormField.tsx
// 基于原则 05：防错设计 + 06：识别优于回忆

"use client";

import {
  type ReactNode,
  cloneElement,
  isValidElement,
  useId,
} from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}

type FormFieldChildProps = {
  id?: string;
  className?: string;
  "aria-invalid"?: "true";
  "aria-describedby"?: string;
};

export default function FormField({
  label,
  required = false,
  helpText,
  error,
  children,
  id,
  className = "",
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-xs font-medium"
        style={{ color: "var(--editorial-text)" }}
      >
        {label}
        {required && <span className="ml-1" style={{ color: "#9a4b3d" }}>*</span>}
      </label>

      <div
        className={[
          "relative",
          error && "ring-1 rounded-lg",
        ]
          .filter(Boolean)
          .join(" ")}
        style={error ? { "--tw-ring-color": "#9a4b3d" } as React.CSSProperties : undefined}
      >
        {isValidElement<FormFieldChildProps>(children)
          ? cloneElement(children, {
              id: fieldId,
              "aria-invalid": error ? "true" : undefined,
              "aria-describedby": [
                error ? errorId : null,
                helpText ? helpId : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined,
              className: [
                children.props.className,
                error && "border-[#9a4b3d]",
              ]
                .filter(Boolean)
                .join(" "),
            })
          : children}
      </div>

      {helpText && !error && (
        <p
          id={helpId}
          className="text-[10px]"
          style={{ color: "var(--editorial-muted)" }}
        >
          {helpText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-xs flex items-center gap-1"
          style={{ color: "#9a4b3d" }}
          role="alert"
        >
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
