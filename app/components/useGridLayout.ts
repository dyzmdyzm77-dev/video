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
    // 잴 때마다 areaRef.current 를 다시 읽고, 대상이 바뀌었으면 관찰도 옮긴다.
    // 예전엔 마운트 시점의 요소 하나를 붙잡아 뒀는데, 그리드가 언마운트됐다가
    // 다시 마운트되면(가로 모드 왕복) 관찰 대상이 떨어져 나간 옛 요소로 남아
    // 비율이 그 시점 값에 굳었다. 그 굳은 비율로 화면 개수를 고르니 세로로
    // 돌아왔을 때 배치가 어긋났다.
    let observed: HTMLElement | null = null;
    const measure = () => {
      const el = areaRef.current;
      if (!el) return;
      if (el !== observed) {
        if (observed) ro.unobserve(observed);
        ro.observe(el);
        observed = el;
      }
      // transform 을 안 타는 '레이아웃 크기'로 잰다. getBoundingClientRect 는
      // 변환이 적용된 뒤의 축 정렬 박스라, 실기기 가로 모드에선 값이 뒤집힌다 —
      // 실기기는 돌릴 목업이 없어 프레임 자체를 CSS 로 90° 돌리는데(globals.css
      // 의 터치 전용 규칙), 90° 돌린 요소의 축 정렬 박스는 가로·세로가 맞바뀐
      // 세로 값이다. 그 값으로 배치를 고르니 같은 가로 화면인데 PC 목업(각도를
      // 0 으로 되돌리고 크기를 맞바꾼다)과 실기기가 서로 다른 그리드가 나왔다.
      // 회전 트랜지션 도중에 재면 중간 각도의 박스가 잡혀 개수가 들쭉날쭉하던
      // 것도 같이 사라진다 — offsetWidth/Height 는 각도와 무관하다.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setRatio(w / h);
    };
    const ro = new ResizeObserver(measure);
    measure();
    const evts = ["devicechange", "devicerange", "deviceresize", "resize"];
    evts.forEach((e) => window.addEventListener(e, measure));
    return () => {
      ro.disconnect();
      evts.forEach((e) => window.removeEventListener(e, measure));
    };
  }, []);
  return [areaRef, ratio] as const;
}
