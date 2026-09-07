"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 접속 기기 판별.
// - iPhone/iPad(iPadOS 13+ 는 데스크톱 사파리로 위장 → MacIntel+터치로 구분) → ios
// - Android → android
// - 그 외(데스크톱 등) → android + desktop 표시
function detect(): { platform: "ios" | "android"; desktop: boolean } {
  if (typeof navigator === "undefined") {
    return { platform: "android", desktop: true };
  }
  const ua = navigator.userAgent;
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return { platform: "ios", desktop: false };
  if (/android/i.test(ua)) return { platform: "android", desktop: false };
  return { platform: "android", desktop: true };
}

// 루트(/): 선택 화면 없이 접속 기기에 맞춰 바로 A-4안으로 진입한다(기본 안).
// - 모바일: 감지한 OS 로.
// - 데스크톱: Android 로 + 가짜 시스템 바(chrome=1)를 기본 표시. 실제 폰에는
//   OS 가 이미 상태바/네비를 그리므로 붙이지 않는다(이중 표시 방지).
//
// 기본 안은 A-1 → A-4 로 바뀌었다(사용자 지정 2026-09-07: "화면 접속했을때,
// A-4안이 디폴트로 선택되어있으면 좋겠어"). 좌측 데스크톱 패널의 목록도 같은
// 값을 보므로 A-4안이 선택된 채로 뜬다. 기본 안을 또 바꾼다면 여기 하나로는
// 안 되고 variantRoute.ts(variantFromPath·readVariant)와 /a 도 같이다.
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const { platform, desktop } = detect();
    router.replace(`/a4?platform=${platform}${desktop ? "&chrome=1" : ""}`);
  }, [router]);
  // 리다이렉트 직전엔 빈 화면(선택 화면 없음).
  return null;
}
