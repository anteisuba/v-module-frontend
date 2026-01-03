"use client";

import React from "react";
// import dynamic from "next/dynamic";

// 暂时禁用 react-dev-inspector，因为它与 Next.js 16 的 params Promise 有兼容性问题
// 动态导入 Inspector，禁用 SSR，确保只在客户端加载
// 这样可以避免 hydration 不匹配，同时确保 Inspector 正常工作
// const Inspector = dynamic(
//   () =>
//     import("react-dev-inspector").then((mod) => {
//       return { default: mod.Inspector };
//     }),
//   {
//     ssr: false,
//   }
// );

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

  // 暂时禁用 react-dev-inspector，因为它与 Next.js 16 的 params Promise 有兼容性问题
  // react-dev-inspector 在序列化组件时会尝试枚举 props，导致 params Promise 被访问
  // 这会导致 "params are being enumerated" 错误
  // TODO: 等待 react-dev-inspector 更新以支持 Next.js 16
  return <>{children}</>;

  // 在开发环境中，使用动态导入的 Inspector 包裹 children
  // 注意：react-dev-inspector 可能与 Next.js 16 的 params Promise 有兼容性问题
  // 如果遇到序列化错误，可以暂时禁用 Inspector
  // return (
  //   <Inspector
  //     // 自定义快捷键：Cmd + Shift + X (Mac) 或 Ctrl + Shift + X (Windows)
  //     // 使用 "control" 在 Mac 上会自动映射到 Cmd，在 Windows 上映射到 Ctrl
  //     keys={["control", "shift", "x"]}
  //     onInspectElement={(inspect) => {
  //       console.log("正在跳转到代码:", inspect);
  //     }}
  //   >
  //     {children}
  //   </Inspector>
  // );
};

