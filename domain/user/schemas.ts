import { z } from "zod";

export const loginInputSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "密码必填"),
});

export const registerInputSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
  displayName: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
});

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址"),
});

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "token 必填"),
  password: z.string().min(6, "密码至少 6 位"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
