"use client";

// 실시간 ↔ 녹화 세그먼트 토글.
//
// A-1 안의 그리드 아래 줄에 있던 걸 꺼냈다 — 클라우드 이벤트 화면
// (CloudEventScreen)이 "상단 구조는 실시간과 동일하게"(사용자 결정 2026-08-21)
// 라서 같은 물건을 써야 한다. 사본을 하나 더 만들면 한쪽만 고쳐질 자리다.

export default function ModeChipToggle({
  mode,
  setMode,
}: {
  mode: "live" | "recording";
  setMode: (m: "live" | "recording") => void;
}) {
  // 예전 칩에 있던 앞의 점은 뺐다 — 세그먼트에선 채워진 쪽이 곧 현재 모드라
  // 점이 같은 말을 두 번 하는 셈이었다. 점 자리만큼 좌우 여백을 늘려 폭을 맞춘다.
  const seg = (active: boolean, activeBg: string) => ({
    height: "20px",
    paddingLeft: "10px",
    paddingRight: "10px",
    borderRadius: "9999px",
    backgroundColor: active ? activeBg : "transparent",
    color: active ? "#ffffff" : "#7F7F7F",
  });
  return (
    <div
      className="inline-flex items-center rounded-full"
      style={{ backgroundColor: "#F2F2F2", padding: "2px", gap: "2px" }}
    >
      <button
        type="button"
        onClick={() => setMode("live")}
        className="inline-flex items-center text-[10px] font-bold leading-none tracking-wide transition-colors"
        style={seg(mode === "live", "#ff3b4a")}
      >
        LIVE
      </button>
      <button
        type="button"
        onClick={() => setMode("recording")}
        className="inline-flex items-center text-[10px] font-bold leading-none tracking-wide transition-colors"
        style={seg(mode === "recording", "#757575")}
      >
        녹화
      </button>
    </div>
  );
}
