import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cormorant_Garamond, Geist_Mono, Jost } from "next/font/google";
import { UserProvider } from "@/lib/context/UserProviderWrapper";
import { InspectorWrapper } from "@/lib/context/InspectorWrapper";
import { ToastProvider } from "@/lib/context/ToastContext";
import { I18nProvider } from "@/lib/i18n/context";
import {
  defaultLocale,
  localeCookieName,
  localeHtmlLang,
  parseLocale,
} from "@/i18n/config";
import ErrorFilter from "@/components/ErrorFilter";
import RevealObserver from "@/components/ui/RevealObserver";
import { ErrorBoundary } from "@/components/ui";
import "@/lib/env"; // 触发环境变量验证
import "./globals.css";
import "./globals"; // 导入 globals.ts 以立即安装错误过滤器

const bodyFont = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VTuber Site",
  description: "Creator pages, editorial content, and storefront management.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000",
  ),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale =
    parseLocale(cookieStore.get(localeCookieName)?.value) ?? defaultLocale;

  return (
    <html lang={localeHtmlLang[initialLocale]} suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} antialiased`}
      >
        <RevealObserver />
        <ErrorBoundary>
          <ErrorFilter />
          <InspectorWrapper>
            <ToastProvider>
              <UserProvider>
                <I18nProvider initialLocale={initialLocale}>
                  {children}
                </I18nProvider>
              </UserProvider>
            </ToastProvider>
          </InspectorWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
