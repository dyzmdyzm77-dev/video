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

export default function DebugHud() {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    // useSearchParams 를 안 쓴다 — 그걸 쓰면 Suspense 경계가 필요해져서
    // 임시 진단용으로는 과하다. 주소는 클라이언트에서 직접 읽는다.
    if (!/[?&]debug=1/.test(window.location.search)) return;
    setOn(true);

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

      setLines([
        `imm=${root.dataset.immersive ?? "-"} land=${root.dataset.landscape ?? "-"} rot=${root.dataset.rotate ?? "-"}`,
        `inner=${window.innerWidth}×${window.innerHeight} scr=${window.screen.width}×${window.screen.height}`,
        `insetTop=${insetTop} fs=${!!document.fullscreenElement}`,
        `theme=${themes || "-"} htmlBg=${getComputedStyle(root).backgroundColor}`,
        `frame pad=${fcs?.padding ?? "-"} bg=${fcs?.backgroundColor ?? "-"}`,
        `frame pos=${fcs?.position ?? "-"} rotated=${fcs?.transform !== "none"}`,
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
