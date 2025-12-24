// components/ui/ImagePositionEditor.tsx

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Props = {
  src: string;
  alt?: string;
  objectPosition: string;
  onChange: (position: string) => void;
  disabled?: boolean;
};

// 将 objectPosition 字符串转换为百分比坐标
function parsePosition(position: string): { x: number; y: number } {
  // 默认居中
  let x = 50;
  let y = 50;

  if (!position || position === "center") {
    return { x: 50, y: 50 };
  }

  // 处理预设值
  const presets: Record<string, { x: number; y: number }> = {
    top: { x: 50, y: 0 },
    bottom: { x: 50, y: 100 },
    left: { x: 0, y: 50 },
    right: { x: 100, y: 50 },
    "top left": { x: 0, y: 0 },
    "top right": { x: 100, y: 0 },
    "bottom left": { x: 0, y: 100 },
    "bottom right": { x: 100, y: 100 },
  };

  if (presets[position]) {
    return presets[position];
  }

  // 处理百分比值，如 "50% 30%"
  const match = position.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (match) {
    x = parseFloat(match[1]);
    y = parseFloat(match[2]);
  }

  return { x, y };
}

// 将坐标转换为 objectPosition 字符串
function formatPosition(x: number, y: number): string {
  return `${x}% ${y}%`;
}

export default function ImagePositionEditor({
  src,
  alt,
  objectPosition,
  onChange,
  disabled = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const position = parsePosition(objectPosition);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
    },
    [disabled]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || disabled) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // 限制在 0-100% 范围内
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      onChange(formatPosition(clampedX, clampedY));
    },
    [isDragging, onChange, disabled]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] overflow-hidden rounded-lg border border-black/10 bg-black/5 cursor-crosshair"
      onMouseDown={handleMouseDown}
      style={{ userSelect: "none" }}
    >
      {/* 图片 */}
      <img
        src={src}
        alt={alt || "Preview"}
        className="h-full w-full object-cover"
        style={{
          objectPosition: objectPosition || "center",
          pointerEvents: "none",
        }}
      />

      {/* 拖拽指示器（十字线 + 圆点） */}
      <div
        className="absolute pointer-events-none z-10"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
        }}
      >
        {/* 垂直十字线 */}
        <div
          className="absolute bg-white/90 border border-black/40 shadow-sm"
          style={{
            left: "50%",
            top: 0,
            width: "2px",
            height: "100%",
            transform: "translateX(-50%)",
          }}
        />
        {/* 水平十字线 */}
        <div
          className="absolute bg-white/90 border border-black/40 shadow-sm"
          style={{
            left: 0,
            top: "50%",
            width: "100%",
            height: "2px",
            transform: "translateY(-50%)",
          }}
        />
        {/* 中心圆点 */}
        <div
          className="absolute bg-white border-2 border-black/70 rounded-full shadow-lg"
          style={{
            left: "50%",
            top: "50%",
            width: "12px",
            height: "12px",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* 拖拽提示 */}
      {!disabled && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <div className="inline-block rounded bg-black/60 px-2 py-1 text-xs text-white">
            拖拽调整位置
          </div>
        </div>
      )}
    </div>
  );
}

