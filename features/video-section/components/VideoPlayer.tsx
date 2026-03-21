"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import BilibiliPlayer from "./BilibiliPlayer";
import { detectPlatform, normalizeVideoUrl } from "../utils/urlParser";
import type { VideoItem, VideoPlatform } from "../types";

type ReactPlayerProps = ComponentProps<typeof import("react-player").default>;

const ReactPlayer = dynamic<ReactPlayerProps>(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-black/10">
      <div className="text-sm text-black/50">Loading...</div>
    </div>
  ),
});

interface VideoPlayerProps {
  item: VideoItem;
  width?: string | number;
  height?: string | number;
  className?: string;
}


function formatPlayerError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Player fallback to HTML5";
}

function buildPlayerConfig(platform: VideoPlatform | null): ReactPlayerProps["config"] {
  if (platform !== "youtube") {
    return {};
  }

  return {
    youtube: {
      rel: 0,
      enablejsapi: 1,
    },
  };
}

export default function VideoPlayer({
  item,
  width = "100%",
  height = "100%",
  className = "",
}: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const url = item.url?.trim() || "";
  const platform = useMemo<VideoPlatform | null>(() => {
    if (!url) {
      return null;
    }

    if (item.platform && item.platform !== "auto") {
      return item.platform;
    }

    return detectPlatform(url);
  }, [item.platform, url]);

  const normalizedUrl = useMemo(() => {
    if (!url) {
      return "";
    }

    return normalizeVideoUrl(url, platform || undefined);
  }, [platform, url]);

  const playerConfig = useMemo(() => buildPlayerConfig(platform), [platform]);
  const finalUrl = normalizedUrl;
  const hasPlayerConfig = playerConfig != null && Object.keys(playerConfig).length > 0;



  if (!url) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-black/5 ${className}`}
        style={{ width, height }}
      >
        <div className="px-4 text-center text-xs text-black/40">
          Please enter a video URL
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-black/10 ${className}`}
        style={{ width, height }}
      >
        <div className="px-4 text-center text-sm text-black/50">
          Unsupported video platform. Please use YouTube or Bilibili links.
        </div>
      </div>
    );
  }

  if (!finalUrl.trim()) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-black/10 ${className}`}
        style={{ width, height }}
      >
        <div className="px-4 text-center text-sm text-black/50">
          Invalid video URL
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`} style={{ width, height }}>
      {hasError ? (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-black/10 p-4">
          <div className="mb-2 text-center text-sm text-black/50">
            Video failed to load
            <br />
            <span className="text-xs">URL: {normalizedUrl}</span>
            <br />
            <span className="text-xs">Platform: {platform}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setRetryKey((prev) => prev + 1);
            }}
            className="mt-2 rounded bg-black/20 px-3 py-1 text-xs transition-colors hover:bg-black/30"
          >
            Retry
          </button>
        </div>
      ) : (
        <div key={retryKey} className="h-full w-full" style={{ position: "relative" }}>
          {platform === "bilibili" ? (
            <BilibiliPlayer
              item={item}
              width={width}
              height={height}
              className={className}
            />
          ) : (
            <ReactPlayer
              src={finalUrl}
              width="100%"
              height="100%"
              controls
              playing={false}
              muted={false}
              loop={false}
              config={hasPlayerConfig ? playerConfig : undefined}
              onError={(error: unknown) => {
                if (process.env.NODE_ENV === "development") {
                  console.error("Video player error:", {
                    error,
                    errorMessage: formatPlayerError(error),
                    url: finalUrl,
                    platform,
                    config: playerConfig,
                  });
                }

                setHasError(true);
              }}
              onReady={() => {
                setHasError(false);
              }}
              onStart={() => {}}
              className="rounded-lg"
              style={{ position: "absolute", top: 0, left: 0 }}
              light={false}
              pip={false}
              playsInline
            />
          )}
        </div>
      )}
    </div>
  );
}
