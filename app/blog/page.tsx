import { getBlogPosts } from "@/domain/blog";
import PublicBlogFeed from "@/features/blog/PublicBlogFeed";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const blogData = await getBlogPosts({
    published: true,
    limit: 50,
  });

  return <PublicBlogFeed posts={blogData.posts} />;
}
