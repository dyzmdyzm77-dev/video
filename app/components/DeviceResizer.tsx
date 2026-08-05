"use client";

import { useEffect, useRef } from "react";

// 데스크톱 전용: 기기 화면(.app-safe-frame)의 오른쪽·아래·모서리에 드래그 영역을
// 얹어 마우스로 가로/세로를 '자유롭게' 조절한다. 위치는 실제 렌더된 프레임의
// getBoundingClientRect 로 매번 맞추므로 배율·패널 오프셋과 무관하게 정확히
// 가장자리에 붙는다.
//
// 기기는 왼쪽·위 모서리 고정이라 오른쪽/아래로만 늘어난다 → 마우스 이동량 d 에
// 대해 크기 변화 = d/scale. 드래그 중엔 배율을 고정한다.
//
// ※ 프리셋(좌측탭 해상도) 값으로 스냅하지 않는다. 드래그는 순수하게 가로·세로
//    길이만 바꾸고, 라운드/여백/펀치홀은 마지막에 고른 값 그대로 둔다. 특정
//    크기(ZFold/ZTrifold 등)는 좌측탭 버튼을 눌러 '딱' 적용한다.
// 드래그로 줄일 수 있는 최소 — 가로 300, 세로 240. 최대 2400.
const MIN_W = 300;
const MIN_H = 240;
const MAX = 2400;

// 목업 위 치수 눈금자를 프레임 상단에서 띄우는 간격.
const RULER_GAP = 20;

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// 관용 표기를 우선하는 가로:세로 비율. 예를 들어 405×648 은 약분하면 5:8 이지만
// 흔히 쓰는 표기(16:10 = 세로:가로)로 10:16 을 보여주고 싶다. 아래 목록에 있는
// 비율과 (오차 0.5% 이내로) 맞으면 그 표기를 그대로 쓴다(가로:세로 방향으로).
const PREFERRED_RATIOS: [number, number][] = [
  [4, 3],
  [3, 4],
  [16, 10],
  [10, 16],
  [16, 9],
  [9, 16],
  [3, 2],
  [2, 3],
  [5, 4],
  [4, 5],
  [2, 1],
  [1, 2],
];

// 가로:세로를 정수비로 표기한다. 관용 비율(PREFERRED)에 맞으면 그걸 쓰고,
// 아니면 약분(두 수 20 이하)하거나 근사비(≈)로 준다.
function simpleRatio(w: number, h: number): string {
  if (!w || !h) return "";
  const target = w / h;
  for (const [a, b] of PREFERRED_RATIOS) {
    if (Math.abs(a / b - target) < target * 0.005) return `${a} : ${b}`;
  }
  const g = gcd(w, h);
  const ew = w / g;
  const eh = h / g;
  if (ew <= 20 && eh <= 20) return `${ew} : ${eh}`;
  let best = { a: 1, b: 1, err: Infinity };
  for (let b = 1; b <= 20; b++) {
    for (let a = 1; a <= 20; a++) {
      if (gcd(a, b) !== 1) continue;
      const err = Math.abs(a / b - target);
      if (err < best.err - 1e-9) best = { a, b, err };
    }
  }
  return `≈ ${best.a} : ${best.b}`;
}

const clampW = (v: number) => Math.min(MAX, Math.max(MIN_W, Math.round(v)));
const clampH = (v: number) => Math.min(MAX, Math.max(MIN_H, Math.round(v)));

// 드래그로는 가로/세로 길이만 바꾼다(스냅·프리셋 없음).
function applyWidth(w: number) {
  document.documentElement.style.setProperty("--device-w", `${clampW(w)}px`);
}
function applyHeight(h: number) {
  document.documentElement.style.setProperty("--device-h", `${clampH(h)}px`);
}

