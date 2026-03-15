// app/u/[slug]/blog/page.tsx

import { notFound } from "next/navigation";
import { getUserPageDataBySlug } from "@/domain/page-config";
import { getBlogPosts } from "@/domain/blog/services";
import BlogList from "@/features/blog/BlogList";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG, resolveBackgroundStyle } from "@/domain/page-config/constants";
import { getServerSession } from "@/lib/session/userSession";
import {
  findE2EPublicPageState,
  getE2EPublicPageBlogPosts,
  getE2EPublicSiteState,
} from "@/lib/e2e/publicPageState";

export const dynamic = "force-dynamic";

export default async function UserBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e2eSiteState = await getE2EPublicSiteState();
  const e2ePageState = findE2EPublicPageState(e2eSiteState, slug);
  const e2eBlogPosts = getE2EPublicPageBlogPosts(e2eSiteState, slug);

  const user = e2ePageState
    ? {
        id: `e2e-user-${slug}`,
        slug,
        displayName: e2ePageState.displayName,
        page: {
          publishedConfig: e2ePageState.publishedConfig,
        },
      }
    : await getUserPageDataBySlug(slug);

  if (!user) {
    notFound();
  }

  // 获取页面配置（用于背景样式）
  let config: PageConfig = EMPTY_PAGE_CONFIG;
  if (user.page?.publishedConfig) {
    try {
      config = user.page.publishedConfig as PageConfig;
    } catch (e) {
      console.error("Failed to parse publishedConfig:", e);
    }
  }

  // 获取已发布的博客文章
  const session = e2eBlogPosts === null ? await getServerSession() : null;
  const blogData =
    e2eBlogPosts !== null
      ? { posts: e2eBlogPosts }
      : await getBlogPosts({
          userSlug: slug,
          published: true,
          limit: 50,
          viewerUserId: session?.user?.id,
          viewerEmail: session?.user?.email,
        });

  // 调试信息（开发环境）
  if (process.env.NODE_ENV === "development") {
    console.log(`[Blog Page] User slug: ${slug}, Found ${blogData.posts.length} published posts`);
    if (blogData.posts.length === 0) {
      // 检查是否有未发布的文章
      const allBlogData = await getBlogPosts({
        userSlug: slug,
        limit: 10,
      });
      console.log(`[Blog Page] Total posts (including drafts): ${allBlogData.posts.length}`);
    }
  }

  const backgroundStyle = resolveBackgroundStyle(config?.blogBackground, config?.newsBackground);

  return <BlogList posts={blogData.posts} userSlug={slug} backgroundStyle={backgroundStyle} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e2ePageState = findE2EPublicPageState(
    await getE2EPublicSiteState(),
    slug
  );
  const user = e2ePageState
    ? {
        slug,
        displayName: e2ePageState.displayName,
        page: {
          publishedConfig: e2ePageState.publishedConfig,
        },
      }
    : await getUserPageDataBySlug(slug);

  if (!user) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${user.displayName || user.slug}'s Blog`,
    description: `Blog posts by ${user.displayName || user.slug}`,
  };
}
