"use client";

import { useEffect, useRef, useState } from "react";

// 카메라 목록 배치(가로 한 줄 ↔ 세로 2열)를 정하는 단일 규칙 — 자세한 근거는
// app/components/layoutRules.ts 참고. 요약하면: 목록 방향은 폭만으로 정할 수 없다.
// 620px 이라도 4:5(620×775)처럼 세로로 긴 화면은 가로 한 줄로 깔면 타일 높이가
// 영역 높이만큼 커져 1개밖에 안 보인다. 그래서 '지금 이 영역에 어느 쪽이 더 많이
// 보이는가'를 재서 고른다 — 타일이 항상 16:9 라 두 배치 모두 개수가 계산으로 나온다.
//
// 반환한 ref 는 '목록 영역'(제목 + 타일 컨테이너를 감싸는 flex-1 박스)에 단다.
// headerPad 는 그 영역 안에서 타일이 못 쓰는 세로(제목·여백·pb)의 합.

const GAP = 8; // 타일 간격 (gap-2)
const PAD_X = 40; // 좌우 여백 (px-5)
const RATIO = 16 / 9; // 타일은 항상 16:9

export function useListLayout(headerPad: number) {
  const areaRef = useRef<HTMLDivElement>(null);
  // 첫 렌더 기본값은 세로 2열 — 폰 세로가 가장 흔하고, 잘못 잡혀도 첫 측정에서 바로 고쳐진다.
  const [listWide, setListWide] = useState(false);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const pick = () => {
      const W = el.clientWidth - PAD_X;
      const H = el.clientHeight - headerPad;
      if (W <= 0 || H <= 0) return;
      // 가로 한 줄: 타일 높이 = 영역 높이, 폭 = 높이 × 16/9 → 한 줄에 몇 개.
      const tileWh = H * RATIO;
      const countH = Math.max(1, Math.floor((W + GAP) / (tileWh + GAP)));
      // 세로 2열: 타일 폭 = (영역폭 − 갭)/2, 높이 = 폭 × 9/16 → 몇 줄 × 2개.
      const tileWv = (W - GAP) / 2;
      const tileHv = tileWv / RATIO;
      const rows = Math.max(1, Math.floor((H + GAP) / (tileHv + GAP)));
      setListWide(countH >= 2 * rows);
    };
    pick();
    const ro = new ResizeObserver(pick);
    ro.observe(el);
    return () => ro.disconnect();
  }, [headerPad]);
  return [areaRef, listWide] as const;
}
