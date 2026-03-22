import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { normalizePageConfig } from "@/utils/pageConfig";

export const runtime = "nodejs";
export const alt = "Creator Page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      themeColor: true,
      publishedConfig: true,
      user: { select: { displayName: true, slug: true } },
    },
  });

  const displayName = page?.user?.displayName || slug;
  const config = normalizePageConfig(page?.publishedConfig);
  const theme = config.theme;

  const bgColor = theme?.backgroundColor || "#0a0a0a";
  const textColor = theme?.textColor || "#ffffff";
  const accentColor = theme?.primaryColor || page?.themeColor || "#ffffff";
  const title = config.meta?.title || `${displayName}'s Page`;
  const description = config.meta?.description || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bgColor,
          color: textColor,
          fontFamily: "sans-serif",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            backgroundColor: accentColor,
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: "900px",
            display: "flex",
          }}
        >
          {title}
        </div>

        {/* Description */}
        {description && (
          <div
            style={{
              fontSize: 28,
              opacity: 0.7,
              marginTop: "24px",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {description.length > 100
              ? description.slice(0, 100) + "..."
              : description}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: 20,
            opacity: 0.4,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {displayName}
        </div>
      </div>
    ),
    { ...size }
  );
}
