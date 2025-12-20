// lib/email.ts
import nodemailer from "nodemailer";

/**
 * 创建邮件传输器
 * 支持 SMTP 配置（开发/生产环境）
 */
function createTransporter() {
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
    "邮件服务未配置。请设置 SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD 环境变量"
  );
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const transporter = createTransporter();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

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
    const info = await transporter.sendMail(mailOptions);

    // 开发环境：输出邮件内容到控制台（更明显的格式）
    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "=".repeat(60));
      console.log("📧 [邮件发送] 开发模式");
      console.log("=".repeat(60));
      console.log("收件人:", email);
      console.log("重置链接:", resetUrl);
      console.log("=".repeat(60) + "\n");
    }

    return;
  } catch (error) {
    console.error("[邮件发送失败]", error);
    throw new Error("邮件发送失败，请稍后重试");
  }
}
