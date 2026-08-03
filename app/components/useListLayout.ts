"use client";

import { useEffect, useRef, useState } from "react";
import { LIST_MIN_H, LIST_MIN_VISIBLE, TILE_MIN_H } from "./layoutRules";

// 카메라 목록 배치(가로 한 줄 ↔ 세로 2열)를 정하는 단일 규칙 — 자세한 근거는
// app/components/layoutRules.ts 참고.
//
// 전환 기준: 세로 2열로 '완전히 보이는 2개 + 반쯤 보이는 2개'(= 1.5줄)에 못 미치면
// 가로 한 줄로 넘어간다. 폭만으로는 못 가른다 — 620px 이라도 4:5 처럼 세로로 긴
// 화면은 세로 2열이 넉넉히 들어간다.
//
// 쓰는 법: areaRef 는 '목록 영역'(제목 + 타일 행을 감싸는 flex-1 박스, position:
// relative)에, rowRef 는 그 안의 '타일 행'(가로 한 줄 flex / 세로 2열 grid 가 되는
// 박스)에 단다. 타일이 실제로 쓸 수 있는 세로는 두 요소의 offset 차이로 직접 재므로,
// 제목이 있는 모드(실시간)와 없는 모드(녹화)를 상수로 추정하지 않는다.

const GAP = 8; // 타일 간격 (gap-2)
const PAD_X = 40; // 좌우 여백 (px-5)
const RATIO = 16 / 9; // 타일은 항상 16:9
const KEEP_ROWS = 1.5; // 세로 유지 기준 — 2개 완전 + 2개 반쯤

// noRowMinH: 타일 행이 없는 상태(녹화 '움직임 감지' 탭)에서 영역이 지켜야 할 높이.
// 가로 한 줄일 때 목록 영역도 이 높이에 맞춰, 탭을 오가도 높이가 안 튀게 한다.
export function useListLayout(noRowMinH?: number) {
  const areaRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  // 첫 렌더 기본값은 세로 2열 — 폰 세로가 가장 흔하고, 잘못 잡혀도 첫 측정에서 고쳐진다.
  const [listWide, setListWide] = useState(false);
  // 가로 한 줄일 때 타일 높이 상한(px) — LIST_MIN_VISIBLE 개가 보이도록.
  const [tileMaxH, setTileMaxH] = useState(0);
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

      const W = el.clientWidth - PAD_X;
      if (W <= 0) return;
      // 배치 판정에 쓸 '목록이 쓸 수 있는 세로'.
      // 영역의 현재 높이를 그대로 쓰면 안 된다 — 아래에서 가로 한 줄일 때 높이를
      // 고정하는데, 그 값을 다시 재면 판정이 자기 결과에 갇혀(가로 → 높이 고정 →
      // 계속 가로) 세로로 못 돌아온다. 그래서 컬럼 기하로 계산한다:
      //   컬럼 높이 − (목록·영상 뺀 나머지 형제) − 영상의 제 크기(16:9) − 크롬
      // 영상을 '현재 높이'가 아니라 '제 크기'로 넣는 게 핵심 — 목록이 얼마를
      // 가져갔는지와 무관한 값이라 순환하지 않는다.
      const col = el.parentElement;
      if (!col) return;
      const video = col.querySelector<HTMLElement>(".single-video-area");
      let others = 0;
      for (const c of Array.from(col.children)) {
        if (c === el || c === video) continue;
        // 절대배치(오버레이·토스트 등)는 flex 자리를 안 차지하므로 빼야 한다.
        // 안 빼면 화면을 덮는 오버레이 높이까지 더해져 남는 세로가 음수가 되고,
        // 폰에서도 늘 '가로 한 줄'로 잘못 넘어간다.
        const pos = getComputedStyle(c).position;
        if (pos === "absolute" || pos === "fixed") continue;
        others += c.getBoundingClientRect().height;
      }
      const videoIdeal = video
        ? parseFloat(getComputedStyle(video).maxHeight) || 0
        : 0;
      const availH = col.clientHeight - others - videoIdeal - chrome;
      if (!Number.isFinite(availH)) return;

      // 세로 2열 타일: 폭 = (영역폭 − 갭)/2, 높이 = 폭 × 9/16.
      const tileHv = (W - GAP) / 2 / RATIO;
      // 1.5줄 = 첫 줄(tileHv) + 갭 + 둘째 줄 절반. 이만큼도 안 나오면 가로로.
      const wide = availH < tileHv * KEEP_ROWS + GAP;
      setListWide(wide);

      // ── 2) 타일 크기 상한 — 가로 한 줄에서 최소 LIST_MIN_VISIBLE 개는 보이게 ──
      // 폭 (W − 갭×(n−1))/n 을 넘지 않게 하고 높이는 16:9 로 역산. 그리는 크기에만
      // 쓰고 위 판정에는 넣지 않는다(넣으면 전환 시점이 앞당겨진다).
      const tileCapH = Math.max(
        1,
        Math.floor((W - GAP * (LIST_MIN_VISIBLE - 1)) / LIST_MIN_VISIBLE / RATIO),
      );
      setTileMaxH(tileCapH);

      // ── 3) 영역 높이 ────────────────────────────────────────────────────────
      if (wide) {
        // 가로 한 줄 — 감지 탭과 같은 높이(noRowMinH)로 '고정'한다. flex 로 늘어나지
        // 않으니 남는 세로는 목록 아래 빈 공간으로 남지 않고 전부 단일 영상으로 간다
        // (영상은 grow 로 받되 16:9 에서 멈춘다). 타일은 h-full 로 이 높이를 채운다.
        const h = Math.max(TILE_MIN_H + chrome, noRowMinH ?? 0);
        el.style.flex = "none";
        el.style.height = `${h}px`;
        el.style.minHeight = "";
      } else {
        // 세로 2열 — 남는 세로를 목록이 채운다(스크롤). 바닥만 잡아 둔다.
        el.style.flex = "";
        el.style.height = "";
        el.style.minHeight = `${LIST_MIN_H}px`;
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
  return [areaRef, rowRef, listWide, tileMaxH] as const;
}
