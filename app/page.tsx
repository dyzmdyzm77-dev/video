"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformSelect from "./components/PlatformSelect";

// 접속 기기의 OS 를 userAgent 로 감지한다. 모바일이면 해당 플랫폼으로 자동 진입,
// 데스크톱/알 수 없음이면 null 을 돌려 수동 선택 화면을 띄운다.
function detectPlatform(): "ios" | "android" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS 13+ 는 데스크톱 사파리로 위장(Macintosh)한다. 터치 지원으로 구분.
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return "ios";
  }
  return null;
}

// 루트(/): 접속 기기 자동 감지.
// - iOS/Android 기기 → /a?platform=... 로 자동 이동(수동 선택 생략).
// - 데스크톱 등 → 기존 선택 화면 표시.
// 이후 변형 전환(A↔B↔C)·홈 버튼에서도 이 platform 쿼리가 유지된다.
export default function Page() {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const platform = detectPlatform();
    if (platform) {
      // replace: 자동 이동은 히스토리에 안 남겨 뒤로가기가 선택화면으로 안 돌아오게.
      router.replace(`/a?platform=${platform}`);
    } else {
      setShowPicker(true);
    }
  }, [router]);

  // 감지 전(또는 모바일 리다이렉트 직전)엔 빈 화면. 선택 화면 깜빡임 방지.
  if (!showPicker) return null;

  return <PlatformSelect onSelect={(p) => router.push(`/a?platform=${p}`)} />;
}
