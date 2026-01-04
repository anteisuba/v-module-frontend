// features/video-section/components/BilibiliPlayer.tsx

"use client";

import { useMemo } from "react";
import { parseBilibiliUrl } from "../utils/urlParser";
import type { VideoItem } from "../types";

interface BilibiliPlayerProps {
  item: VideoItem;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Bilibili 视频播放器组件
 * react-player 3.x 不支持 Bilibili，所以使用 iframe 嵌入
 */
export default function BilibiliPlayer({
  item,
  width = "100%",
  height = "100%",
  className = "",
}: BilibiliPlayerProps) {
  // 解析 Bilibili URL，提取 BV 号或 av 号
  const bilibiliInfo = useMemo(() => {
    if (!item.url) return null;
    // 先移除查询参数，只保留路径部分用于解析
    const urlWithoutQuery = item.url.split('?')[0];
    return parseBilibiliUrl(urlWithoutQuery);
  }, [item.url]);

  // 构建 Bilibili 播放器 URL
  const playerUrl = useMemo(() => {
    if (!item.url) return '';
    
    const info = bilibiliInfo;
    if (!info) {
      // 如果无法解析，尝试从 URL 中提取 BV 号（忽略查询参数）
      const urlWithoutQuery = item.url.split('?')[0];
      const bvMatch = urlWithoutQuery.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
      if (bvMatch && bvMatch[1]) {
        const params = new URLSearchParams();
        params.set('bvid', bvMatch[1]);
        if (item.autoplay) params.set('autoplay', '1');
        if (item.muted) params.set('muted', '1');
        if (item.startTime) params.set('t', Math.floor(item.startTime).toString());
        return `https://player.bilibili.com/player.html?${params.toString()}`;
      }
      return '';
    }

    const params = new URLSearchParams();
    
    if (info.bvid) {
      params.set('bvid', info.bvid);
    } else if (info.aid) {
      // 移除 'av' 前缀
      const aidNumber = info.aid.replace(/^av/i, '');
      params.set('aid', aidNumber);
    }
    
    // 添加播放参数
    if (item.autoplay) {
      params.set('autoplay', '1');
    }
    if (item.muted) {
      params.set('muted', '1');
    }
    if (item.startTime) {
      params.set('t', Math.floor(item.startTime).toString());
    }
    
    return `https://player.bilibili.com/player.html?${params.toString()}`;
  }, [item.url, bilibiliInfo, item.autoplay, item.muted, item.startTime]);

  if (!playerUrl) {
    return (
      <div className={`flex items-center justify-center bg-black/10 rounded-lg ${className}`} style={{ width, height }}>
        <div className="text-sm text-black/50 text-center px-4">
          Invalid Bilibili URL
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={{ width, height }}>
      <iframe
        src={playerUrl}
        width="100%"
        height="100%"
        scrolling="no"
        border="0"
        frameBorder="no"
        frameSpacing="0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        className="rounded-lg"
      />
    </div>
  );
}

