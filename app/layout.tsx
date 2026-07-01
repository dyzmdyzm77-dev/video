import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "에스원 CCTV",
  description: "8층 사무실 실시간 영상",
  appleWebApp: {
    capable: true,
    title: "에스원 CCTV",
    // black-translucent 은 iOS 홈앱에서 웹뷰 하단이 상태바 높이만큼 잘리는 버그가
    // 있다. default(불투명)로 두면 웹뷰가 상태바 아래에 정렬돼 화면 바닥까지 채운다.
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Android Chrome 의 주소창/상태바 색. 앱 상단이 흰색이라 흰색으로 맞춘다.
  themeColor: "#ffffff",
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
