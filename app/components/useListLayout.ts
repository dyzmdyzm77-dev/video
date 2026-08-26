"use client";

import { useEffect, useRef, useState } from "react";
import { LIST_MIN_H, LIST_MIN_VISIBLE, TILE_MIN_H } from "./layoutRules";

// 카메라 목록 배치(가로 한 줄 ↔ 세로 2열)를 정하는 단일 규칙 — 자세한 근거는
// app/components/layoutRules.ts 참고.
//
// 전환 기준: 세로 2열로 '완전히 보이는 2개 + 반쯤 보이는 2개'(= 1.5줄)에 못 미치면
// 가로 한 줄로 넘어간다. 폭만으로는 못 가른다(620px 이라도 4:5 처럼 세로로 긴 화면은
// 세로 2열이 넉넉하다).
//
// 쓰는 법: areaRef 는 '목록 영역'(제목 + 타일 행을 감싸는 flex-1 박스, position:
// relative)에, rowRef 는 그 안의 '타일 행'(가로 한 줄 flex / 세로 2열 grid 가 되는
// 박스)에 단다. 타일이 실제로 쓸 수 있는 세로는 두 요소의 offset 차이로 직접 재므로,
// 제목이 있는 모드(실시간)와 없는 모드(녹화)를 상수로 추정하지 않는다.
// videoRef 는 .single-video-area 에 단다(pin 을 쓸 때만) — 아래 참고.

const GAP = 8; // 타일 간격 (gap-2)
const PAD_X = 40; // 좌우 여백 (px-5)
const RATIO = 16 / 9; // 타일은 항상 16:9

/**
 * motionH: 가로 한 줄일 때 목록 영역이 지켜야 할 높이(px). 지금은 네 안이 모두
 *   '움직임 감지' 탭 스트립 높이(MOTION_MIN_H)를 넘긴다. 안 넘기면 타일 최소 높이만
 *   바닥이다.
 * pin: 그 높이를 '최소'가 아니라 '정확히'로 못 박을지.
 *   · 목록 스트립과 감지 탭 스트립이 1px 도 안 어긋난다. 예전엔 최소로만 걸어서,
 *     세로가 남는 화면(620×780·750×832)에선 목록만 flex-1 로 늘어나 타일이 커지고
 *     감지 탭보다 60~40px 두꺼워 보였다.
 *   · 못 박고 남는 세로는 videoRef(단일 영상 영역)가 가져간다. 그래서 스트립 아래에
 *     빈 공간이 안 남는다. 가로 한 줄일 땐 영상이 16:9 를 넘겨 세로로 늘어나도 된다
 *     (사용자 결정). 세로 2열일 땐 목록이 남는 세로를 쓰므로 영상은 16:9 그대로다.
 *   videoRef 를 안 달면 못 박기만 하고 남는 세로는 빈 공간으로 남는다.
 * tileMinH: 가로 한 줄일 때 타일 세로의 바닥(px). 기본은 네 안이 같이 쓰는
 *   TILE_MIN_H(88). A-4 만 72 로 낮춰 부른다 — 750 처럼 넓은 화면에서 88 은
 *   스트립이 두꺼워 카드가 커 보인다는 지적(사용자 2026-08-26)에 따른 것으로,
 *   그 안의 카메라 목록·움직임 감지가 같이 낮아져 두 탭 크기는 계속 일치한다.
 *   다른 안은 인자를 안 넘기므로 예전 그대로다.
 */
