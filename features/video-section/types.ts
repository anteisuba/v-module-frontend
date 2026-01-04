// features/video-section/types.ts

export type VideoPlatform = 'youtube' | 'bilibili';

export type VideoItem = {
  id: string;
  url: string;
  platform?: 'youtube' | 'bilibili' | 'auto';
  title?: string;
  thumbnail?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  startTime?: number;
};

