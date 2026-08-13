"use client";

// ============================================================================
// 상태바 진단 페이지 (/debug) — 임시
// ============================================================================
// 확대 → 축소 뒤 아이폰 상태바가 검정으로 남는 문제. 세 번 헛짚었다.
//
// 1차 진단으로 하나 확정됐다(사용자 확인): 화면 전체를 검은 판으로 덮어도
// 상단바는 흰색 그대로였다. 즉 이 기기에서 상태바 색은 페이지가 그린 내용과
// 무관하다 — "검은 영상이 상태바 자리에 비쳐서 검게 된다"는 전제가 틀렸다.
// 그래서 흰 띠를 깔아 막으려던 시도(globals.css 의 ::before)도 애초에 상관없는
// 자리를 막고 있었던 것이다.
//
// 그럼 확대에서 상태바를 검게 만드는 건 따로 있다. 후보를 하나씩 눌러 범인을
// 찍는다 — 버튼 하나 = 가설 하나. 상태바가 검게 변하는 버튼이 범인이다.
//   ① theme-color 를 검정으로   → 사파리가 이 값으로 상단바를 칠하는가
//   ② html 배경을 검정으로       → 루트 배경(캔버스)이 상단바로 번지는가
//   ③ 확대 흉내                  → 실제 확대와 같은 DOM 상태·CSS 를 그대로 재현
//                                  (data-immersive/landscape + 회전한 검은 프레임)
//
// 확인이 끝나면 이 페이지는 지운다.
// ============================================================================

import { useEffect, useState } from "react";

type Probe = { label: string; value: string };

