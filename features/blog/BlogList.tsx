// features/blog/BlogList.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import { blogApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { isExternalUrl } from "@/lib/utils/isExternalUrl";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
}

interface BlogListProps {
  posts: BlogPost[];
  userSlug: string;
  backgroundStyle?: React.CSSProperties;
}

export default function BlogList({ posts, userSlug, backgroundStyle }: BlogListProps) {
  const menu = useHeroMenu();
  const { showToast } = useToast();
  const [postsWithStats, setPostsWithStats] = useState<BlogPost[]>(posts);

  async function handleLike(postId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await blogApi.toggleLike(postId);
      setPostsWithStats((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: result.liked,
              likeCount: (post.likeCount || 0) + (result.liked ? 1 : -1),
            };
          }
          return post;
        })
      );
    } catch {
      showToast("操作失败，请重试");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const defaultBackgroundStyle: React.CSSProperties = {
    backgroundColor: "#000000",
  };

  return (
    <main
      data-testid="public-user-blog-list"
      className="relative min-h-screen text-black"
      style={backgroundStyle || defaultBackgroundStyle}
    >
      {/* 右上角菜单按钮 */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4 text-white">
        <button
          className="text-2xl opacity-90 hover:opacity-100 transition drop-shadow-lg"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          ☰
        </button>
      </div>

      {/* 菜单 */}
      <HeroMenu open={menu.open} onClose={menu.closeMenu} />

      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* 标题和返回按钮 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-wider text-white">BLOG</h1>
          <Link
            href={`/u/${userSlug}`}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            BACK
          </Link>
        </div>

        {/* 内容区域 */}
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-white/60 mb-4">暂无已发布的博客文章</p>
            <p className="text-sm text-white/40">
              提示：请确保在编辑博客时勾选&quot;已发布&quot;选项
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {postsWithStats.map((post) => (
              <div
                key={post.id}
                data-testid={`public-user-blog-post-${post.id}`}
                className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-colors"
              >
                {/* 封面图 */}
                {post.coverImage && (
                  <Link href={`/u/${userSlug}/blog/${post.id}`}>
                    <div className="relative w-full h-64 overflow-hidden">
                      {isExternalUrl(post.coverImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 672px"
                        />
                      )}
                    </div>
                  </Link>
                )}

                {/* 内容 */}
                <div className="p-4">
                  <Link href={`/u/${userSlug}/blog/${post.id}`}>
                    <h3 className="text-lg font-semibold mb-2 text-white hover:underline">
                      {post.title}
                    </h3>
                    <p className="text-sm text-white/70 line-clamp-3 mb-3">
                      {post.content.substring(0, 200)}
                      {post.content.length > 200 ? "..." : ""}
                    </p>
                  </Link>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
                    {/* 点赞按钮 */}
                    <button
                      onClick={(e) => handleLike(post.id, e)}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        post.isLiked
                          ? "text-red-500 hover:text-red-600"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">
                        {post.isLiked ? "❤️" : "🤍"}
                      </span>
                      <span>{post.likeCount || 0}</span>
                    </button>

                    {/* 评论按钮 */}
                    <Link
                      href={`/u/${userSlug}/blog/${post.id}#comments`}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      <span className="text-lg">💬</span>
                      <span>{post.commentCount || 0}</span>
                    </Link>

                    {/* 时间 */}
                    <div className="ml-auto text-xs text-white/50">
                      {post.publishedAt
                        ? formatDate(post.publishedAt)
                        : formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
