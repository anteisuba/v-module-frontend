// components/ui/Button.tsx
// 基于原则 04：一致性与标准

"use client";

import { ReactNode } from "react";
import LoadingState from "./LoadingState";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "text" | "themed";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-black text-white hover:bg-black/90 active:bg-black/95",
    secondary: "border border-black/20 bg-white/70 text-black hover:bg-white/80 active:bg-white/90",
    danger: "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200",
    text: "text-black/70 hover:text-black underline bg-transparent",
    // 主题色变体 - 使用 CSS 变量实现动态品牌色
    themed: "btn-themed",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2.5 text-sm",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingState type="spinner" size="sm" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

