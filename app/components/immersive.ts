"use client";

import { useEffect, useState } from "react";

// ============================================================================
// 몰입 모드 — 영상만 화면을 꽉 채우기
// ============================================================================
// 딤의 확대 버튼(zoom_in)이 켜고 끈다. 켜지면 상태바·헤더·하단 탭바·안드로이드
// 내비를 다 걷고 영상 화면 하나만 남긴다 — 화면(app-safe-frame) 전체를 영상이
// 쓴다. 레이아웃은 가로 모드와 같은 것을 쓴다(LandscapeVideo): 장소명은 왼쪽
// 위, 실시간/녹화 칩 + 시각은 위 가운데, 플레이어·시간바는 아래. "가로 전환
// 때처럼 위치는 동일하게"가 요구사항이라 화면을 새로 만들지 않고 그대로 쓴다.
//
// 회전(가로)과는 다른 개념이다. 가로는 기기를 눕히는 것이고, 몰입은 지금
// 방향 그대로 영상만 키우는 것이다. 그래서 상태를 따로 둔다 — 다만 두 상태
// 모두 같은 '영상만' 화면을 그리므로, 안들은 (landscape || immersive) 로 분기한다.
//
// 전달 방식은 eventThumbs·deviceRotate 와 같다: 문서 루트의 data 속성에 쓰고
// 이벤트를 쏜다. 버튼은 공용 딤(GridSelectionOverlay)에 있어 안의 상태를 직접
// 못 건드리기 때문이다.
//
// 실기기의 '진짜' 브라우저 UI(주소창)와 OS 상태바까지 걷지는 못한다 — 전체화면
// API 를 쓰면 안드로이드 크롬이 "아래로 내린 후 뒤로가기" 안내를 강제로 띄워서
// 빼기로 했다(deviceRotate.ts 참고). 여기서 가려지는 건 앱이 그리는 것들이다.
// ============================================================================

export const IMMERSIVE_EVENT = "immersivechange";

export function readImmersive(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.immersive === "true";
}

/** 딤의 확대/축소 버튼에서 호출. 지금 상태를 뒤집는다. */
export function toggleImmersive() {
  const next = !readImmersive();
  document.documentElement.dataset.immersive = next ? "true" : "false";
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
}

/** 몰입 모드를 끈다(가로로 전환할 때처럼 상태를 정리해야 하는 쪽에서 쓴다). */
export function exitImmersive() {
  if (!readImmersive()) return;
  document.documentElement.dataset.immersive = "false";
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
}

/** 몰입 여부를 구독한다. SSR·첫 렌더는 꺼짐(false)으로 맞춰 하이드레이션 불일치를 막는다. */
export function useImmersive(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(readImmersive());
    sync();
    window.addEventListener(IMMERSIVE_EVENT, sync);
    return () => window.removeEventListener(IMMERSIVE_EVENT, sync);
  }, []);
  return on;
}
