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

/** 하단 홈 인디케이터 인셋. 세로에서만 잰다(가로는 값의 의미가 다르다).
 *  강제 세로 화면이 진짜 세로 화면과 같은 하단 여백을 갖게 하는 데 쓴다. */
function readHomeH(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;";
  document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  return window.innerWidth > window.innerHeight ? 0 : h;
}

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
    let bestBottom = 0;
    const sync = () => {
      // '눕힌 채 축소'로 콘텐츠를 세울 때 돌릴 방향(globals.css 의
      // data-force-portrait). 기기 각도의 반대로 돌려야 똑바로 선다.
      //
      // 각도를 못 읽는 기기가 있다(screen.orientation 자체가 없다 — 이 앱의
      // 대상 아이폰이 그렇다). 그때 0 으로 두면 회전이 아예 안 걸려서, 세로
      // 폭짜리 화면이 가로 화면 가운데 놓이고 좌우에 흰 띠가 남는다(실제로 그랬다).
      // 그래서 각도가 없으면 뷰포트로 유추한다 — 가로면 90 으로 본다.
      const raw =
        window.screen?.orientation?.angle ??
        (window as unknown as { orientation?: number }).orientation;
      const angle =
        typeof raw === "number" && raw !== 0
          ? raw
          : window.innerWidth > window.innerHeight
            ? 90
            : 0;
      root.style.setProperty("--force-rot", `${-((angle + 360) % 360)}deg`);

      const now = readStatusH();
      if (now > best) {
        best = now;
        root.style.setProperty("--status-h", `${Math.round(best)}px`);
      }
      const hb = readHomeH();
      if (hb > bestBottom) {
        bestBottom = hb;
        root.style.setProperty("--home-h", `${Math.round(bestBottom)}px`);
      }

      // 눕힌 가로에서 비울 변은 '노치 쪽 한 변'이다 — 확대가 물리 상단 한 변만
      // 비우는 것과 같은 그림(사용자 지적: "가로로 전환이랑 확대모드 왜 달라?").
      // env() 는 가로에서 좌우를 대칭으로 줘서 노치 쪽을 못 가른다. 회전 각도로
      // 가른다: 90(반시계, 노치 왼쪽) → 왼쪽만, 270/-90(시계, 노치 오른쪽) →
      // 오른쪽만. 각도 API 가 없으면 왼쪽으로 본다(반시계가 일반적인 파지).
      const land = window.innerWidth > window.innerHeight;
      let l = "0px";
      let r = "0px";
      if (land && best > 0) {
        const raw =
          window.screen?.orientation?.angle ??
          (window as unknown as { orientation?: number }).orientation;
        const a = typeof raw === "number" ? (raw + 360) % 360 : 90;
        if (a === 270) r = `${Math.round(best)}px`;
        else l = `${Math.round(best)}px`;
      }
      root.style.setProperty("--notch-l", l);
      root.style.setProperty("--notch-r", r);
    };
    sync();

    // ── 확대 중 회전 모션 가리개(페이드판) ──────────────────────────────
    // 확대는 이미 가로 뷰라 눕혀도 결과 화면이 같은데, iOS 가 회전 애니메이션을
    // 틀어 '또 도는' 것으로 보인다. 회전 잠금은 이 기기에서 전부 막혀 있다 —
    // API 없음(진단 3차), manifest orientation 무시(재추가 후 실측). 그래서
    // 모션을 빠른 페이드로 가린다. 즉시 검정(1차판)은 "무슨 검정 화면이 떠"
    // 지적을 받아 짧은 페이드 인/아웃으로 순화했다(사용자 선택: 3번).
    const mask = document.createElement("div");
    mask.style.cssText =
      "position:fixed;inset:-50vmax;background:#000;z-index:2147483647;" +
      "pointer-events:none;opacity:0;transition:opacity 0.12s ease;";
    document.body.appendChild(mask);
    let maskTimer: ReturnType<typeof setTimeout> | null = null;
    const onRotateStart = () => {
      // 모든 화면에서 가린다(사용자 확정: "눕히는 걸 아예 막아") — 눕혀도 화면이
      // 미동도 안 하는 것처럼 보여야 한다. 확대(검은 화면)는 검정으로, 보통
      // 화면(흰 배경)은 흰색으로 덮어 어느 쪽이든 색이 튀지 않게 한다.
      mask.style.background =
        root.dataset.immersive === "true" || root.dataset.landscape === "true"
          ? "#000"
          : "#fff";
      mask.style.opacity = "1";
      if (maskTimer !== null) clearTimeout(maskTimer);
      // iOS 회전 애니메이션(~0.4s)이 끝난 뒤 걷는다.
      maskTimer = setTimeout(() => {
        maskTimer = null;
        mask.style.opacity = "0";
      }, 500);
    };

    const evts = ["resize", "orientationchange"];
    evts.forEach((e) => window.addEventListener(e, sync, { passive: true }));
    window.addEventListener("orientationchange", onRotateStart, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", onRotateStart);
    return () => {
      evts.forEach((e) => window.removeEventListener(e, sync));
      window.removeEventListener("orientationchange", onRotateStart);
      window.visualViewport?.removeEventListener("resize", onRotateStart);
      if (maskTimer !== null) clearTimeout(maskTimer);
      mask.remove();
    };
  }, []);

  return null;
}
