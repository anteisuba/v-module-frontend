// app/blog/page.tsx

import { redirect } from "next/navigation";

export default function BlogPage() {
  // 重定向到默认用户页面（可以根据需要修改为其他默认用户）
  // 或者可以显示一个提示页面，让用户选择要查看的用户
  redirect("/u/xiuruisu/blog");
}
