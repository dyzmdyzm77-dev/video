"use client";

import { useEffect } from "react";

// 데스크톱 폰 목업을 창 크기에 맞춰 축소하기 위한 배율(--device-scale)을 계산해
// 문서 루트에 설정한다. 목업 기준 크기 380×800 + 사방 여백 16px.
// CSS 만으론 뷰포트 높이 기반 unitless 배율을 못 구하므로 JS 로 세팅한다.
// (transform: scale 은 데스크톱 미디어쿼리에서만 적용되므로 모바일엔 영향 없음)
export default function DeviceScaler() {
  useEffect(() => {
    const apply = () => {
      const s = Math.min(
        1,
        (window.innerHeight - 32) / 800,
        (window.innerWidth - 32) / 380,
      );
      document.documentElement.style.setProperty(
        "--device-scale",
        String(Math.max(0.1, s)),
      );
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  return null;
}
