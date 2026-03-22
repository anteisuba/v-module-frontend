// domain/page-config/presets.ts

import type { ThemeConfig, ThemePresetId } from "./types";

export const THEME_PRESETS: Record<ThemePresetId, ThemeConfig> = {
  editorial: {
    presetId: "editorial",
    primaryColor: "#c9a96e",
    backgroundColor: "#0d0d0b",
    surfaceColor: "#141410",
    textColor: "#e8e4d9",
    headingFont: "var(--font-cormorant)",
    bodyFont: "var(--font-jost)",
    borderRadius: "1.5rem",
    overlay:
      "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(8,8,6,0.38) 52%, rgba(8,8,6,0.6))",
  },
  vivid: {
    presetId: "vivid",
    primaryColor: "#6366f1",
    backgroundColor: "#f8f6f1",
    surfaceColor: "#ffffff",
    textColor: "#1a1a18",
    headingFont: "var(--font-jost)",
    bodyFont: "var(--font-jost)",
    borderRadius: "1rem",
    overlay: "none",
  },
  mono: {
    presetId: "mono",
    primaryColor: "#171717",
    backgroundColor: "#fafafa",
    surfaceColor: "#f5f5f5",
    textColor: "#171717",
    headingFont: "var(--font-geist-mono)",
    bodyFont: "var(--font-jost)",
    borderRadius: "0",
    overlay:
      "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(250,250,250,0.05))",
  },
};

export const DEFAULT_PRESET: ThemePresetId = "editorial";
