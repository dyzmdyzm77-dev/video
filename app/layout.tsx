import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import DesktopVariantNav from "./components/DesktopVariantNav";
import DeviceScaler from "./components/DeviceScaler";
import DeviceResizer from "./components/DeviceResizer";
import AsIsPanel from "./components/AsIsPanel";
import DebugHud from "./components/DebugHud";
import StatusInset from "./components/StatusInset";

export const metadata: Metadata = {
  title: "에스원 CCTV",
  description: "8층 사무실 실시간 영상",
  appleWebApp: {
    capable: true,
    title: "에스원 CCTV",
    // 투명 상태바 — 웹뷰가 상태바 밑까지 깔리고, 상태바 배경 = 페이지가 그
    // 자리에 그린 색이 된다. 세로(흰 프레임 + 안전영역 여백)는 흰 상태바,
    // 확대(검은 화면)는 검은 상태바가 되고, 축소하면 흰 화면이 돌아오므로 색이
    // 저절로 되돌아온다 — default 에서 검정이 '굳던' 문제가 구조적으로 없어진다.
    // default 로는 iOS 가 상태바 자리를 떼어 가 확대와 눕힌 가로의 영상 크기도
    // 달랐다(사용자 지적). 이 값은 홈 화면에 '추가하는 순간' 박히므로, 바꾸면
    // 아이콘을 지우고 다시 추가해야 적용된다.
    // (예전 주석의 '웹뷰 하단이 잘리는 버그'는 구형 iOS 얘기라 다시 검증한다 —
    //  재현되면 이 값을 되돌리고 다른 길을 찾는다.)
    statusBarStyle: "black-translucent",
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
        {/* 세로에서 잰 상태바 높이를 --status-h 로 내보낸다(가로에서 그만큼 비운다). */}
        <StatusInset />
        {/* 임시 진단용. 주소에 ?debug=1 을 붙였을 때만 뜬다. 확인 끝나면 지운다. */}
        <DebugHud />
      </body>
    </html>
  );
}
