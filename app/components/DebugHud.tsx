"use client";

// ============================================================================
// 실기기 계기판 (임시) — 주소에 ?debug=1 을 붙였을 때만 뜬다
// ============================================================================
// 확대 → 축소 뒤 아이폰 상태바가 검게 남는 문제. /debug 의 시뮬레이션으로는
// 재현이 안 됐다 — 확대와 같은 CSS·플래그를 그대로 재현해도(③) 상단바는
// 흰색이었고, 전체화면·방향 잠금 API 는 이 기기에 아예 없다.
//
// 그래서 흉내 말고 '진짜로 검게 된 그 순간'의 값을 봐야 한다. 실제 앱 화면 위에
// 얇게 얹어 두고, 확대 → 축소를 태운 뒤 상태바가 검은 채로 스크린샷을 찍으면
// 그 한 장에 원인 후보가 다 들어온다.
//
// 확인이 끝나면 이 파일과 layout.tsx 의 사용처를 지운다.
// ============================================================================

import { useEffect, useState } from "react";
import { readEdgeGaps } from "./useDeviceWidth";

export default function DebugHud() {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    // useSearchParams 를 안 쓴다 — 그걸 쓰면 Suspense 경계가 필요해져서
    // 임시 진단용으로는 과하다. 주소는 클라이언트에서 직접 읽는다.
    //
    // 홈화면 앱(standalone)은 저장된 주소로만 열려서 ?debug=1 을 못 붙인다.
    // 그런데 정작 봐야 할 환경이 거기다 — 사파리와 상태바 동작이 다르다.
    // 그래서 화면 왼쪽 위 모서리를 3초 안에 5번 두드리면 켜지게 한다.
    let taps = 0;
    let tapTimer: number | undefined;
    const onTap = (e: PointerEvent) => {
      if (e.clientX > 80 || e.clientY > 80) return;
      taps += 1;
      window.clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => {
        taps = 0;
      }, 3000);
      if (taps >= 5) {
        taps = 0;
        setOn((v) => !v);
      }
    };
    window.addEventListener("pointerdown", onTap, true);
    const cleanupTap = () => {
      window.removeEventListener("pointerdown", onTap, true);
      window.clearTimeout(tapTimer);
    };

    // 주소에 ?debug=1 이 있으면 바로 켠다. 없어도 모서리 탭으로 켤 수 있으므로
    // 읽기(read)는 어느 쪽이든 돌려 둔다 — 예전엔 주소로 켠 경우에만 값을 읽어서,
    // 정작 이 계기판이 필요한 홈화면 앱(주소를 못 붙인다)에서는 탭으로 켜도 빈
    // 상자만 떴다.
    if (/[?&]debug=1/.test(window.location.search)) setOn(true);

    const read = () => {
      const root = document.documentElement;
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);";
      document.body.appendChild(probe);
      const insetTop = probe.getBoundingClientRect().height;
      probe.remove();

      const themes = [
        ...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
      ]
        .map((m) => m.content)
        .join(",");
      const frame = document.querySelector<HTMLElement>(".app-safe-frame");
      const fcs = frame ? getComputedStyle(frame) : null;

      // 가로 딤 마진이 '기기 기준인지 영상 기준인지' 보려고 붙인 줄들
      // (사용자 지적 2026-08-18: 안드로이드만 영상 뷰 기준으로 보인다).
      // 프레임이 화면보다 작으면 그 안의 딤·영상이 통째로 안쪽으로 들어온다 —
      // frame 과 scr 을 나란히 찍어 두면 한눈에 갈린다.
      const r = (el: Element | null) => {
        if (!el) return "-";
        const b = el.getBoundingClientRect();
        return `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}×${Math.round(b.height)}`;
      };
      const area = document.querySelector(".landscape-video-area");
      // 딤 위쪽 줄(장소명 · 좌우 여백이 걸린 층)
      const dimRow = document.querySelector(
        ".landscape-video-area ~ div, .app-safe-frame [class*='inset-x-0']",
      );
      setLines([
        `imm=${root.dataset.immersive ?? "-"} land=${root.dataset.landscape ?? "-"} bleed=${root.dataset.videoBleed ?? "-"}`,
        `inner=${window.innerWidth}×${window.innerHeight} scr=${window.screen.width}×${window.screen.height}`,
        `dpr=${window.devicePixelRatio} insetTop=${insetTop} fs=${!!document.fullscreenElement}`,
        `frame=${r(frame)} pad=${fcs?.padding ?? "-"}`,
        `videoArea=${r(area)}`,
        `dimRow=${r(dimRow)}`,
        `statusH=${getComputedStyle(root).getPropertyValue("--status-h") || "-"}`,
        // 딤 여백 보정이 쓰는 값 — 창이 화면에서 얼마나 밀렸나(useEdgeGaps).
        `win=${window.screenX},${window.screenY} gaps=${JSON.stringify(readEdgeGaps())}`,
        `theme=${themes || "-"} rotated=${fcs?.transform !== "none"}`,
      ]);
    };

    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, []);

  if (!on) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 4,
        bottom: 4,
        zIndex: 2147483647,
        pointerEvents: "none",
        background: "rgba(255,255,255,0.92)",
        color: "#000",
        font: "9px/1.35 ui-monospace, Menlo, monospace",
        padding: "4px 6px",
        borderRadius: 4,
        maxWidth: "96vw",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      {lines.join("\n")}
    </div>
  );
}
