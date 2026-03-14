import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface EmailMessageInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export function hasEmailDeliveryConfigured() {
  if (process.env.RESEND_API_KEY) {
    return true;
  }

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return true;
  }

  return process.env.NODE_ENV === "development";
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

function getFromEmail() {
  return process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@vtuber-site.com";
}

function logEmailPreview(mode: string, recipients: string[], subject: string, extra?: Record<string, string>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📧 [邮件发送] ${mode}`);
  console.log("=".repeat(60));
  console.log("收件人:", recipients.join(", "));
  console.log("主题:", subject);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      console.log(`${key}:`, value);
    }
  }
  console.log("=".repeat(60) + "\n");
}

async function sendEmailViaResend(message: EmailMessageInput): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: getFromEmail(),
    to: normalizeRecipients(message.to),
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  if (result.error) {
    let errorMessage = result.error.message || "邮件发送失败";

    if (errorMessage.includes("only send testing emails to your own email address")) {
      errorMessage =
        "使用 onboarding@resend.dev 只能发送到注册邮箱。要发送到其他邮箱，请验证域名后使用你自己的邮箱地址。详情请查看 docs/zh-CN/operations/deployment-and-delivery-history.md";
    }

    throw new Error(`邮件发送失败: ${errorMessage}`);
  }

  if (!result.data) {
    throw new Error("邮件发送失败: API 响应异常");
  }

  logEmailPreview("Resend SDK", normalizeRecipients(message.to), message.subject, {
    "邮件 ID": result.data.id,
  });
}

function createSMTPTransporter() {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  if (process.env.NODE_ENV === "development") {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  throw new Error("邮件服务未配置。请设置 RESEND_API_KEY 或 SMTP 相关环境变量");
}

async function sendEmailViaSMTP(message: EmailMessageInput): Promise<void> {
  const transporter = createSMTPTransporter();

  await transporter.sendMail({
    from: getFromEmail(),
    to: normalizeRecipients(message.to).join(", "),
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  logEmailPreview("SMTP 模式", normalizeRecipients(message.to), message.subject);
}

export async function sendEmailMessage(message: EmailMessageInput): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    return sendEmailViaResend(message);
  }

  return sendEmailViaSMTP(message);
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

  return sendEmailMessage({
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
}
