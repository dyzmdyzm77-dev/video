"use client";

import { useEffect, useState } from "react";
import type { VariantKey } from "./variantRoute";

// ============================================================================
// 비교하기에서 '왼쪽에 무엇을 놓을지'
// ============================================================================
// 원래는 As Is(현행 앱) 하나뿐이었다. 시안끼리도 비교하고 싶다는 요청이 있어
// (예: A-1안 ↔ A-2안) 왼쪽 대상을 고를 수 있게 한다(2026-08-12).
// 그 뒤 "세 개까지 나란히"라는 요청이 와서(2026-08-24) 왼쪽 자리를 둘로 늘렸고,
// 다시 "4개까지"(2026-08-31) 셋으로 늘렸다 — 오른쪽(지금 보고 있는 안)까지
// 합쳐 최대 4개가 한 화면에 선다.
//
// 자리(slot) 번호는 오른쪽에서부터 센다:
//   slot 1 = 시안 바로 왼쪽, slot 2 = 그 왼쪽, slot 3 = 가장 바깥.
// 오른쪽은 지금 보고 있는 안이다 — 상단 칩이나 좌측 패널에서 바꾸면 된다.
// 왼쪽 둘만 여기서 정한다.
//
// 전달 방식은 variantRoute·eventThumbs 와 같다: 문서 루트의 data 속성에 쓰고
// 이벤트를 쏜다. 고르는 쪽(좌측 패널)과 그리는 쪽(AsIsPanel)이 서로를 import
// 하지 않아도 된다. slot 1 은 예전 이름(data-compare-with)을 그대로 쓴다 —
// ?compare=1 로 도는 링크나 옛 상태가 그대로 살아 있어야 한다.
// ============================================================================

export type CompareTarget = "asis" | VariantKey;

/** 왼쪽 비교 자리 번호. 1 = 시안 바로 옆, 3 = 가장 바깥. */
export type CompareSlot = 1 | 2 | 3;

/** 왼쪽에 놓을 수 있는 최대 개수(= 화면에 서는 기기 최대 4대). */
export const MAX_COMPARE_SLOTS = 3;

/** 왼쪽 자리 전부. 자리마다 도는 곳들이 이 배열 하나를 쓴다. */
export const COMPARE_SLOTS: CompareSlot[] = [1, 2, 3];

export const COMPARE_TARGET_EVENT = "comparetargetchange";

const TARGETS: CompareTarget[] = ["asis", "a1", "a2", "a3", "a4", "a4m01"];

// 자리 1 은 예전 이름(data-compare-with)을 그대로 쓴다 — 옛 링크·상태가 산다.
const dataKey = (slot: CompareSlot) =>
  slot === 1 ? "compareWith" : `compareWith${slot}`;

export function readCompareTarget(slot: CompareSlot = 1): CompareTarget {
  if (typeof document === "undefined") return "asis";
  const v = document.documentElement.dataset[dataKey(slot)];
  return (TARGETS as string[]).includes(v ?? "")
    ? (v as CompareTarget)
    : "asis";
}

export function requestCompareTarget(t: CompareTarget, slot: CompareSlot = 1) {
  document.documentElement.dataset[dataKey(slot)] = t;
  window.dispatchEvent(new Event(COMPARE_TARGET_EVENT));
}

/** 비교 대상을 구독한다. SSR·첫 렌더는 As Is 로 맞춰 하이드레이션 불일치를 막는다. */
export function useCompareTarget(slot: CompareSlot = 1): CompareTarget {
  const [t, setT] = useState<CompareTarget>("asis");
  useEffect(() => {
    const sync = () => setT(readCompareTarget(slot));
    sync();
    window.addEventListener(COMPARE_TARGET_EVENT, sync);
    return () => window.removeEventListener(COMPARE_TARGET_EVENT, sync);
  }, [slot]);
  return t;
}

// ---- 몇 개를 나란히 놓을지 ------------------------------------------------
// 왼쪽 자리 개수(0 = 비교 꺼짐, 1 = 2개 비교, 2 = 3개, 3 = 4개). 켜고 끄는 것과
// 개수를 한 값으로 합치지 않고 data-compare(on/off)는 그대로 뒀다 — 비교
// 여부만 보는 곳(DeviceScaler 의 회전 예외, CSS 캡션 등)이 여럿이라 그쪽
// 조건을 전부 뜯어고치는 것보다 개수를 따로 싣는 편이 안전하다.

export function readCompareSlots(): number {
  if (typeof document === "undefined") return 0;
  const root = document.documentElement;
  if (root.dataset.compare !== "true") return 0;
  const n = Number(root.dataset.compareSlots);
  return n >= 1 && n <= MAX_COMPARE_SLOTS ? n : 1;
}

/** 왼쪽 자리 개수를 구독한다(comparechange 로 갱신). */
export function useCompareSlots(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const sync = () => setN(readCompareSlots());
    sync();
    window.addEventListener("comparechange", sync);
    return () => window.removeEventListener("comparechange", sync);
  }, []);
  return n;
}
