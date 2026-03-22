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

  // 将 sections 按 Full / 非 Full 分组，Full 的脱离 container，非 Full 的合并到同一个 grid
  type Group =
    | { kind: "full"; section: (typeof sortedSections)[number] }
    | { kind: "grid"; sections: (typeof sortedSections)[number][] };

  const groups: Group[] = [];
  for (const section of sortedSections) {
    const colSpan = section.layout?.colSpan || 4;
    if (colSpan === 4) {
      groups.push({ kind: "full", section });
    } else {
      const last = groups[groups.length - 1];
      if (last && last.kind === "grid") {
        last.sections.push(section);
      } else {
        groups.push({ kind: "grid", sections: [section] });
      }
    }
  }

  function renderWrapped(section: (typeof sortedSections)[number]) {
    const rendered = renderSection(section, config);
    if (rendered == null) return null;

    if (section.type === "video") {
      return (
        <Suspense
          key={section.id}
          fallback={
            <div className="flex aspect-[16/9] items-center justify-center text-sm text-[color:var(--editorial-muted)]">
              Loading video...
            </div>
          }
        >
          {rendered}
        </Suspense>
      );
    }

    return rendered;
  }

  return (
    <main
      className="editorial-shell min-h-screen"
      style={backgroundStyle}
      data-testid="public-page-renderer"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(8,8,6,0.38)_52%,rgba(8,8,6,0.6))]" />

      {groups.map((group, gi) => {
        if (group.kind === "full") {
          const rendered = renderWrapped(group.section);
          if (rendered == null) return null;

          // Full: 脱离 container，充满整个页面宽度，不加 card 样式
          return (
            <div key={group.section.id} className="relative w-full overflow-clip">
              {rendered}
            </div>
          );
        }

        // Grid: 非 Full 的 sections 放在 editorial-container 内
        return (
          <div key={`grid-${gi}`} className="editorial-container">
            <div className="grid auto-rows-min grid-cols-1 gap-5 md:grid-cols-4">
              {group.sections.map((section) => {
                const rendered = renderWrapped(section);
                if (rendered == null) return null;

                const colSpan = section.layout?.colSpan || 4;
                const colSpanClass = colSpanClasses[colSpan];

                return (
                  <div
                    key={section.id}
                    className={`${section.type === "hero" ? "" : "reveal editorial-card overflow-hidden"} col-span-1 ${colSpanClass}`}
                  >
                    {rendered}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </main>
  );
}


