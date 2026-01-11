// app/u/[slug]/blog/page.tsx

import { notFound } from "next/navigation";
import { getUserPageDataBySlug } from "@/domain/page-config";
import { getBlogPosts } from "@/domain/blog/services";
import BlogList from "@/features/blog/BlogList";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";

export const dynamic = "force-dynamic";

export default async function UserBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getUserPageDataBySlug(slug);

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
  const blogData = await getBlogPosts({
    userSlug: slug,
    published: true,
    limit: 50,
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

  // 获取背景样式（优先使用 blogBackground，如果没有则使用 newsBackground 作为后备）
  const getBackgroundStyle = (): React.CSSProperties => {
    const blogBg = config?.blogBackground;
    if (blogBg && blogBg.type && blogBg.value && blogBg.value.trim() !== "") {
      return blogBg.type === "color"
        ? { backgroundColor: blogBg.value }
        : {
            backgroundImage: `url(${blogBg.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          };
    }
    // 如果没有 blogBackground，使用 newsBackground 作为后备
    const newsBg = config?.newsBackground;
    if (newsBg && newsBg.type && newsBg.value && newsBg.value.trim() !== "") {
      return newsBg.type === "color"
        ? { backgroundColor: newsBg.value }
        : {
            backgroundImage: `url(${newsBg.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          };
    }
    return { backgroundColor: "#000000" };
  };

  return <BlogList posts={blogData.posts} userSlug={slug} backgroundStyle={getBackgroundStyle()} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUserPageDataBySlug(slug);

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
