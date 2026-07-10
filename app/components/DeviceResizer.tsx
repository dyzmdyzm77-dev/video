"use client";

import { useEffect, useRef } from "react";

// 데스크톱 전용: 기기 화면(.app-safe-frame)의 좌·우 가장자리에 드래그 영역을 얹어
// 마우스로 "폭"을 조절한다. 위치는 실제 렌더된 프레임의 getBoundingClientRect 로
// 매번 맞추므로 배율·패널 오프셋과 무관하게 정확히 가장자리에 붙는다.
//
// 프레임은 중앙(패널 제외) 기준 좌우 대칭 확대 → 마우스 이동량 dx 에 대해
// 폭 변화 = ±2·dx/scale(오른쪽 +, 왼쪽 −). 드래그 중엔 배율을 고정한다.
// 폭 360~1080. 폭이 구간(좌측탭 해상도)에 들어오면 세로값·라운드도 그 프리셋으로.
const MIN_W = 360;
const MAX_W = 1080;

// 폭 구간별 세로/라운드/여백(좌측탭 해상도와 동일). min 이상이면 그 프리셋 적용.
// m = 베젤과 화면 사이 사방 간격(px). 1080 만 30, 나머지는 10.
const BREAKS = [
  { min: 360, h: 780, r: 45, m: 10 },
  { min: 480, h: 780, r: 29, m: 10 },
  { min: 620, h: 780, r: 29, m: 10 },
  { min: 750, h: 832, r: 13, m: 10 },
  { min: 1080, h: 792, r: 13, m: 30 },
];

// 폭이 속한 해상도 범위(BREAKS/DEVICES) 인덱스.
function rangeIndex(w: number) {
  let idx = 0;
  for (let i = 0; i < BREAKS.length; i++) if (w >= BREAKS[i].min) idx = i;
  return idx;
}

function applyWidth(w: number) {
  const root = document.documentElement;
  const b = BREAKS[rangeIndex(w)];
  root.style.setProperty("--device-w", `${w}px`);
  root.style.setProperty("--device-h", `${b.h}px`);
  root.style.setProperty("--device-radius", `${b.r}px`);
  root.style.setProperty("--device-margin", `${b.m}px`);
  // 폰(360)에서만 SVG 목업, 그보다 크면 찌그러짐 방지로 CSS 베젤.
  root.dataset.deviceKind = w <= 360 ? "phone" : "wide";
}

// 목업 위 치수 눈금자를 프레임 상단에서 띄우는 간격.
const RULER_GAP = 20;

export default function DeviceResizer() {
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const drag = useRef<{
    side: "left" | "right";
    startX: number;
    startW: number;
    scale: number;
    lastIdx: number;
  } | null>(null);

  // 두 드래그 영역과 상단 치수 눈금자를 현재 기기 화면 위치에 맞춰 배치한다.
  const position = () => {
    const frame = document.querySelector(".app-safe-frame");
    const l = leftRef.current;
    const r = rightRef.current;
    if (!frame || !l || !r) return;
    const box = frame.getBoundingClientRect();
    for (const [el, x] of [
      [l, box.left],
      [r, box.right],
    ] as const) {
      el.style.top = `${box.top}px`;
      el.style.height = `${box.height}px`;
      el.style.left = `${x}px`;
    }
    // 상단 치수 눈금자: 화면 폭만큼 span, 베젤 위쪽에 배치, 라벨은 현재 폭(px).
    // 실제 사이즈 모드에선 기기 몸체(베젤 포함) 폭을 mm 로 표시한다.
    const ruler = rulerRef.current;
    const label = labelRef.current;
    if (ruler && label) {
      const cs = getComputedStyle(document.documentElement);
      const margin = parseFloat(cs.getPropertyValue("--device-margin")) || 10;
      const scale = parseFloat(cs.getPropertyValue("--device-scale")) || 1;
      const w = Math.round(parseFloat(cs.getPropertyValue("--device-w")) || 360);
      const actual = document.documentElement.dataset.actualSize === "true";
      if (actual) {
        // 몸체 물리 폭(mm)은 DeviceScaler 가 --device-phys-mm 로 노출한다.
        const mm = parseFloat(cs.getPropertyValue("--device-phys-mm")) || 0;
        ruler.style.left = `${box.left - margin * scale}px`;
        ruler.style.width = `${box.width + margin * scale * 2}px`;
        label.textContent = `${mm.toFixed(1)}mm`;
      } else {
        ruler.style.left = `${box.left}px`;
        ruler.style.width = `${box.width}px`;
        label.textContent = `${w}px`;
      }
      // 베젤 상단(화면 top 에서 margin·scale 위) 보다 RULER_GAP 만큼 더 위.
      ruler.style.top = `${box.top - margin * scale - RULER_GAP}px`;
    }
  };

  // 배율/패널 전환은 트랜지션(0.22s)으로 움직이므로 잠깐 프레임마다 재배치.
  const burst = () => {
    const end = performance.now() + 300;
    const step = () => {
      position();
      if (performance.now() < end) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    position();
    const onEvt = () => burst();
    window.addEventListener("resize", onEvt);
    window.addEventListener("devicechange", onEvt);
    window.addEventListener("devicecustom", onEvt);
    return () => {
      window.removeEventListener("resize", onEvt);
      window.removeEventListener("devicechange", onEvt);
      window.removeEventListener("devicecustom", onEvt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readVar = (name: string, fallback: number) => {
    const v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name),
    );
    return Number.isFinite(v) ? v : fallback;
  };

  const onPointerDown = (side: "left" | "right") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const startW = readVar("--device-w", 360);
    drag.current = {
      side,
      startX: e.clientX,
      startW,
      scale: readVar("--device-scale", 1) || 1,
      lastIdx: rangeIndex(startW),
    };
    // 드래그 중엔 폭이 마우스를 즉시 따라오도록 CSS 전환을 끈다(플래그).
    document.documentElement.dataset.resizing = "true";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const raw =
      d.side === "right"
        ? d.startW + (2 * dx) / d.scale
        : d.startW - (2 * dx) / d.scale;
    const w = Math.min(MAX_W, Math.max(MIN_W, Math.round(raw)));
    applyWidth(w);
    // 드래그 중 폭 변화를 구독자(안드로이드 네비 등)에 실시간 전달.
    window.dispatchEvent(new Event("deviceresize"));
    // 현재 폭이 속한 해상도 범위가 바뀌면 좌측 패널 강조를 갱신한다.
    const idx = rangeIndex(w);
    if (idx !== d.lastIdx) {
      d.lastIdx = idx;
      window.dispatchEvent(new CustomEvent("devicerange", { detail: idx }));
    }
    position();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    drag.current = null;
    // 드래그 종료 → 전환 다시 켬(버튼 클릭 등은 부드럽게).
    document.documentElement.dataset.resizing = "false";
    // 창에 맞춰 배율 재계산.
    window.dispatchEvent(new Event("devicechange"));
  };

  return (
    <div aria-hidden className="device-resizer">
      {/* 상단 폭 치수 눈금자(양쪽 화살표 + px). */}
      <div ref={rulerRef} className="device-ruler">
        <span ref={labelRef} className="device-ruler-label">
          360px
        </span>
        <div className="device-ruler-line">
          <span className="device-ruler-arrow dra-left" />
          <span className="device-ruler-arrow dra-right" />
        </div>
      </div>
      <span
        ref={leftRef}
        className="device-resize-edge dre-left"
        onPointerDown={onPointerDown("left")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <span
        ref={rightRef}
        className="device-resize-edge dre-right"
        onPointerDown={onPointerDown("right")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
