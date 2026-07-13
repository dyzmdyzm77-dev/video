"use client";

import { useEffect, useState } from "react";

// 현재 기기 화면 폭(--device-w, px)을 반응형으로 읽는다. 프리셋 선택('devicechange')
// 이나 드래그 중 해상도 구간 변경('devicerange') 시 갱신된다. 데스크톱 미리보기에서
// 해상도별로 UI(예: 안드로이드 하단바)를 분기할 때 사용.
export function useDeviceWidth() {
  // 첫 렌더부터 실제 폭으로 시작한다. 360 고정으로 시작하면 페이지 전환 때마다
  // 하단바가 "360 상태 → 실제 폭"으로 재생돼 전환 애니메이션이 헛돌게 된다.
  // (서버 렌더/최초 로드 시엔 변수가 없어 360 — 최초 프리셋과 같아 무해)
  const [w, setW] = useState(() => {
    if (typeof window === "undefined") return 360;
    const v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--device-w",
      ),
    );
    return Number.isFinite(v) ? v : 360;
  });
  useEffect(() => {
    const read = () => {
      const v = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--device-w",
        ),
      );
      if (Number.isFinite(v)) setW(v);
    };
    read();
    window.addEventListener("devicechange", read);
    window.addEventListener("devicerange", read);
    // 드래그 중 매 프레임 갱신(폭이 실시간으로 바뀜).
    window.addEventListener("deviceresize", read);
    return () => {
      window.removeEventListener("devicechange", read);
      window.removeEventListener("devicerange", read);
      window.removeEventListener("deviceresize", read);
    };
  }, []);
  return w;
}
