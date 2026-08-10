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

// 실기기에서 가로로 갈 때 브라우저 UI(주소창·툴바)와 OS 시스템 바까지 걷어
// 영상만 남긴다. 전체화면 API 는 '사용자 조작' 안에서만 허용되므로 회전 버튼을
// 누른 이 자리에서 바로 부른다 — 상태가 바뀐 뒤 effect 에서 부르면 제스처가
// 끊겨 거부된다.
//
// 플랫폼별로 되는 정도가 다르다:
//   · Android Chrome — 전체화면 되면 브라우저 UI·상태바·내비바가 다 사라진다.
//   · iPhone Safari  — requestFullscreen 자체가 없다(video 태그 전용). 아래
//                      guard 에 걸려 아무 일도 안 일어난다. 사파리 툴바·상태바를
//                      웹 페이지가 걷을 방법은 '홈 화면에 추가'(standalone) 뿐이다.
//   · 데스크톱 미리보기 — 목업이라 전체화면으로 만들면 좌측 패널까지 같이 커진다.
//                      hover+정밀 포인터면 건너뛴다.
function syncFullscreen(toLandscape: boolean) {
  if (typeof document === "undefined") return;
  const desktop =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktop) return;
  try {
    if (toLandscape) {
      const el = document.documentElement;
      // 거부(제스처 없음·미지원)는 그냥 무시한다 — 전체화면은 덤이고, 안 돼도
      // 회전 자체는 그대로 동작해야 한다.
      el.requestFullscreen?.({ navigationUI: "hide" })?.catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    }
  } catch {}
}

// 상단 바(아이폰 상태바 영역 / 안드로이드 상태바)의 색을 지금 화면에 맞춘다.
//
// 세로→가로→세로 를 오가면 상태바 영역이 검정으로 굳어 있는 문제가 있었다.
// 사파리는 viewport-fit=cover 인 페이지에서 상단 바 색을 페이지에서 샘플링해
// 쓰는데, 가로(영상만 있는 검정 화면)에서 잡은 색을 세로로 돌아와도 다시
// 안 잡는 경우가 있다. theme-color 를 명시하면 샘플링 대신 이 값을 쓰므로
// 방향이 바뀔 때마다 못 박아 준다 — 가로는 검정(영상), 세로는 흰색(앱 배경).
//
// html 배경도 같이 맞춘다. body 는 100svh 라 그 바깥(상태바 아래·툴바 뒤)은
// 캔버스(html 배경)가 칠하는데, 값을 바꾸는 것 자체가 그 영역을 다시 그리게
// 만든다. 데스크톱 미리보기는 목업 배경(#e5e5e5)이 따로 있으니 건드리지 않는다.
export function setBarColor(landscape: boolean) {
  if (typeof document === "undefined") return;
  const color = landscape ? "#000000" : "#ffffff";
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
  const desktop =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!desktop) document.documentElement.style.backgroundColor = color;
}

/** 딤의 회전 버튼에서 호출. 좌측 패널이 받아서 회전 토글을 뒤집는다. */
export function requestDeviceRotate() {
  // 지금 세로면 가로로 가는 것 — 그 방향에 맞춰 전체화면을 켜고 끈다.
  syncFullscreen(!readDeviceLandscape());
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
