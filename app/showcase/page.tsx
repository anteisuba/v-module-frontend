// app/showcase/page.tsx
// Showcase landing page — demonstrates platform visual diversity with 3 demo sites

import { prisma } from "@/lib/prisma";
import { normalizePageConfig } from "@/utils/pageConfig";
import { THEME_PRESETS } from "@/domain/page-config/presets";
import type { ThemePresetId } from "@/domain/page-config/types";
import Link from "next/link";

// Demo site slugs — these are created via CMS with different presets
const DEMO_SLUGS = ["demo-editorial", "demo-vivid", "demo-mono"] as const;

const DEMO_META: Record<
  string,
  { label: string; presetId: ThemePresetId; persona: string }
> = {
  "demo-editorial": {
    label: "Editorial",
    presetId: "editorial",
    persona: "Musician — dark, cinematic brand",
  },
  "demo-vivid": {
    label: "Vivid",
    presetId: "vivid",
    persona: "VTuber — bright, energetic brand",
  },
  "demo-mono": {
    label: "Mono",
    presetId: "mono",
    persona: "Photographer — minimal, geometric brand",
  },
};

async function getDemoPages() {
  const pages = await prisma.page.findMany({
    where: { slug: { in: [...DEMO_SLUGS] } },
    select: {
      slug: true,
      themeColor: true,
      publishedConfig: true,
    },
  });

  return DEMO_SLUGS.map((slug) => {
    const page = pages.find((p) => p.slug === slug);
    const meta = DEMO_META[slug];
    const config = page ? normalizePageConfig(page.publishedConfig) : null;
    const preset = THEME_PRESETS[meta.presetId];

    return {
      slug,
      ...meta,
      hasData: !!page?.publishedConfig,
      themeColor: page?.themeColor || preset.primaryColor || "#000000",
      backgroundColor: config?.theme?.backgroundColor || preset.backgroundColor,
      textColor: config?.theme?.textColor || preset.textColor,
      primaryColor: config?.theme?.primaryColor || preset.primaryColor,
    };
  });
}

export default async function ShowcasePage() {
  const demos = await getDemoPages();

  return (
    <main className="min-h-screen bg-[#fafaf8]">
      {/* Hero */}
      <section className="px-6 pb-16 pt-24 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          No-Code Creator Platform
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-light leading-tight tracking-tight text-black/90 md:text-5xl">
          One platform,{" "}
          <span className="italic">infinite styles</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-black/50">
          Every creator deserves a site that looks custom-built. Choose a preset,
          pick your variants, and launch in minutes — not months.
        </p>
      </section>

      {/* Demo Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          {demos.map((demo) => (
            <Link
              key={demo.slug}
              href={`/u/${demo.slug}`}
              className="group block overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Theme color preview band */}
              <div
                className="flex h-36 items-end p-5"
                style={{ backgroundColor: demo.backgroundColor, color: demo.textColor }}
              >
                <div>
                  <div
                    className="mb-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
                    style={{ backgroundColor: demo.primaryColor }}
                  >
                    {demo.label}
                  </div>
                  <div className="mt-1 text-sm font-light opacity-80">
                    {demo.persona}
                  </div>
                </div>
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-3 border-t border-black/5 px-5 py-4">
                <div className="flex gap-1">
                  {[demo.backgroundColor, demo.primaryColor, demo.textColor].map(
                    (color, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
                <span className="flex-1 text-xs text-black/40">
                  {demo.hasData ? "Live demo" : "Coming soon"}
                </span>
                <span className="text-xs text-black/30 transition-colors group-hover:text-black/60">
                  Visit →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-t border-black/8 bg-white px-6 py-20 text-center">
        <h2 className="text-2xl font-light tracking-tight text-black/80">
          Built for creators who want more than a template
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-3">
          {[
            {
              title: "Theme Presets",
              desc: "3 curated color schemes with one-click switching. Background, surface, text, and accent — all coordinated.",
            },
            {
              title: "Section Variants",
              desc: "News carousel or timeline? Grid gallery or masonry? Choose the layout that fits your content.",
            },
            {
              title: "Your Brand, Your Way",
              desc: "Custom accent colors, heading fonts, and overlay controls. Make it unmistakably yours.",
            },
          ].map((item) => (
            <div key={item.title} className="text-left">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-black/60">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-black/45">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-black/30">
          v-module &middot; no-code creator platform
        </p>
      </section>
    </main>
  );
}
