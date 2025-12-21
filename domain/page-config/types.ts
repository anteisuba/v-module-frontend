// domain/page-config/types.ts

export type BackgroundType = 'color' | 'image';

export type SectionType = 'hero' | 'links' | 'gallery';

export type BackgroundConfig = 
  | { type: 'color'; value: string }  // hex color, e.g. "#000000"
  | { type: 'image'; value: string }; // image src, e.g. "/uploads/user123/bg.jpg"

export type HeroSectionProps = {
  slides: Array<{
    src: string;
    alt?: string;
    href?: string;
  }>;
  title?: string;
  subtitle?: string;
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

export type SectionConfig = 
  | { id: string; type: 'hero'; props: HeroSectionProps; enabled: boolean; order: number }
  | { id: string; type: 'links'; props: LinksSectionProps; enabled: boolean; order: number }
  | { id: string; type: 'gallery'; props: GallerySectionProps; enabled: boolean; order: number };

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
  
  // 所有 sections（按 order 排序后渲染）
  sections: SectionConfig[];
  
  // Logo 配置（左上角 ano 位置）
  logo?: {
    src?: string; // 图片路径，如果为空则显示文字 "ano"
    alt?: string;
  };
  
  // 社交链接配置（右上角）- 动态数组
  socialLinks?: SocialLinkItem[];
  
  // 元数据（可选）
  meta?: {
    title?: string;
    description?: string;
  };
};

