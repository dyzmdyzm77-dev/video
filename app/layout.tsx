import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import DesktopVariantNav from "./components/DesktopVariantNav";
import DeviceScaler from "./components/DeviceScaler";
import DeviceResizer from "./components/DeviceResizer";
import AsIsPanel from "./components/AsIsPanel";

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
      <body className="min-h-full bg-neutral-100">
        {/* 데스크톱 전용: 모든 프리셋 공용 CSS 베젤(시안 목업 레이어 재현).
            모바일/터치에선 CSS로 숨김. */}
        <div aria-hidden className="device-frame">
          {/* As Is(왼쪽) 짝 라벨. 비교하기 켰을 때만 보인다(CSS). */}
          <span className="device-caption">To Be</span>
        </div>
        {/* 기기 가장자리 드래그 핸들(폭·높이 조절). */}
        <DeviceResizer />
        {/* 비교하기: 시안 왼쪽에 As Is(현재 앱) 영상 화면. useSearchParams 를
            쓰므로 Suspense 로 감싸야 /_not-found 등 정적 프리렌더가 깨지지
            않는다. */}
        <Suspense>
          <AsIsPanel />
        </Suspense>
        {children}
        <DeviceScaler />
        <DesktopVariantNav />
      </body>
    </html>
  );
}
