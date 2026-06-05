import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "에스원 CCTV",
  description: "8층 사무실 실시간 영상",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body className="min-h-full bg-neutral-100">{children}</body>
    </html>
  );
}
