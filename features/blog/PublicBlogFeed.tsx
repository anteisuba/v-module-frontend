"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { isExternalUrl } from "@/lib/utils/isExternalUrl";

interface PublicBlogPost {
  id: string;
  userSlug: string | null;
  userDisplayName: string | null;
  title: string;
  content: string;
  coverImage: string | null;
  createdAt: string;
  publishedAt: string | null;
}

interface PublicBlogFeedProps {
  posts: PublicBlogPost[];
}

function formatDate(value: string, locale: string) {
  const dateLocale =
    locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN";

  return new Date(value).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function PublicBlogFeed({ posts }: PublicBlogFeedProps) {
  const { t, locale } = useI18n();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,207,232,0.55),_rgba(255,255,255,1)_38%),linear-gradient(180deg,_#fff8f1_0%,_#ffffff_58%,_#f8fafc_100%)] text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {t("publicEntry.blog.eyebrow")}
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {t("publicEntry.blog.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {t("publicEntry.blog.description")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 xl:items-end">
            <div className="rounded-full border border-black/10 bg-slate-950 px-4 py-2 text-sm font-medium text-white">
              {posts.length} {t("publicEntry.blog.countSuffix")}
            </div>
            <Link
              href="/admin"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
            >
              {t("publicEntry.common.openAdmin")}
            </Link>
          </div>
        </header>

        {posts.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-black/15 bg-white/70 px-6 py-16 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              {t("publicEntry.blog.emptyTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              {t("publicEntry.blog.emptyDescription")}
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            {posts.map((post) => {
              const authorSlug = post.userSlug ?? "";
              const postHref = authorSlug
                ? `/u/${authorSlug}/blog/${post.id}`
                : `/blog`;
              const authorHref = authorSlug ? `/u/${authorSlug}/blog` : "/blog";

              return (
                <article
                  key={post.id}
                  className="grid gap-0 overflow-hidden rounded-[32px] border border-black/10 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:grid-cols-[280px_minmax(0,1fr)]"
                >
                  <Link
                    href={postHref}
                    className="relative block min-h-[220px] bg-slate-100"
                  >
                    {post.coverImage ? (
                      isExternalUrl(post.coverImage) ? (
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
                          sizes="(max-width: 768px) 100vw, 280px"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,_#f8d7da,_#fef3c7)] text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                        BLOG
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col justify-between p-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        <span>{formatDate(post.publishedAt || post.createdAt, locale)}</span>
                        {authorSlug ? <span>@{authorSlug}</span> : null}
                      </div>
                      <Link href={postHref} className="mt-3 block">
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 transition-colors hover:text-slate-700">
                          {post.title}
                        </h2>
                      </Link>
                      <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-600">
                        {post.content}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 border-t border-black/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {t("publicEntry.common.creatorLabel")}
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-800">
                          {post.userDisplayName || (authorSlug ? `@${authorSlug}` : t("publicEntry.common.unknownCreator"))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={postHref}
                          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          {t("publicEntry.blog.read")}
                        </Link>
                        {authorSlug ? (
                          <Link
                            href={authorHref}
                            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                          >
                            {t("publicEntry.common.visitCreator")}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
