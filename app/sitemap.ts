import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/showcase`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // User public pages
  const users = await prisma.user.findMany({
    select: { slug: true, updatedAt: true },
  });

  const userPages: MetadataRoute.Sitemap = users.map((u) => ({
      url: `${baseUrl}/u/${u.slug}`,
      lastModified: u.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  // Published blog posts
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { id: true, updatedAt: true, user: { select: { slug: true } } },
  });

  const blogPages: MetadataRoute.Sitemap = posts
    .filter((p) => p.user.slug)
    .map((p) => ({
      url: `${baseUrl}/u/${p.user.slug}/blog/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // Published products
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, updatedAt: true, user: { select: { slug: true } } },
  });

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.user.slug)
    .map((p) => ({
      url: `${baseUrl}/u/${p.user.slug}/shop/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  // Published news articles
  const articles = await prisma.newsArticle.findMany({
    where: { published: true },
    select: { id: true, updatedAt: true },
  });

  const newsPages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${baseUrl}/news/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...userPages, ...blogPages, ...productPages, ...newsPages];
}
