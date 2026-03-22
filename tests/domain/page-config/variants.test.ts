// tests/domain/page-config/variants.test.ts

import { describe, it, expect } from "vitest";
import { PageConfigSchema } from "@/lib/validation/pageConfigSchema";

describe("Section Variants", () => {
  it("accepts valid variant values", () => {
    const cases = [
      { type: "news" as const, variant: "grid" },
      { type: "news" as const, variant: "list" },
      { type: "gallery" as const, variant: "masonry" },
      { type: "video" as const, variant: "featured" },
    ];

    for (const { type, variant } of cases) {
      const result = PageConfigSchema.safeParse({
        background: { type: "color", value: "#000000" },
        sections: [
          {
            id: `${type}-1`,
            type,
            enabled: true,
            order: 0,
            variant,
            props: type === "news" ? { items: [] }
              : type === "gallery" ? { items: [] }
              : { items: [] },
          },
        ],
      });
      expect(result.success, `${type} with variant "${variant}" should be valid`).toBe(true);
    }
  });

  it("accepts sections without variant (backward compatible)", () => {
    const result = PageConfigSchema.safeParse({
      background: { type: "color", value: "#000000" },
      sections: [
        {
          id: "news-1",
          type: "news",
          enabled: true,
          order: 0,
          props: { items: [] },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts unknown variant values (open string type)", () => {
    // variant is z.string().optional(), so any string is valid
    // invalid variants are handled at render time by falling back to default
    const result = PageConfigSchema.safeParse({
      background: { type: "color", value: "#000000" },
      sections: [
        {
          id: "news-1",
          type: "news",
          enabled: true,
          order: 0,
          variant: "nonexistent",
          props: { items: [] },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
