// features/video-section/utils/urlParser.ts

/**
 * 检测视频平台类型
 */
export function detectPlatform(url: string): 'youtube' | 'bilibili' | null {
  const lowerUrl = url.toLowerCase().trim();
  
  // YouTube 检测
  if (
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('youtube-nocookie.com')
  ) {
    return 'youtube';
  }
  
  // Bilibili 检测
  if (
    lowerUrl.includes('bilibili.com') ||
    lowerUrl.includes('b23.tv')
  ) {
    return 'bilibili';
  }
  
  return null;
}

/**
 * 解析 YouTube URL，提取视频 ID
 */
export function parseYouTubeUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * 解析 Bilibili URL，提取 BV 号或 av 号
 */
export function parseBilibiliUrl(url: string): { bvid?: string; aid?: string } | null {
  // BV 号格式：BV1xx411c7mu
  const bvMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
  if (bvMatch && bvMatch[1]) {
    return { bvid: bvMatch[1] };
  }
  
  // av 号格式：av123456
  const avMatch = url.match(/\/video\/(av\d+)/i);
  if (avMatch && avMatch[1]) {
    return { aid: avMatch[1] };
  }
  
  // 短链接 b23.tv 需要解析，但这里只返回原始 URL，让 react-player 处理
  if (url.includes('b23.tv')) {
    return { bvid: undefined, aid: undefined };
  }
  
  return null;
}

/**
 * 标准化视频 URL（确保可以被 react-player 识别）
 */
export function normalizeVideoUrl(url: string, platform?: 'youtube' | 'bilibili' | 'auto'): string {
  if (!url || !url.trim()) {
    return '';
  }
  
  const trimmedUrl = url.trim();
  const detectedPlatform = platform === 'auto' || !platform 
    ? detectPlatform(trimmedUrl) 
    : platform;
  
  if (!detectedPlatform) {
    // 如果无法检测平台，返回原始 URL
    return trimmedUrl;
  }
  
  if (detectedPlatform === 'youtube') {
    const videoId = parseYouTubeUrl(trimmedUrl);
    if (videoId) {
      // 确保返回标准的 YouTube watch URL
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    // 如果无法解析视频 ID，返回原始 URL（让 react-player 尝试处理）
    return trimmedUrl;
  }
  
  if (detectedPlatform === 'bilibili') {
    // Bilibili URL 保持原样，react-player 会处理
    return trimmedUrl;
  }
  
  return trimmedUrl;
}

