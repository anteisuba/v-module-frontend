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
    <main
      className="editorial-shell min-h-screen"
      style={backgroundStyle}
      data-testid="public-page-renderer"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(8,8,6,0.38)_52%,rgba(8,8,6,0.6))]" />
      <div className="editorial-container">
        <div className="grid auto-rows-min grid-cols-1 gap-5 md:grid-cols-4">
          {sortedSections.map((section) => {
            const renderedSection = renderSection(section, config);

            if (renderedSection == null) {
              return null;
            }

            const colSpan = section.layout?.colSpan || 4;
            const colSpanClass = colSpanClasses[colSpan];

            if (section.type === "hero") {
              return (
                <div key={section.id} className="col-span-1 md:col-span-4">
                  {renderedSection}
                </div>
              );
            }

            if (section.type === "video") {
              return (
                <div
                  key={section.id}
                  className={`reveal col-span-1 ${colSpanClass} editorial-card overflow-hidden`}
                >
                  <Suspense
                    fallback={
                      <div className="flex aspect-[16/9] items-center justify-center text-sm text-[color:var(--editorial-muted)]">
                        Loading video...
                      </div>
                    }
                  >
                    {renderedSection}
                  </Suspense>
                </div>
              );
            }

            return (
              <div
                key={section.id}
                className={`reveal col-span-1 ${colSpanClass} editorial-card overflow-hidden`}
              >
                {renderedSection}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}


