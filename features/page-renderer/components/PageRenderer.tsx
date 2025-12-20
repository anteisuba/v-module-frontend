// features/page-renderer/components/PageRenderer.tsx

import type { PageConfig } from "@/domain/page-config/types";
import { renderSection } from "../registry";

export default function PageRenderer({ config }: { config: PageConfig }) {
  // 排序 sections（按 order 字段）
  const sortedSections = [...config.sections]
    .filter((s) => s.enabled) // 只渲染启用的
    .sort((a, b) => a.order - b.order);

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
      {sortedSections.map((section) => renderSection(section))}
    </main>
  );
}

