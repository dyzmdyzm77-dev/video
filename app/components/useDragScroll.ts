"use client";

import { useRef } from "react";

// ============================================================================
// 스크롤 영역을 마우스로 끌어서 굴리기 (데스크톱 미리보기용)
// ============================================================================
// 카메라 목록은 브라우저 기본 스크롤(overflow-x/y)만 쓴다. 실기기에선 스와이프로
// 잘 굴러가지만 데스크톱 미리보기에선 휠·트랙패드로만 움직인다 — 같은 화면의
// 시간바·감지 레일은 직접 만든 포인터 드래그라 마우스로 끌리니까, 목록만 안
// 끌리는 게 고장처럼 보였다(사용자 지적 2026-08-26: "카메라 목록은 왜 드래그가
// 안돼?").
//
// 그래서 마우스일 때만 드래그 스크롤을 얹는다. 터치는 손대지 않는다 — 브라우저
// 기본 스크롤이 이미 관성까지 해 주는데 가로채면 오히려 뻑뻑해진다.
//
// 타일이 클릭 대상(카메라 선택)이라, 끌고 나서 손을 떼면 그 클릭 한 번을 삼킨다.
// 감지 레일에서 쓰는 판정과 같은 방식이다 — 몇 px 이상 움직였으면 '끈 것'이다.
//
// 쓰는 법: 스크롤 컨테이너에 그대로 펼친다.
//   const drag = useDragScroll();
//   <div className="overflow-x-auto" {...drag}> … </div>
// ============================================================================

/** 이만큼 움직이면 '끈 것'으로 본다(px). 손이 미세하게 떨려도 클릭은 살린다. */
const SLOP = 4;

export function useDragScroll() {
  const drag = useRef<{
    el: HTMLElement;
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
    id: number;
  } | null>(null);
  // 끌고 난 직후의 click 한 번을 삼키기 위한 표.
  const swallow = useRef(false);

  const end = () => {
    const d = drag.current;
    if (!d) return;
    if (d.moved) {
      swallow.current = true;
      d.el.style.cursor = "";
      d.el.style.userSelect = "";
      if (d.el.hasPointerCapture?.(d.id)) d.el.releasePointerCapture(d.id);
    }
    drag.current = null;
  };

  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const el = e.currentTarget;
      drag.current = {
        el,
        x: e.clientX,
        y: e.clientY,
        left: el.scrollLeft,
        top: el.scrollTop,
        moved: false,
        id: e.pointerId,
      };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved) {
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
        d.moved = true;
        // 포인터를 잡아 둔다 — 타일 위를 벗어나도 계속 끌린다.
        d.el.setPointerCapture?.(d.id);
        d.el.style.cursor = "grabbing";
        // 끄는 동안 글자가 선택되면 파란 하이라이트가 남는다.
        d.el.style.userSelect = "none";
      }
      d.el.scrollLeft = d.left - dx;
      d.el.scrollTop = d.top - dy;
    },
    onPointerUp: end,
    onPointerCancel: end,
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => {
      if (!swallow.current) return;
      swallow.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}
