// components/theme/ThemeProvider.tsx
"use client";

import { createContext, useContext } from "react";
import type { ThemeConfig } from "@/domain/page-config/types";

// Context 只传递 theme 值，CSS 变量由服务端 layout.tsx 注入
const ThemeContext = createContext<ThemeConfig>({});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: ThemeConfig;
  /** @deprecated 使用 theme.primaryColor */
  themeColor?: string;
  /** @deprecated 使用 theme.bodyFont */
  fontFamily?: string;
}

export function ThemeProvider({
  children,
  theme,
  themeColor,
  fontFamily,
}: ThemeProviderProps) {
  const value: ThemeConfig = theme ?? {
    primaryColor: themeColor || "#c9a96e",
    bodyFont: fontFamily || "var(--font-jost)",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export type { ThemeConfig };
