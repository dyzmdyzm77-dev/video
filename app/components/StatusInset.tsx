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

/** env() 가 0 을 주는 환경을 위한 대체 측정.
 *
 *  홈화면 앱은 상태바 스타일이 "default" 라 웹뷰가 상태바 아래에서 시작한다 —
 *  화면 높이와 뷰포트 높이의 차가 곧 상태바 높이다(아이폰 16 Pro 기준 874−812=62).
 *  이걸 쓰면 env() 가 뭘 주든 상관없이 값이 잡힌다.
 *
 *  사파리에서는 아래 주소창까지 빠져서 차가 훨씬 크다(874−714=160). STATUS_MAX
 *  로 걸러 낸다 — 사파리에서는 0 이 되어 지금 동작 그대로다.
 *  세로에서만 잰다. 가로는 상태바가 없어 차가 다른 뜻이 된다. */
const STATUS_MAX = 90;

function readStatusH(): number {
  const env = readInsetTop();
  if (env > 0) return env;
  if (window.innerWidth > window.innerHeight) return 0;
  const screenH = Math.max(window.screen.width, window.screen.height);
  const gap = screenH - window.innerHeight;
  return gap > 0 && gap <= STATUS_MAX ? gap : 0;
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
      // '눕힌 채 축소'로 콘텐츠를 세울 때(globals.css 의 data-force-portrait) 돌릴
      // 방향. 폰을 왼쪽으로 눕혔는지 오른쪽으로 눕혔는지에 따라 반대여야 하고,
      // 고정값으로 두면 절반의 경우에 화면이 거꾸로 선다. 기기 각도의 반대로 돌리면
      // 콘텐츠가 똑바로 선다.
      const angle =
        window.screen?.orientation?.angle ??
        ((window as unknown as { orientation?: number }).orientation || 0);
      root.style.setProperty("--force-rot", `${-((angle + 360) % 360)}deg`);

      const now = readStatusH();
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
