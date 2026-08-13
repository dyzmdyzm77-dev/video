"use client";

import { useEffect, useState } from "react";
import {
  LANDSCAPE_EVENT,
  readDeviceLandscape,
  requestDeviceRotate,
  setBarColor,
} from "./deviceRotate";
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
// 앱이 그리는 것(헤더·목록·탭바·가짜 시스템 바)에 더해, 실기기의 브라우저
// 주소창과 OS 바도 전체화면 API 로 같이 걷는다 — 아래 syncFullscreen 주석 참고.
// ============================================================================

// 확대할 때는 전체화면 API 로 브라우저 주소창과 OS 바까지 걷는다.
//
// 한 번 뺐다가 되돌렸다. 뺀 이유는 "아래로 내린 후 뒤로가기를 누르세요" 안내와
// '한 번 더 도는 회전' 이었는데, 회전 쪽 원인은 따로 잡혔다 — 실기기 확대가
// 이제 앱을 CSS 로 돌리지 않으므로(toggleImmersive), 전체화면 때문에 뷰포트가
// 바뀌어도 방향 전환으로 읽힐 일이 없다. 남는 건 안드로이드 크롬의 안내 토스트
// 하나뿐이고, 그건 사용자가 갇히지 않게 브라우저가 강제하는 것이라 웹에서 끌
// 방법이 없다. OS 바가 남는 것보다는 낫다는 판단(사용자 지적: "여전히
// 안드로이드바랑 상태바 다 보이는데, 아까는 없었는데").
//
// 안내 없이 바까지 없애려면 '홈 화면에 추가'로 설치해 열면 된다 — manifest 가
// display:"fullscreen" 이다(manifest.ts).
//
// 플랫폼별:
//   · Android Chrome — 주소창·상태바·내비바가 다 사라진다(안내 토스트 1회).
//   · iPhone Safari  — requestFullscreen 이 없다(video 전용). 아무 일도 안 난다.
//                      거기서 사파리 UI 를 걷는 건 '홈 화면에 추가'뿐이다.
//   · 데스크톱 미리보기 — 목업이라 전체화면이면 좌측 패널까지 커진다. 건너뛴다.
function syncFullscreen(on: boolean): Promise<unknown> {
  if (typeof document === "undefined") return Promise.resolve();
  const desktop =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktop) return Promise.resolve();
  try {
    if (on) {
      // 거부(미지원·제스처 없음)는 무시한다 — 전체화면은 덤이고, 안 되더라도
      // 확대 자체는 그대로 동작해야 한다.
      return (
        document.documentElement
          .requestFullscreen?.({ navigationUI: "hide" })
          ?.catch(() => {}) ?? Promise.resolve()
      );
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
    }
  } catch {}
  return Promise.resolve();
}

// ── 확대 중에는 방향을 잠근다 ────────────────────────────────────────────
// 확대는 '지금 보이는 이 화면'을 그대로 크게 보는 것이다. 그 상태에서 폰을
// 눕혔다고 화면이 다시 돌면 안 된다 — 세로에서 확대를 눌러 가로가 된 경우가
// 특히 그렇다. 앱이 CSS 로 90° 돌려 만든 가짜 가로라, 폰까지 눕으면 두 회전이
// 겹친다(사용자 지정: "세로에서 확대모드 눌렀는데 가로로 전환되는 상황의
// 경우는, 디바이스 눕혀도 고정이야 그냥").
//
// 그래서 OS 방향 자체를 잠근다. 잠기면 눕혀도 뷰포트가 안 바뀌므로 resize·
// orientationchange 가 아예 안 오고, 앱은 손댈 것도 없이 그냥 고정이다.
//
// 앱이 CSS 로 눕힌 확대라면 잠글 방향은 '세로'다 — 기기가 세로로 있어야
// 그 CSS 회전이 똑바로 선 가로로 보인다. 안 눕힌 확대(이미 가로거나 넓은
// 기기)는 지금 방향 그대로 잠근다.
//
// 플랫폼별:
//   · Android Chrome — 전체화면 안에서만 허용된다. syncFullscreen 뒤에 건다.
//   · iPhone Safari  — screen.orientation.lock 이 없다. 아무 일도 안 난다.
//                      거긴 아래 alignImmersiveRotation 이 대신 받아 준다
//                      (앱의 CSS 회전을 즉시 되감아 화면을 세워 둔다).
/** 데스크톱 미리보기는 물리 방향이 없다 — 잠글 것도 풀 것도 없고, 목업 프레임을
 *  CSS 로 눕히는 쪽이라 브라우저 창 방향을 건드리면 오히려 방해가 된다. */
