// app/u/[slug]/shop/page.tsx

import { notFound } from "next/navigation";
import { getUserPageDataBySlug } from "@/domain/page-config";
import { getProducts } from "@/domain/shop/services";
import ProductList from "@/features/shop/ProductList";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";

export default async function UserShopPage({
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

  // 获取已发布的商品
  const productData = await getProducts({
    userId: user.id,
    status: "PUBLISHED",
    limit: 100,
  });

  // 调试信息（开发环境）
  if (process.env.NODE_ENV === "development") {
    console.log(`[Shop Page] User slug: ${slug}, User ID: ${user.id}, Found ${productData.products.length} published products`);
    if (productData.products.length === 0) {
      // 检查是否有其他状态的商品
      const allProductData = await getProducts({
        userId: user.id,
        limit: 10,
      });
      console.log(`[Shop Page] Total products (all statuses): ${allProductData.products.length}`);
    }
  }

  // 获取背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
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

  return <ProductList products={productData.products} userSlug={slug} backgroundStyle={getBackgroundStyle()} />;
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
    title: `${user.displayName || user.slug}'s Shop`,
    description: `Products by ${user.displayName || user.slug}`,
  };
}
