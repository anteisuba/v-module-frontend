// lib/siteConfig.ts
import { prisma } from "@/lib/prisma";

export type HeroSlideDB = {
  slot: 1 | 2 | 3;
  src: string;
  alt?: string; // ✅ 注意：这里不要 null
};

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

export async function getPublicHeroSlides(): Promise<HeroSlideDB[]> {
  const config = await prisma.siteConfig.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { heroSlides: true },
  });

  return normalizeSlides(config?.heroSlides);
}
