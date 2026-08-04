"use client";

import { useEffect, useRef, useState } from "react";
import { LIST_MIN_H, TILE_MIN_H } from "./layoutRules";

// 카메라 목록 배치(가로 한 줄 ↔ 세로 2열)를 정하는 단일 규칙 — 자세한 근거는
// app/components/layoutRules.ts 참고.
//
// 전환 기준: 두 배치를 '각자의 목록 높이'로 깔았을 때 더 많이 보이는 쪽을 고른다.
// 세로 2열은 남는 세로를 다 쓰고, 가로 한 줄은 감지 탭과 같은 높이로 고정되므로
// 높이가 서로 다르다 — 그래서 개수도 각자의 높이로 세야 한다.
// 폭만으로는 못 가른다(620px 이라도 4:5 처럼 세로로 긴 화면은 세로 2열이 넉넉).
//
// 쓰는 법: areaRef 는 '목록 영역'(제목 + 타일 행을 감싸는 flex-1 박스, position:
// relative)에, rowRef 는 그 안의 '타일 행'(가로 한 줄 flex / 세로 2열 grid 가 되는
// 박스)에 단다. 타일이 실제로 쓸 수 있는 세로는 두 요소의 offset 차이로 직접 재므로,
// 제목이 있는 모드(실시간)와 없는 모드(녹화)를 상수로 추정하지 않는다.

const GAP = 8; // 타일 간격 (gap-2)
const PAD_X = 40; // 좌우 여백 (px-5)
const RATIO = 16 / 9; // 타일은 항상 16:9

// noRowMinH: 타일 행이 없는 상태(녹화 '움직임 감지' 탭)에서 영역이 지켜야 할 높이.
// 가로 한 줄일 때 목록 영역도 이 높이에 맞춰, 탭을 오가도 높이가 안 튀게 한다.
export function useListLayout(noRowMinH?: number) {
  const areaRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  // 첫 렌더 기본값은 세로 2열 — 폰 세로가 가장 흔하고, 잘못 잡혀도 첫 측정에서 고쳐진다.
  const [listWide, setListWide] = useState(false);
  const pickRef = useRef<() => void>(undefined);
  {
    pickRef.current = () => {
      // ref 는 호출 시점에 읽는다 — 첫 렌더 때 캡처하면 계속 null 을 붙들게 된다.
      const el = areaRef.current;
      if (!el) return;
      const row = rowRef.current;
      // 타일 행이 없는 상태(녹화의 '움직임 감지' 탭)에서는 목록 기준 높이가 의미 없다.
      // 이전 탭에서 걸어 둔 값이 남아 영역이 눌리거나 늘어나지 않도록 정리한다.
      if (!row) {
        el.style.flex = "";
        el.style.height = "";
        el.style.maxHeight = "";
        el.style.minHeight = noRowMinH ? `${noRowMinH}px` : "";
        return;
      }
      // 타일 위(제목·여백)와 아래(패딩)로 빠지는 세로 — 안마다 pb-3/pb-2 처럼 값이
      // 달라 상수로 못 박고 실측한다. offsetTop 은 area(position:relative) 기준.
      const padB = parseFloat(
        getComputedStyle(row.parentElement as Element).paddingBottom || "0",
      );
      const chrome = row.offsetTop + (Number.isFinite(padB) ? padB : 0);

      // 판정에 쓰는 '목록이 쓸 수 있는 세로' — 실제로 렌더된 높이에서 크롬을 뺀 값.
      // 컬럼 기하로 추정(컬럼 − 형제 − 영상 제 크기)해 봤지만, 영상이 이미 눌려 있는
      // 상태에선 실제와 크게 어긋났다(162 로 계산 vs 실제 114). 화면에 보이는 양이
      // 기준이므로 렌더 결과를 그대로 쓴다.
      const W = el.clientWidth - PAD_X;
      const availH = el.clientHeight - chrome;
      if (W <= 0 || availH <= 0) {
        // 첫 렌더 등으로 아직 자리를 못 받은 상태. 그냥 빠져나가면 0 인 채로 굳으니
        // 바닥을 깔아 두고, 그 리사이즈가 다음 측정을 부르게 한다.
        if (!el.style.minHeight) el.style.minHeight = `${LIST_MIN_H}px`;
        return;
      }

      // ── 어느 배치가 실제로 더 많이 보이나 ──────────────────────────────────
      // 중요: 두 배치는 '목록 영역 높이'가 서로 다르다.
      //  · 세로 2열 — 남는 세로를 다 쓴다(availH).
      //  · 가로 한 줄 — 감지 탭과 같은 높이로 고정된다(noRowMinH). 그래서 타일이
      //    그 높이만큼 커지고, 오히려 적게 보일 수 있다.
      // 각자 '자기 높이'로 개수를 낸 뒤 비교해야 한다. 예전엔 세로 기준 1.5줄이라는
      // 고정선으로 갈랐는데, 그러면 가로가 더 적게 보이는데도 넘어가는 구간이 생겼다.
      const tileHv = (W - GAP) / 2 / RATIO; // 세로 2열 타일 높이(폭에서 나옴)
      const rowsV = Math.max(1, Math.floor((availH + GAP) / (tileHv + GAP)));
      const countV = 2 * rowsV;

      const hWide = Math.max(TILE_MIN_H, (noRowMinH ?? TILE_MIN_H + chrome) - chrome);
      const tileWh = hWide * RATIO; // 가로 한 줄 타일 폭(높이에서 나옴)
      const countH = Math.max(1, Math.floor((W + GAP) / (tileWh + GAP)));

      // 같으면 세로를 남긴다 — 가로로 가서 얻는 게 없으면 굳이 안 바꾼다.
      const wide = countH > countV;
      setListWide(wide);

      // ── 3) 영역 높이 ────────────────────────────────────────────────────────
      // 바닥(min-height)만 잡는다. 높이를 고정하면 그 값이 다시 판정에 들어가
      // 가로에 갇히므로 쓰지 않는다. 가로 한 줄은 애초에 '자리가 빡빡할 때' 켜지는
      // 배치라 실제로 바닥에 붙고, 그래서 목록 아래에 빈 공간이 생기지 않는다.
      el.style.flex = "";
      el.style.height = "";
      el.style.minHeight = wide
        ? // 감지 탭과 같은 높이로 맞춰 탭 전환 시 영상 크기가 안 튀게 한다.
          `${Math.max(TILE_MIN_H + chrome, noRowMinH ?? 0)}px`
        : `${LIST_MIN_H}px`;
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
  return [areaRef, rowRef, listWide] as const;
}
