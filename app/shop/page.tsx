// app/shop/page.tsx

import { redirect } from "next/navigation";

export default function ShopPage() {
  // 重定向到默认用户页面（可以根据需要修改为其他默认用户）
  redirect("/u/xiuruisu/shop");
}
