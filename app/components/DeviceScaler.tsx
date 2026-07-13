"use client";

import { useEffect } from "react";
import { detectPxPerMm } from "./displayDensity";

// 데스크톱 폰 목업/프레임을 창 크기에 맞춰 축소하기 위한 배율(--device-scale)을
// 계산해 문서 루트에 설정한다. 기준 크기는 선택된 디바이스(--device-w/--device-h)
// + 사방 여백 10px(목업이 앱보다 사방 10px 큼). 창·디바이스가 바뀌면 재계산한다.
// (transform: scale 은 데스크톱 미디어쿼리에서만 적용되므로 모바일엔 영향 없음)
// 큰 창에서의 최대 배율. 1 이면 원본 크기, 낮출수록 작게.
const MAX_SCALE = 0.8;

// "실제 사이즈" 환산용 상수.
// 기기 쪽: 폭 구간별 기준 실기기의 목업 윤곽(dp + 2·margin) ↔ 몸체 물리 폭(mm).
//   360~ = Galaxy S25(70.5mm), 750~ = Z Fold 7 펼침(143.2mm),
//   1080 = Z TriFold 펼침(214.1mm).
// 구간 안에서는 기준 기기의 밀도를 그대로 쓴다(= 기기를 옆으로만 늘린 것으로
// 취급). 그래서 드래그로 폭을 바꿔도 세로 물리 크기는 구간 내에서 일정하고,
// 다음 구간(1080 등)에 도달하는 순간에만 그 기기 기준으로 전환된다.
// 모니터 쪽: 접속하면 자동 추정한다(displayDensity — Apple 노트북은 패널 비율로
// 모델을 식별해 정확, 그 외는 표준 96dpi 근사).
const PHYS_ANCHORS = [
  { min: 360, outerDp: 380, mm: 70.5 },
  { min: 750, outerDp: 770, mm: 143.2 },
  { min: 1080, outerDp: 1140, mm: 214.1 },
];

// 현재 폭이 속한 구간의 기준 기기 앵커.
function anchorFor(dp: number) {
  let a = PHYS_ANCHORS[0];
  for (const p of PHYS_ANCHORS) if (dp >= p.min) a = p;
  return a;
}

export default function DeviceScaler() {
  useEffect(() => {
    const apply = () => {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      // 선택된 디바이스 크기(px). 미설정 시 기본 폰(360×780).
      const w = parseFloat(cs.getPropertyValue("--device-w")) || 360;
      const h = parseFloat(cs.getPropertyValue("--device-h")) || 780;
      // 베젤 사방 여백(--device-margin, 기본 10px). 목업/프레임은 화면보다 2·margin 큼.
      const margin = parseFloat(cs.getPropertyValue("--device-margin")) || 10;
      // 왼쪽 패널 폭을 뺀 가용 폭 기준으로 맞춘다(패널과 겹치지 않게).
      const panel = parseFloat(cs.getPropertyValue("--panel-w")) || 0;
      // "실제 사이즈로 보기" 상태면 창 크기와 무관하게, 모니터 위에서 실제
      // 기기와 같은 물리 크기로 보이는 배율로 고정한다.
      // 현재 폭의 실기기 몸체 폭(mm)을 목업 바깥 윤곽(w + 2·margin)에 맞춘다.
      if (root.dataset.actualSize === "true") {
        // 자동 감지(Apple 패널 식별 또는 96dpi 근사)한 모니터 밀도로 환산한다.
        const cssPxPerMm = detectPxPerMm().pxPerMm;
        // 배율은 구간 기준 기기에서만 결정되므로 구간 내에서 상수다.
        const a = anchorFor(w);
        const scale = (a.mm * cssPxPerMm) / a.outerDp;
        root.style.setProperty("--device-scale", String(scale));
        // 치수 눈금자(DeviceResizer)가 mm 라벨로 쓰도록 현재 몸체 폭을 노출한다.
        root.style.setProperty(
          "--device-phys-mm",
          String(((w + margin * 2) * scale) / cssPxPerMm),
        );
        return;
      }
      // 목업/프레임 외곽(사방 margin) + 창 여백 32px 기준으로 맞춘다.
      const s = Math.min(
        MAX_SCALE,
        (window.innerHeight - 32) / (h + margin * 2),
        (window.innerWidth - panel - 32) / (w + margin * 2),
      );
      root.style.setProperty("--device-scale", String(Math.max(0.1, s)));
    };
    // 드래그 중(deviceresize)에는 자동 맞춤 배율을 고정해 두는 게 원래 동작이지만,
    // 실제 사이즈 모드에선 폭에 따라 물리 배율·mm 라벨이 달라지므로 실시간 갱신한다.
    const onDragResize = () => {
      if (document.documentElement.dataset.actualSize === "true") apply();
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("devicechange", apply);
    window.addEventListener("deviceresize", onDragResize);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("devicechange", apply);
      window.removeEventListener("deviceresize", onDragResize);
    };
  }, []);
  return null;
}