export function useListLayout(
  motionH?: number,
  pin = false,
  tileMinH: number = TILE_MIN_H,
) {
  const areaRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  // 타일 행이 없는 '움직임 감지' 탭에서도 배치를 다시 판정하려면 크롬 값이 필요한데,
  // 그건 타일 행이 있어야 잴 수 있다. 마지막으로 잰 값을 들고 있는다.
  const chromeRef = useRef(0);
  // 첫 렌더 기본값은 세로 2열 — 폰 세로가 가장 흔하고, 잘못 잡혀도 첫 측정에서 고쳐진다.
  const [listWide, setListWide] = useState(false);
  const pickRef = useRef<() => void>(undefined);
  {
    pickRef.current = () => {
      // ref 는 호출 시점에 읽는다 — 첫 렌더 때 캡처하면 계속 null 을 붙들게 된다.
      const el = areaRef.current;
      if (!el) return;
      const row = rowRef.current;
      const pinned = pin && motionH ? motionH : 0;
      const vid = videoRef.current;
      // 영상 영역: 기본은 globals.css 의 16:9 상한(flex-grow 0 / max-height 56.25cqw).
      // 가로 한 줄일 때만 상한을 풀어 남는 세로를 가져가게 한다.
      // 상태만 켜고 끈다 — 실제 크기(flex-grow · 늘어남 한도 · 박스 폭 100%)는
      // globals.css 의 [data-fill] 규칙이 잡는다. 인라인으로 잡으면 늘어남 한도를
      // '영역 폭 ÷ 1.5' 로 줘야 하는데, 그 폭을 여기서 또 재야 해서 CSS 에 맡겼다.
      const videoFill = (on: boolean) => {
        if (!vid) return;
        if (on) vid.dataset.fill = "true";
        else delete vid.dataset.fill;
      };

      if (!row && !pinned) {
        // 타일 행이 없고(감지 탭) 못 박지도 않는 안(A-1·B) — 감지 탭이 세로 타임라인이라
        // 영역을 채우는 게 맞다. 이전 탭에서 걸어 둔 값만 정리하고 flex-1 로 둔다.
        el.style.flex = "";
        el.style.height = "";
        el.style.maxHeight = "";
        el.style.minHeight = motionH ? `${motionH}px` : "";
        videoFill(false);
        return;
      }

      // 타일 위(제목·여백)와 아래(패딩)로 빠지는 세로 — 안마다 pb-3/pb-2 처럼 값이
      // 달라 상수로 못 박고 실측한다. offsetTop 은 area(position:relative) 기준이고
      // 영역 높이와 무관하므로 아래 초기화보다 먼저 읽어도 된다. 타일 행이 없는
      // 감지 탭에선 직전에 재 둔 값을 쓴다(위·아래 여백은 탭이 바뀌어도 같다).
      let chrome = chromeRef.current;
      if (row) {
        // 타일 아래로 빠지는 여백 — 스크롤 래퍼의 padding-bottom 과 영역 자신의
        // padding-bottom 둘 다. 영역 쪽에 둔 여백은 스크롤을 해도 안 사라지라고
        // 밖에 뺀 것이라(사용자 지적 2026-08-26), 높이 계산에서 빠지면 안 된다.
        const num = (v: string) => {
          const n = parseFloat(v || "0");
          return Number.isFinite(n) ? n : 0;
        };
        const padB =
          num(getComputedStyle(row.parentElement as Element).paddingBottom) +
          num(getComputedStyle(el).paddingBottom);
        // offsetTop 은 영역(position:relative) 기준이라 영역의 padding-top 이 이미 들어 있다.
        chrome = row.offsetTop + padB;
        chromeRef.current = chrome;
      }

      // ── 1) 판정 전 초기화 ───────────────────────────────────────────────────
      // 지난 판정이 걸어 둔 크기를 그대로 두고 재면 그 값이 다시 판정에 들어가
      // 한 배치에 갇힌다(목록을 가로로 못 박고 영상이 남는 세로를 먹은 상태로 재면,
      // 목록은 영영 좁게 잡힌다). 걷어내고 '세로 2열이라면 받았을 높이'(영상은 16:9
      // 상한 + 목록은 flex-1 에 바닥 LIST_MIN_H)로 되돌려 놓고 잰다 — 아래 판정의
      // availH 가 곧 세로 2열 후보의 높이라서, 그 상태로 재는 게 맞다.
      // 바닥까지 지우면 flex-basis 0 짜리 영역이 0 으로 붕괴해 측정이 망가진다.
      videoFill(false);
      el.style.flex = "";
      el.style.height = "";
      el.style.maxHeight = "";
      el.style.minHeight = `${LIST_MIN_H}px`;

      // 판정에 쓰는 '목록이 쓸 수 있는 세로' — 위 초기화 상태에서 실제로 렌더된
      // 높이에서 크롬을 뺀 값(= 세로 2열이 받을 높이). 컬럼 기하로 추정(컬럼 −
      // 형제 − 영상 제 크기)해 봤지만, 영상이 이미 눌려 있는 상태에선 실제와 크게
      // 어긋났다(162 로 계산 vs 실제 114). 화면에 보이는 양이 기준이므로 렌더
      // 결과를 그대로 쓴다. clientHeight 읽기가 위 스타일 변경을 반영해 준다.
      const W = el.clientWidth - PAD_X;
      const availH = el.clientHeight - chrome;
      if (W <= 0 || availH <= 0) {
        // 첫 렌더 등으로 아직 자리를 못 받은 상태. 그냥 빠져나가면 0 인 채로 굳으니
        // 바닥을 깔아 두고, 그 리사이즈가 다음 측정을 부르게 한다.
        el.style.minHeight = `${LIST_MIN_H}px`;
        return;
      }

      // ── 2) 세로 2열로 '1.5줄'이 되나 ────────────────────────────────────────
      // 기준은 '완전히 보이는 2개 + 반쯤 보이는 2개'(= 1.5줄). 그만큼도 안 들어가면
      // 세로 2열은 한 줄(2개)만 덩그러니 보이고 나머진 스크롤이라 목록 구실을 못 한다
      // → 가로 한 줄로 넘어간다. 필요한 세로 = 1줄 + 갭 + 반줄.
      //
      // '두 배치의 노출 개수를 세서 많은 쪽'으로 바꿔 본 적 있는데(832e35a), 405×648
      // 처럼 양쪽 다 2개인 구간에서 비겨 세로에 눌러앉아 1.5줄 규칙을 어겼다. 되돌렸다.
      const tileHv = (W - GAP) / 2 / RATIO; // 세로 2열 타일 높이(폭에서 나옴)
      const wide = availH < tileHv * 1.5 + GAP;
      setListWide(wide);

      // 가로 한 줄일 때 타일 높이는 '최소 N개가 보이는' 폭에서 거꾸로 나온다
      // (layoutRules 의 LIST_MIN_VISIBLE). 행 높이를 그대로 채우게만 두면 좁은
      // 화면에서 타일이 커져 두 개 남짓만 보였다.
      const tileHwide = (W - GAP * (LIST_MIN_VISIBLE - 1)) / LIST_MIN_VISIBLE / RATIO;

      // ── 3) 영역 높이 ────────────────────────────────────────────────────────
      if (wide && pinned) {
        // 감지 탭과 정확히 같은 높이. min-height 가 아니라 고정 height 다 — 늘어나면
        // 그만큼 타일이 두꺼워져 감지 탭과 안 맞는다. 남는 세로는 영상이 가져간다.
        //
        // 높이는 셋 중 가운데를 고른다: 못 박은 값(pinned)과 타일 바닥(TILE_MIN_H)이
        // 위쪽 한계고, N개 규칙이 그보다 작으면 그쪽을 따른다 — 좁은 화면에서만
        // 줄어들고 넓은 화면은 지금 그대로다.
        const wanted = Math.max(tileMinH + chrome, pinned);
        el.style.flex = "none";
        el.style.height = `${Math.min(wanted, tileHwide + chrome)}px`;
        el.style.minHeight = "";
        videoFill(true);
      } else {
        // 세로 2열이거나, 못 박지 않는 안 — 바닥만 잡고 flex-1 로 남는 세로를 받는다.
        // 세로 2열은 타일 폭이 영역 폭에서 나오므로 영역 기준 바닥(LIST_MIN_H),
        // 가로 한 줄은 감지 탭 높이(없으면 타일 기준 바닥)를 쓴다. 타일 행이 없는
        // 감지 탭은 스트립 높이(motionH)만 지키면 된다.
        el.style.flex = "";
        el.style.height = "";
        el.style.minHeight = !row
          ? `${motionH}px`
          : wide
            ? // 못 박지 않는 안(A-1·B)도 같은 규칙 — N개가 보이는 높이가 더 작으면
              // 그쪽을 바닥으로 쓴다.
              `${Math.min(
                Math.max(tileMinH + chrome, motionH ?? 0),
                tileHwide + chrome,
              )}px`
            : `${LIST_MIN_H}px`;
        videoFill(false);
      }
    };
  }
  // (1) 매 렌더 뒤 재계산 — 실시간↔녹화, 목록↔움직임감지 처럼 제목·여백이 바뀌면
  //     크롬 높이가 달라진다. 이때 React 가 '타일 행' DOM 을 새로 만들 수 있어서
  //     ResizeObserver 만으로는 못 잡는다(옛 노드를 계속 보고 있게 됨).
  useEffect(() => {
    pickRef.current?.();
  });
  // (2) 크기 변화 — 기기 폭/높이 전환, 회전 등. area 는 렌더가 바뀌어도 같은 노드라
  //     한 번만 붙여 두면 된다.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => pickRef.current?.());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [areaRef, rowRef, listWide, videoRef] as const;
}
