// features/video-section/components/VideoPlayer.tsx

"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import { detectPlatform, normalizeVideoUrl } from "../utils/urlParser";
import BilibiliPlayer from "./BilibiliPlayer";
import type { VideoItem } from "../types";

// 动态导入 react-player，避免 SSR 问题
// react-player 3.x 版本：所有播放器都打包在主模块中
// react-player 会自动处理 YouTube 播放器模块的懒加载
const ReactPlayer = dynamic(
  () => import("react-player"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-black/10 rounded-lg">
        <div className="text-sm text-black/50">Loading...</div>
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
  
  // 如果 URL 为空或无效，显示占位符（提前返回，避免渲染播放器）
  const url = item.url?.trim() || '';
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-black/5 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-xs text-black/40 text-center px-4">
          Please enter a video URL
        </div>
      </div>
    );
  }
  
  // 检测平台
  const platform = useMemo(() => {
    return item.platform === 'auto' || !item.platform
      ? detectPlatform(url)
      : item.platform;
  }, [url, item.platform]);
  
  // 标准化 URL
  const normalizedUrl = useMemo(() => {
    if (!url) return '';
    return normalizeVideoUrl(url, platform || undefined);
  }, [url, platform]);
  
  // 如果无法检测平台，显示错误
  if (!platform) {
    return (
      <div className={`flex items-center justify-center bg-black/10 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-sm text-black/50 text-center px-4">
          Unsupported video platform. Please use YouTube or Bilibili links.
        </div>
      </div>
    );
  }
  
  // 确保标准化后的 URL 有效
  if (!normalizedUrl || !normalizedUrl.trim()) {
    return (
      <div className={`flex items-center justify-center bg-black/10 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-sm text-black/50 text-center px-4">
          Invalid video URL
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

  // 调试信息（生产环境可移除）- 使用 useMemo 避免重复日志
  const debugInfo = useMemo(() => ({
    originalUrl: item.url,
    normalizedUrl,
    finalUrl,
    platform,
    hasConfig: !!playerConfig.youtube || !!playerConfig.bilibili,
    configKeys: Object.keys(playerConfig),
  }), [item.url, normalizedUrl, finalUrl, platform, playerConfig]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('VideoPlayer render:', debugInfo);
    }
  }, [debugInfo]);

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
          {finalUrl ? (
            // react-player 3.x 不支持 Bilibili，使用自定义播放器
            platform === 'bilibili' ? (
              <BilibiliPlayer item={item} width={width} height={height} className={className} />
            ) : (
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
                  // 空错误对象通常表示播放器回退到了 HTML5 播放器
                  const errorMessage = error?.message || error?.toString() || 'Player fallback to HTML5';
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
                      note: hasErrorDetails ? 'Error has details' : 'Empty error object - likely HTML5 fallback',
                    });
                    
                    // 检查是否是 YouTube 播放器模块加载问题
                    if (platform === 'youtube' && !hasErrorDetails) {
                      console.warn('⚠️ YouTube player may not be loaded correctly. Check if youtube-video-element is available.');
                    }
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
            )
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-black/10 rounded-lg">
              <div className="text-sm text-black/50 text-center px-4">
                Invalid video URL
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
