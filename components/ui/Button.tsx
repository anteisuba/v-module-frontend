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
  const baseClasses =
    "editorial-button disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "editorial-button--primary",
    secondary: "editorial-button--secondary",
    danger: "editorial-button--danger",
    text: "editorial-button--text",
    // 主题色变体 - 使用 CSS 变量实现动态品牌色
    themed: "editorial-button--primary btn-themed",
  };

  const sizeClasses = {
    sm: "min-h-9 px-3 py-2 text-[10px]",
    md: "min-h-11 px-4 py-2.5 text-[11px]",
    lg: "min-h-12 px-5 py-3 text-xs",
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
