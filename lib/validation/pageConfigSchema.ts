// lib/validation/pageConfigSchema.ts

import { z } from "zod";

const BackgroundConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("color"),
    value: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  z.object({
    type: z.literal("image"),
    value: z.string().min(1),
  }),
]);

const HeroSectionPropsSchema = z.object({
  slides: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().optional(),
        href: z.string().optional(),
      })
    )
    .max(10), // 允许空数组，最多 10 张
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

const LinksSectionPropsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1),
      href: z.string().url(),
      icon: z.string().optional(),
    })
  ),
  layout: z.enum(["grid", "list"]).optional(),
});

const GallerySectionPropsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      src: z.string().min(1),
      alt: z.string().optional(),
      caption: z.string().optional(),
      href: z.string().optional(),
    })
  ),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  gap: z.enum(["sm", "md", "lg"]).optional(),
});

const SectionConfigSchema: z.ZodType<any> = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("hero"),
    props: HeroSectionPropsSchema,
    enabled: z.boolean(),
    order: z.number().int().min(0),
  }),
  z.object({
    id: z.string(),
    type: z.literal("links"),
    props: LinksSectionPropsSchema,
    enabled: z.boolean(),
    order: z.number().int().min(0),
  }),
  z.object({
    id: z.string(),
    type: z.literal("gallery"),
    props: GallerySectionPropsSchema,
    enabled: z.boolean(),
    order: z.number().int().min(0),
  }),
]);

export const PageConfigSchema = z.object({
  background: BackgroundConfigSchema,
  sections: z.array(SectionConfigSchema).max(20), // 最多 20 个 sections
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export type ValidatedPageConfig = z.infer<typeof PageConfigSchema>;

