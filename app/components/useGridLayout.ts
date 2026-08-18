"use client";

import { useEffect, useRef, useState } from "react";
import { GRID_TILE_RATIO } from "./layoutRules";
import { LANDSCAPE_EVENT } from "./deviceRotate";
import { IMMERSIVE_EVENT } from "./immersive";

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
    // 방향·확대가 바뀌는 순간에는 재 봐야 소용이 없다 — 그때 이 영역은 아직
    // 안 붙었거나(확대 화면으로 넘어가는 중) 옛 크기 그대로다. 두 프레임 뒤,
    // React 가 새 화면을 붙이고 레이아웃이 끝난 다음에 잰다.
    //
    // 이걸 안 하면 실기기에서 세로 → 가로 → 세로 왕복 시 배치가 어긋났다:
    // 물리 회전은 resize 만 쏘는데 그 시점엔 아직 세로 그리드가 붙어 있어
    // '가로로 넓어진 세로 그리드'를 재 버리고, 그 비율이 그대로 굳어 세로로
    // 돌아왔을 때 8채널이 2×4 가 아니라 4×2 로 잡혔다(사용자 지적).
    // 한 번만 재면 놓친다. 방향 전환은 '이벤트 → React 리렌더 → 회전 연출(350ms)'
    // 순서로 이어지는데, 그 사이 어느 시점에 재느냐에 따라 옛 그리드가 잡힌다.
    // 게다가 세로↔가로는 그리드 DOM 자체가 갈아끼워지는 전환이라, ResizeObserver 는
    // 떨어져 나간 옛 노드를 보고 있어 새 노드의 첫 레이아웃을 못 잡는다(measure 가
    // 다시 불려야 관찰 대상을 옮긴다). 그래서 두 프레임 뒤 + 연출 전후로 몇 번 더
    // 잰다 — 실기기에서 가로 → 세로로 돌아왔을 때 8채널이 2×4 가 아니라 4×2 로
    // 굳던 그 문제다(사용자 지적 2026-08-18: "평소엔 2x4인데, 가로에서 세로로
    // 바꾸면 4x2로 바뀌는 경우가 있다고").
    // 값이 같으면 setRatio 가 리렌더를 안 내므로 여러 번 재도 공짜다.
    const timers: ReturnType<typeof setTimeout>[] = [];
    const measureSoon = () => {
      requestAnimationFrame(() => requestAnimationFrame(measure));
      timers.forEach(clearTimeout);
      timers.length = 0;
      // 350ms 는 회전 연출 길이(deviceRotate). 그 전·직후·여유 뒤로 한 번씩.
      [120, 400, 800].forEach((ms) => timers.push(setTimeout(measure, ms)));
    };
    const ro = new ResizeObserver(measure);
    measure();
    // 마지막 안전망 — 0.5초마다 한 번씩 그냥 다시 잰다.
    //
    // 이벤트로 잡으려던 시도가 두 번 다 샜다(사용자 지적 2026-08-18: "가로에서
    // 세로로 넘어갈때 또 화면 구성이 이상하네?"). 방향 전환은 기기·브라우저마다
    // 신호 순서가 다르고(resize 만 오거나, orientationchange 가 늦거나), 전환 중에
    // 그리드 DOM 이 갈아끼워져 ResizeObserver 도 옛 노드를 붙들고 있다. 어느 한
    // 경로가 어긋나면 옛 비율이 그대로 굳어 세로인데 4×2 가 나온다.
    //
    // 폴링이면 어떤 경로로 들어와도 0.5초 안에 제자리를 찾는다. 비용은 요소 하나의
    // offsetWidth/Height 읽기뿐이고, 값이 같으면 setRatio 가 리렌더를 안 낸다.
    const poll = setInterval(measure, 500);
    // 크기 이벤트도 '지금' 한 번 + '조금 뒤' 한 번이다. 물리 회전이 resize 만 쏘는
    // 기기에서는 그 시점에 아직 옛 그리드가 붙어 있어, 지금 값만 믿으면 어긋난다.
    const measureNowAndSoon = () => {
      measure();
      measureSoon();
    };
    const evts = ["devicechange", "devicerange", "deviceresize", "resize"];
    evts.forEach((e) => window.addEventListener(e, measureNowAndSoon));
    const lateEvts = [LANDSCAPE_EVENT, IMMERSIVE_EVENT, "orientationchange"];
    lateEvts.forEach((e) => window.addEventListener(e, measureSoon));
    return () => {
      ro.disconnect();
      clearInterval(poll);
      timers.forEach(clearTimeout);
      evts.forEach((e) => window.removeEventListener(e, measureNowAndSoon));
      lateEvts.forEach((e) => window.removeEventListener(e, measureSoon));
    };
  }, []);
  return [areaRef, ratio] as const;
}
