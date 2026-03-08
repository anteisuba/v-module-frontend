import { getProducts } from "@/domain/shop";
import PublicShopCatalog from "@/features/shop/PublicShopCatalog";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const productData = await getProducts({
    status: "PUBLISHED",
    limit: 60,
  });

  return <PublicShopCatalog products={productData.products} />;
}
