"use client";

import { useEffect, useState } from "react";
import type { VariantKey } from "./variantRoute";

// ============================================================================
// 비교하기에서 '왼쪽에 무엇을 놓을지'
// ============================================================================
// 원래는 As Is(현행 앱) 하나뿐이었다. 시안끼리도 비교하고 싶다는 요청이 있어
// (예: A-1안 ↔ A-2안) 왼쪽 대상을 고를 수 있게 한다(2026-08-12).
//
// 오른쪽은 지금 보고 있는 안이다 — 상단 칩이나 좌측 패널에서 바꾸면 된다.
// 왼쪽만 여기서 정한다.
//
// 전달 방식은 variantRoute·eventThumbs 와 같다: 문서 루트의 data 속성에 쓰고
// 이벤트를 쏜다. 고르는 쪽(좌측 패널)과 그리는 쪽(AsIsPanel)이 서로를 import
// 하지 않아도 된다.
// ============================================================================

export type CompareTarget = "asis" | VariantKey;

export const COMPARE_TARGET_EVENT = "comparetargetchange";

const TARGETS: CompareTarget[] = ["asis", "a1", "a2", "b"];

export function readCompareTarget(): CompareTarget {
  if (typeof document === "undefined") return "asis";
  const v = document.documentElement.dataset.compareWith;
  return (TARGETS as string[]).includes(v ?? "")
    ? (v as CompareTarget)
    : "asis";
}

export function requestCompareTarget(t: CompareTarget) {
  document.documentElement.dataset.compareWith = t;
  window.dispatchEvent(new Event(COMPARE_TARGET_EVENT));
}

/** 비교 대상을 구독한다. SSR·첫 렌더는 As Is 로 맞춰 하이드레이션 불일치를 막는다. */
export function useCompareTarget(): CompareTarget {
  const [t, setT] = useState<CompareTarget>("asis");
  useEffect(() => {
    const sync = () => setT(readCompareTarget());
    sync();
    window.addEventListener(COMPARE_TARGET_EVENT, sync);
    return () => window.removeEventListener(COMPARE_TARGET_EVENT, sync);
  }, []);
  return t;
}
