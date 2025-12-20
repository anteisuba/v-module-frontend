// scripts/clear-rate-limit.ts
// 清理指定邮箱的速率限制（删除 15 分钟内的重置请求记录）

import { prisma } from "../lib/prisma";

async function clearRateLimit(email: string) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // 查找 15 分钟内的请求记录
  const recentRequests = await prisma.userPasswordResetToken.findMany({
    where: {
      user: { email },
      createdAt: { gte: fifteenMinutesAgo },
    },
  });

  console.log(`找到 ${recentRequests.length} 条最近的请求记录`);

  if (recentRequests.length === 0) {
    console.log("没有需要清理的记录");
    return;
  }

  // 删除这些记录
  const result = await prisma.userPasswordResetToken.deleteMany({
    where: {
      user: { email },
      createdAt: { gte: fifteenMinutesAgo },
    },
  });

  console.log(`已删除 ${result.count} 条记录，速率限制已清除`);
}

// 从命令行参数获取邮箱
const email = process.argv[2];

if (!email) {
  console.error("用法: tsx scripts/clear-rate-limit.ts <email>");
  console.error("示例: tsx scripts/clear-rate-limit.ts test@example.com");
  process.exit(1);
}

clearRateLimit(email)
  .then(() => {
    console.log("完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("错误:", error);
    process.exit(1);
  });

