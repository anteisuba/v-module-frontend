// components/ui/SectionLayoutControl.tsx
"use client";

// 简单的 classNames 合并函数
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface SectionLayoutControlProps {
  value: 1 | 2 | 3 | 4;
  onChange: (value: 1 | 2 | 3 | 4) => void;
  className?: string;
}

const layouts = [
  { label: "1/4", value: 1 as const, icon: "▏" },
  { label: "Half", value: 2 as const, icon: "▍" },
  { label: "3/4", value: 3 as const, icon: "▊" },
  { label: "Full", value: 4 as const, icon: "█" },
];

export function SectionLayoutControl({
  value,
  onChange,
  className,
}: SectionLayoutControlProps) {
  return (
    <div className={classNames("flex items-center gap-2", className)}>
      <span className="text-xs font-medium text-gray-600">Width:</span>
      <div className="inline-flex rounded-lg bg-gray-100/80 p-0.5 backdrop-blur-sm">
        {layouts.map((layout) => (
          <button
            key={layout.value}
            type="button"
            onClick={() => onChange(layout.value)}
            className={classNames(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              "hover:bg-white/60 active:scale-95",
              value === layout.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
            aria-label={`Set width to ${layout.label}`}
          >
            <span className="mr-1.5 opacity-60">{layout.icon}</span>
            {layout.label}
          </button>
        ))}
      </div>
    </div>
  );
}
