// features/video-section/components/VideoPlayer.tsx

"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { detectPlatform, normalizeVideoUrl } from "../utils/urlParser";
import type { VideoItem } from "../types";

// 动态导入 react-player，避免 SSR 问题
// react-player 3.x 版本：所有播放器都打包在主模块中
const ReactPlayer = dynamic(
  () => import("react-player"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-black/10 rounded-lg">
        <div className="text-sm text-black/50">加载中...</div>
      </div>
    ),
  }
) as any;

interface VideoPlayerProps {
  item: VideoItem;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function VideoPlayer({
  item,
  width = "100%",
  height = "100%",
  className = "",
}: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  
  // 如果 URL 为空，显示占位符
  if (!item.url || !item.url.trim()) {
    return (
      <div className={`flex items-center justify-center bg-black/5 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-xs text-black/40 text-center px-4">
          请输入视频链接
        </div>
      </div>
    );
  }
  
  // 检测平台
  const platform = useMemo(() => {
    return item.platform === 'auto' || !item.platform
      ? detectPlatform(item.url)
      : item.platform;
  }, [item.url, item.platform]);
  
  // 标准化 URL
  const normalizedUrl = useMemo(() => {
    return normalizeVideoUrl(item.url, platform || undefined);
  }, [item.url, platform]);
  
  // 如果无法检测平台，显示错误
  if (!platform) {
    return (
      <div className={`flex items-center justify-center bg-black/10 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-sm text-black/50 text-center px-4">
          不支持的视频平台，请使用 YouTube 或 Bilibili 链接
        </div>
      </div>
    );
  }
  
  // 确保 URL 有效
  if (!normalizedUrl || !normalizedUrl.trim()) {
    return (
      <div className={`flex items-center justify-center bg-black/10 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-sm text-black/50 text-center px-4">
          无效的视频 URL
        </div>
      </div>
    );
  }
  
  // 构建播放器配置
  const playerConfig: any = useMemo(() => {
    const config: any = {};
    
    if (platform === 'youtube') {
      config.youtube = {
        playerVars: {
          start: item.startTime || 0,
          autoplay: item.autoplay ? 1 : 0,
          mute: item.muted ? 1 : 0,
          loop: item.loop ? 1 : 0,
          controls: item.controls !== false ? 1 : 0,
          rel: 0, // 不显示相关视频
          modestbranding: 1, // 减少 YouTube 品牌
          enablejsapi: 1, // 启用 JavaScript API
        },
      };
    } else if (platform === 'bilibili') {
      config.bilibili = {
        // react-player 会自动处理 Bilibili URL
      };
    }
    
    return config;
  }, [platform, item.startTime, item.autoplay, item.muted, item.loop, item.controls]);
  
  // 使用标准化后的 URL
  const finalUrl = normalizedUrl;

  // 调试信息（生产环境可移除）
  if (process.env.NODE_ENV === 'development') {
    console.log('VideoPlayer render:', {
      originalUrl: item.url,
      normalizedUrl,
      finalUrl,
      platform,
      hasConfig: !!playerConfig.youtube || !!playerConfig.bilibili,
      configKeys: Object.keys(playerConfig),
    });
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={{ width, height }}>
      {hasError ? (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black/10 rounded-lg p-4">
          <div className="text-sm text-black/50 text-center mb-2">
            Video failed to load
            <br />
            <span className="text-xs">URL: {normalizedUrl}</span>
            <br />
            <span className="text-xs">Platform: {platform}</span>
          </div>
          <button
            onClick={() => {
              setHasError(false);
              setRetryKey(prev => prev + 1);
            }}
            className="mt-2 px-3 py-1 text-xs bg-black/20 hover:bg-black/30 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="w-full h-full" style={{ position: 'relative' }} key={retryKey}>
          <ReactPlayer
            src={finalUrl}
            width="100%"
            height="100%"
            controls={item.controls !== false}
            playing={item.autoplay || false}
            muted={item.muted || false}
            loop={item.loop || false}
            config={Object.keys(playerConfig).length > 0 ? playerConfig : undefined}
            onError={(error: any) => {
              // react-player 3.x 可能传递空错误对象，需要检查实际错误
              const errorMessage = error?.message || error?.toString() || 'Unknown error';
              const hasErrorDetails = error && typeof error === 'object' && Object.keys(error).length > 0;
              
              if (process.env.NODE_ENV === 'development') {
                console.error('❌ Video player error:', {
                  error,
                  errorMessage,
                  errorType: typeof error,
                  errorKeys: hasErrorDetails ? Object.keys(error) : [],
                  url: finalUrl,
                  platform,
                  config: playerConfig,
                });
              }
              
              // 设置错误状态，但允许用户重试
              setHasError(true);
            }}
            onReady={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Video player READY!');
              }
              setHasError(false);
            }}
            onStart={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('▶️ Video started');
              }
            }}
            onProgress={(state: any) => {
              // 进度回调（生产环境不打印）
            }}
            onPlay={() => {
              // 播放回调（生产环境不打印）
            }}
            onPause={() => {
              // 暂停回调（生产环境不打印）
            }}
            className="rounded-lg"
            style={{ position: 'absolute', top: 0, left: 0 }}
            light={false}
            pip={false}
            playsinline={true}
          />
        </div>
      )}
    </div>
  );
}
