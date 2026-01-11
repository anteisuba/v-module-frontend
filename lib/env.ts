// lib/env.ts

import { z } from "zod";

/**
 * 环境变量 Schema 定义
 * 使用 Zod 进行类型安全的验证
 */
const envSchema = z.object({
  // 数据库（必需）
  DATABASE_URL: z.string().url().startsWith("postgresql://", {
    message: "DATABASE_URL 必须是 postgresql:// 开头的 URL",
  }),

  // Session（必需）
  SESSION_PASSWORD: z.string().min(32, {
    message: "SESSION_PASSWORD 长度至少需要 32 个字符",
  }),

  // 应用 URL（必需）
  NEXT_PUBLIC_BASE_URL: z.string().url({
    message: "NEXT_PUBLIC_BASE_URL 必须是有效的 URL",
  }),

  // 邮件服务（至少配置一种）
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().email().optional().or(z.literal("")),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional().or(z.literal("")),

  // Cloudflare R2（生产环境推荐）
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional().or(z.literal("")),

  // Node 环境
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Vercel 环境标识
  VERCEL: z.string().optional(),
});

/**
 * 验证环境变量
 * 仅在服务端执行，避免在客户端暴露环境变量
 */
function validateEnv() {
  if (typeof window !== "undefined") {
    // 客户端环境，返回部分环境变量
    return {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "",
      NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
    };
  }

  // 服务端环境，进行完整验证
  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_PASSWORD: process.env.SESSION_PASSWORD,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
  });

  if (!result.success) {
    const errors = result.error.issues.map((err) => {
      const path = err.path.join(".");
      return `${path}: ${err.message}`;
    });

    console.error("❌ 环境变量验证失败:");
    errors.forEach((error) => {
      console.error(`  - ${error}`);
    });

    // 在生产环境或 Vercel 上，如果验证失败则抛出错误
    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = process.env.VERCEL === "1";

    if (isProduction || isVercel) {
      throw new Error(`环境变量配置错误:\n${errors.join("\n")}`);
    }

    // 开发环境只警告
    console.warn("⚠️  开发环境：环境变量验证失败，但继续运行");
  } else {
    // 验证通过，检查可选配置的完整性
    const warnings: string[] = [];

    // 检查邮件服务配置
    const hasResend = !!result.data.RESEND_API_KEY;
    const hasSMTP =
      !!(
        result.data.SMTP_HOST &&
        result.data.SMTP_PORT &&
        result.data.SMTP_USER &&
        result.data.SMTP_PASSWORD
      );

    if (!hasResend && !hasSMTP) {
      warnings.push("未配置邮件服务（RESEND_API_KEY 或 SMTP），密码重置功能将无法使用");
    }

    // 检查生产环境的 R2 配置
    const isProduction = result.data.NODE_ENV === "production";
    const isVercel = result.data.VERCEL === "1";
    
    if (isProduction || isVercel) {
      const hasR2 =
        !!(
          result.data.R2_ACCOUNT_ID &&
          result.data.R2_ACCESS_KEY_ID &&
          result.data.R2_SECRET_ACCESS_KEY &&
          result.data.R2_BUCKET_NAME
        );

      if (!hasR2) {
        warnings.push("生产环境未配置 Cloudflare R2，文件上传功能将无法使用");
      }
    }

    // 检查 HTTPS
    if (
      (isProduction || isVercel) &&
      result.data.NEXT_PUBLIC_BASE_URL.startsWith("http://")
    ) {
      warnings.push("生产环境应使用 HTTPS URL");
    }

    if (warnings.length > 0) {
      console.warn("⚠️  环境变量警告:");
      warnings.forEach((warning) => {
        console.warn(`  - ${warning}`);
      });
    } else {
      console.log("✅ 环境变量验证通过");
    }
  }

  return result.success ? result.data : null;
}

// 在模块加载时执行验证
const env = validateEnv();

/**
 * 类型安全的环境变量对象
 * 在服务端使用完整类型，在客户端使用部分类型
 */
export const envConfig = env as z.infer<typeof envSchema> | {
  NEXT_PUBLIC_BASE_URL: string;
  NODE_ENV: "development" | "production" | "test";
};

/**
 * 获取验证后的环境变量（类型安全）
 * 在服务端返回完整配置，在客户端返回公开配置
 */
export function getEnv() {
  if (typeof window !== "undefined") {
    // 客户端环境
    return {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "",
      NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
    };
  }

  // 服务端环境
  if (!env) {
    throw new Error("环境变量验证失败，请检查配置");
  }

  return env;
}
