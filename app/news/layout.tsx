import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News",
  description: "Latest news and announcements from creators.",
  openGraph: { title: "News", description: "Latest news and announcements from creators." },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
