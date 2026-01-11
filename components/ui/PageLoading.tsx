// components/ui/PageLoading.tsx

/**
 * 页面加载组件
 * 用于 Next.js loading.tsx 文件，提供统一的加载体验
 */

interface PageLoadingProps {
  message?: string;
  backgroundColor?: string;
}

export default function PageLoading({
  message = "加载中...",
  backgroundColor = "#000000",
}: PageLoadingProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor }}
    >
      <div className="text-center">
        {/* 加载动画 */}
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
        </div>
        {/* 加载文字 */}
        <p className="text-white/80">{message}</p>
      </div>
    </div>
  );
}
