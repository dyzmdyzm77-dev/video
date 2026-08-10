"use client";

import { useEffect, useState } from "react";

// ============================================================================
// 지금 보고 있는 화면안(A / A-1 / B) — URL 을 안 건드리는 전환
// ============================================================================
// 안 전환을 router.push 로 하면 라우트가 바뀐다. iOS 사파리는 URL 이 바뀔 때마다
// (전체 새로고침이든 pushState 든) 접혀 있던 주소창/툴바를 다시 펼치는데, 이 앱은
// 스크롤이 없어서(globals.css 의 overflow:hidden + 100svh) 한 번 펼쳐지면 다시
// 접히지 않는다. 그래서 안을 한 번 바꾸면 그 뒤로 계속 툴바가 남아 있었다.
// 홈 탭에서 같은 문제를 없앤 방식(a/a1/b 페이지가 홈 화면을 그 자리에 렌더)을
// 안 전환에도 그대로 적용한다 — 세 안을 한 화면(AppShell)에서 상태로 갈아끼운다.
//
// 전달 방식은 eventThumbs / deviceRotate 와 같다: 문서 루트의 data 속성에 쓰고
// 이벤트를 쏘면 구독자들이 받는다. 안(AppShell)과 좌측 데스크톱 패널이 서로를
// import 하지 않고도 같은 값을 본다.
//
// 트레이드오프(사용자 결정): 주소창은 처음 들어온 안으로 남는다. 안을 바꾼 뒤
// 링크를 복사해 공유하면 보고 있던 안이 아니라 진입한 안이 열린다. 새로고침도
// 마찬가지로 URL 의 안으로 돌아온다.
// ============================================================================

export type VariantKey = "a" | "a1" | "b";

export const VARIANT_EVENT = "variantchange";

const KEYS: VariantKey[] = ["a", "a1", "b"];

/** 경로(/a·/a1·/b)에서 안 키를 뽑는다. 모르면 A안. */
export function variantFromPath(pathname: string): VariantKey {
  const seg = pathname.replace(/^\/+|\/+$/g, "");
  return (KEYS as string[]).includes(seg) ? (seg as VariantKey) : "a";
}

/** 문서 루트에서 현재 안을 읽는다. 아직 안 심겼으면 fallback. */
export function readVariant(fallback: VariantKey = "a"): VariantKey {
  if (typeof document === "undefined") return fallback;
  const v = document.documentElement.dataset.variant;
  return (KEYS as string[]).includes(v ?? "") ? (v as VariantKey) : fallback;
}

/** 안을 바꾼다. 시안 목록 시트·좌측 패널이 이걸 부른다(URL 은 안 건드린다). */
export function requestVariant(v: VariantKey) {
  document.documentElement.dataset.variant = v;
  window.dispatchEvent(new Event(VARIANT_EVENT));
}

/**
 * 현재 안을 구독한다. initial 은 그 페이지의 라우트가 뜻하는 안이다 —
 * SSR·첫 렌더는 항상 initial 로 맞춰 하이드레이션 불일치를 막고, 마운트 직후
 * 문서 루트에 심어 좌측 패널과 값을 맞춘다.
 */
export function useVariant(initial: VariantKey): VariantKey {
  const [variant, setVariant] = useState<VariantKey>(initial);
  useEffect(() => {
    // 라우트로 새로 들어온 것이므로 그 안을 현재 값으로 심는다(직접 접속·뒤로가기).
    document.documentElement.dataset.variant = initial;
    setVariant(initial);
    const sync = () => setVariant(readVariant(initial));
    window.addEventListener(VARIANT_EVENT, sync);
    return () => window.removeEventListener(VARIANT_EVENT, sync);
  }, [initial]);
  return variant;
}
