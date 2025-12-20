// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_PAGE_CONFIG } from "../domain/page-config/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("开始 seed...");

  // 创建一个测试用户
  const email = "test@example.com";
  const password = "123456";
  const passwordHash = await bcrypt.hash(password, 10);

  // 删除已存在的测试用户（如果存在）
  // 先尝试删除 Page（如果有的话）
  try {
    await prisma.page.deleteMany({
      where: {
        user: {
          email,
        },
      },
    });
  } catch (error) {
    // 如果表不存在或其他错误，忽略（可能是首次运行）
    console.log("注意: 跳过删除 Page（可能表尚未创建）");
  }

  // 删除已存在的用户（如果存在）
  try {
    await prisma.user.deleteMany({
      where: { email },
    });
  } catch (error) {
    // 如果表不存在或其他错误，忽略（可能是首次运行）
    console.log("注意: 跳过删除 User（可能表尚未创建）");
  }

  // 创建用户
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      slug: "testuser",
      displayName: "Test User",
    },
  });

  console.log("✅ 创建用户:", user.email);

  // 自动创建 Page 记录并填充默认配置
  const page = await prisma.page.create({
    data: {
      userId: user.id,
      slug: user.slug,
      draftConfig: DEFAULT_PAGE_CONFIG,
      publishedConfig: DEFAULT_PAGE_CONFIG, // 初始状态：草稿和发布配置相同
    },
  });

  console.log("✅ 创建页面:", page.slug);
  console.log("✅ Seed 完成!");
  console.log(`\n测试账号:`);
  console.log(`  邮箱: ${email}`);
  console.log(`  密码: ${password}`);
  console.log(`  Slug: ${user.slug}`);
}

main()
  .catch((e) => {
    console.error("Seed 失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
