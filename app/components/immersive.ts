"use client";

import { useEffect, useState } from "react";
import { readDeviceLandscape, requestDeviceRotate } from "./deviceRotate";
import {
  readDeviceHeight,
  readDeviceWide,
  readDeviceWidth,
} from "./useDeviceWidth";

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

// ── 확대할 때 방향까지 정한다 ────────────────────────────────────────────
// 기준: '영상이 가장 커지는 상태로 간다'(사용자 결정). 유튜브 전체화면과 같은
// 개념이다 — 회전 버튼이 따로 있는 게 아니라, 전체화면 하나가 방향까지 정한다.
//
// 판정은 간단하다: 프레임이 세로로 길면 눕힌다. 16:9 영상 기준으로 이게 곧
// '면적 최대'와 같은 답이 된다. 360×780 이면 세로로는 360×203 인데 눕히면
// 780×439 로 4.7배다 — 세로로 아무리 늘려도 영상은 폭에 묶여 검은 여백만 는다.
// 반대로 이미 넓은 기기(780×780·864×648·1080×792)는 눕히면 오히려 작아지므로
// 그 자리에서 몰입만 한다.
//
// 다채널도 같은 규칙을 쓴다. 그리드는 배치가 알아서 바뀌어 이득이 단일만큼
// 크진 않지만, 같은 버튼이 화면마다 다르게 동작하면 안 된다.
const ROTATED_FLAG = "immersiveRotated";

// 눕혔을 때 영상이 이 배수 이상 커질 때만 돌린다. 회전은 사용자가 폰을 직접
// 돌려야 하는 동작이라, 조금 커지는 정도로는 오히려 번거롭다(사용자 결정).
// 기기별 실제 배수 — 1.5 를 넘는 건 폰 계열뿐이다:
//   360×780 3.16 / 480×780 2.64 / 620×780 1.58 / 405×648 2.56  → 돌린다
//   750×832 1.23 / 780×780 1.00                                 → 그대로 (차이 작음)
//   864×648 0.56 / 1080×780 0.52 / 1080×792 0.54                → 그대로 (오히려 작아짐)
// 1.3 으로 낮춰도 이 목록에선 결과가 같다. 여유를 두고 1.5 로 잡았다.
//
// 2.0 으로 올릴지 한 번 검토했다("비율이 비슷하면 굳이 확대까지 가야 하나").
// 이 목록에서 1.5 ↔ 2.0 사이에 걸리는 건 620×780(1.58) 하나뿐인데, 그것도
// 영상 면적이 58% 늘어 눈에 띄게 커지므로 확대로 보내는 게 맞다고 정했다
// (사용자 결정 2026-08-11). 올리기 전에 이 판단을 먼저 확인할 것.
const ROTATE_GAIN = 1.5;

/** 프레임 w×h 안에 16:9 영상이 들어갈 때의 면적. */
function fitArea(w: number, h: number): number {
  const r = 16 / 9;
  return w / h >= r ? h * r * h : w * (w / r);
}

/** 눕히는 게 확실히 이득인가. 지금 면적 대비 눕혔을 때 면적으로 판정한다.
 *  기준은 단일 영상(16:9)이다 — 다채널은 배치가 알아서 바뀌어 이득이 작지만,
 *  같은 버튼이 화면마다 다르게 동작하면 안 되므로 한 기준으로 통일한다. */
function shouldRotate(): boolean {
  const w = readDeviceWidth();
  const h = readDeviceHeight();
  const now = fitArea(w, h);
  if (!(now > 0)) return false;
  return fitArea(h, w) / now >= ROTATE_GAIN;
}

// ── 가로가 되면 자동으로 확대 ────────────────────────────────────────────
// 화면이 가로로 길어지면 확대 모드로 들어간다(사용자 결정 2026-08-11).
// 앱 안의 '왼쪽으로 회전'이든, 실기기를 손으로 눕힌 것이든 똑같이 본다 —
// 눕히는 행동 자체가 '영상 크게 보고 싶다'는 신호라, 어느 쪽으로 눕혔는지에
// 따라 다르게 동작하면 안 된다(유튜브·넷플릭스도 같은 규칙).
// 눕힌 화면에서 헤더·목록·탭바를 그대로 두면 영상이 오히려 작아진다 — 눕히는
// 목적 자체가 영상을 크게 보는 것이라, 가로 = 영상만 화면으로 맞춘다.
//
// 다만 아무 때나는 아니다. 판정은 확대 버튼이 방향을 정할 때와 같은 기준
// (ROTATE_GAIN)을 쓴다 — 눕혀서 영상이 확실히 커지는 기기(폰 계열)에서만
// 그렇게 하고, 눕혀도 별로 안 커지는 넓은 기기(780×780·1080×792 등)는 회전을
// 그냥 '방향 전환'으로 둔다. 같은 회전이 기기마다 다르게 동작하는 게 아니라,
// '영상이 커지느냐'는 하나의 기준으로 갈리는 것이다.
const BY_ROTATE_FLAG = "immersiveByRotate";

