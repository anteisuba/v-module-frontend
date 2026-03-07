// lib/email.ts
import nodemailer from "nodemailer";
import { Resend } from "resend";

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

  // 优先使用 Resend SDK（如果配置了 RESEND_API_KEY）
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail =
        process.env.RESEND_FROM || process.env.SMTP_FROM || "onboarding@resend.dev";

      console.log("[Resend] 准备发送邮件到:", email);
      console.log("[Resend] 发件人:", fromEmail);
      console.log("[Resend] API Key 前缀:", process.env.RESEND_API_KEY?.substring(0, 10) + "...");

      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "重置密码 - VTuber Site",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>重置密码</h2>
                <p>您请求重置密码。请点击下面的链接来设置新密码：</p>
                <a href="${resetUrl}" class="button">重置密码</a>
                <p>或者复制以下链接到浏览器：</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p><strong>此链接将在 24 小时后过期。</strong></p>
                <p>如果您没有请求重置密码，请忽略此邮件。</p>
                <div class="footer">
                  <p>© VTuber Site</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
重置密码

您请求重置密码。请访问以下链接来设置新密码：

${resetUrl}

此链接将在 24 小时后过期。

如果您没有请求重置密码，请忽略此邮件。

© VTuber Site
        `.trim(),
      });

      // 检查发送结果（Resend SDK 返回 { data?: {...}, error?: {...} }）
      console.log("[Resend] API 响应:", JSON.stringify(result, null, 2));

      if (result.error) {
        console.error("[Resend] 发送失败 - 错误类型:", result.error.name);
        console.error("[Resend] 发送失败 - 错误消息:", result.error.message);
        console.error("[Resend] 发送失败 - 完整错误:", JSON.stringify(result.error, null, 2));
        
        // 提供更友好的错误信息
        let errorMessage = result.error.message || "邮件发送失败";
        
        // 如果是域名验证相关的错误，提供更详细的提示
        if (errorMessage.includes("only send testing emails to your own email address")) {
          errorMessage = "使用 onboarding@resend.dev 只能发送到注册邮箱。要发送到其他邮箱，请验证域名后使用你自己的邮箱地址。详情请查看 docs/zh-CN/operations/deployment-and-delivery-history.md";
        }
        
        throw new Error(`邮件发送失败: ${errorMessage}`);
      }

      if (!result.data) {
        console.error("[Resend] 发送失败 - 响应中没有 data 字段");
        throw new Error("邮件发送失败: API 响应异常");
      }

      console.log("[Resend] 发送成功，邮件 ID:", result.data.id);

      // 开发环境：输出邮件内容到控制台
      if (process.env.NODE_ENV === "development") {
        console.log("\n" + "=".repeat(60));
        console.log("📧 [邮件发送] Resend SDK");
        console.log("=".repeat(60));
        console.log("收件人:", email);
        console.log("重置链接:", resetUrl);
        console.log("邮件 ID:", result.data?.id);
        console.log("=".repeat(60) + "\n");
      }

      return;
    } catch (error) {
      console.error("[Resend] 邮件发送失败:", error);
      if (error instanceof Error) {
        console.error("[Resend] 错误详情:", error.message);
        console.error("[Resend] 错误堆栈:", error.stack);
      }
      throw new Error(`邮件发送失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  // 回退到 SMTP 方式（使用 nodemailer）
  return sendPasswordResetEmailViaSMTP(email, token, resetUrl);
}

/**
 * 通过 SMTP 发送密码重置邮件（备用方案）
 */
async function sendPasswordResetEmailViaSMTP(
  email: string,
  token: string,
  resetUrl: string
): Promise<void> {
  const transporter = createSMTPTransporter();

  const mailOptions = {
    from:
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "noreply@vtuber-site.com",
    to: email,
    subject: "重置密码 - VTuber Site",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>重置密码</h2>
            <p>您请求重置密码。请点击下面的链接来设置新密码：</p>
            <a href="${resetUrl}" class="button">重置密码</a>
            <p>或者复制以下链接到浏览器：</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>此链接将在 24 小时后过期。</strong></p>
            <p>如果您没有请求重置密码，请忽略此邮件。</p>
            <div class="footer">
              <p>© VTuber Site</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
重置密码

您请求重置密码。请访问以下链接来设置新密码：

${resetUrl}

此链接将在 24 小时后过期。

如果您没有请求重置密码，请忽略此邮件。

© VTuber Site
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);

    // 开发环境：输出邮件内容到控制台
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "=".repeat(60));
      console.log("📧 [邮件发送] SMTP 模式");
      console.log("=".repeat(60));
      console.log("收件人:", email);
      console.log("重置链接:", resetUrl);
      console.log("=".repeat(60) + "\n");
    }

    return;
  } catch (error) {
    console.error("[SMTP 邮件发送失败]", error);
    throw new Error("邮件发送失败，请稍后重试");
  }
}

/**
 * 创建 SMTP 传输器（备用方案）
 */
function createSMTPTransporter() {
  // 如果配置了 SMTP，使用 SMTP
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465", // 465 端口使用 SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // 开发环境：如果没有配置 SMTP，使用控制台输出（不实际发送）
  if (process.env.NODE_ENV === "development") {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  throw new Error(
    "邮件服务未配置。请设置 RESEND_API_KEY 或 SMTP 相关环境变量"
  );
}
