"use client";

import { useEffect, useId, useRef } from "react";
import type { PlayMode } from "./screenState";

// ============================================================================
// 비교하기 — 나란히 선 기기끼리 '실시간/녹화'와 재생 시각 맞추기
// ============================================================================
// 다채널/단일은 예전부터 서로 따라갔는데(channel-sync) 녹화 진입은 안 따라가서
// 한쪽만 녹화 화면이 됐다(사용자 지적 2026-08-24). 같은 장면을 놓고 보자고
// 나란히 세운 것이라 화면 종류가 갈리면 비교가 안 된다.
//
// screenState.ts 로는 안 된다 — 그건 '안을 갈아끼울 때 물려주는 값'이라
// 마운트할 때 한 번만 읽는다. 이미 떠 있는 옆 기기는 값이 바뀌어도 모른다.
// 그래서 창 이벤트로 서로에게 알린다(channel-sync 와 같은 방식).
//
// 무엇을 보낼지 — '사용자가 화면을 옮긴 순간'만. 녹화 중에는 playbackMs 가
// 50~150ms 마다 저절로 흐르는데(자동 진행) 그걸 다 보내면 옆 기기가 매 틱
// 끌려다닌다. 그래서
//   · 실시간↔녹화가 바뀌었거나
//   · 재생 위치가 null↔값 으로 바뀌었거나(녹화 진입·해제)
//   · 한 번에 JUMP_MS 넘게 건너뛰었을 때(시트에서 시각 고르기, 이벤트 카드,
//     타임라인 스크럽)
// 만 보낸다. 자동 진행 한 틱은 최대 150ms × 16배속 = 2.4초라, 문턱을 30초로
// 두면 자동 진행과 사용자의 '건너뛰기'가 안 섞인다.
//
// 날짜·시간 시트는 고른 쪽에서만 뜬다. 시트가 열린 것 자체는 안 보내고 '적용'
// 해서 실제로 화면이 바뀐 결과만 전달한다 — 옆 기기까지 시트가 뜨면 어느 걸
// 조작하는 건지 알 수 없다.
//
// As Is 재현 패널은 이 대화에 안 낀다. 현행 앱 재현엔 녹화 화면 자체가 없다.
// ============================================================================

const EVENT = "playback-sync";
const JUMP_MS = 30_000;

type Detail = { id: string; mode: PlayMode; ms: number | null };

export function usePlaybackSync({
  mode,
  playbackMs,
  isScrubbing,
  apply,
}: {
  mode: PlayMode;
  playbackMs: number | null;
  /** 타임라인을 끌고 있는 중인가. 끄는 동안은 보내지 않고, 놓을 때 한 번 보낸다. */
  isScrubbing: boolean;
  /** 옆 기기가 옮긴 화면을 내 상태에 반영한다. */
  apply: (next: { mode: PlayMode; ms: number | null }) => void;
}) {
  // 한 화면에 같은 안이 둘 이상 뜰 수 있어서(3개 비교) 자기 것을 가려낼 표가
  // 필요하다. useId 는 인스턴스마다 다르다.
  const id = useId();
  // 콜백은 매 렌더 새로 만들어지므로 ref 로 최신 것만 들고 있는다 —
  // 구독을 매번 다시 걸면 이벤트를 놓칠 수 있다.
  const applyRef = useRef(apply);
  applyRef.current = apply;
  // 방금 '받아서 맞춘' 값. 되쏘지 않으려고 들고 있는다(둘이 서로 튕기지 않게).
  // 플래그가 아니라 값인 이유 — 받은 값이 이미 내 값과 같으면 상태가 안 바뀌어
  // 아래 effect 가 안 도는데, 플래그였다면 그게 남아 다음 내 조작을 삼킨다.
  const fromRemote = useRef<{ mode: PlayMode; ms: number | null } | null>(null);
  const last = useRef<{ mode: PlayMode; ms: number | null }>({
    mode,
    ms: playbackMs,
  });

  useEffect(() => {
    const onSync = (e: Event) => {
      const d = (e as CustomEvent<Detail>).detail;
      if (!d || d.id === id) return;
      fromRemote.current = { mode: d.mode, ms: d.ms };
      applyRef.current({ mode: d.mode, ms: d.ms });
    };
    window.addEventListener(EVENT, onSync);
    return () => window.removeEventListener(EVENT, onSync);
  }, [id]);

  useEffect(() => {
    // 끄는 중엔 기준값도 그대로 둔다 — 놓는 순간 '끌기 전 위치'와 비교해야
    // 한 번에 얼마나 건너뛰었는지 나온다.
    if (isScrubbing) return;
    const prev = last.current;
    const moved =
      prev.mode !== mode ||
      (prev.ms === null) !== (playbackMs === null) ||
      (prev.ms !== null &&
        playbackMs !== null &&
        Math.abs(playbackMs - prev.ms) > JUMP_MS);
    last.current = { mode, ms: playbackMs };
    const r = fromRemote.current;
    const echo = r !== null && r.mode === mode && r.ms === playbackMs;
    fromRemote.current = null;
    if (echo) return;
    if (!moved) return;
    window.dispatchEvent(
      new CustomEvent<Detail>(EVENT, {
        detail: { id, mode, ms: playbackMs },
      }),
    );
  }, [id, mode, playbackMs, isScrubbing]);
}