/** 지금 가로 상태가 세로였을 때보다 영상이 확실히 큰가. shouldRotate 의 반대편 —
 *  이미 눕혀 놓은 상태에서 판정하므로 지금 크기가 가로, 맞바꾼 게 세로다. */
function landscapeIsMuchBetter(): boolean {
  const w = readDeviceWidth();
  const h = readDeviceHeight();
  const portrait = fitArea(h, w);
  if (!(portrait > 0)) return false;
  return fitArea(w, h) / portrait >= ROTATE_GAIN;
}

/** 방향이 바뀔 때마다 확대 상태를 맞춘다. 가로가 되면(그리고 그게 이득이면)
 *  확대를 켜고, 그때 켠 것이었다면 세로로 돌아올 때 끈다. 사용자가 확대
 *  버튼으로 직접 켠 건 건드리지 않는다(플래그로 구분).
 *
 *  '가로인가'는 readDeviceWide 로 본다 — 앱이 돌린 회전과 실기기 물리 회전을
 *  한 값으로 묶어 주는 유일한 출처다(useDeviceWidth.ts). */
// 직전에 본 방향. '가로다'가 아니라 '가로가 됐다'로 판정하기 위한 것 —
// 처음부터 가로인 상태(가로로 긴 프리셋을 고르거나, 가로로 든 채 앱을 열거나)
// 까지 확대로 끌고 가면 안 된다. 눕히는 '동작'만 신호로 본다.
let lastWide: boolean | null = null;

export function syncImmersiveWithLandscape() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const wide = readDeviceWide();
  const prev = lastWide;
  lastWide = wide;
  if (prev === null || prev === wide) return;
  if (wide) {
    if (readImmersive()) return;
    if (!landscapeIsMuchBetter()) return;
    root.dataset.immersive = "true";
    root.dataset[BY_ROTATE_FLAG] = "true";
    syncFullscreen(true);
    window.dispatchEvent(new Event(IMMERSIVE_EVENT));
    return;
  }
  if (root.dataset[BY_ROTATE_FLAG] === "true") {
    root.dataset[BY_ROTATE_FLAG] = "false";
    root.dataset.immersive = "false";
    syncFullscreen(false);
    window.dispatchEvent(new Event(IMMERSIVE_EVENT));
  }
}

/** 딤의 확대/축소 버튼에서 호출. 지금 상태를 뒤집는다.
 *  전체화면·회전은 '사용자 조작' 안에서만 허용되므로 버튼 핸들러인 여기서 바로
 *  부른다 — 상태가 바뀐 뒤 effect 에서 부르면 제스처가 끊겨 거부된다. */
export function toggleImmersive() {
  if (readImmersive()) {
    exitImmersive();
    return;
  }
  document.documentElement.dataset.immersive = "true";
  syncFullscreen(true);
  // 세로로 긴 프레임이면 눕혀야 영상이 커진다. 이미 가로면 그대로 둔다.
  if (!readDeviceLandscape() && shouldRotate()) {
    document.documentElement.dataset[ROTATED_FLAG] = "true";
    requestDeviceRotate();
  }
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
}

/** 몰입 모드를 끈다. 확대하면서 눕힌 거였다면 방향도 원래대로 되돌린다 —
 *  사용자가 직접 눕혀 둔 가로는 건드리지 않는다(플래그로 구분). */
export function exitImmersive() {
  if (!readImmersive()) return;
  document.documentElement.dataset.immersive = "false";
  // 회전으로 자동으로 켠 것이었더라도, 손으로 껐으면 그 자국은 지운다 —
  // 안 지우면 세로로 돌아갈 때 이미 꺼진 걸 또 끄려 든다.
  document.documentElement.dataset[BY_ROTATE_FLAG] = "false";
  syncFullscreen(false);
  if (document.documentElement.dataset[ROTATED_FLAG] === "true") {
    document.documentElement.dataset[ROTATED_FLAG] = "false";
    requestDeviceRotate();
  }
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
