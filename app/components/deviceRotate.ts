"use client";

import { useEffect, useState } from "react";

// ============================================================================
// 화면 전환(회전) 요청 — 딤 안의 회전 버튼 → 좌측 패널의 '왼쪽으로 회전'
// ============================================================================
// 실기기에서는 OS 가 회전을 처리하지만 이 프로토타입은 목업 프레임이라 돌 곳이
// 없다. 그래서 안들의 딤 회전 버튼은 좌측 패널(DesktopVariantNav)의 '왼쪽으로
// 회전' 토글을 그대로 누른 것과 같게 만든다 — 회전 연출(각도 트랜지션·배치
// 스위치)은 그 한 곳에만 두고, 여기서는 '눌렀다'는 사실만 이벤트로 보낸다.
//
// 안이 좌측 패널을 직접 import 하면 방향이 거꾸로다(패널은 데스크톱 전용 껍데기,
// 안은 그 안에 들어가는 내용물). 그래서 eventThumbs 와 같은 window 이벤트 방식.
// ============================================================================

export const DEVICE_ROTATE_EVENT = "devicerotaterequest";

/** 딤의 회전 버튼에서 호출. 좌측 패널이 받아서 회전 토글을 뒤집는다. */
export function requestDeviceRotate() {
  window.dispatchEvent(new Event(DEVICE_ROTATE_EVENT));
}

// ── 가로 모드 상태 ──────────────────────────────────────────────────────────
// 회전은 '프레임을 눕히는 연출'이 아니라 기기 크기(--device-w/h)를 맞바꾸는 것으로
// 동작한다. 눕히기만 하면 안의 콘텐츠까지 같이 누워 글자를 옆으로 읽어야 했다.
// 크기를 맞바꾸면 앱이 가로 폭 기준으로 다시 배치되므로 콘텐츠가 똑바로 선다.
export const LANDSCAPE_EVENT = "devicelandscapechange";

export function readDeviceLandscape(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.landscape === "true";
}

/** 가로 모드 여부를 구독한다. SSR·첫 렌더는 세로(false)로 맞춰 하이드레이션 불일치를 막는다. */
export function useDeviceLandscape(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(readDeviceLandscape());
    sync();
    window.addEventListener(LANDSCAPE_EVENT, sync);
    return () => window.removeEventListener(LANDSCAPE_EVENT, sync);
  }, []);
  return on;
}
