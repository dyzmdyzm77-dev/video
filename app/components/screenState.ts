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
// 남기는 건 '어떤 화면을 보고 있었나'다. 딤 상태·페이지·화면 맞춤처럼 안마다
// 다른 것은 안 넘긴다 — 그건 그 안의 사양이다.
//
// 재생 시각(ms)은 처음엔 안 넘겼는데, 그게 버그였다(사용자 지적 2026-08-25:
// "시안 바꾸는데 시간바가 안 뜨고 시간도 멈춰 있다"). 녹화 화면인 채로 안을
// 바꾸면 mode 만 물려받고 재생 시각은 null 로 시작한다 → 시간바가 기준 시각
// (anchor)을 못 잡아 눈금·라벨이 하나도 안 그려지고, 자동 진행 effect 도
// playbackMs === null 이면 그냥 빠져나가 시계가 00:00:00 에 멈춘다.
// '어느 화면'에 시각까지 포함되는 게 맞다 — 같은 시점을 놓고 안을 갈아 가며
// 비교하는 게 이 화면의 용도다.
// ============================================================================

export type PlayMode = "live" | "recording";

export type ScreenState = {
  /** 단일 화면이면 그 카메라 인덱스, 다채널이면 null. */
  single: number | null;
  mode: PlayMode;
  /** 녹화 재생 시각(epoch ms). 실시간이면 null. */
  ms: number | null;
};

const DEFAULT: ScreenState = { single: null, mode: "live", ms: null };

export function readScreenState(): ScreenState {
  if (typeof document === "undefined") return DEFAULT;
  const d = document.documentElement.dataset;
  const raw = d.screenSingle;
  const n = raw === undefined || raw === "" ? NaN : Number(raw);
  const rawMs = d.screenMs;
  const ms = rawMs === undefined || rawMs === "" ? NaN : Number(rawMs);
  return {
    single: Number.isInteger(n) && n >= 0 ? n : null,
    mode: d.screenMode === "recording" ? "recording" : "live",
    ms: Number.isFinite(ms) && ms > 0 ? ms : null,
  };
}

export function writeScreenState(next: Partial<ScreenState>) {
  if (typeof document === "undefined") return;
  const d = document.documentElement.dataset;
  if ("single" in next) {
    d.screenSingle = next.single === null ? "" : String(next.single);
  }
  if (next.mode) d.screenMode = next.mode;
  if ("ms" in next) d.screenMs = next.ms === null ? "" : String(next.ms);
}
