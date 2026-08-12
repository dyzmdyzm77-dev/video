"use client";

// ============================================================================
// 안을 갈아끼워도 이어지는 '화면 종류'
// ============================================================================
// A-1안의 단일 화면 · 실시간을 보다가 A-2안으로 바꾸면, A-2안의 단일 화면 ·
// 실시간이 나와야 한다(사용자 요청 2026-08-12). 비교하려고 바꾸는 것이라 같은
// 자리에서 시작하지 않으면 매번 다시 찾아 들어가야 한다.
//
// 안들은 서로 다른 컴포넌트라 상태를 공유할 수 없고, 전환하면 통째로 다시
// 마운트된다. 그래서 문서 루트에 남겨 두고 새로 뜨는 안이 그대로 물려받는다 —
// eventThumbs · deviceRotate · variantRoute 와 같은 방식이다.
//
// 남기는 건 '어떤 화면을 보고 있었나'뿐이다. 안마다 다른 것(딤 상태·페이지·
// 재생 위치·화면 맞춤 등)은 넘기지 않는다 — 그건 그 안의 사양이다.
// ============================================================================

export type PlayMode = "live" | "recording";

export type ScreenState = {
  /** 단일 화면이면 그 카메라 인덱스, 다채널이면 null. */
  single: number | null;
  mode: PlayMode;
};

const DEFAULT: ScreenState = { single: null, mode: "live" };

export function readScreenState(): ScreenState {
  if (typeof document === "undefined") return DEFAULT;
  const d = document.documentElement.dataset;
  const raw = d.screenSingle;
  const n = raw === undefined || raw === "" ? NaN : Number(raw);
  return {
    single: Number.isInteger(n) && n >= 0 ? n : null,
    mode: d.screenMode === "recording" ? "recording" : "live",
  };
}

export function writeScreenState(next: Partial<ScreenState>) {
  if (typeof document === "undefined") return;
  const d = document.documentElement.dataset;
  if ("single" in next) {
    d.screenSingle = next.single === null ? "" : String(next.single);
  }
  if (next.mode) d.screenMode = next.mode;
}
