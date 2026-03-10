import { getBlogPosts } from "@/domain/blog";
import PublicBlogFeed from "@/features/blog/PublicBlogFeed";
import { getE2EPublicBlogFeed, getE2EPublicSiteState } from "@/lib/e2e/publicPageState";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const e2eSiteState = await getE2EPublicSiteState();
  const e2ePosts = getE2EPublicBlogFeed(e2eSiteState);
  const blogData =
    e2ePosts !== null
      ? { posts: e2ePosts }
      : await getBlogPosts({
          published: true,
          limit: 50,
        });

  return <PublicBlogFeed posts={blogData.posts} />;
}
