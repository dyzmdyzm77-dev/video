"use client";

import { useEffect, useState } from "react";

// 현재 "기기 화면 폭"(px)을 읽는다. 폭 기준 분기(app/components/layoutRules.ts 의
// WIDE_BP)는 전부 이 함수 하나를 통해야 한다 — 예전엔 안·홈이 각자 인라인으로
// 같은 로직을 복제해 두어 갱신 시점이 미묘하게 어긋났다.
//  - 데스크톱 미리보기(hover+정밀 포인터): LNB 프리셋/드래그로 지정한 --device-w.
//    'devicechange'/'devicerange'/'deviceresize' 로 갱신.
//  - 실제 터치 기기(아이폰·태블릿 등에서 고정 링크 접속): 데스크톱 목업이 숨겨지고
//    앱이 화면을 꽉 채우므로, --device-w(기본 360)가 아니라 실제 뷰포트 폭을 써야
//    해상도 분기(예: 카메라 목록 620+ 가로 배열)가 올바로 동작한다.
//
// fallback 을 주면 실기기 폴백에서 window.innerWidth 대신 그 값을 쓴다(홈처럼
// 프레임 요소를 이미 들고 있는 쪽 — FLIP 애니메이션이 프레임 폭 기준이라
// innerWidth 와 어긋나면 안 된다). 요소를 주면 관측 폭을, 숫자를 주면 그대로
// 쓴다(ResizeObserver 콜백에서 contentRect 를 넘겨 강제 리플로우를 피한다).
export function readDeviceWidth(fallback?: number | Element | null): number {
  if (typeof window === "undefined") return 360;
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) {
    const v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--device-w"),
    );
    if (Number.isFinite(v) && v > 0) return v;
  }
  if (typeof fallback === "number") {
    if (fallback > 0) return fallback;
  } else if (fallback) {
    const w = fallback.getBoundingClientRect().width;
    if (w > 0) return w;
  }
  return window.innerWidth || 360;
}

// 기기 화면 세로(px). 폭과 같은 규칙으로 읽는다 — 데스크톱 미리보기면 --device-h,
// 실기기면 뷰포트 높이. 화면 비율(가로/세로)을 보는 분기(layoutRules 의
// SIDE_PANEL_RATIO)에 쓴다. 여기 말고 딴 데서 --device-h 를 직접 읽지 말 것.
export function readDeviceHeight(): number {
  if (typeof window === "undefined") return 780;
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) {
    const v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--device-h"),
    );
    if (Number.isFinite(v) && v > 0) return v;
  }
  return window.innerHeight || 780;
}

/** 화면 비율(가로/세로). 1 보다 크면 가로가 더 긴 화면. */
export function useDeviceRatio() {
  const [r, setR] = useState(() => readDeviceWidth() / readDeviceHeight());
  useEffect(() => {
    const read = () => setR(readDeviceWidth() / readDeviceHeight());
    read();
    const evts = ["devicechange", "devicerange", "deviceresize", "resize"];
    evts.forEach((e) => window.addEventListener(e, read));
    return () => evts.forEach((e) => window.removeEventListener(e, read));
  }, []);
  return r;
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
