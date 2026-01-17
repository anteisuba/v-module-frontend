// components/theme/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect } from "react";

export interface ThemeConfig {
  themeColor: string;
  fontFamily: string;
}

const ThemeContext = createContext<ThemeConfig>({
  themeColor: "#000000",
  fontFamily: "Inter",
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  themeColor?: string;
  fontFamily?: string;
}

export function ThemeProvider({
  children,
  themeColor = "#000000",
  fontFamily = "Inter",
}: ThemeProviderProps) {
  // 使用 useEffect 将主题注入到 CSS 变量
  useEffect(() => {
    // 注入主题色到 existing CSS 变量
    document.documentElement.style.setProperty("--theme-primary", themeColor);
    // 计算 hover 和 active 颜色（简单的颜色变亮/变暗）
    document.documentElement.style.setProperty("--theme-primary-hover", themeColor);
    document.documentElement.style.setProperty("--theme-primary-active", themeColor);
    
    // 注入字体家族
    document.documentElement.style.setProperty("--font-sans", fontFamily);
    
    // 同时为兼容性保留原变量名
    document.documentElement.style.setProperty("--theme-color", themeColor);
    document.documentElement.style.setProperty("--theme-font-family", fontFamily);
  }, [themeColor, fontFamily]);


  const value: ThemeConfig = {
    themeColor,
    fontFamily,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
