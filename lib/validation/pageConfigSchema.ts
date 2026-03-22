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
        heightVh: z.number().min(20).max(300).optional(), // 单张 slide 高度（vh）
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
      parallax: z.boolean().optional(), // 是否开启视差滚动
    })
    .optional(),
  carousel: z
    .object({
      autoplayInterval: z.number().min(1).max(30).optional(), // 每张图片显示时长（秒），1-30
      transitionDuration: z.number().min(0.1).max(10).optional(), // 切换过渡时间（秒），0.1-10
    })
    .optional(),
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
      href: z.string().default(""), // 外部链接，允许为空（用户可能先选图再填链接）
      objectPosition: z.string().optional(), // 图片位置
    })
  ),
  layout: z
    .object({
      paddingY: z.number().min(0).max(200).optional(), // 上下内边距（px），0-200
      paddingX: z.number().min(0).max(200).optional(), // 左右内边距（px），0-200
      backgroundColor: z.string().optional(), // 背景颜色
      backgroundOpacity: z.number().min(0).max(1).optional(), // 背景透明度 0-1
      maxWidth: z.string().optional(), // 最大宽度，如 "7xl", "6xl", "full" 等
    })
    .optional(),
});

const VideoSectionPropsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        url: z
          .string()
          .refine(
            (val) => !val || val.trim() === "" || z.string().url().safeParse(val).success,
            { message: "Must be a valid URL or empty string" }
          )
          .optional(), // URL 可选，允许空字符串或有效 URL
        platform: z.enum(["youtube", "bilibili", "auto"]).optional(), // 平台类型
        title: z.string().optional(), // 视频标题
        thumbnail: z.string().url().optional().or(z.literal("")), // 自定义缩略图，允许空字符串
      })
    )
    .max(10), // 最多 10 个视频，允许空数组
  layout: z
    .object({
      paddingY: z.number().min(0).max(200).optional(), // 上下内边距（px），0-200
      paddingX: z.number().min(0).max(200).optional(), // 左右内边距（px），0-200
      backgroundColor: z.string().optional(), // 背景颜色
      backgroundOpacity: z.number().min(0).max(1).optional(), // 背景透明度 0-1
      maxWidth: z.string().optional(), // 最大宽度，如 "7xl", "6xl", "full" 等
      aspectRatio: z.enum(["16:9", "4:3", "1:1", "auto"]).optional(), // 宽高比
    })
    .optional(),
  display: z
    .object({
      columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(), // 网格列数
      gap: z.enum(["sm", "md", "lg"]).optional(), // 间距
    })
    .optional(),
});

const NavLinkItemSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().optional(),
  href: z.string().optional(),
  enabled: z.boolean(),
});

const MenuSectionPropsSchema = z.object({
  items: z.array(NavLinkItemSchema).max(20).optional(),
  style: z
    .object({
      backdropBlur: z.boolean().optional(),
      buttonVariant: z.enum(["default", "outline", "ghost"]).optional(),
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
  z.object({
    id: z.string(),
    type: z.literal("video"),
    props: VideoSectionPropsSchema,
    enabled: z.boolean(),
    order: z.number().int().min(0),
  }),
  z.object({
    id: z.string(),
    type: z.literal("menu"),
    props: MenuSectionPropsSchema,
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
  newsBackground: BackgroundConfigSchema.optional(), // 新闻页面背景
  blogBackground: BackgroundConfigSchema.optional(), // 博客列表页面背景
  blogDetailBackground: BackgroundConfigSchema.optional(), // 博客详情页面背景
  shopBackground: BackgroundConfigSchema.optional(), // 商店列表页面背景
  shopDetailBackground: BackgroundConfigSchema.optional(), // 商品详情页面背景
  sections: z.array(SectionConfigSchema).max(20), // 最多 20 个 sections
  logo: z
    .object({
      src: z.string().optional(),
      alt: z.string().optional(),
      opacity: z.number().min(0).max(1).optional(), // Logo 透明度 0-1
      size: z.number().min(24).max(120).optional(), // Logo 显示尺寸（px）
    })
    .optional(),
  socialLinks: z.array(SocialLinkItemSchema).max(10).optional(), // 最多 10 个社交链接
  logoPosition: z.enum(["top-left", "top-center"]).optional(), // Logo 位置
  socialLinksPosition: z.enum(["top-right", "bottom-center"]).optional(), // 社交链接位置
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
