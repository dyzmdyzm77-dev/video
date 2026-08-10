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
// 여기까지는 '앱이 그리는 것'만 가린다. 실기기의 진짜 브라우저 주소창과 OS
// 내비게이션/상태 바는 전체화면 API 로만 걷을 수 있어서, 크게 보기로 들어갈 때
// 같이 요청한다(사용자 결정).
//
// 그 대가로 안드로이드 크롬은 "아래로 내린 후 뒤로가기를 누르세요" 안내를
// 반드시 띄운다 — 사용자가 갇히지 않게 브라우저가 강제하는 것이라 웹에서 끌
// 방법이 없다. 한 번 뺐다가(회전에 묶여 있던 시절) OS 바까지 가려 달라는
// 요구로 되돌린 것이니, 지우기 전에 그 트레이드오프를 먼저 확인할 것.
//
// 플랫폼별:
//   · Android Chrome — 주소창·상태바·내비바가 다 사라진다.
//   · iPhone Safari  — requestFullscreen 이 없다(video 전용). 아무 일도 안 난다.
//                      거기서 사파리 UI 를 걷는 건 '홈 화면에 추가'뿐이다.
//   · 데스크톱 미리보기 — 목업이라 전체화면이면 좌측 패널까지 커진다. 건너뛴다.
// ============================================================================

function syncFullscreen(on: boolean) {
  if (typeof document === "undefined") return;
  const desktop =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktop) return;
  try {
    if (on) {
      // 거부(미지원·제스처 없음)는 무시한다 — 전체화면은 덤이고, 안 되더라도
      // 크게 보기 자체는 그대로 동작해야 한다.
      document.documentElement.requestFullscreen?.({
        navigationUI: "hide",
      })?.catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    }
  } catch {}
}

export const IMMERSIVE_EVENT = "immersivechange";

export function readImmersive(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.immersive === "true";
}

/** 딤의 확대/축소 버튼에서 호출. 지금 상태를 뒤집는다.
 *  전체화면은 '사용자 조작' 안에서만 허용되므로 버튼 핸들러인 여기서 바로
 *  부른다 — 상태가 바뀐 뒤 effect 에서 부르면 제스처가 끊겨 거부된다. */
export function toggleImmersive() {
  const next = !readImmersive();
  document.documentElement.dataset.immersive = next ? "true" : "false";
  syncFullscreen(next);
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
}

/** 몰입 모드를 끈다(가로로 전환할 때처럼 상태를 정리해야 하는 쪽에서 쓴다). */
export function exitImmersive() {
  if (!readImmersive()) return;
  document.documentElement.dataset.immersive = "false";
  syncFullscreen(false);
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
}

/** 몰입 여부를 구독한다. SSR·첫 렌더는 꺼짐(false)으로 맞춰 하이드레이션 불일치를 막는다. */
export function useImmersive(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(readImmersive());
    sync();
    window.addEventListener(IMMERSIVE_EVENT, sync);
    // 안드로이드에선 뒤로가기·스와이프로 전체화면만 빠져나올 수 있다. 그때
    // 크게 보기 상태만 남으면 화면과 어긋나므로 같이 되돌린다.
    const onFs = () => {
      if (!document.fullscreenElement && readImmersive()) exitImmersive();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener(IMMERSIVE_EVENT, sync);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);
  return on;
}
