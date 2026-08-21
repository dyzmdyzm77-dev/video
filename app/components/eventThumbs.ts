"use client";

import { useEffect, useState } from "react";
import { STORAGE_MODE_EVENT, readStorageMode } from "./storageMode";

// ============================================================================
// 움직임 감지 이벤트 카드 — 썸네일 지원 여부
// ============================================================================
// 이건 이제 독립된 스위치가 아니라 저장 방식(storageMode.ts)에서 파생된 값이다.
//
//   NVR   — 썸네일 없음. 그 자리·그 크기에 시각 + "움직임 감지" 텍스트만
//   클라우드 — 썸네일 이미지
//
// 원래는 좌측 패널의 '감지 썸네일' 체크박스가 따로 있었다. 그 체크 여부가 곧
// NVR 이냐 클라우드냐였다는 게 확인돼서(2026-08-21 사용자), 체크박스를 없애고
// 저장 방식 토글 하나로 합쳤다. 스위치가 둘이면 같은 것을 두 군데서 고르게 된다.
//
// 모듈은 남긴다 — 안(VariantA/A1/A3)들이 부르는 건 '썸네일이 있냐'지 '무슨 저장
// 방식이냐'가 아니다. 여기서 한 번 번역해 두면 나중에 저장 방식이 썸네일 말고
// 다른 것까지 가를 때 안 쪽을 안 건드려도 된다.
//
// 카드 크기는 어느 쪽이든 같다. THUMB_MIN_H/MAX_H 48 로 못 박힌 85×48 안에
// 두 줄을 넣는다 — 없다고 레일 높이가 달라지면 시간바·목록 스트립 높이
// 규칙(layoutRules.ts)이 같이 흔들린다.
// ============================================================================

/** 문서 루트에서 현재 값을 읽는다. 클라우드일 때만 썸네일이 있다. */
export function readEventThumbs(): boolean {
  return readStorageMode() === "cloud";
}

/**
 * 썸네일 표시 여부를 구독한다. SSR·첫 렌더는 기본 저장 방식(NVR)에 맞춰
 * 항상 false 로 시작해 하이드레이션 불일치를 막는다.
 */
export function useEventThumbs(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(readEventThumbs());
    sync();
    window.addEventListener(STORAGE_MODE_EVENT, sync);
    return () => window.removeEventListener(STORAGE_MODE_EVENT, sync);
  }, []);
  return on;
}
