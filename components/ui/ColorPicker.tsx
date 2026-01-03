// components/ui/ColorPicker.tsx
// 基于原则 06：识别优于回忆

"use client";

import FormField from "./FormField";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  helpText?: string;
  disabled?: boolean;
  className?: string;
}

export default function ColorPicker({
  label,
  value,
  onChange,
  helpText,
  disabled = false,
  className = "",
}: ColorPickerProps) {
  return (
    <FormField
      label={label}
      helpText={helpText}
      className={className}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-20 cursor-pointer rounded border border-black/10 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {/* 颜色值显示 */}
          <div className="mt-1 text-[10px] text-black/50 text-center">
            {value.toUpperCase()}
          </div>
        </div>

        {/* 颜色预览框 */}
        <div
          className="h-10 w-20 rounded border border-black/10"
          style={{ backgroundColor: value }}
        />
      </div>
    </FormField>
  );
}

