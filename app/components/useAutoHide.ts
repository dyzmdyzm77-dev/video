"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// 영상 컨트롤(딤) 자동 숨김 (단일 출처)
// ============================================================================
// 규칙: 마지막 사용자 인터랙션이 '끝난' 시점부터 5초간 노출한 뒤 숨긴다.
// 인터랙션이 진행 중인 동안(버튼을 누르고 있거나, 드래그·길게 누르기 중)에는
// 딤과 컨트롤을 유지하고, 손을 뗀 그 순간부터 5초를 다시 센다.
//
// 예전 구현은 '보이기 시작한 시점'부터 5초를 셌고, 타이머를 되살리는 건 스와이프
// 하나뿐이었다. 그래서 딤 안의 버튼(목록·화면 맞춤·회전·더보기)을 눌러도 시간이
// 안 밀려서, 조작하는 도중에 컨트롤이 사라지는 일이 있었다. 길게 누르는 동안에도
// 그냥 사라졌다.
//
// 쓰는 법:
//   const hide = useCallback(() => setShowControls(false), []);
//   const auto = useAutoHide(showControls, hide);
//   ...
//   <div {...auto.holdProps} onClick={auto.keepAlive}>  // 컨트롤 묶음
//
//   · keepAlive() — 한 번의 조작(탭·클릭·스와이프 종료). 5초를 처음부터 다시 센다.
//   · holdProps   — 누르고 있는 동안 붙잡아 두는 포인터 핸들러. pointerdown 에
//                   붙잡고 pointerup/cancel/leave 에 놓으면서 5초를 다시 시작한다.
//
// pointerdown/up 을 쓰는 이유: click 은 손을 뗀 뒤에야 오므로 '누르고 있는 동안'을
// 표현하지 못한다. 여러 손가락·중첩 요소를 감안해 붙잡은 횟수를 세고, 0 이 될 때만
// 타이머를 다시 건다.
// ============================================================================

/** 마지막 조작 종료 후 컨트롤을 유지하는 시간(ms). */
export const AUTO_HIDE_MS = 5000;

export function useAutoHide(
  visible: boolean,
  hide: () => void,
  delayMs: number = AUTO_HIDE_MS,
) {
  // 조작이 끝날 때마다 올려서 타이머를 처음부터 다시 걸게 하는 값.
  const [tick, setTick] = useState(0);
  // 누르고 있는 포인터 수. 0 보다 크면 타이머를 아예 걸지 않는다.
  const holdCount = useRef(0);
  const [holding, setHolding] = useState(false);
  // hide 는 호출부에서 매 렌더 새로 만들어질 수 있어 effect 의존성에 넣지 않는다.
  const hideRef = useRef(hide);
  hideRef.current = hide;

  useEffect(() => {
    if (!visible || holding) return;
    const t = setTimeout(() => hideRef.current(), delayMs);
    return () => clearTimeout(t);
  }, [visible, holding, tick, delayMs]);

  // 안 보이게 되면 붙잡고 있던 상태도 정리한다(딤이 꺼진 채 holding 이 남으면
  // 다음에 켰을 때 타이머가 안 걸린다).
  useEffect(() => {
    if (!visible) {
      holdCount.current = 0;
      setHolding(false);
    }
  }, [visible]);

  const keepAlive = useCallback(() => setTick((t) => t + 1), []);

  const hold = useCallback(() => {
    holdCount.current += 1;
    setHolding(true);
  }, []);

  const release = useCallback(() => {
    holdCount.current = Math.max(0, holdCount.current - 1);
    if (holdCount.current === 0) {
      setHolding(false);
      setTick((t) => t + 1); // 손을 뗀 시점부터 5초 다시 시작
    }
  }, []);

  const holdProps = {
    onPointerDown: hold,
    onPointerUp: release,
    onPointerCancel: release,
  };

  return { keepAlive, hold, release, holdProps };
}