function noPhysicalOrientation() {
  return (
    typeof window === "undefined" ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches)
  );
}

function lockOrientation(kind: "portrait" | "landscape") {
  if (noPhysicalOrientation()) return;
  try {
    const so = window.screen?.orientation as
      | (ScreenOrientation & { lock?: (o: string) => Promise<void> })
      | undefined;
    so?.lock?.(kind)?.catch(() => {});
  } catch {}
}

function unlockOrientation() {
  if (noPhysicalOrientation()) return;
  try {
    window.screen?.orientation?.unlock?.();
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
const ROTATE_GAIN = 1.5;

// 회전했을 때 '확대로까지' 갈지는 더 깐깐하게 본다(사용자 결정 2026-08-11).
// 확대 버튼은 이미 '크게 보겠다'는 의사표시라 조금만 이득이어도 눕히는 게 맞지만,
// 회전은 그냥 방향만 바꾸려는 것일 수도 있다. 비슷비슷하면 눕히기만 하고 화면은
// 그대로 두는 게 덜 놀랍다("비율이 어느정도 비슷하면 그냥 회전시키면 어때?").
//
//   360×780 3.16 / 480×780 2.64 / 405×648 2.56  → 회전하면 확대까지
//   620×780 1.58                                 → 회전만 (영상은 커지지만 애매)
//   750×832 1.23 / 780×780 1.00 / 그 이상        → 회전만
const AUTO_IMMERSIVE_GAIN = 2.0;

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
// 다만 아무 때나는 아니다. 눕혀서 영상이 확실히 커지는 기기에서만 그렇게 하고,
// 눕혀도 별로 안 커지는 기기(620×780 · 780×780 · 1080×792 등)는 회전을 그냥
// '방향 전환'으로 둔다. 같은 회전이 기기마다 다르게 동작하는 게 아니라,
// '영상이 커지느냐'는 하나의 기준으로 갈리는 것이다(AUTO_IMMERSIVE_GAIN).
const BY_ROTATE_FLAG = "immersiveByRotate";

/** 확대를 켜고 끌지 판단할 때 쓰는 '기기 자체의 방향'.
 *
 *  readDeviceWide 와 다르다. 그쪽은 '사용자 눈에 가로로 보이는가'라, 확대가
 *  앱을 CSS 로 눕혀 놓은 것도 가로로 친다. 확대 판정에 그걸 쓰면, 확대(앱을
 *  눕힘) 상태에서 폰까지 눕혔을 때 두 회전이 상쇄돼 '세로로 돌아왔다'로 읽히고
 *  확대가 꺼진다 — CSS 회전은 켜진 채로 남아 화면이 두 번 돈 꼴이 된다
 *  (사용자 지적: "확대 모드를 했다 세로에서? 근데 그러고 가로로 돌리잖아?
 *   그럼 두번 회전에서 이상하게 돼").
 *
 *  그래서 여기선 앱의 CSS 회전을 빼고 기기 자체만 본다. 데스크톱 미리보기는
 *  물리 기기가 없어 CSS 회전이 곧 기기 방향이므로 readDeviceWide 그대로다. */
function deviceOwnWide(): boolean {
  if (typeof window === "undefined") return false;
  const desktopPreview =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (desktopPreview) return readDeviceWide();
  return window.innerWidth > window.innerHeight;
}

/** 지금 가로 상태가 세로였을 때보다 영상이 확실히 큰가. shouldRotate 의 반대편 —
 *  이미 눕혀 놓은 상태에서 판정하므로 지금 크기가 가로, 맞바꾼 게 세로다. */
function landscapeIsMuchBetter(): boolean {
  const w = readDeviceWidth();
  const h = readDeviceHeight();
  const portrait = fitArea(h, w);
  if (!(portrait > 0)) return false;
  return fitArea(w, h) / portrait >= AUTO_IMMERSIVE_GAIN;
}

/** 방향이 바뀔 때마다 확대 상태를 맞춘다. 가로가 되면(그리고 그게 이득이면)
 *  확대를 켜고, 그때 켠 것이었다면 세로로 돌아올 때 끈다. 사용자가 확대
 *  버튼으로 직접 켠 건 건드리지 않는다(플래그로 구분).
 *
 *  '가로인가'는 readDeviceWide 로 본다 — 앱이 돌린 회전과 실기기 물리 회전을
 *  한 값으로 묶어 주는 유일한 출처다(useDeviceWidth.ts). */
// 직전에 본 화면 크기·방향. '가로다'가 아니라 '가로가 됐다'로 판정하기 위한 것 —
// 처음부터 가로인 상태(가로로 긴 프리셋을 고르거나, 가로로 든 채 앱을 열거나)
// 까지 확대로 끌고 가면 안 된다. 눕히는 '동작'만 신호로 본다.
//
// 방향(boolean)만 들고 있으면 '눕혔다'와 '다른 기기를 골랐다'를 못 가른다.
// 크기까지 기억해 두면 회전은 w·h 가 정확히 맞바뀐 것으로 알아볼 수 있다.
let lastState: { w: number; h: number; wide: boolean } | null = null;

/** 지금 크기·방향을 '기준값'으로만 기록한다(확대는 건드리지 않는다).
 *  데스크톱 미리보기에서 프리셋을 바꾸면 방향이 통째로 달라지는데, 그건
 *  '눕힌' 게 아니라 다른 기기를 고른 것이다. 기록만 해 두지 않으면 직전
 *  기기의 방향이 남아, 새 기기에서 눕혀도 '이미 가로였다'로 보고 지나친다.
 *
 *  단 회전일 때는 손대지 않는다 — 회전도 devicechange 를 같이 쏘는데, 여기서
 *  기준을 먼저 갱신해 버리면 뒤이어 오는 회전 신호가 '변화 없음'이 된다. */
export function noteDeviceOrientation() {
  if (typeof document === "undefined") return;
  const w = readDeviceWidth();
  const h = readDeviceHeight();
  if (lastState && w === lastState.h && h === lastState.w) return;
  lastState = { w, h, wide: deviceOwnWide() };
}

export function syncImmersiveWithLandscape() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const w = readDeviceWidth();
  const h = readDeviceHeight();
  const wide = deviceOwnWide();
  const prev = lastState;
  lastState = { w, h, wide };
  if (prev === null || prev.wide === wide) return;
  if (wide) {
    if (readImmersive()) return;
    // '눕혔다'가 아니라 '원래 방향으로 돌아왔다'면 확대할 일이 아니다.
    // 데스크톱 미리보기에는 가로로 긴 프리셋(1080×780 등)이 있는데, 그걸
    // 세로로 돌렸다가 되돌리면 '세로 → 가로' 전환으로 보여 확대가 켜졌다
    // (사용자 지적: "확대모드를 안했는데 되돌아올 때는 왜 확대모드가 되는거야").
    // data-landscape 는 '기본 방향에서 돌려 놓은 상태'라, 되돌아온 순간엔
    // false 다 — 그걸로 가른다.
    // 실기기는 이 플래그를 안 쓰고(물리 회전은 뷰포트만 바뀐다) 폰의 기본
    // 방향은 세로이므로, 미리보기에서만 따진다.
    const desktopPreview =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (desktopPreview && !readDeviceLandscape()) return;
    if (!landscapeIsMuchBetter()) return;
    root.dataset.immersive = "true";
    root.dataset[BY_ROTATE_FLAG] = "true";
    syncFullscreen(true);
    window.dispatchEvent(new Event(IMMERSIVE_EVENT));
    return;
  }
  // 세로가 됐다. 확대 화면은 '가로로 눕힌 영상'이라 세로에 남겨 두면 위아래로
  // 검은 띠만 남는다 — 눕혀서 켜진 확대는 여기서 같이 정리하고 보통 화면으로
  // 돌아온다.
  //
  // 단 '확대 버튼으로 켠 확대'는 예외다. 그건 방향과 무관하게 고정이고, 나가는
  // 길은 축소 버튼뿐이다(사용자 지정: "세로에서 확대모드 눌렀는데 가로로
  // 전환되는 상황의 경우는, 디바이스 눕혀도 고정이야 그냥. 그리고 그 상태에서
  // 축소모드 하면 세로로 돌아오는거고"). 실기기에선 애초에 방향을 잠가 두므로
  // (lockOrientation) 여기까지 잘 안 오지만, 잠금이 없는 아이폰 사파리가 있다.
  //
  // 데스크톱 미리보기는 예전 규칙 그대로 둔다 — 거긴 물리 방향이 없고 좌측
  // '왼쪽으로 회전'이 곧 방향이라, 안 끄면 '세로인데 확대 화면'이 남는다
  // (사용자 지적: "그 상태에서 또 가로 또는 세로로 눕히면 또 돌아가면 어떡해").
  if (!readImmersive()) return;
  if (
    !noPhysicalOrientation() &&
    root.dataset[BY_ROTATE_FLAG] !== "true"
  ) {
    return;
  }
  root.dataset[BY_ROTATE_FLAG] = "false";
  // 이미 세로다 — 확대를 끄면서 방향을 또 되돌릴 일은 없다.
  root.dataset[ROTATED_FLAG] = "false";
  root.dataset.immersive = "false";
  syncFullscreen(false);
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
  // 확대에서 잡힌 검은 상태바를 흰색으로 되찾는다(exitImmersive 와 같은 이유).
  requestAnimationFrame(() => setBarColor(false));
}

/** 지금 확대가 '앱을 눕혀서' 만든 상태인가. 좌측 패널의 회전 버튼이 이걸 보고
 *  '원복'(확대만 끄면 방향도 같이 돌아옴)인지 '직접 회전'인지 가른다. */
export function readImmersiveRotated(): boolean {
  if (typeof document === "undefined") return false;
  return (
    readImmersive() && document.documentElement.dataset[ROTATED_FLAG] === "true"
  );
}

/** 확대 중 폰을 눕혀도 앱은 아무것도 안 한다 — 그냥 냅둔다(사용자 지정:
 *  "가로 모드로 된 경우는 그냥 냅둬야지"). 나가는 길은 축소 버튼뿐이다.
 *
 *  전에는 여기서 CSS 회전을 되감았다(alignImmersiveRotation). 물리 회전 한 번에
 *  resize 가 여러 번 오는데 판정은 DOM 속성으로 해서 되감기가 겹쳐 나갔고,
 *  막아 놔도 React 리렌더 한 박자가 '한 번 더 도는' 것으로 보였다. 지금은 그
 *  맞바꿈을 CSS 미디어쿼리가 한다(globals.css 의 `@media (orientation: portrait)`)
 *  — 상태를 아무도 안 건드리니 눕혀도 조용하다.
 *
 *  거기에 더해 아예 OS 방향을 잠근다(lockOrientation) — 되는 곳(안드로이드
 *  크롬)에서는 뷰포트조차 안 돌아 정말로 고정이다. */

/** 딤의 확대/축소 버튼에서 호출. 지금 상태를 뒤집는다.
 *  전체화면·회전은 '사용자 조작' 안에서만 허용되므로 버튼 핸들러인 여기서 바로
 *  부른다 — 상태가 바뀐 뒤 effect 에서 부르면 제스처가 끊겨 거부된다. */
export function toggleImmersive() {
  if (readImmersive()) {
    exitImmersive();
    return;
  }
  // 확대에 들어가면 방향을 잠근다 — 눕혀도 그냥 고정이다(사용자 지정).
  // 전체화면 안에서만 허용되므로 전체화면이 잡힌 뒤에 건다. 잠글 방향은
  // '기기가 있어야 할 방향'이다: 앱을 CSS 로 눕혀 만든 가짜 가로라면 기기는
  // 세로로 있어야 하고, 안 눕혔으면 지금 방향 그대로다.
  const willRotate = !readDeviceLandscape() && shouldRotate();
  const lockTo: "portrait" | "landscape" = willRotate
    ? "portrait"
    : window.innerWidth > window.innerHeight
      ? "landscape"
      : "portrait";
  syncFullscreen(true).then(() => lockOrientation(lockTo));
  // 세로로 긴 프레임이면 눕혀야 영상이 커진다(ROTATE_GAIN). 이미 가로면 그대로.
  //
  // 실기기에서도 눕힌다. 잠깐 '실기기에선 안 눕힌다'로 뒀었는데 — 앱만 CSS 로
  // 돌면 OS 상태바·내비바는 세로 그대로라 콘텐츠만 옆으로 누워서였다 — 그건
  // 전체화면을 빼 둔 동안의 이야기다. 지금은 확대가 전체화면으로 그 바들을
  // 같이 걷으므로 어긋날 상대가 없다(syncFullscreen). 360 처럼 세로로 긴
  // 기기에서 확대가 안 눕는 게 오히려 어색하다는 지적이 있었다.
  if (willRotate) {
    document.documentElement.dataset[ROTATED_FLAG] = "true";
    // 확대 화면은 '회전이 끝난 뒤'에 켠다. 먼저 켜면 도는 동안 세로 프레임에
    // 가로용 확대 화면이 그려져 '제자리 확대 한 번 → 다시 가로로' 두 단계로
    // 보인다(사용자 지적). 이러면 보통 화면이 그냥 한 번 돌고, 다 돌면 확대
    // 화면이 된다.
    //
    // 전체화면(syncFullscreen)만은 위에서 미리 부른다 — 사용자 조작 안에서만
    // 허용되는 API 라 회전이 끝난 뒤에 부르면 제스처가 끊겨 거부된다.
    const onRotated = () => {
      window.removeEventListener(LANDSCAPE_EVENT, onRotated);
      document.documentElement.dataset.immersive = "true";
      window.dispatchEvent(new Event(IMMERSIVE_EVENT));
    };
    window.addEventListener(LANDSCAPE_EVENT, onRotated);
    requestDeviceRotate();
    return;
  }
  document.documentElement.dataset.immersive = "true";
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
}

/** 몰입 모드를 끈다. 확대하면서 눕힌 거였다면 방향도 원래대로 되돌린다 —
 *  사용자가 직접 눕혀 둔 가로는 건드리지 않는다(플래그로 구분). */
export function exitImmersive() {
  if (!readImmersive()) return;
  const ds = document.documentElement.dataset;
  // 확대가 눕힌 것이었나 / 눕혀서 켜진 것이었나. 둘 다 '세로에서 시작해 가로가
  // 된' 경우라, 축소하면 세로로 돌아가야 한다(사용자 지적: "가로 회전했다가
  // 축소 버튼 누르면 세로로 돌아가야지. 왜 가로 모드 고정되어잇어?").
  // 예전엔 앞쪽(확대가 눕힌 경우)만 되돌려서, 회전으로 켜진 확대를 끄면 가로에
  // 남았다.
  ds.immersive = "false";
  ds[ROTATED_FLAG] = "false";
  ds[BY_ROTATE_FLAG] = "false";
  // 잠금은 전체화면을 나가기 전에 푼다 — 나가면서 자동으로 풀리기도 하지만,
  // 안 풀린 채로 남으면 세로로 돌아온 뒤에도 방향이 굳는다.
  unlockOrientation();
  syncFullscreen(false);
  // 축소하면 앱이 걸어 둔 회전은 무조건 푼다. 어떤 경로로 눕었든(확대가 눕혔든,
  // 회전으로 켜졌든, 중간에 폰을 눕혔다 세웠든) 축소 뒤에는 기기 방향 그대로
  // 돌아와야 한다 — 플래그로 경로를 따지다 보니 어떤 순서에서는 눕은 채로
  // 남았다(사용자 지적: "눕힌 상황에서 축소하면 원래 세로 모드로 돌아와야지").
  // 이미 안 눕어 있으면(폰을 직접 눕혀 CSS 회전이 풀린 상태) 할 일이 없다.
  if (readDeviceLandscape()) requestDeviceRotate();
  window.dispatchEvent(new Event(IMMERSIVE_EVENT));
  // 상태바 색을 흰색으로 되찾는다. 확대는 검은 화면이 안전 영역까지 덮는
  // 배치라(globals.css 의 padding:0) 사파리가 상태바 색을 검정으로 잡아 두는데,
  // 세로로 돌아와도 스스로 다시 안 잡는다. 회전을 안 하는 경로(이미 세로)도
  // 있으므로 회전 쪽에 맡기지 않고 여기서 직접 부른다.
  // 화면이 흰 프레임으로 다시 그려진 다음이라야 해서 한 프레임 뒤에 부른다.
  requestAnimationFrame(() => setBarColor(false));
}

/** 몰입 여부를 구독한다. SSR·첫 렌더는 꺼짐(false)으로 맞춰 하이드레이션 불일치를 막는다. */
export function useImmersive(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(readImmersive());
    sync();
    window.addEventListener(IMMERSIVE_EVENT, sync);
    // 안드로이드에선 뒤로가기·스와이프로 전체화면만 빠져나올 수 있다. 그때
    // 확대 상태만 남으면 화면과 어긋나므로 같이 되돌린다.
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
