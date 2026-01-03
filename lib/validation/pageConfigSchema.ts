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
        objectPosition: z.string().optional(), // 图片位置
      })
    )
    .max(10), // 允许空数组，最多 10 张
  title: z.string().optional(),
  subtitle: z.string().optional(),
  layout: z
    .object({
      heightVh: z.number().min(50).max(300).optional(), // 高度（vh），50-300
      backgroundColor: z.string().optional(), // 背景颜色
      backgroundOpacity: z.number().min(0).max(1).optional(), // 背景透明度 0-1
    })
    .optional(),
  carousel: z
    .object({
      autoplayInterval: z.number().min(1).max(30).optional(), // 每张图片显示时长（秒），1-30
      transitionDuration: z.number().min(0.1).max(10).optional(), // 切换过渡时间（秒），0.1-10
    })
    .optional(),
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

const NewsSectionPropsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      src: z.string().min(1),
      alt: z.string().optional(),
      href: z.string().min(1), // 外部链接，必填
      objectPosition: z.string().optional(), // 图片位置
    })
  ),
  layout: z
    .object({
      paddingY: z.number().min(0).max(200).optional(), // 上下内边距（px），0-200
      backgroundColor: z.string().optional(), // 背景颜色
      backgroundOpacity: z.number().min(0).max(1).optional(), // 背景透明度 0-1
      maxWidth: z.string().optional(), // 最大宽度，如 "7xl", "6xl", "full" 等
    })
    .optional(),
});

const SectionConfigSchema = z.discriminatedUnion("type", [
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
  z.object({
    id: z.string(),
    type: z.literal("news"),
    props: NewsSectionPropsSchema,
    enabled: z.boolean(),
    order: z.number().int().min(0),
  }),
]);

const SocialLinkItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  icon: z.string().optional(),
  enabled: z.boolean(),
});

export const PageConfigSchema = z.object({
  background: BackgroundConfigSchema,
  newsBackground: BackgroundConfigSchema.optional(), // 新闻页面背景（用于 NewsListSection、/news 和 /news/[id] 页面）
  sections: z.array(SectionConfigSchema).max(20), // 最多 20 个 sections
  logo: z
    .object({
      src: z.string().optional(),
      alt: z.string().optional(),
      opacity: z.number().min(0).max(1).optional(), // Logo 透明度 0-1
    })
    .optional(),
  socialLinks: z.array(SocialLinkItemSchema).max(10).optional(), // 最多 10 个社交链接
  showHeroThumbStrip: z.boolean().optional(), // 是否显示 Hero 缩略图条
  showLogo: z.boolean().optional(), // 是否显示 Logo
  showSocialLinks: z.boolean().optional(), // 是否显示社交链接
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  hasPublished: z.boolean().optional(), // 是否已发布过
});

export type ValidatedPageConfig = z.infer<typeof PageConfigSchema>;
