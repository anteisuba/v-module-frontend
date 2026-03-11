// app/u/[slug]/blog/[id]/page.tsx

import { notFound } from "next/navigation";
import { getUserPageDataBySlug } from "@/domain/page-config";
import { getBlogPostById, getBlogPostDetailById } from "@/domain/blog/services";
import BlogDetail from "@/features/blog/BlogDetail";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";
import { getServerSession } from "@/lib/session/userSession";
import {
  findE2EPublicPageState,
  getE2EPublicPageBlogPost,
  getE2EPublicSiteState,
} from "@/lib/e2e/publicPageState";

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const e2eSiteState = await getE2EPublicSiteState();
  const e2ePageState = findE2EPublicPageState(e2eSiteState, slug);
  const e2ePost = getE2EPublicPageBlogPost(e2eSiteState, slug, id);

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

  // 获取博客文章
  const session = e2ePost === null ? await getServerSession() : null;
  const post =
    e2ePost ??
    (await getBlogPostDetailById(id, {
      viewerUserId: session?.user?.id,
      viewerEmail: session?.user?.email,
      commentsLimit: 50,
    }));

  if (!post || !post.published || post.userSlug !== slug) {
    notFound();
  }

  // 获取背景样式（优先使用 blogDetailBackground，如果没有则使用 blogBackground，最后使用 newsBackground 作为后备）
  const getBackgroundStyle = (): React.CSSProperties => {
    const blogDetailBg = config?.blogDetailBackground;
    if (blogDetailBg && blogDetailBg.type && blogDetailBg.value && blogDetailBg.value.trim() !== "") {
      return blogDetailBg.type === "color"
        ? { backgroundColor: blogDetailBg.value }
        : {
            backgroundImage: `url(${blogDetailBg.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          };
    }
    // 如果没有 blogDetailBackground，使用 blogBackground
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
    // 如果都没有，使用 newsBackground 作为后备
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

  // 判断当前使用的背景类型（用于显示遮罩层）
  const currentBackgroundType = config?.blogDetailBackground?.type || config?.blogBackground?.type || config?.newsBackground?.type || "color";

  return (
    <BlogDetail
      post={post}
      userSlug={slug}
      backgroundStyle={getBackgroundStyle()}
      backgroundType={currentBackgroundType}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const e2ePost = getE2EPublicPageBlogPost(
    await getE2EPublicSiteState(),
    slug,
    id
  );
  const post = e2ePost ?? (await getBlogPostById(id));

  if (!post || !post.published) {
    return {
      title: "Blog Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160),
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}
