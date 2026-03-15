"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { isExternalUrl } from "@/lib/utils/isExternalUrl";
import FloatingMenu from "@/features/home-hero/components/FloatingMenu";

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
    <main data-testid="public-blog-feed" className="editorial-shell editorial-shell--light">
      <FloatingMenu />
      <div className="editorial-container flex flex-col gap-10 py-10 sm:py-14">
        <header className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.5fr)]">
          <div className="reveal max-w-4xl">
            <div className="editorial-kicker">{t("publicEntry.blog.eyebrow")}</div>
            <div className="line-wipe mt-5 max-w-sm" />
            <h1 className="editorial-hero-title mt-8 text-[color:var(--editorial-text)]">
              {t("publicEntry.blog.title")}
            </h1>
            <p className="editorial-subtitle mt-6">
              {t("publicEntry.blog.description")}
            </p>
          </div>

          <div className="reveal editorial-panel flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div>
              <div className="editorial-kicker">Archive</div>
              <div className="mt-5 editorial-stat">
                <div className="editorial-stat__label">
                  {t("publicEntry.blog.countSuffix")}
                </div>
                <div className="editorial-stat__value">{posts.length}</div>
              </div>
            </div>
            <Link
              href="/admin"
              className="editorial-button editorial-button--primary min-h-11 px-4 py-2.5 text-[11px]"
            >
              {t("publicEntry.common.openAdmin")}
            </Link>
          </div>
        </header>

        {posts.length === 0 ? (
          <section className="reveal editorial-panel border-dashed px-6 py-16 text-center">
            <h2 className="font-serif text-3xl font-light text-[color:var(--editorial-text)]">
              {t("publicEntry.blog.emptyTitle")}
            </h2>
            <p className="editorial-copy mx-auto mt-4">
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
                  data-testid={`public-blog-feed-post-${post.id}`}
                  className="reveal grid gap-0 overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--editorial-border)_86%,transparent)] bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_94%,transparent)] shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:grid-cols-[300px_minmax(0,1fr)]"
                >
                  <Link
                    href={postHref}
                    className="relative block min-h-[260px] bg-[color:color-mix(in_srgb,var(--editorial-text)_5%,transparent)]"
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
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(201,169,110,0.14),rgba(26,26,24,0.06))] text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
                        BLOG
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col justify-between gap-8 p-6 sm:p-8">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]">
                        <span>{formatDate(post.publishedAt || post.createdAt, locale)}</span>
                        {authorSlug ? <span className="ml-3">@{authorSlug}</span> : null}
                      </div>
                      <Link href={postHref} className="mt-3 block">
                        <h2 className="font-serif text-[2rem] font-light leading-[1.02] tracking-[0.03em] text-[color:var(--editorial-text)] transition-colors hover:text-[color:color-mix(in_srgb,var(--editorial-text)_82%,transparent)]">
                          {post.title}
                        </h2>
                      </Link>
                      <p className="mt-5 line-clamp-4 text-sm leading-8 text-[color:color-mix(in_srgb,var(--editorial-text)_76%,transparent)]">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-[color:color-mix(in_srgb,var(--editorial-border)_82%,transparent)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
                          {t("publicEntry.common.creatorLabel")}
                        </div>
                        <div className="mt-2 text-sm text-[color:var(--editorial-text)]">
                          {post.userDisplayName || (authorSlug ? `@${authorSlug}` : t("publicEntry.common.unknownCreator"))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={postHref}
                          className="editorial-button editorial-button--primary min-h-11 px-4 py-2.5 text-[11px]"
                        >
                          {t("publicEntry.blog.read")}
                        </Link>
                        {authorSlug ? (
                          <Link
                            href={authorHref}
                            className="editorial-button editorial-button--secondary min-h-11 px-4 py-2.5 text-[11px]"
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
