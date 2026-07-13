// 접속한 디스플레이의 물리 밀도(1mm 당 CSS px)를 자동 추정한다.
//
// 브라우저에는 모니터 물리 크기 API 가 없지만, Apple 노트북 패널은 화면 비율이
// 모델마다 고유해서(아래 표) "비율 + 픽셀 배율(dpr≥2) + Mac 플랫폼"만으로
// 어떤 기기인지 식별할 수 있다. macOS 의 '공간 확대/축소' 설정을 바꿔도 비율은
// 유지되므로 식별이 깨지지 않고, 논리 해상도(screen.width)를 알려진 물리 폭으로
// 나누면 그 설정에 맞는 정확한 밀도가 나온다.
//
// 식별에 실패하면(일반 외장 모니터 등) CSS 표준 96dpi 로 근사한다 — 보통의
// 100% 배율 데스크톱 모니터는 실제 밀도가 96dpi 근처라 오차가 작다.

// 패널 비율 → 화면 물리 가로폭(mm). 비율은 네이티브 해상도 기준.
const APPLE_PANELS = [
  { ratio: 2560 / 1664, widthMm: 289.6, label: "MacBook Air 13.6\"" },
  { ratio: 3024 / 1964, widthMm: 302.5, label: "MacBook Pro 14\"" },
  { ratio: 2880 / 1864, widthMm: 326.2, label: "MacBook Air 15\"" },
  { ratio: 3456 / 2234, widthMm: 345.6, label: "MacBook Pro 16\"" },
  { ratio: 2560 / 1600, widthMm: 286.5, label: "MacBook 13\" (16:10)" },
];

export function detectPxPerMm(): { pxPerMm: number; source: string } {
  if (typeof window !== "undefined") {
    const isMac =
      /Mac/.test(navigator.platform || "") ||
      /Macintosh/.test(navigator.userAgent);
    const dpr = window.devicePixelRatio || 1;
    const ratio = window.screen.width / window.screen.height;
    if (isMac && dpr >= 2 && ratio > 1) {
      // 가장 가까운 패널 비율 매칭(허용 오차 0.8% — 모델 간 비율 차이보다 좁게).
      let best = APPLE_PANELS[0];
      let bestDiff = Infinity;
      for (const p of APPLE_PANELS) {
        const d = Math.abs(ratio - p.ratio) / p.ratio;
        if (d < bestDiff) {
          bestDiff = d;
          best = p;
        }
      }
      if (bestDiff < 0.008) {
        return {
          pxPerMm: window.screen.width / best.widthMm,
          source: best.label,
        };
      }
    }
  }
  return { pxPerMm: 96 / 25.4, source: "표준 96dpi" };
}
