"use client";

import { useEffect, useState } from "react";

// ============================================================================
// 움직임 감지 이벤트 카드 — 썸네일 지원 여부 (프로토타입 스위치)
// ============================================================================
// 카메라·NVR 사양에 따라 이벤트 썸네일(정지 프레임)을 못 뽑는 경우가 있다.
// 그 사양용으로 안을 따로 파는 대신, 좌측 데스크톱 패널(DesktopVariantNav)의
// 토글 하나로 같은 안에서 두 상태를 다 볼 수 있게 했다.
//
//   ON (기본)  — 지금처럼 썸네일 이미지
//   OFF        — 썸네일이 있던 그 자리·그 크기에 시각 + "움직임 감지" 텍스트만
//
// 전달 방식은 '비교하기'(data-compare + comparechange)와 같다 — 문서 루트의
// data 속성에 쓰고 이벤트를 쏘면 안들이 구독한다. 안이 좌측 패널을 직접
// import 하지 않아도 되므로(모바일에선 패널 자체가 없다) 이 방식을 유지한다.
//
// 카드 크기는 건드리지 않는다. THUMB_MIN_H/MAX_H 48 로 못 박힌 85×48 안에
// 두 줄을 넣는다 — OFF 라고 레일 높이가 달라지면 시간바·목록 스트립 높이
// 규칙(layoutRules.ts)이 같이 흔들린다.
// ============================================================================

export const EVENT_THUMBS_EVENT = "eventthumbschange";

/** 문서 루트에서 현재 값을 읽는다. 기본은 켜짐. */
export function readEventThumbs(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.dataset.eventThumbs !== "false";
}

/** 썸네일 표시 여부를 구독한다. SSR·첫 렌더는 항상 true(기본값)로 맞춰 하이드레이션 불일치를 막는다. */
export function useEventThumbs(): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const sync = () => setOn(readEventThumbs());
    sync();
    window.addEventListener(EVENT_THUMBS_EVENT, sync);
    return () => window.removeEventListener(EVENT_THUMBS_EVENT, sync);
  }, []);
  return on;
}
