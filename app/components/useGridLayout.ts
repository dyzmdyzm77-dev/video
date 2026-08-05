"use client";

import { useEffect, useRef, useState } from "react";
import { GRID_TILE_RATIO } from "./layoutRules";

// 다채널(그리드) 배치가 보는 '영상 영역 비율'(가로/세로) 하나를 안들이 공유한다.
// 자세한 근거는 layoutRules.ts 의 GRID_AUTO_LADDER / bestGridForCount 주석 참고.
//
// areaRef 를 그리드 페이지가 슬라이드하는 <section>(헤더·하단 컨트롤을 뺀
// 나머지 전부)에 단다. 그 섹션의 크기는 cols×rows 선택과 무관하다(그리드는
// 섹션 '안'을 나누기만 하므로) — 그래서 배치를 고르는 데 써도 순환 의존이
// 없다. 첫 렌더는 아직 잴 수 없으니 16:9 를 기본값으로 둔다(측정되는 즉시
// 보정됨 — useListLayout 의 listWide 기본값과 같은 패턴).
//
// ResizeObserver 만 믿지 않는다 — useDeviceWidth 가 이미 겪은 것과 같은 이유로,
// LNB 프리셋 선택·드래그 리사이즈·실기기 회전은 각각 'devicechange' /
// 'deviceresize' / 'resize' 로 신호를 보낸다(useDeviceWidth.ts 참고). 이
// 이벤트들에도 직접 반응해 getBoundingClientRect 로 즉시 재는 걸 더해 — 두
// 경로 중 하나만 살아 있어도 비율이 굳지 않는다.
export function useGridAreaRatio() {
  const areaRef = useRef<HTMLElement>(null);
  const [ratio, setRatio] = useState(GRID_TILE_RATIO);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setRatio(r.width / r.height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const evts = ["devicechange", "devicerange", "deviceresize", "resize"];
    evts.forEach((e) => window.addEventListener(e, measure));
    return () => {
      ro.disconnect();
      evts.forEach((e) => window.removeEventListener(e, measure));
    };
  }, []);
  return [areaRef, ratio] as const;
}
