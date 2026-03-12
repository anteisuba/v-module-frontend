// features/blog/BlogDetail.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import VideoPlayer from "@/features/video-section/components/VideoPlayer";
import { detectPlatform } from "@/features/video-section";
import { blogApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { Input, Button } from "@/components/ui";
import { isExternalUrl } from "@/lib/utils/isExternalUrl";
import { FaRegHeart, FaHeart, FaRegComment } from "react-icons/fa6";
import { FiShare, FiLink, FiCheck } from "react-icons/fi";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  videoUrl: string | null;
  externalLinks: Array<{ url: string; label: string }> | null;
  publishedAt: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  comments: BlogComment[];
}

interface BlogComment {
  id: string;
  blogPostId: string;
  userName: string;
  userEmail: string | null;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  moderatedAt: string | null;
  user: {
    id: string;
    slug: string;
    displayName: string | null;
  } | null;
}

interface BlogDetailProps {
  post: BlogPost;
  userSlug: string;
  backgroundStyle?: React.CSSProperties;
  backgroundType?: "color" | "image";
}

export default function BlogDetail({
  post,
  userSlug,
  backgroundStyle,
  backgroundType = "color",
}: BlogDetailProps) {
  const menu = useHeroMenu();
  const { showToast } = useToast();
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [comments, setComments] = useState<BlogComment[]>(post.comments);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentForm, setCommentForm] = useState({
    userName: "",
    userEmail: "",
    content: "",
  });
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // 处理复制链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("链接已复制");
      setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
    } catch {
      showToast("复制失败");
    }
  };

  async function handleLike() {
    try {
      const result = await blogApi.toggleLike(post.id, commentForm.userEmail || undefined);
      setIsLiked(result.liked);
      setLikeCount((prev) => prev + (result.liked ? 1 : -1));
    } catch {
      showToast("操作失败，请重试");
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentForm.userName.trim() || !commentForm.content.trim()) {
      showToast("请填写姓名和评论内容");
      return;
    }

    try {
      setSubmittingComment(true);
      const newComment = await blogApi.createComment(post.id, {
        userName: commentForm.userName.trim(),
        userEmail: commentForm.userEmail.trim() || undefined,
        content: commentForm.content.trim(),
      });
      setCommentForm({ userName: "", userEmail: "", content: "" });

      if (newComment.status === "APPROVED") {
        setComments((prev) => [...prev, newComment]);
        setCommentCount((prev) => prev + 1);
        showToast("评论已发布");
      } else {
        showToast("评论已提交，审核后显示");
      }
    } catch {
      showToast("评论发布失败，请重试");
    } finally {
      setSubmittingComment(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const defaultBackgroundStyle: React.CSSProperties = {
    backgroundColor: "#000000",
  };

  const contentHtml = post.content
    .replace(/\n/g, "<br />")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="editorial-link">$1</a>'
    );

  const backgroundOverlayClass =
    backgroundType === "image"
      ? "bg-[linear-gradient(180deg,rgba(8,8,6,0.28),rgba(8,8,6,0.52)_42%,rgba(8,8,6,0.82))]"
      : "bg-[linear-gradient(180deg,rgba(8,8,6,0.14),rgba(8,8,6,0.46)_46%,rgba(8,8,6,0.78))]";

  return (
    <article
      data-testid="public-user-blog-detail"
      className="editorial-shell relative min-h-screen"
    >
      <div
        className="absolute inset-0"
        style={backgroundStyle || defaultBackgroundStyle}
      />
      <div className={`absolute inset-0 ${backgroundOverlayClass}`} />

      <div className="fixed right-6 top-6 z-50 flex items-center gap-4 text-white">
        <button
          className="editorial-button min-h-10 border-white/14 bg-black/28 px-4 py-2 text-[10px] text-white backdrop-blur-md hover:bg-black/40"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          Menu
        </button>
      </div>

      <HeroMenu open={menu.open} onClose={menu.closeMenu} />

      <div className="editorial-container pt-20 sm:pt-24">
        <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="reveal max-w-3xl">
            <div className="editorial-kicker text-white/54">Creator journal</div>
            <div className="line-wipe mt-5 max-w-sm bg-white/16" />
            <h1 className="mt-8 font-serif text-[clamp(3.2rem,7vw,6.8rem)] font-light leading-[0.92] tracking-[0.03em] text-white">
              Blog
            </h1>
          </div>
          <Link
            href={`/u/${userSlug}/blog`}
            className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
          >
            Back
          </Link>
        </div>

        <div className="reveal editorial-panel mb-6 p-6 sm:p-8">
          {post.coverImage && (
            <div className="relative mb-8 h-96 w-full overflow-hidden rounded-[1.7rem] border border-white/10">
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
                  priority
                  sizes="100vw"
                />
              )}
            </div>
          )}

          <h2
            data-testid="public-user-blog-detail-title"
            className="font-serif text-[clamp(2.4rem,4vw,4.4rem)] font-light leading-[0.96] tracking-[0.03em] text-white"
          >
            {post.title}
          </h2>

          <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/44">
            <span>
              {post.publishedAt
                ? formatDate(post.publishedAt)
                : formatDate(post.createdAt)}
            </span>
          </div>

          <div className="mt-8">
            <div
              className="editorial-richtext"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          {post.videoUrl && (
            <div className="mt-8 aspect-video overflow-hidden rounded-[1.7rem] border border-white/10">
              <VideoPlayer
                item={{
                  id: `blog-video-${post.id}`,
                  url: post.videoUrl,
                  platform: detectPlatform(post.videoUrl) || "auto",
                }}
                width="100%"
                height="100%"
                className=""
              />
            </div>
          )}

          {post.externalLinks && post.externalLinks.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-5">
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/42">相关链接</h3>
              <ul className="mt-4 space-y-2">
                {post.externalLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="editorial-link text-sm"
                    >
                      {link.label || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="relative mt-8 flex items-center justify-between border-t border-white/10 px-2 pt-5 select-none">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-white/56 transition-colors hover:text-white"
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="relative -left-2 rounded-full p-2 transition-colors hover:bg-white/8">
                <FaRegComment className="w-5 h-5" />
              </div>
              <span className="-ml-0.5">{commentCount > 0 ? commentCount : ""}</span>
            </button>

            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center transition-colors ${
                isLiked ? "text-[color:var(--theme-primary)]" : "text-white/56 hover:text-[color:var(--theme-primary)]"
              }`}
            >
              <div className="relative -left-2 rounded-full p-2 transition-colors hover:bg-white/8">
                {isLiked ? (
                  <FaHeart className="w-5 h-5" />
                ) : (
                  <FaRegHeart className="w-5 h-5" />
                )}
              </div>
              <span className="-ml-0.5 text-sm">{likeCount > 0 ? likeCount : ""}</span>
            </button>
            
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-white/56 transition-colors hover:text-white"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <div className="relative -left-2 rounded-full p-2 transition-colors hover:bg-white/8">
                  <FiShare className="w-5 h-5" />
                </div>
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full right-0 z-50 mb-2 w-44 overflow-hidden rounded-[1.2rem] border border-white/10 bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_98%,transparent)] shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white transition-colors hover:bg-white/6"
                  >
                    {copied ? <FiCheck className="h-4 w-4 text-[color:var(--theme-primary)]" /> : <FiLink className="h-4 w-4" />}
                    <span>{copied ? "已复制" : "复制链接"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div id="comments" className="reveal editorial-panel mb-6 p-6 sm:p-8">
          <h3 className="font-serif text-[2rem] font-light text-white">
            评论 ({commentCount})
          </h3>

          <form onSubmit={handleSubmitComment} className="mb-6 mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label="姓名"
                value={commentForm.userName}
                onChange={(e) =>
                  setCommentForm({ ...commentForm, userName: e.target.value })
                }
                placeholder="您的姓名 *"
                required
                disabled={submittingComment}
              />
              <Input
                label="邮箱"
                type="email"
                value={commentForm.userEmail}
                onChange={(e) =>
                  setCommentForm({ ...commentForm, userEmail: e.target.value })
                }
                placeholder="您的邮箱（可选）"
                disabled={submittingComment}
              />
            </div>
            <textarea
              value={commentForm.content}
              onChange={(e) =>
                setCommentForm({ ...commentForm, content: e.target.value })
              }
              placeholder="写下您的评论... *"
              required
              rows={4}
              disabled={submittingComment}
              className="editorial-textarea resize-y text-sm leading-7"
            />
            <p className="text-xs text-white/44">
              评论提交后需审核，通过后才会公开显示。
            </p>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submittingComment}
                disabled={submittingComment}
              >
                发布评论
              </Button>
            </div>
          </form>

          {/* 评论列表 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/44">
                暂无评论，快来发表第一条评论吧！
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-b border-white/10 pb-4 last:border-b-0"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {comment.user?.displayName || comment.userName}
                      </span>
                      {comment.user && (
                        <Link
                          href={`/u/${comment.user.slug}`}
                          className="editorial-link text-xs"
                        >
                          @{comment.user.slug}
                        </Link>
                      )}
                    </div>
                    <span className="text-xs text-white/40">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/72">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/u/${userSlug}/blog`}
            className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
          >
            一覧に戻る
          </Link>
        </div>
      </div>
    </article>
  );
}
