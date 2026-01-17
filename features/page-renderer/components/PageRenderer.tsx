// features/page-renderer/components/PageRenderer.tsx

import { Suspense } from "react";
import type { PageConfig } from "@/domain/page-config/types";
import { renderSection } from "../registry";

export default function PageRenderer({ config }: { config: PageConfig }) {
  // 排序 sections（按 order 字段）
  // Hero section 始终排在最前面，无论其 order 值
  const sortedSections = [...config.sections]
    .filter((s) => s.enabled) // 只渲染启用的
    .sort((a, b) => {
      // Hero section 始终排在最前面
      if (a.type === "hero") return -1;
      if (b.type === "hero") return 1;
      // 其他 sections 按 order 排序
      return a.order - b.order;
    });

  // 应用背景样式
  const backgroundStyle: React.CSSProperties = {
    ...(config.background.type === "color"
      ? { backgroundColor: config.background.value }
      : {
          backgroundImage: `url(${config.background.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }),
  };

  // Tailwind 列跨度映射（因为 Tailwind 不支持动态 class 拼接）
  const colSpanClasses = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
  } as const;

  return (
    <main className="min-h-screen" style={backgroundStyle}>
      {/* Bento Grid 容器：移动端单列，桌面端 4 列 */}
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4 auto-rows-min">
        {sortedSections.map((section) => {
          // 获取列跨度，默认为 4 (全宽)
          const colSpan = section.layout?.colSpan || 4;
          const colSpanClass = colSpanClasses[colSpan];
          
          // Hero section 特殊处理：始终全宽，不应用 Bento 卡片样式
          if (section.type === "hero") {
            return (
              <div
                key={section.id}
                className="col-span-1 md:col-span-4"
              >
                {renderSection(section, config)}
              </div>
            );
          }
          
          // 为 Video section 单独设置 Suspense 边界
          if (section.type === "video") {
            return (
              <div
                key={section.id}
                className={`col-span-1 ${colSpanClass} rounded-3xl bg-white/60 backdrop-blur-md overflow-hidden border border-white/20 shadow-sm transition-all hover:shadow-md`}
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center w-full aspect-[16/9] bg-black/5">
                      <div className="text-sm text-black/50">Loading video...</div>
                    </div>
                  }
                >
                  {renderSection(section)}
                </Suspense>
              </div>
            );
          }
          
          // 其他 sections：应用 Bento 卡片样式
          return (
            <div
              key={section.id}
              className={`col-span-1 ${colSpanClass} rounded-3xl bg-white/60 backdrop-blur-md overflow-hidden border border-white/20 shadow-sm transition-all hover:shadow-md`}
            >
              {renderSection(section)}
            </div>
          );
        })}
      </div>
    </main>
  );
}



