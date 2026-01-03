// components/ui/ToggleSwitch.tsx

"use client";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  label = "是否显示",
  className = "",
}: ToggleSwitchProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm text-black/70">{label}</label>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2",
          enabled ? "bg-black" : "bg-black/30",
          disabled && "opacity-50 cursor-not-allowed",
        ].join(" ")}
        aria-label="Toggle visibility"
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

