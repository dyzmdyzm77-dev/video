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

// 가로로 갈 때 전체화면(requestFullscreen)을 부르지 않는다 — 한 번 해 봤다가
// 뺐다(사용자 결정). 안드로이드 크롬은 전체화면에 들어가면 "아래로 내린 후
// 뒤로가기를 누르세요" 안내를 반드시 띄운다. 갇히지 않게 브라우저가 강제하는
// 것이라 웹 페이지에서 끌 방법이 없고, UT 중에 그 토스트가 뜨는 게 브라우저
// 주소창이 남는 것보다 방해된다고 봤다.
// (아이폰 사파리는 애초에 requestFullscreen 이 없어 해도 아무 일도 안 났다.
//  거기서 사파리 UI 를 걷는 방법은 '홈 화면에 추가'(standalone) 뿐이다.)

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

// ── 포인터 좌표축 보정 ──────────────────────────────────────────────────────
// 실기기 가로는 '화면이 돌아간' 게 아니라 콘텐츠를 CSS 로 90° 돌린 것이다
// (globals.css 의 터치 전용 규칙). 포인터 이벤트의 clientX/clientY 는 변환과
// 무관한 화면 좌표라, 콘텐츠 기준으로 보면 x·y 가 맞바뀐 상태가 된다.
//
// rotate(90deg) 는 콘텐츠의 로컬 (1,0)[오른쪽] 을 화면 (0,1)[아래] 로 보낸다.
// 그래서 콘텐츠 기준 가로 이동량 = 화면 세로 이동량(부호까지 그대로)이다.
// 시간바처럼 '가로로 끄는' UI 는 이때 clientY 를 읽어야 한다 — 안 그러면
// 손가락을 가로로 움직여도 clientX 가 거의 안 변해서 아무 반응이 없다.
//
// 데스크톱 목업은 각도를 0 으로 되돌리고 크기만 맞바꾸므로 콘텐츠가 똑바로
// 서 있다 — 거기선 보정하면 안 된다. 그래서 '터치 && 가로' 일 때만 참이다.
export function useRotatedInput(): boolean {
  const landscape = useDeviceLandscape();
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setTouch(true);
      return;
    }
    // 마운트 때 한 번만 재면 안 된다 — 데스크톱 미리보기에서 개발자도구로 기기를
    // 바꾸거나, 마우스가 붙었다 떨어지는 환경에서 판정이 굳는다. 변화도 구독한다.
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setTouch(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return landscape && touch;
}
