// features/page-renderer/components/PageRenderer.tsx

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

  return (
    <main className="min-h-screen" style={backgroundStyle}>
      {sortedSections.map((section) => {
        // 如果是 hero section，传递 pageConfig 以支持 logo 和 socialLinks
        if (section.type === "hero") {
          return renderSection(section, config);
        }
        return renderSection(section);
      })}
    </main>
  );
}

