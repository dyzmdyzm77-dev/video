"use client";

import { useEffect, useState } from "react";

// 현재 기기 화면 폭(--device-w, px)을 반응형으로 읽는다. 프리셋 선택('devicechange')
// 이나 드래그 중 해상도 구간 변경('devicerange') 시 갱신된다. 데스크톱 미리보기에서
// 해상도별로 UI(예: 안드로이드 하단바)를 분기할 때 사용.
export function useDeviceWidth() {
  const [w, setW] = useState(360);
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
