"use client";

import React from "react";
import dynamic from "next/dynamic";

// 动态导入 Inspector，禁用 SSR，确保只在客户端加载
// 这样可以避免 hydration 不匹配，同时确保 Inspector 正常工作
const Inspector = dynamic(
  () =>
    import("react-dev-inspector").then((mod) => {
      return { default: mod.Inspector };
    }),
  {
    ssr: false,
  }
);

export const InspectorWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isDev = process.env.NODE_ENV === "development";

  // 如果不是开发环境，直接返回 children
  if (!isDev) {
    return <>{children}</>;
  }

  // 在开发环境中，使用动态导入的 Inspector 包裹 children
  return (
    <Inspector
      // 自定义快捷键：Cmd + Shift + X (Mac) 或 Ctrl + Shift + X (Windows)
      // 使用 "control" 在 Mac 上会自动映射到 Cmd，在 Windows 上映射到 Ctrl
      keys={["control", "shift", "x"]}
      onInspectElement={(inspect) => {
        console.log("正在跳转到代码:", inspect);
      }}
    >
      {children}
    </Inspector>
  );
};

