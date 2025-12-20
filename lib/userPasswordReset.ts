// lib/userPasswordReset.ts
import crypto from "crypto";
import { prisma } from "./prisma";
import { sendPasswordResetEmail as sendEmail } from "./email";

/**
 * 生成密码重置 token（32 字节随机字符串，base64 编码）
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * 对 token 进行哈希（用于存储到数据库）
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * 验证 token（比较原始 token 的哈希与存储的哈希）
 */
export function verifyToken(token: string, storedHash: string): boolean {
  const computedHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

/**
 * 检查速率限制：同一邮箱在 15 分钟内只能请求一次重置
 */
export async function checkRateLimitForUser(email: string): Promise<boolean> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const recentRequest = await prisma.userPasswordResetToken.findFirst({
    where: {
      user: { email },
      createdAt: { gte: fifteenMinutesAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  return !recentRequest; // 如果没有最近的请求，返回 true（允许）
}

/**
 * 发送密码重置邮件（用户版本）
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  await sendEmail(email, token);
}

