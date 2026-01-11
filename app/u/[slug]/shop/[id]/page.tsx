// app/u/[slug]/shop/[id]/page.tsx

import { notFound } from "next/navigation";
import { getUserPageDataBySlug } from "@/domain/page-config";
import { getProductById } from "@/domain/shop/services";
import ProductDetail from "@/features/shop/ProductDetail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const user = await getUserPageDataBySlug(slug);

  if (!user) {
    notFound();
  }

  // 获取商品
  const product = await getProductById(id);

  if (
    !product ||
    product.status !== "PUBLISHED" ||
    product.userSlug !== slug
  ) {
    notFound();
  }

  return <ProductDetail product={product} userSlug={slug} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const product = await getProductById(id);

  if (!product || product.status !== "PUBLISHED") {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description || product.name,
    openGraph: {
      title: product.name,
      description: product.description || product.name,
      images: product.images && product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}
