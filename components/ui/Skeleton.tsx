// components/ui/Skeleton.tsx
// 骨架屏组件 - 基于 UX_DESIGN_GUIDELINES.md 原则 01：系统状态可见性
// 用于页面/区块加载时的占位效果，带闪烁动画

"use client";

import { type CSSProperties } from "react";

interface SkeletonProps {
  /** 宽度，默认 100% */
  width?: string | number;
  /** 高度，默认 16px */
  height?: string | number;
  /** 圆角大小 */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** 是否为圆形（用于头像等） */
  circle?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 变体：默认为 shimmer 闪烁效果 */
  variant?: "shimmer" | "pulse";
}

/**
 * Skeleton 骨架屏组件
 * 
 * 使用场景：
 * - 页面初始化时的占位
 * - 图片加载前的占位
 * - 列表/卡片内容加载时的占位
 * 
 * 视觉规范（来自 UX_DESIGN_GUIDELINES.md）：
 * - 使用浅灰色占位
 * - 带闪烁动画效果（shimmer）
 */
export default function Skeleton({
  width = "100%",
  height = 16,
  rounded = "md",
  circle = false,
  className = "",
  style,
  variant = "shimmer",
}: SkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  const baseClasses = circle
    ? "rounded-full"
    : roundedClasses[rounded];

  // Shimmer 效果使用 CSS 渐变动画，Pulse 使用简单的透明度动画
  const animationClasses = variant === "shimmer"
    ? "skeleton-shimmer"
    : "animate-pulse";

  return (
    <div
      className={`
        relative overflow-hidden bg-black/10
        ${baseClasses}
        ${animationClasses}
        ${className}
      `.trim().replace(/\s+/g, " ")}
      style={{
        width: widthStyle,
        height: heightStyle,
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

/**
 * 图片骨架屏专用组件
 * 用于在图片加载完成前显示占位
 */
interface ImageSkeletonProps {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 子元素（实际图片） */
  children: React.ReactNode;
  /** 容器类名 */
  className?: string;
  /** 骨架屏圆角 */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

export function ImageSkeleton({
  isLoading,
  children,
  className = "",
  rounded = "md",
}: ImageSkeletonProps) {
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <Skeleton
          width="100%"
          height="100%"
          rounded={rounded}
          className="absolute inset-0 z-10"
        />
      )}
      <div className={isLoading ? "invisible" : "visible"}>
        {children}
      </div>
    </div>
  );
}

/**
 * 文本骨架屏 - 模拟多行文本加载
 */
interface TextSkeletonProps {
  /** 行数 */
  lines?: number;
  /** 行间距 */
  gap?: number;
  /** 最后一行宽度百分比 */
  lastLineWidth?: number;
  /** 自定义类名 */
  className?: string;
}

export function TextSkeleton({
  lines = 3,
  gap = 8,
  lastLineWidth = 70,
  className = "",
}: TextSkeletonProps) {
  return (
    <div className={`flex flex-col ${className}`} style={{ gap: `${gap}px` }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? `${lastLineWidth}%` : "100%"}
          height={14}
          rounded="sm"
        />
      ))}
    </div>
  );
}

/**
 * 卡片骨架屏 - 用于商品/文章卡片
 */
interface CardSkeletonProps {
  /** 是否显示图片区域 */
  showImage?: boolean;
  /** 图片高度 */
  imageHeight?: number;
  /** 自定义类名 */
  className?: string;
}

export function CardSkeleton({
  showImage = true,
  imageHeight = 192,
  className = "",
}: CardSkeletonProps) {
  return (
    <div className={`rounded-lg overflow-hidden border border-black/10 bg-white ${className}`}>
      {showImage && (
        <Skeleton
          width="100%"
          height={imageHeight}
          rounded="none"
        />
      )}
      <div className="p-4 space-y-3">
        <Skeleton width="70%" height={20} rounded="sm" />
        <TextSkeleton lines={2} gap={6} />
        <div className="flex items-center justify-between pt-2">
          <Skeleton width={80} height={24} rounded="sm" />
          <Skeleton width={40} height={16} rounded="sm" />
        </div>
      </div>
    </div>
  );
}