export default function DeviceResizer() {
  const rightRef = useRef<HTMLSpanElement>(null);
  const bottomRef = useRef<HTMLSpanElement>(null);
  const cornerRef = useRef<HTMLSpanElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const drag = useRef<{
    axis: "x" | "y" | "xy";
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    scale: number;
  } | null>(null);

  // 드래그 영역(오른쪽·아래·모서리)과 상단 치수 눈금자를 현재 프레임 위치에 맞춘다.
  const position = () => {
    // 시안(메인) 프레임만 잡는다. 홈 화면(/home)에선 As Is 패널도 같은 홈 컴포넌트를
    // 재사용해 .app-safe-frame 이 하나 더 생기는데, 그건 .asis-frame 안에 있으므로
    // 건너뛴다(안 그러면 눈금자·핸들이 As Is 쪽으로 튄다).
    const frame = Array.from(
      document.querySelectorAll(".app-safe-frame"),
    ).find((el) => !el.closest(".asis-frame"));
    if (!frame) return;
    const box = frame.getBoundingClientRect();
    const right = rightRef.current;
    const bottom = bottomRef.current;
    const corner = cornerRef.current;
    if (right) {
      right.style.top = `${box.top}px`;
      right.style.height = `${box.height}px`;
      right.style.left = `${box.right}px`;
    }
    if (bottom) {
      bottom.style.left = `${box.left}px`;
      bottom.style.width = `${box.width}px`;
      bottom.style.top = `${box.bottom}px`;
    }
    if (corner) {
      corner.style.left = `${box.right}px`;
      corner.style.top = `${box.bottom}px`;
    }
    // 상단 치수 눈금자: 화면 폭만큼 span, 베젤 위쪽에 배치, 라벨은 현재 폭·비율.
    const ruler = rulerRef.current;
    const label = labelRef.current;
    if (ruler && label) {
      const cs = getComputedStyle(document.documentElement);
      const margin = parseFloat(cs.getPropertyValue("--device-margin")) || 10;
      const scale = parseFloat(cs.getPropertyValue("--device-scale")) || 1;
      const w = Math.round(parseFloat(cs.getPropertyValue("--device-w")) || 360);
      const h = Math.round(parseFloat(cs.getPropertyValue("--device-h")) || 0);
      const ratio = simpleRatio(w, h);
      const actual = document.documentElement.dataset.actualSize === "true";
      if (actual) {
        const mm = parseFloat(cs.getPropertyValue("--device-phys-mm")) || 0;
        ruler.style.left = `${box.left - margin * scale}px`;
        ruler.style.width = `${box.width + margin * scale * 2}px`;
        label.textContent = ratio
          ? `${mm.toFixed(1)}mm · ${ratio}`
          : `${mm.toFixed(1)}mm`;
      } else {
        ruler.style.left = `${box.left}px`;
        ruler.style.width = `${box.width}px`;
        label.textContent = ratio ? `${w}px · ${ratio}` : `${w}px`;
      }
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
    window.addEventListener("comparechange", onEvt);
    return () => {
      window.removeEventListener("resize", onEvt);
      window.removeEventListener("devicechange", onEvt);
      window.removeEventListener("devicecustom", onEvt);
      window.removeEventListener("comparechange", onEvt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readVar = (name: string, fallback: number) => {
    const v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name),
    );
    return Number.isFinite(v) ? v : fallback;
  };

  // 드래그 반영은 '프레임당 한 번'으로 묶는다. 포인터 이벤트는 주사율보다 자주
  // 오는데, 한 번 반영할 때마다 --device-w 쓰기 → 구독자(useDeviceWidth 등)가
  // getComputedStyle 로 되읽기 → 시안 트리 리렌더 → position() 이 다시 읽기가
  // 이어진다. 이벤트마다 그걸 하면 한 프레임 안에서 쓰기·읽기가 여러 번 교차해
  // 강제 리플로우가 쌓인다(저사양 PC 에서 드래그가 끊기던 원인).
  const pending = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef(0);

  // 드래그 중 페이지를 벗어나면 예약된 프레임이 남는다.
  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const flush = () => {
    raf.current = 0;
    const d = drag.current;
    const p = pending.current;
    if (!d || !p) return;
    pending.current = null;
    if (d.axis === "x" || d.axis === "xy") {
      applyWidth(d.startW + (p.x - d.startX) / d.scale);
    }
    if (d.axis === "y" || d.axis === "xy") {
      applyHeight(d.startH + (p.y - d.startY) / d.scale);
    }
    // 드래그 중 크기 변화를 구독자(안드로이드 네비 등)에 실시간 전달.
    window.dispatchEvent(new Event("deviceresize"));
    position();
  };

  const startDrag = (axis: "x" | "y" | "xy") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = {
      axis,
      startX: e.clientX,
      startY: e.clientY,
      startW: readVar("--device-w", 360),
      startH: readVar("--device-h", 780),
      scale: readVar("--device-scale", 1) || 1,
    };
    // 드래그 중엔 폭·세로가 마우스를 즉시 따라오도록 CSS 전환을 끈다(플래그).
    document.documentElement.dataset.resizing = "true";
    // 자유 크기라 프리셋 강조를 해제한다(-1 = 해당 없음).
    window.dispatchEvent(new CustomEvent("devicerange", { detail: -1 }));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    // 좌표만 적어두고 반영은 다음 프레임에 한 번. 같은 프레임에 이벤트가 더 와도
    // 마지막 좌표로 덮어써지므로 중간값을 그리느라 낭비하지 않는다.
    pending.current = { x: e.clientX, y: e.clientY };
    if (!raf.current) raf.current = requestAnimationFrame(flush);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    // 마지막 좌표가 프레임을 못 타고 남아 있을 수 있다 — 놓는 순간 값으로 확정.
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    flush();
    drag.current = null;
    // 드래그 종료 → 전환 다시 켬(버튼 클릭 등은 부드럽게).
    document.documentElement.dataset.resizing = "false";
    // 창에 맞춰 배율 재계산.
    window.dispatchEvent(new Event("devicechange"));
  };

  return (
    <div aria-hidden className="device-resizer">
      {/* 상단 치수 눈금자(양쪽 화살표 + px·비율). */}
      <div ref={rulerRef} className="device-ruler">
        <span ref={labelRef} className="device-ruler-label">
          360px
        </span>
        <div className="device-ruler-line">
          <span className="device-ruler-arrow dra-left" />
          <span className="device-ruler-arrow dra-right" />
        </div>
      </div>
      {/* 오른쪽(가로) · 아래(세로) · 모서리(둘 다) 드래그 영역. */}
      <span
        ref={rightRef}
        className="device-resize-edge dre-right"
        onPointerDown={startDrag("x")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <span
        ref={bottomRef}
        className="device-resize-edge dre-bottom"
        onPointerDown={startDrag("y")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <span
        ref={cornerRef}
        className="device-resize-edge dre-corner"
        onPointerDown={startDrag("xy")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
