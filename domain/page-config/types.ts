// domain/page-config/types.ts

export type BackgroundType = 'color' | 'image';

export type SectionType = 'hero' | 'links' | 'gallery' | 'news';

export type BackgroundConfig = 
  | { type: 'color'; value: string }  // hex color, e.g. "#000000"
  | { type: 'image'; value: string }; // image src, e.g. "/uploads/user123/bg.jpg"

export type HeroSectionProps = {
  slides: Array<{
    src: string;
    alt?: string;
    href?: string;
    objectPosition?: string; // 图片位置，如 "center", "top", "bottom", "50% 50%" 等
  }>;
  title?: string;
  subtitle?: string;
  // 布局配置
  layout?: {
    heightVh?: number; // 高度（vh单位），默认 150
    backgroundColor?: string; // 背景颜色，默认 "black"
    backgroundOpacity?: number; // 背景透明度（0-1），默认 1
  };
};

export type LinksSectionProps = {
  items: Array<{
    id: string;
    label: string;
    href: string;
    icon?: string; // emoji 或 icon name
  }>;
  layout?: 'grid' | 'list'; // 布局方式
};

export type GallerySectionProps = {
  items: Array<{
    id: string;
    src: string;
    alt?: string;
    caption?: string;
    href?: string;
  }>;
  columns?: 2 | 3 | 4; // 网格列数
  gap?: 'sm' | 'md' | 'lg';
};

export type NewsSectionProps = {
  items: Array<{
    id: string;
    src: string;
    alt?: string;
    href: string; // 外部链接
    objectPosition?: string; // 图片位置，如 "center", "top", "bottom", "50% 50%" 等
  }>;
  // 布局配置
  layout?: {
    paddingY?: number; // 上下内边距（px），默认 64 (py-16)
    backgroundColor?: string; // 背景颜色，默认 "black"
    backgroundOpacity?: number; // 背景透明度（0-1），默认 1
    maxWidth?: string; // 最大宽度，默认 "7xl"
  };
};

export type SectionConfig = 
  | { id: string; type: 'hero'; props: HeroSectionProps; enabled: boolean; order: number }
  | { id: string; type: 'links'; props: LinksSectionProps; enabled: boolean; order: number }
  | { id: string; type: 'gallery'; props: GallerySectionProps; enabled: boolean; order: number }
  | { id: string; type: 'news'; props: NewsSectionProps; enabled: boolean; order: number };

export type SocialLinkItem = {
  id: string; // 唯一标识
  name: string; // 显示名称（如 "Twitter"、"YouTube"）
  url: string; // 链接地址
  icon?: string; // 图标（emoji 或文字，如 "X"、"YT"、"GH"）
  enabled: boolean; // 是否显示
};

export type PageConfig = {
  // 页面背景（全局）
  background: BackgroundConfig;
  
  // 新闻页面背景（用于 NewsListSection、/news 和 /news/[id] 页面）
  newsBackground?: BackgroundConfig;
  
  // 所有 sections（按 order 排序后渲染）
  sections: SectionConfig[];
  
  // Logo 配置（左上角 ano 位置）
  logo?: {
    src?: string; // 图片路径，如果为空则显示文字 "ano"
    alt?: string;
  };
  
  // 社交链接配置（右上角）- 动态数组
  socialLinks?: SocialLinkItem[];
  
  // 是否显示 Hero 轮播缩略图条（HeroThumbStrip）
  showHeroThumbStrip?: boolean;
  
  // 是否显示 Logo
  showLogo?: boolean;
  
  // 是否显示社交链接
  showSocialLinks?: boolean;
  
  // 元数据（可选）
  meta?: {
    title?: string;
    description?: string;
  };

  // 是否已发布过（用于防止清空已发布的配置）
  hasPublished?: boolean;
};

