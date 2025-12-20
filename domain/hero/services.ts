// domain/hero/services.ts
import { prisma } from "@/lib/prisma";
import type { HeroSlideDB } from "./types";
import { DEFAULT_HERO_SLIDES } from "./constants";

export function normalizeSlides(v: unknown): HeroSlideDB[] {
  if (!Array.isArray(v)) return [];

  const out: HeroSlideDB[] = [];

  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;

    const slot = Number(o.slot);
    const src = typeof o.src === "string" ? o.src : "";
    const altRaw = o.alt;
    const alt =
      typeof altRaw === "string" && altRaw.trim().length > 0
        ? altRaw.trim()
        : undefined;

    if ((slot === 1 || slot === 2 || slot === 3) && src) {
      out.push({ slot: slot as 1 | 2 | 3, src, alt });
    }
  }

  // ✅ 保证顺序 + 每个 slot 只保留一个
  const bySlot = new Map<number, HeroSlideDB>();
  for (const s of out) bySlot.set(s.slot, s);

  return [1, 2, 3].map((n) => bySlot.get(n)).filter(Boolean) as HeroSlideDB[];
}

/**
 * 补齐 Hero slides 到 3 张
 * 如果 DB 中只有 1-2 张，用 DEFAULT_HERO_SLIDES 填充缺失的 slot
 */
export function fillSlidesWithDefaults(dbSlides: HeroSlideDB[]): HeroSlideDB[] {
  const bySlot = new Map<number, HeroSlideDB>();
  for (const slide of dbSlides) {
    bySlot.set(slide.slot, slide);
  }

  // 确保返回 3 张，缺失的用 DEFAULT 填充
  return [1, 2, 3].map((slot) => {
    return bySlot.get(slot) ?? DEFAULT_HERO_SLIDES[slot - 1];
  });
}

export async function getPublicHeroSlides(
  siteKey?: string
): Promise<HeroSlideDB[]> {
  // ✅ 当前实现：取最新一条配置（未来可通过 siteKey 扩展多站点支持）
  // TODO: 未来如果需要多站点，可以在 SiteConfig 中添加 siteKey 字段
  const config = await prisma.siteConfig.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { heroSlides: true },
  });

  const dbSlides = normalizeSlides(config?.heroSlides);

  // ✅ 补齐到 3 张（缺失的用 DEFAULT 填充）
  return fillSlidesWithDefaults(dbSlides);
}
