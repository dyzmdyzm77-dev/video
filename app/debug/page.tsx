"use client";

// ============================================================================
// 상태바 진단 페이지 (/debug) — 임시
// ============================================================================
// 확대 → 축소 뒤 아이폰 상태바가 검정으로 남는 문제를 세 번 헛짚었다. 원인을
// 추측으로 좁히는 걸 그만두고, 실기기에서 어느 전제가 깨지는지 직접 보려고
// 만든 페이지다. 앱 화면과 무관하게 혼자 서고, 확인이 끝나면 지운다.
//
// 보는 법:
//   · 맨 위 초록 띠 = 확대 화면에 깔아 둔 흰 띠와 똑같은 방식으로 그린 것
//     (position:fixed, top:0, height:env(safe-area-inset-top)).
//     이게 상태바 자리에 안 보이면 그 방식 자체가 이 기기에서 안 먹는 것이다.
//   · '검정 덮기' = 확대 화면처럼 검은 판을 화면 전체에 깐다. 이때 상태바가
//     검게 변하는지, 초록 띠가 그걸 막아 주는지를 본다.
//   · '치우기' 뒤에도 상태바가 검정으로 남는지가 원래 증상이다.
// ============================================================================

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [strip, setStrip] = useState(true);
  const [cover, setCover] = useState(false);
  const [info, setInfo] = useState<string[]>([]);

  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);";
    document.body.appendChild(probe);
    const insetTop = probe.getBoundingClientRect().height;
    probe.remove();

    const mq = (q: string) =>
      typeof window.matchMedia === "function" ? window.matchMedia(q).matches : "?";
    const vp = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const themes = [
      ...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
    ].map((m) => m.content || "(빈값)");

    setInfo([
      `safe-area-inset-top = ${insetTop}px`,
      `innerW×H = ${window.innerWidth}×${window.innerHeight}`,
      `screen = ${window.screen.width}×${window.screen.height}`,
      `홈화면앱(standalone) = ${
        (navigator as Navigator & { standalone?: boolean }).standalone ?? "false"
      }`,
      `hover:hover & pointer:fine = ${mq("(hover: hover) and (pointer: fine)")}`,
      `다크모드 = ${mq("(prefers-color-scheme: dark)")}`,
      `html 배경 = ${getComputedStyle(document.documentElement).backgroundColor}`,
      `body 배경 = ${getComputedStyle(document.body).backgroundColor}`,
      `theme-color = ${themes.length ? themes.join(" / ") : "(없음)"}`,
      `viewport = ${vp?.content ?? "(없음)"}`,
    ]);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffffff",
        color: "#111",
        font: "13px/1.5 ui-monospace, Menlo, monospace",
        padding: "calc(env(safe-area-inset-top, 0px) + 12px) 14px 14px",
        overflow: "auto",
        zIndex: 10,
      }}
    >
      <h1 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
        상태바 진단
      </h1>

      <ol style={{ paddingLeft: 18, marginBottom: 14, lineHeight: 1.7 }}>
        <li>지금 이 화면 그대로 스크린샷 1장 (맨 위 초록 띠가 보이는지)</li>
        <li>‘검정 덮기’ 누르고 스크린샷 1장</li>
        <li>‘치우기’ 누르고 스크린샷 1장</li>
      </ol>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setCover(true)}
          style={{ flex: 1, padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}
        >
          검정 덮기
        </button>
        <button
          onClick={() => setCover(false)}
          style={{ flex: 1, padding: 12, background: "#eee", borderRadius: 8 }}
        >
          치우기
        </button>
        <button
          onClick={() => setStrip((v) => !v)}
          style={{ flex: 1, padding: 12, background: "#eee", borderRadius: 8 }}
        >
          띠 {strip ? "끄기" : "켜기"}
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, wordBreak: "break-all" }}>
        {info.map((line) => (
          <li key={line} style={{ padding: "3px 0", borderBottom: "1px solid #eee" }}>
            {line}
          </li>
        ))}
      </ul>

      {/* 확대 화면의 검은 판과 같은 조건 — 화면 전체를 덮는다. */}
      {cover ? (
        <div
          onClick={() => setCover(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 100,
            color: "#fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          아무 데나 눌러 치우기
        </div>
      ) : null}

      {/* globals.css 의 html[data-immersive="true"]::before 와 같은 방식.
          초록이라 상태바 자리에 실제로 그려지는지 눈으로 보인다. */}
      {strip ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "env(safe-area-inset-top, 0px)",
            background: "#00c853",
            zIndex: 2147483647,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}
