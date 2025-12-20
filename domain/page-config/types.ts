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

export type PageConfig = {
  // 页面背景（全局）
  background: BackgroundConfig;
  
  // 所有 sections（按 order 排序后渲染）
  sections: SectionConfig[];
  
  // 元数据（可选）
  meta?: {
    title?: string;
    description?: string;
  };
};

