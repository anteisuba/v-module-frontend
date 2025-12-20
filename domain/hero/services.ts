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

// 此函数已废弃，首页现在直接使用默认配置
// 保留函数定义以避免编译错误，但不再从数据库读取
export async function getPublicHeroSlides(
  siteKey?: string
): Promise<HeroSlideDB[]> {
  // 直接返回默认配置
  return DEFAULT_HERO_SLIDES;
}
