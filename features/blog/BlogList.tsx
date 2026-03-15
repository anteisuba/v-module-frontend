// features/blog/BlogList.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
      className="editorial-shell relative min-h-screen"
    >
      <div
        className="absolute inset-0"
        style={backgroundStyle || defaultBackgroundStyle}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,6,0.18),rgba(8,8,6,0.6)_56%,rgba(8,8,6,0.82))]" />

      <div className="editorial-container pt-20 sm:pt-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="reveal max-w-3xl">
            <div className="editorial-kicker text-white/54">Creator journal</div>
            <div className="line-wipe mt-5 max-w-sm bg-white/16" />
            <h1 className="mt-8 font-serif text-[clamp(3.2rem,7vw,6.8rem)] font-light leading-[0.92] tracking-[0.03em] text-white">
              Blog
            </h1>
          </div>
          <Link
            href={`/u/${userSlug}`}
            className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
          >
            Back
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="reveal editorial-panel px-6 py-16 text-center">
            <p className="font-serif text-3xl font-light text-white">暂无已发布的博客文章</p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/56">
              提示：请确保在编辑博客时勾选&quot;已发布&quot;选项
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {postsWithStats.map((post) => (
              <div
                key={post.id}
                data-testid={`public-user-blog-post-${post.id}`}
                className="reveal overflow-hidden rounded-[1.8rem] border border-white/10 bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_92%,transparent)] backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
              >
                {post.coverImage && (
                  <Link href={`/u/${userSlug}/blog/${post.id}`}>
                    <div className="relative h-72 w-full overflow-hidden">
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

                <div className="p-6 sm:p-7">
                  <Link href={`/u/${userSlug}/blog/${post.id}`}>
                    <h3 className="font-serif text-[2rem] font-light leading-[1.02] tracking-[0.03em] text-white">
                      {post.title}
                    </h3>
                    <p className="mt-4 line-clamp-3 text-sm leading-8 text-white/70">
                      {post.content.substring(0, 200)}
                      {post.content.length > 200 ? "..." : ""}
                    </p>
                  </Link>

                  <div className="mt-6 flex items-center gap-6 border-t border-white/10 pt-5">
                    <button
                      onClick={(e) => handleLike(post.id, e)}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        post.isLiked
                          ? "text-[color:var(--theme-primary)]"
                          : "text-white/56 hover:text-white"
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
                      className="flex items-center gap-2 text-sm text-white/56 transition-colors hover:text-white"
                    >
                      <span className="text-lg">💬</span>
                      <span>{post.commentCount || 0}</span>
                    </Link>

                    <div className="ml-auto text-[11px] uppercase tracking-[0.16em] text-white/42">
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
