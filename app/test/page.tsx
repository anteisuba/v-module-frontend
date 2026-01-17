// app/test/page.tsx
// 测试页面 - 用于验证新功能（开发环境使用）

"use client";

import { useState } from "react";
import { Button, Skeleton, CardSkeleton, TextSkeleton } from "@/components/ui";
import { useToast } from "@/hooks/useToast";

export default function TestPage() {
  const toast = useToast();
  const [themeColor, setThemeColor] = useState("#000000");
  const [showSkeleton, setShowSkeleton] = useState(true);

  // 计算主题色的 hover 和 active 状态
  const getThemeStyles = (color: string) => ({
    "--theme-primary": color,
    "--theme-primary-foreground": "#ffffff",
    "--theme-primary-hover": adjustBrightness(color, 20),
    "--theme-primary-active": adjustBrightness(color, 40),
  } as React.CSSProperties);

  // 简单的颜色亮度调整函数
  function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <h1 className="text-3xl font-bold text-black">功能测试页面</h1>

        {/* ========== Toast 测试 ========== */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">1. Toast 通知测试</h2>
          <p className="mb-4 text-sm text-black/60">
            点击下方按钮测试不同类型的 Toast 通知（右上角弹出）
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => toast.success("保存成功！")}
            >
              Success Toast
            </Button>
            <Button
              variant="danger"
              onClick={() => toast.error("操作失败，请重试")}
            >
              Error Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.warning("请注意：库存不足")}
            >
              Warning Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.info("提示：可以拖拽排序")}
            >
              Info Toast
            </Button>
            <Button
              variant="text"
              onClick={() => {
                toast.success("第一条");
                setTimeout(() => toast.info("第二条"), 300);
                setTimeout(() => toast.warning("第三条"), 600);
              }}
            >
              连续触发 3 条
            </Button>
          </div>
        </section>

        {/* ========== Skeleton 测试 ========== */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">2. Skeleton 骨架屏测试</h2>
          <p className="mb-4 text-sm text-black/60">
            骨架屏用于加载状态，带闪烁动画效果
          </p>

          <div className="mb-4">
            <Button
              variant="secondary"
              onClick={() => setShowSkeleton(!showSkeleton)}
            >
              {showSkeleton ? "隐藏骨架屏" : "显示骨架屏"}
            </Button>
          </div>

          {showSkeleton && (
            <div className="space-y-6">
              {/* 基础骨架屏 */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-black/70">
                  基础骨架屏
                </h3>
                <div className="space-y-2">
                  <Skeleton width="100%" height={20} />
                  <Skeleton width="80%" height={16} />
                  <Skeleton width="60%" height={16} />
                </div>
              </div>

              {/* 文本骨架屏 */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-black/70">
                  文本骨架屏 (TextSkeleton)
                </h3>
                <TextSkeleton lines={4} />
              </div>

              {/* 卡片骨架屏 */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-black/70">
                  卡片骨架屏 (CardSkeleton)
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              </div>

              {/* 圆形骨架屏 */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-black/70">
                  头像骨架屏
                </h3>
                <div className="flex items-center gap-3">
                  <Skeleton width={48} height={48} circle />
                  <div className="flex-1">
                    <Skeleton width="50%" height={16} className="mb-2" />
                    <Skeleton width="30%" height={12} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========== 主题色测试 ========== */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">3. 主题色 (Theming) 测试</h2>
          <p className="mb-4 text-sm text-black/60">
            选择不同的主题色，观察按钮颜色变化
          </p>

          {/* 颜色选择器 */}
          <div className="mb-6 flex items-center gap-4">
            <label className="text-sm font-medium">选择主题色：</label>
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="h-10 w-20 cursor-pointer rounded border border-black/10"
            />
            <span className="text-sm text-black/60">{themeColor}</span>
          </div>

          {/* 预设颜色 */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { name: "黑色", color: "#000000" },
              { name: "蓝色", color: "#2563eb" },
              { name: "紫色", color: "#7c3aed" },
              { name: "粉色", color: "#ec4899" },
              { name: "绿色", color: "#10b981" },
              { name: "橙色", color: "#f97316" },
              { name: "红色", color: "#ef4444" },
            ].map((preset) => (
              <button
                key={preset.color}
                onClick={() => setThemeColor(preset.color)}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-xs transition-colors hover:bg-black/5"
                style={{
                  borderColor: themeColor === preset.color ? preset.color : undefined,
                  borderWidth: themeColor === preset.color ? 2 : 1,
                }}
              >
                <span
                  className="mr-1.5 inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: preset.color }}
                />
                {preset.name}
              </button>
            ))}
          </div>

          {/* 主题色按钮演示 */}
          <div style={getThemeStyles(themeColor)} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="themed" size="lg">
                主题色按钮 (Large)
              </Button>
              <Button variant="themed" size="md">
                主题色按钮 (Medium)
              </Button>
              <Button variant="themed" size="sm">
                主题色按钮 (Small)
              </Button>
            </div>

            {/* 其他主题色元素 */}
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className="text-themed text-sm underline">
                主题色链接
              </a>
              <span className="border-themed rounded border-2 px-3 py-1 text-sm">
                主题色边框
              </span>
              <span className="bg-themed-light rounded px-3 py-1 text-sm">
                主题色浅背景
              </span>
            </div>
          </div>
        </section>

        {/* ========== 按钮变体展示 ========== */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">4. Button 组件变体</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="text">Text</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </section>

        {/* 提示信息 */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>提示：</strong>这是一个开发测试页面，用于验证 UI 组件功能。
          生产环境中可以删除此页面。
        </div>
      </div>
    </main>
  );
}