export default function DebugPage() {
  const [cover, setCover] = useState(false);
  const [themeBlack, setThemeBlack] = useState(false);
  const [htmlBlack, setHtmlBlack] = useState(false);
  const [fakeImmersive, setFakeImmersive] = useState(false);
  const [info, setInfo] = useState<Probe[]>([]);

  // ① theme-color 를 검정으로.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const prev = meta.content;
    meta.content = themeBlack ? "#000000" : "#ffffff";
    return () => {
      meta.content = prev;
    };
  }, [themeBlack]);

  // ② html(루트) 배경을 검정으로.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.backgroundColor;
    root.style.backgroundColor = htmlBlack ? "#000000" : "";
    return () => {
      root.style.backgroundColor = prev;
    };
  }, [htmlBlack]);

  // ③ 확대 흉내 — 실제 확대와 같은 플래그를 세운다. globals.css 의 터치 전용
  //    규칙(padding:0 · 90° 회전 · 흰 띠)이 아래 .app-safe-frame 에 그대로 붙는다.
  useEffect(() => {
    const ds = document.documentElement.dataset;
    if (!fakeImmersive) return;
    ds.immersive = "true";
    ds.landscape = "true";
    return () => {
      ds.immersive = "false";
      ds.landscape = "false";
    };
  }, [fakeImmersive]);

  // ①②③④ 가 전부 상태바를 못 건드렸다(사용자 확인). 확대가 하는 일 중 진단
  // 페이지가 안 하던 게 둘 남는다 — 전체화면과 방향 잠금. 주석엔 "아이폰 사파리엔
  // 둘 다 없다"고 적혀 있지만 그건 예전 iOS 기준이라, 실제로 있는지부터 찍는다.
  useEffect(() => {
    const measure = () => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);";
      document.body.appendChild(probe);
      const insetTop = probe.getBoundingClientRect().height;
      probe.remove();

      const mq = (q: string) =>
        typeof window.matchMedia === "function" ? String(window.matchMedia(q).matches) : "?";
      const so = window.screen?.orientation as
        | (ScreenOrientation & { lock?: unknown })
        | undefined;

      setInfo([
        { label: "safe-area-inset-top", value: `${insetTop}px` },
        { label: "innerW×H", value: `${window.innerWidth}×${window.innerHeight}` },
        { label: "screen", value: `${window.screen.width}×${window.screen.height}` },
        {
          label: "★ 지금 전체화면인가",
          value: String(!!document.fullscreenElement),
        },
        {
          label: "★ requestFullscreen 있나",
          value: String(typeof document.documentElement.requestFullscreen === "function"),
        },
        { label: "★ fullscreenEnabled", value: String(document.fullscreenEnabled) },
        { label: "★ orientation.lock 있나", value: String(typeof so?.lock === "function") },
        {
          label: "홈화면앱(standalone)",
          value: String(
            (navigator as Navigator & { standalone?: boolean }).standalone ?? false,
          ),
        },
        { label: "다크모드", value: mq("(prefers-color-scheme: dark)") },
        { label: "hover & fine", value: mq("(hover: hover) and (pointer: fine)") },
      ]);
    };
    measure();
    const evts = ["fullscreenchange", "resize", "orientationchange"];
    evts.forEach((e) => window.addEventListener(e, measure));
    document.addEventListener("fullscreenchange", measure);
    return () => {
      evts.forEach((e) => window.removeEventListener(e, measure));
      document.removeEventListener("fullscreenchange", measure);
    };
  }, []);

  // ⑤ 전체화면 — 확대가 실제로 부르는 것과 같은 호출.
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()?.catch(() => {});
      return;
    }
    document.documentElement
      .requestFullscreen?.({ navigationUI: "hide" })
      ?.catch((e: unknown) => alert(`전체화면 거부: ${String(e)}`));
  };

  // ⑥ 방향 잠금 — 확대가 전체화면 뒤에 거는 것과 같은 호출.
  const lockPortrait = () => {
    const so = window.screen?.orientation as
      | (ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void })
      | undefined;
    if (!so?.lock) {
      alert("orientation.lock 없음");
      return;
    }
    so.lock("portrait")?.catch((e: unknown) => alert(`잠금 거부: ${String(e)}`));
  };

  const btn = (on: boolean): React.CSSProperties => ({
    padding: "14px 10px",
    borderRadius: 10,
    border: on ? "2px solid #1D6CEB" : "1px solid #ddd",
    background: on ? "#1D6CEB" : "#f2f2f2",
    color: on ? "#fff" : "#111",
    fontSize: 14,
    fontWeight: 600,
  });

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
      <h1 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>상태바 진단 2차</h1>
      <p style={{ marginBottom: 12, color: "#555" }}>
        버튼을 <b>하나씩</b> 켜고 맨 위 상태바(시간·배터리)가 <b>검게 변하는지</b>만
        봐줘. 검게 변하는 버튼이 범인이야. 확인했으면 다시 눌러서 끄고 다음 버튼.
      </p>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <button style={btn(themeBlack)} onClick={() => setThemeBlack((v) => !v)}>
          ① theme-color 검정 {themeBlack ? "(켜짐)" : ""}
        </button>
        <button style={btn(htmlBlack)} onClick={() => setHtmlBlack((v) => !v)}>
          ② html 배경 검정 {htmlBlack ? "(켜짐)" : ""}
        </button>
        <button style={btn(fakeImmersive)} onClick={() => setFakeImmersive((v) => !v)}>
          ③ 확대 흉내 {fakeImmersive ? "(켜짐)" : ""}
        </button>
        <button style={btn(cover)} onClick={() => setCover((v) => !v)}>
          ④ 검정 덮기(1차에서 흰색이었던 것) {cover ? "(켜짐)" : ""}
        </button>
        <button style={btn(false)} onClick={toggleFullscreen}>
          ⑤ 전체화면 켜기 / 끄기 ← 유력
        </button>
        <button style={btn(false)} onClick={lockPortrait}>
          ⑥ 방향 잠금(세로)
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, wordBreak: "break-all" }}>
        {info.map((p) => (
          <li key={p.label} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>
            {p.label} = <b>{p.value}</b>
          </li>
        ))}
      </ul>

      {/* ③ 확대 흉내 — 실제 앱의 확대 화면과 같은 요소·클래스. */}
      {fakeImmersive ? (
        <div
          className="app-safe-frame"
          onClick={() => setFakeImmersive(false)}
          style={{
            background: "#000",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
        >
          확대 흉내 — 눌러서 끄기
        </div>
      ) : null}

      {/* ④ 그냥 검은 판. */}
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
          눌러서 치우기
        </div>
      ) : null}
    </div>
  );
}
