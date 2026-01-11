// features/blog/BlogDetail.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import VideoPlayer from "@/features/video-section/components/VideoPlayer";
import { detectPlatform } from "@/features/video-section";
import { blogApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { Input, Button } from "@/components/ui";
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
}

interface BlogComment {
  id: string;
  userName: string;
  userEmail: string | null;
  content: string;
  createdAt: string;
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
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);
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
    } catch (err) {
      showToast("复制失败");
    }
  };

  // 加载点赞和评论数据
  useEffect(() => {
    async function loadData() {
      try {
        const likeStatus = await blogApi.getLikeStatus(post.id);
        setLikeCount(likeStatus.likeCount);
        setIsLiked(likeStatus.isLiked);

        const commentsData = await blogApi.getComments(post.id, { limit: 50 });
        setComments(commentsData.comments);
        setCommentCount(commentsData.pagination.total);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, [post.id]);

  async function handleLike() {
    try {
      const result = await blogApi.toggleLike(post.id, commentForm.userEmail || undefined);
      setIsLiked(result.liked);
      setLikeCount((prev) => prev + (result.liked ? 1 : -1));
    } catch (error) {
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
      setComments([...comments, newComment]);
      setCommentCount((prev) => prev + 1);
      setCommentForm({ userName: "", userEmail: "", content: "" });
      showToast("评论已发布");
    } catch (error) {
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

  return (
    <article
      className="relative min-h-screen w-full overflow-hidden text-black py-16 px-6"
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

      {/* 背景遮罩层（仅在图片背景时显示） */}
      {backgroundType === "image" && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        {/* 头部 */}
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">BLOG</h1>
            <p className="mt-1 text-xs text-white/70">博客详情</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/u/${userSlug}/blog`}
              className="cursor-pointer rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-white/20"
            >
              BACK
            </Link>
          </div>
        </div>

        {/* 主要内容卡片 */}
        <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
          {/* 封面图 */}
          {post.coverImage && (
            <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden border border-black/10">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
          )}

          {/* 标题 */}
          <h2 className="mb-4 text-lg font-semibold text-black">{post.title}</h2>

          {/* 日期 */}
          <div className="mb-4 flex items-center gap-3 text-xs text-black/60">
            <span>
              {post.publishedAt
                ? formatDate(post.publishedAt)
                : formatDate(post.createdAt)}
            </span>
          </div>

          {/* 内容 */}
          <div className="mb-4">
            <div
              className="whitespace-pre-wrap text-sm text-black/90 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/\n/g, "<br />")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'),
              }}
            />
          </div>

          {/* 视频 */}
          {post.videoUrl && (
            <div className="mb-6 aspect-video rounded-lg overflow-hidden border border-black/10">
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

          {/* 外部链接 */}
          {post.externalLinks && post.externalLinks.length > 0 && (
            <div className="border-t border-black/10 pt-4">
              <h3 className="mb-2 text-xs font-medium text-black/70">相关链接</h3>
              <ul className="space-y-1">
                {post.externalLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {link.label || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 - 仿 Twitter 样式 */}
          <div className="flex items-center justify-between border-t border-black/10 pt-4 mt-4 px-2 select-none relative">
            {/* 评论 */}
            <div 
              className="flex items-center group cursor-pointer text-black/60 hover:text-blue-500 transition-colors"
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors relative -left-2">
                <FaRegComment className="w-5 h-5" />
              </div>
              <span className="text-sm -ml-0.5">{commentCount > 0 ? commentCount : ""}</span>
            </div>

            {/* 点赞 */}
            <button
              onClick={handleLike}
              className={`flex items-center group transition-colors ${
                isLiked ? "text-pink-600" : "text-black/60 hover:text-pink-600"
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-pink-600/10 transition-colors relative -left-2">
                {isLiked ? (
                  <FaHeart className="w-5 h-5" />
                ) : (
                  <FaRegHeart className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm -ml-0.5">{likeCount > 0 ? likeCount : ""}</span>
            </button>
            
            {/* 分享 */}
            <div className="relative">
              <div 
                className="flex items-center group cursor-pointer text-black/60 hover:text-blue-500 transition-colors"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                 <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors relative -left-2">
                  <FiShare className="w-5 h-5" />
                </div>
              </div>

              {/* 分享菜单 (Popover) */}
              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-sm font-medium text-black"
                  >
                    {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiLink className="w-4 h-4" />}
                    <span>{copied ? "已复制" : "复制链接"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 评论区域 */}
        <div id="comments" className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-4 text-black">评论 ({commentCount})</h3>

          {/* 评论表单 */}
          <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={commentForm.userName}
                onChange={(e) =>
                  setCommentForm({ ...commentForm, userName: e.target.value })
                }
                placeholder="您的姓名 *"
                required
                disabled={submittingComment}
              />
              <Input
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
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-1 resize-y"
            />
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
              <div className="py-8 text-center text-sm text-black/50">
                暂无评论，快来发表第一条评论吧！
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-b border-black/10 pb-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-black">
                        {comment.user?.displayName || comment.userName}
                      </span>
                      {comment.user && (
                        <Link
                          href={`/u/${comment.user.slug}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          @{comment.user.slug}
                        </Link>
                      )}
                    </div>
                    <span className="text-xs text-black/50">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-black/80 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 导航按钮 */}
        <div className="flex gap-2">
          <Link
            href={`/u/${userSlug}/blog`}
            className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
          >
            一覧に戻る
          </Link>
        </div>
      </div>
    </article>
  );
}
