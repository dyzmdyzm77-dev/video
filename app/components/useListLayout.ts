"use client";

import { useEffect, useRef, useState } from "react";
import { LIST_MIN_H, LIST_MIN_VISIBLE, TILE_MIN_H } from "./layoutRules";

// 카메라 목록 배치(가로 한 줄 ↔ 세로 2열)를 정하는 단일 규칙 — 자세한 근거는
// app/components/layoutRules.ts 참고. 요약하면: 목록 방향은 폭만으로 정할 수 없다.
// 620px 이라도 4:5(620×775)처럼 세로로 긴 화면은 가로 한 줄로 깔면 타일 높이가
// 영역 높이만큼 커져 1개밖에 안 보인다. 그래서 '지금 이 영역에 어느 쪽이 더 많이
// 보이는가'를 재서 고른다 — 타일이 항상 16:9 라 두 배치 모두 개수가 계산으로 나온다.
//
// 쓰는 법: areaRef 는 '목록 영역'(제목 + 타일 행을 감싸는 flex-1 박스, position:
// relative)에, rowRef 는 그 안의 '타일 행'(가로 한 줄 flex / 세로 2열 grid 가 되는
// 박스)에 단다. 타일이 실제로 쓸 수 있는 세로는 두 요소의 offset 차이로 직접 재므로,
// 제목이 있는 모드(실시간)와 없는 모드(녹화)를 상수로 추정하지 않는다 — 예전엔
// 52/24 같은 어림값을 썼는데 실제 제목 블록 높이(40)와도 안 맞았고, 그 탓에 모드마다
// 타일 최소 높이가 갈렸다. 지금은 훅이 area 의 min-height 도 실측으로 잡아 준다.

const GAP = 8; // 타일 간격 (gap-2)
const PAD_X = 40; // 좌우 여백 (px-5)
const RATIO = 16 / 9; // 타일은 항상 16:9

// noRowMinH: 타일 행이 없는 상태(녹화 '움직임 감지' 탭)에서 영역이 지켜야 할 최소
// 높이. 안 주면 최소 높이를 해제한다.
export function useListLayout(noRowMinH?: number) {
  const areaRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  // 첫 렌더 기본값은 세로 2열 — 폰 세로가 가장 흔하고, 잘못 잡혀도 첫 측정에서 바로 고쳐진다.
  const [listWide, setListWide] = useState(false);
  // 가로 한 줄일 때 타일 높이 상한(px) — LIST_MIN_VISIBLE 개가 보이도록.
  const [tileMaxH, setTileMaxH] = useState(0);
  // 현재 배치를 pick() 안에서 읽기 위한 미러(min-height 기준이 배치마다 다름).
  const wideRef = useRef(false);
  wideRef.current = listWide;
  // pick 을 ref 에 담아 두 이펙트가 같은 최신 함수를 쓰게 한다.
  const pickRef = useRef<() => void>(undefined);
  {
    pickRef.current = () => {
      // ref 는 호출 시점에 읽는다 — 첫 렌더 때 캡처하면 계속 null 을 붙들게 된다.
      const el = areaRef.current;
      if (!el) return;
      const row = rowRef.current;
      // 타일 행이 없는 상태(녹화의 '움직임 감지' 탭 등)에서는 목록 기준 최소 높이가
      // 의미 없다. 이전 탭에서 걸어 둔 값이 남아 영역이 계속 눌려 있지 않도록 지운다.
      if (!row) {
        el.style.minHeight = noRowMinH ? `${noRowMinH}px` : "";
        return;
      }
      // 타일 위(제목·여백)와 아래(패딩)로 빠지는 세로 — 안마다 pb-4/pb-2 처럼 값이
      // 달라서 상수로 못 박고 실측한다. offsetTop 은 area(position:relative) 기준.
      const padB = parseFloat(
        getComputedStyle(row.parentElement as Element).paddingBottom || "0",
      );
      const chrome = row.offsetTop + (Number.isFinite(padB) ? padB : 0);
      // 목록 영역의 최소 높이 — 세로가 짧아질 때 목록이 아니라 위의 단일 영상이 먼저
      // 줄어들게 하는 바닥. 배치에 따라 기준이 다르다:
      //  · 가로 한 줄 — 타일 세로를 직접 잡는다(TILE_MIN_H). 크롬을 실측해 더하므로
      //    실시간/녹화 어느 모드·어느 안이든 '타일' 최소 세로가 똑같이 TILE_MIN_H.
      //  · 세로 2열 — 타일 가로가 영역 폭에서 나오고 세로는 딸려오므로 타일을 잡을
      //    이유가 없다. 기존처럼 영역 자체에 LIST_MIN_H 를 둔다.
      el.style.minHeight = wideRef.current
        ? `${TILE_MIN_H + chrome}px`
        : `${LIST_MIN_H}px`;
      // clientWidth/offsetTop 은 레이아웃 px — 데스크톱 미리보기의 --device-scale
      // 확대/축소(transform)에 영향받지 않아 GAP 같은 상수와 단위가 맞는다.
      const W = el.clientWidth - PAD_X;
      const H = el.clientHeight - chrome;
      if (W <= 0 || H <= 0) return;
      // 가로 한 줄: 타일 높이 = 남은 높이. 단 LIST_MIN_VISIBLE 개는 보여야 하므로
      // 폭 (W − 갭×(n−1))/n 을 넘지 않게 상한을 둔다(높이는 16:9 로 역산).
      const capW = (W - GAP * (LIST_MIN_VISIBLE - 1)) / LIST_MIN_VISIBLE;
      const capH = Math.max(1, Math.floor(capW / RATIO));
      setTileMaxH(capH);
      const tileH = Math.min(H, capH);
      const tileWh = tileH * RATIO;
      const countH = Math.max(1, Math.floor((W + GAP) / (tileWh + GAP)));
      // 세로 2열: 타일 폭 = (영역폭 − 갭)/2, 높이 = 폭 × 9/16 → 몇 줄 × 2개.
      const tileWv = (W - GAP) / 2;
      const tileHv = tileWv / RATIO;
      const rows = Math.max(1, Math.floor((H + GAP) / (tileHv + GAP)));
      setListWide(countH >= 2 * rows);
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
  return [areaRef, rowRef, listWide, tileMaxH] as const;
}
