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
/** '축소 후 강제 세로'(폰은 누워 있는데 앱을 세로로 세워 둔 상태)인가.
 *  exitImmersive 가 data-force-portrait 를 세우면 켜진다(globals.css 의 회전
 *  규칙과 같은 조건). 이때 innerWidth 를 그대로 읽으면 가로 폭 기준 배치가
 *  세로 프레임에 그려지므로, 치수를 읽는 쪽이 폭·세로를 맞바꿔야 한다. */
export function readForcedPortrait(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  if (document.documentElement.dataset.forcePortrait !== "true") return false;
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) return false;
  return window.innerWidth > window.innerHeight;
}

export function readDeviceWidth(fallback?: number | Element | null): number {
  if (typeof window === "undefined") return 360;
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

// ── 앱 창이 물리 화면에서 밀려난 양 ──────────────────────────────────────
// 딤 위 아이콘의 좌우 여백은 '기기 모서리' 기준이어야 한다(사용자 지정
// 2026-08-18: "IOS는 기기 사이즈 기준으로 되어있어. 영상 뷰 기준으로 하지말라고").
//
// 아이폰 홈화면 앱은 화면 전체를 받으므로 앱 창 = 화면이고, 프레임 끝에서 재면
// 그게 곧 기기 끝이다. 안드로이드는 시스템 바(상태바·내비바)가 창을 깎아서 앱이
// 화면보다 작다 — 그 안에서 60 을 주면 기기 기준으로는 60 + 바 두께만큼 들어와
// 보인다. 영상도 같이 작아지니 '영상 뷰 기준으로 붙은 것처럼' 읽힌다.
//
// 창이 화면 어디에 놓였는지는 screenX/screenY 가 알려 준다(CSS 픽셀). 콘텐츠
// 기준 좌우가 물리적으로 어느 변인지는 CSS 회전 여부로 갈린다:
//   · 앱을 눕힌 확대(readCssRotated) — 콘텐츠 왼쪽 = 물리 상단, 오른쪽 = 물리 하단
//   · 그 외(제자리 확대·물리 가로)   — 콘텐츠 좌우 = 물리 좌우
//
// 데스크톱 미리보기는 목업 프레임이라 이 보정을 걸지 않는다(창 위치는 브라우저
// 창 위치일 뿐이다).
export type EdgeGaps = { left: number; right: number };

export function readEdgeGaps(): EdgeGaps {
  if (typeof window === "undefined") return { left: 0, right: 0 };
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) return { left: 0, right: 0 };
  // 앱을 CSS 로 눕힌 확대(폰은 세로)는 건드리지 않는다 — 그쪽은 위아래 바가
  // 콘텐츠의 좌우가 되는데, 두 바 두께를 갈라 낼 방법이 없어 추측이 된다.
  if (readCssRotated()) return { left: 0, right: 0 };

  // 여기부터는 폰을 실제로 눕힌 가로. 이때 좌우를 깎는 건 보통 카메라 컷아웃
  // 한 변이다(상태바·내비바는 위아래로 간다). 얼마나 깎였는지는 화면 폭과
  // 뷰포트 폭의 차이로 알 수 있고, 어느 변인지는 회전 각도로 갈린다:
  //   90(반시계, 기기 위쪽이 왼쪽으로) → 왼쪽,  270(시계) → 오른쪽.
  // 이걸 안 빼면 그 변만 여백이 컷아웃 두께만큼 넓어 보인다(사용자 지적
  // 2026-08-18, 안드로이드: "가로로 돌렸을때 왼쪽 부분이 문제야. 왼쪽이 너무 넓어").
  const gap = Math.round(window.screen.width - window.innerWidth);
  // 0 이거나 너무 크면(측정이 어긋난 것) 손대지 않는다.
  if (!(gap > 0 && gap <= 120)) return { left: 0, right: 0 };
  const raw =
    window.screen?.orientation?.angle ??
    (window as unknown as { orientation?: number }).orientation;
  const a = typeof raw === "number" ? (raw + 360) % 360 : 90;
  return a === 270 ? { left: 0, right: gap } : { left: gap, right: 0 };
}

/** readEdgeGaps 를 구독한다. SSR·첫 렌더는 0 으로 맞춰 하이드레이션 불일치를 막는다. */
export function useEdgeGaps(): EdgeGaps {
  const [gaps, setGaps] = useState<EdgeGaps>({ left: 0, right: 0 });
  useEffect(() => {
    const read = () => {
      const next = readEdgeGaps();
      setGaps((prev) =>
        prev.left === next.left && prev.right === next.right ? prev : next,
      );
    };
    read();
    const evts = [
      "resize",
      "orientationchange",
      "devicechange",
      "devicelandscapechange",
      "immersivechange",
    ];
    evts.forEach((e) => window.addEventListener(e, read));
    return () => evts.forEach((e) => window.removeEventListener(e, read));
  }, []);
  return gaps;
}

/** 실기기가 안드로이드인가.
 *
 *  화면에 그리는 '가짜 시스템 바'용 platform 파라미터와는 다르다 — 그쪽은 값이
 *  없으면 android 로 떨어져서, 실기기 아이폰도 android 로 잡힌다. 여백처럼 실제
 *  기기에 따라 갈려야 하는 값은 UA 로 본다.
 *  SSR·첫 렌더는 false 로 맞춰 하이드레이션 불일치를 막는다. */
export function useIsAndroid(): boolean {
  const [android, setAndroid] = useState(false);
  useEffect(() => {
    setAndroid(/Android/i.test(navigator.userAgent));
  }, []);
  return android;
}
