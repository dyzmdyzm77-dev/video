"use client";

import { useEffect, useState } from "react";
import { DEVICES, punchFor } from "./devicePresets";
import type { CompareSlot } from "./compareTarget";

// ============================================================================
// 비교 자리마다 해상도를 따로 고르기
// ============================================================================
// 원래는 기기가 몇 대가 서든 크기는 하나였다(--device-w/h 를 다 같이 썼다).
// "비교하기, 해상도도 선택할 수 있게 해줘"(2026-08-25) — 같은 안을 360 과
// 폴드 펼침으로 나란히 놓고 보는 게 비교의 핵심이라 자리별로 갈랐다.
//
// 기본값은 '시안과 같음'이다(-1). 그 상태에선 아무 변수도 안 쓴다 — CSS 쪽
// 폴백(--dev1-w: var(--slot1-w, var(--device-w)))이 시안 값을 그대로 받으므로
// 드래그 리사이즈·프리셋 변경이 예전처럼 세 대에 동시에 먹는다. 자리에 해상도를
// 못 박는 순간에만 --slot{n}-* 이 생겨 그 자리를 떼어 낸다.
//
// 전달 방식은 compareTarget·variantRoute 와 같다: 문서 루트에 싣고 이벤트를 쏜다.
// 값 자체는 DEVICES 인덱스다 — 크기(w/h)뿐 아니라 라운드·베젤 여백·펀치홀 위치가
// 프리셋마다 달라서, 숫자 두 개만 실으면 목업이 그 기기처럼 안 보인다.
// ============================================================================

export const COMPARE_SIZE_EVENT = "comparesizechange";

/** 자리에 못 박은 해상도. -1 = 시안과 같음(따로 안 정함). */
export function readCompareSize(slot: CompareSlot): number {
  if (typeof document === "undefined") return -1;
  const raw = document.documentElement.dataset[
    slot === 2 ? "devSize2" : "devSize1"
  ];
  const n = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isInteger(n) && n >= 0 && n < DEVICES.length ? n : -1;
}

/** 자리 크기를 CSS 변수로 반영한다. 가로 모드면 프리셋도 눕혀서 쓴다
 *  (DesktopVariantNav 의 applyPreset 과 같은 규칙 — 안 눕히면 시안만 눕고
 *  비교 기기는 세로로 남아 짝이 안 맞는다). */
export function applyCompareSizes() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const land = root.dataset.landscape === "true";
  ([1, 2] as CompareSlot[]).forEach((slot) => {
    const i = readCompareSize(slot);
    const p = i >= 0 ? DEVICES[i] : null;
    const set = (k: string, v: string | null) => {
      const name = `--slot${slot}-${k}`;
      if (v === null) root.style.removeProperty(name);
      else root.style.setProperty(name, v);
    };
    if (!p) {
      (["w", "h", "r", "m"] as const).forEach((k) => set(k, null));
      return;
    }
    set("w", `${land ? p.h : p.w}px`);
    set("h", `${land ? p.w : p.h}px`);
    set("r", `${p.r}px`);
    set("m", `${p.m}px`);
  });
}

export function requestCompareSize(slot: CompareSlot, i: number) {
  const root = document.documentElement;
  const key = slot === 2 ? "devSize2" : "devSize1";
  if (i < 0) delete root.dataset[key];
  else root.dataset[key] = String(i);
  applyCompareSizes();
  window.dispatchEvent(new Event(COMPARE_SIZE_EVENT));
  // 배율·앵커(DeviceScaler)와 폭을 읽는 쪽(useDeviceWidth)이 같이 갱신되도록.
  window.dispatchEvent(new Event("devicechange"));
}

/** 자리 해상도를 구독한다. SSR·첫 렌더는 -1 로 맞춰 하이드레이션 불일치를 막는다. */
export function useCompareSize(slot: CompareSlot): number {
  const [i, setI] = useState(-1);
  useEffect(() => {
    const sync = () => setI(readCompareSize(slot));
    sync();
    window.addEventListener(COMPARE_SIZE_EVENT, sync);
    return () => window.removeEventListener(COMPARE_SIZE_EVENT, sync);
  }, [slot]);
  return i;
}

/** 그 자리 목업에 뚫을 펀치홀 위치. 자리 해상도를 안 정했으면 null —
 *  그때는 문서 루트(html[data-punch])의 값을 그대로 쓴다. */
export function punchForSlot(i: number): string | null {
  return i >= 0 ? punchFor(DEVICES[i].w) : null;
}
