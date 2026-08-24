"use client";

import { useEffect, useId, useRef } from "react";

// ============================================================================
// 비교하기 — 나란히 선 기기끼리 딤(영상 위 컨트롤) 같이 켜고 끄기
// ============================================================================
// 다채널/단일(channel-sync)·실시간/녹화(playbackSync)에 이어, 딤도 한쪽에서
// 뜨면 옆에서도 같이 떠야 한다(사용자 요청 2026-08-24). 딤이 안 겹치면 한쪽만
// 컨트롤이 얹힌 화면이라 같은 상태를 나란히 놓고 못 본다.
//
// 딤 상태는 안마다, 또 화면마다(다채널·단일·가로) 따로 들고 있다. 그래서 값을
// 한군데 모으는 대신 '켜졌다/꺼졌다'만 창 이벤트로 흘려보내고, 각 화면이 자기
// 상태에 반영한다 — 지금 떠 있는 화면 것만 눈에 보이므로 그걸로 충분하다.
//
// 자동 숨김(useAutoHide)은 기기마다 따로 돈다. 5초가 지나 한쪽이 꺼지면 그것도
// '바뀐 것'이라 같이 꺼진다 — 어차피 둘 다 비슷한 때 꺼질 참이었고, 먼저 꺼진
// 쪽에 맞추는 편이 어긋난 채 남는 것보다 낫다.
//
// 받아서 맞춘 변화는 되쏘지 않는다(applying) — 둘이 서로 튕기면 영영 안 멎는다.
// ============================================================================

const EVENT = "dim-sync";

type Detail = { id: string; on: boolean };


export function useDimSync(visible: boolean, setVisible: (v: boolean) => void) {
  // 한 화면에 같은 안이 둘 이상 뜰 수 있어(3개 비교) 자기 것을 가려낼 표.
  const id = useId();
  const setRef = useRef(setVisible);
  setRef.current = setVisible;
  // 방금 '받아서 맞춘' 값. 플래그(true/false)가 아니라 값으로 들고 있는다 —
  // 받은 값이 이미 내 값과 같으면 상태가 안 바뀌어 아래 effect 가 아예 안 도는데,
  // 플래그였다면 그게 남아 다음번 내 조작을 삼킨다.
  const fromRemote = useRef<boolean | null>(null);
  // 뜰 때의 값은 그대로 기준으로 삼는다(마운트 자체는 안 알린다).
  //
  // 켠 채로 뜨는 화면(A-1 은 화면이 바뀔 때마다, 가로는 들어올 때마다 딤을
  // 띄운다)까지 알리게 해 봤는데 더 나빴다. 기기들이 같은 순간에 화면을 바꾸지
  // 않기 때문이다 — 옆 기기는 As Is 패널의 로딩(800ms)을 지나 뒤늦게 들어온다.
  // 그래서 먼저 들어간 쪽의 '딤 켜짐'이 아직 이전 화면에 머무는 기기의 딤을
  // 켜 놓고, 정작 새 화면은 딤 없이 뜬다. 화면 전환 직후의 딤은 각자 자기
  // 규칙대로 두고, 그다음 조작부터 같이 움직이는 편이 예측 가능하다.
  const last = useRef(visible);

  useEffect(() => {
    const onSync = (e: Event) => {
      const d = (e as CustomEvent<Detail>).detail;
      if (!d || d.id === id) return;
      fromRemote.current = d.on;
      setRef.current(d.on);
    };
    window.addEventListener(EVENT, onSync);
    return () => window.removeEventListener(EVENT, onSync);
  }, [id]);

  useEffect(() => {
    if (last.current === visible) return;
    last.current = visible;
    const echo = fromRemote.current === visible;
    fromRemote.current = null;
    if (echo) return;
    window.dispatchEvent(
      new CustomEvent<Detail>(EVENT, { detail: { id, on: visible } }),
    );
  }, [id, visible]);
}
