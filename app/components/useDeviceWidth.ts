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
/** 실기기에서 '강제 세로'(뷰포트는 가로인데 앱을 CSS 로 세워 둔 상태)인가.
 *  globals.css 의 되돌림 규칙과 같은 조건이어야 한다 — 뷰포트가 가로이고
 *  확대·가로 플래그가 없으면 콘텐츠는 세로로 서 있다.
 *  이때 innerWidth 를 그대로 읽으면 874(화면 가로)가 나와 넓은 화면용 배치가
 *  세로 프레임 안에 그려진다(사용자 지적: "축소 버튼 누르면 기존 세로 뷰랑
 *  다르게 나와"). 치수를 읽는 쪽이 전부 이걸 보고 폭·세로를 맞바꿔야 한다. */
export function readForcedPortrait(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) return false;
  if (window.innerWidth <= window.innerHeight) return false;
  const ds = document.documentElement.dataset;
  return ds.landscape !== "true" && ds.immersive !== "true";
}

export function readDeviceWidth(fallback?: number | Element | null): number {
  if (typeof window === "undefined") return 360;
  // 강제 세로면 화면의 짧은 쪽이 앱의 폭이다.
  if (readForcedPortrait()) return window.innerHeight || 360;
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
  // 강제 세로면 화면의 긴 쪽이 앱의 세로다(readDeviceWidth 와 짝).
  if (readForcedPortrait()) return window.innerWidth || 780;
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

/** 지금 '기기가 가로로 긴 상태'인가. 방향에 따라 달라지는 설정(예: 화면 분할
 *  채널 수)이 어느 쪽을 뜻하는지 판단하는 유일한 출처다.
 *
 *  왜 비율만 보면 안 되나 —
 *   · 데스크톱 미리보기: 회전하면 DesktopVariantNav 가 --device-w/h 를 맞바꾼다.
 *     그래서 비율이 이미 방향을 말해 준다.
 *   · 실기기: OS 방향은 못 바꾸므로 앱을 CSS 로 90° 돌리기만 한다
 *     (globals.css 의 터치 전용 규칙). innerWidth/Height 는 그대로라 비율은
 *     세로 그대로다 — 그때는 뒤집어 줘야 맞는다.
 *  물리 회전(사용자가 폰을 직접 돌린 경우)은 innerWidth/Height 가 알아서
 *  바뀌므로 뒤집지 않는다.
 *
 *  뒤집을지는 '플래그가 켜졌나'가 아니라 'CSS 회전이 실제로 걸렸나'로 본다.
 *  그 규칙이 세로 방향에서만 적용되기 때문이다(globals.css 의
 *  `@media (orientation: portrait)`). 가로로 눕힌 폰에서는 data-landscape 가
 *  켜져 있어도 앱은 안 돌아가 있다 — 플래그만 보면 거기서 '세로'로 잘못 읽는다. */
export function readDeviceWide(): boolean {
  if (typeof window === "undefined") return false;
  const wide = readDeviceWidth() > readDeviceHeight();
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) return wide;
  return readCssRotated() ? !wide : wide;
}

/** 실기기에서 앱이 지금 CSS 로 90° 돌아가 있는가. 가로 플래그가 켜져 있고,
 *  기기가 세로일 때만이다 — globals.css 의 미디어쿼리와 같은 조건이라 둘이
 *  어긋나면 안 된다. 방향 판정·입력 좌표 보정이 다 이걸 본다. */
export function readCssRotated(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  if (document.documentElement.dataset.landscape !== "true") return false;
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // 데스크톱 목업은 프레임 크기를 맞바꾸는 방식이라 방향 조건이 없다.
  if (desktopPreview) return true;
  return window.innerHeight >= window.innerWidth;
}

/** readDeviceWide 를 구독한다. SSR·첫 렌더는 세로(false)로 맞춰 하이드레이션
 *  불일치를 막는다. */
export function useDeviceWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const read = () => setWide(readDeviceWide());
    read();
    const evts = [
      "devicechange",
      "devicerange",
      "deviceresize",
      "resize",
      // 회전은 크기 이벤트를 안 낼 수도 있다(실기기는 CSS 회전뿐).
      "devicelandscapechange",
    ];
    evts.forEach((e) => window.addEventListener(e, read));
    return () => evts.forEach((e) => window.removeEventListener(e, read));
  }, []);
  return wide;
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
