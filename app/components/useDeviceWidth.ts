"use client";

import { useEffect, useState } from "react";

// 현재 "기기 화면 폭"(px)을 반응형으로 읽는다.
//  - 데스크톱 미리보기(hover+정밀 포인터): LNB 프리셋/드래그로 지정한 --device-w.
//    'devicechange'/'devicerange'/'deviceresize' 로 갱신.
//  - 실제 터치 기기(아이폰·태블릿 등에서 고정 링크 접속): 데스크톱 목업이 숨겨지고
//    앱이 화면을 꽉 채우므로, --device-w(기본 360)가 아니라 실제 뷰포트 폭을 써야
//    해상도 분기(예: 카메라 목록 620+ 가로 배열)가 올바로 동작한다.
function readDeviceWidth(): number {
  if (typeof window === "undefined") return 360;
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) {
    const v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--device-w"),
    );
    if (Number.isFinite(v)) return v;
  }
  return window.innerWidth || 360;
}

export function useDeviceWidth() {
  // 첫 렌더부터 실제 폭으로 시작한다. 360 고정으로 시작하면 페이지 전환 때마다
  // 하단바가 "360 상태 → 실제 폭"으로 재생돼 전환 애니메이션이 헛돌게 된다.
  const [w, setW] = useState(() => readDeviceWidth());
  useEffect(() => {
    const read = () => setW(readDeviceWidth());
    read();
    window.addEventListener("devicechange", read);
    window.addEventListener("devicerange", read);
    // 드래그 중 매 프레임 갱신(폭이 실시간으로 바뀜).
    window.addEventListener("deviceresize", read);
    // 실제 기기: 회전·창 크기 변화에 반응.
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("devicechange", read);
      window.removeEventListener("devicerange", read);
      window.removeEventListener("deviceresize", read);
      window.removeEventListener("resize", read);
    };
  }, []);
  return w;
}
