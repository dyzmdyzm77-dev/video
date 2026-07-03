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

// 루트(/): 선택 화면 없이 접속 기기에 맞춰 바로 A안으로 진입한다.
// - 모바일: 감지한 OS 로.
// - 데스크톱: Android 로 + 가짜 시스템 바(chrome=1)를 기본 표시. 실제 폰에는
//   OS 가 이미 상태바/네비를 그리므로 붙이지 않는다(이중 표시 방지).
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const { platform, desktop } = detect();
    router.replace(`/a?platform=${platform}${desktop ? "&chrome=1" : ""}`);
  }, [router]);
  // 리다이렉트 직전엔 빈 화면(선택 화면 없음).
  return null;
}
