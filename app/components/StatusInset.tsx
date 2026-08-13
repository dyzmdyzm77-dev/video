"use client";

// ============================================================================
// 상태바 높이를 재서 --status-h 로 내보낸다
// ============================================================================
// 왜 필요한가. 확대와 가로가 채우는 크기가 달랐다(사용자 지적: "가로로 돌렸을
// 때는 상태바까지 다 채우고, 확대모드는 상태바 제외한 사이즈로 채우고").
//
// 이유는 앱이 아니라 iOS 다. 홈화면 앱은 apple-mobile-web-app-status-bar-style
// 이 "default" 라 iOS 가 상태바 자리를 떼어 놓고 웹뷰를 그 아래부터 시작한다 —
// 확대가 아무리 꽉 채워도 거기까지다. 반면 가로에서는 아이폰이 상태바를 아예
// 안 그리므로 웹뷰가 화면 전체를 받아 가득 찬다.
//
// 둘을 같게 맞추려면(사용자 지정: "동일하게 상태바 제외하고 뜨게 해") 가로에서도
// 그만큼을 비워야 하는데, 가로일 때 env(safe-area-inset-top) 은 0 이다(노치가
// 옆으로 가면서 인셋도 좌우로 간다). 그래서 세로에서 잰 값을 들고 있다가 가로에
// 쓴다.
//
// 본 적 있는 값 중 가장 큰 값을 기억한다 — 한 번이라도 세로로 잰 적이 있으면
// 그 뒤로는 방향과 무관하게 쓸 수 있다. 사파리처럼 인셋을 안 주는 환경에서는
// 0 이라 아무 일도 안 일어난다(가로가 지금처럼 가득 찬다).
// ============================================================================

import { useEffect } from "react";

function readInsetTop(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);pointer-events:none;";
  document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  return h;
}

export default function StatusInset() {
  useEffect(() => {
    const desktop =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // 데스크톱 미리보기는 목업 프레임이라 상태바가 없다.
    if (desktop) return;

    const root = document.documentElement;
    let best = 0;
    const sync = () => {
      const now = readInsetTop();
      if (now <= best) return;
      best = now;
      root.style.setProperty("--status-h", `${Math.round(best)}px`);
    };
    sync();

    const evts = ["resize", "orientationchange"];
    evts.forEach((e) => window.addEventListener(e, sync, { passive: true }));
    return () => {
      evts.forEach((e) => window.removeEventListener(e, sync));
    };
  }, []);

  return null;
}
