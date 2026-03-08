// app/u/[slug]/shop/[id]/page.tsx

import { notFound } from "next/navigation";
import { getUserPageDataBySlug } from "@/domain/page-config";
import { getProductById } from "@/domain/shop/services";
import ProductDetail from "@/features/shop/ProductDetail";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";

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

  let config: PageConfig = EMPTY_PAGE_CONFIG;
  if (user.page?.publishedConfig) {
    try {
      config = user.page.publishedConfig as PageConfig;
    } catch (e) {
      console.error("Failed to parse publishedConfig:", e);
    }
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

  const getBackgroundStyle = (): React.CSSProperties => {
    const detailBg = config?.shopDetailBackground;
    if (detailBg && detailBg.type && detailBg.value && detailBg.value.trim() !== "") {
      return detailBg.type === "color"
        ? { backgroundColor: detailBg.value }
        : {
            backgroundImage: `url(${detailBg.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          };
    }

    const listBg = config?.shopBackground;
    if (listBg && listBg.type && listBg.value && listBg.value.trim() !== "") {
      return listBg.type === "color"
        ? { backgroundColor: listBg.value }
        : {
            backgroundImage: `url(${listBg.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          };
    }

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

  return (
    <ProductDetail
      product={product}
      userSlug={slug}
      backgroundStyle={getBackgroundStyle()}
    />
  );
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
