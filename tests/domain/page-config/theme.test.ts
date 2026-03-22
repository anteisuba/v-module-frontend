// tests/domain/page-config/theme.test.ts

import { describe, it, expect } from "vitest";
import { normalizePageConfig } from "@/utils/pageConfig";
import { THEME_PRESETS } from "@/domain/page-config/presets";
import { hexToRgba } from "@/utils/color";
import { PageConfigSchema } from "@/lib/validation/pageConfigSchema";

describe("Theme Presets", () => {
  it("normalizePageConfig fills editorial defaults when no theme exists", () => {
    const config = normalizePageConfig({
      background: { type: "color", value: "#000000" },
      sections: [],
    });

    expect(config.theme).toBeDefined();
    expect(config.theme?.presetId).toBe("editorial");
    expect(config.theme?.backgroundColor).toBe("#0d0d0b");
    expect(config.theme?.primaryColor).toBe("#c9a96e");
  });

  it("normalizePageConfig preserves user theme when present", () => {
    const config = normalizePageConfig({
      background: { type: "color", value: "#000000" },
      sections: [],
      theme: {
        presetId: "vivid",
        primaryColor: "#ff0000",
      },
    });

    expect(config.theme?.presetId).toBe("vivid");
    expect(config.theme?.primaryColor).toBe("#ff0000");
    // Vivid preset defaults fill in missing fields
    expect(config.theme?.backgroundColor).toBe("#f8f6f1");
  });

  it("normalizePageConfig merges preset defaults with user overrides", () => {
    const config = normalizePageConfig({
      background: { type: "color", value: "#000000" },
      sections: [],
      theme: {
        presetId: "mono",
        primaryColor: "#333333", // override mono's default #171717
      },
    });

    expect(config.theme?.presetId).toBe("mono");
    expect(config.theme?.primaryColor).toBe("#333333"); // user override
    expect(config.theme?.backgroundColor).toBe("#fafafa"); // mono default
    expect(config.theme?.borderRadius).toBe("0"); // mono default
  });

  it("normalizePageConfig handles completely empty input", () => {
    const config = normalizePageConfig(null);
    expect(config.theme?.presetId).toBe("editorial");
  });
});

describe("hexToRgba", () => {
  it("converts valid hex to rgba", () => {
    expect(hexToRgba("#ff0000", 1)).toBe("rgba(255, 0, 0, 1)");
    expect(hexToRgba("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });

  it("returns undefined for invalid/missing hex", () => {
    expect(hexToRgba(undefined)).toBeUndefined();
    expect(hexToRgba("")).toBeUndefined();
    expect(hexToRgba("not-a-color")).toBeUndefined();
  });

  it("returns undefined when backgroundColor not set (CSS variable fallback)", () => {
    // This is the key behavior: when section doesn't have explicit bg,
    // hexToRgba returns undefined, so CSS variable --color-bg takes effect
    const result = hexToRgba(undefined, 1);
    expect(result).toBeUndefined();
  });
});

describe("Zod schema validates theme", () => {
  it("accepts config with theme", () => {
    const result = PageConfigSchema.safeParse({
      theme: {
        presetId: "vivid",
        primaryColor: "#6366f1",
        backgroundColor: "#f8f6f1",
      },
      background: { type: "color", value: "#000000" },
      sections: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts config without theme (backward compatible)", () => {
    const result = PageConfigSchema.safeParse({
      background: { type: "color", value: "#000000" },
      sections: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color in theme", () => {
    const result = PageConfigSchema.safeParse({
      theme: { primaryColor: "not-hex" },
      background: { type: "color", value: "#000000" },
      sections: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts section with variant field", () => {
    const result = PageConfigSchema.safeParse({
      background: { type: "color", value: "#000000" },
      sections: [
        {
          id: "news-1",
          type: "news",
          enabled: true,
          order: 1,
          variant: "list",
          props: { items: [] },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("Preset definitions", () => {
  it("all presets have required fields", () => {
    for (const [id, preset] of Object.entries(THEME_PRESETS)) {
      expect(preset.presetId).toBe(id);
      expect(preset.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.headingFont).toBeDefined();
      expect(preset.bodyFont).toBeDefined();
    }
  });

  it("editorial preset matches current dark theme defaults", () => {
    const editorial = THEME_PRESETS.editorial;
    expect(editorial.backgroundColor).toBe("#0d0d0b");
    expect(editorial.primaryColor).toBe("#c9a96e");
    expect(editorial.textColor).toBe("#e8e4d9");
  });
});
