"use client";

import { useEffect } from "react";
import { detectPxPerMm } from "./displayDensity";

// 데스크톱 폰 목업/프레임을 창 크기에 맞춰 축소하기 위한 배율(--device-scale)을
// 계산해 문서 루트에 설정한다. 기준 크기는 선택된 디바이스(--device-w/--device-h)
// + 사방 여백 10px(목업이 앱보다 사방 10px 큼). 창·디바이스가 바뀌면 재계산한다.
// (transform: scale 은 데스크톱 미디어쿼리에서만 적용되므로 모바일엔 영향 없음)
// 큰 창에서의 최대 배율. 1 이면 원본 크기, 낮출수록 작게.
const MAX_SCALE = 0.8;

// 비교하기(As Is 나란히) 시 두 기기 바깥(베젤) 사이 간격(px).
// CSS 의 .asis-frame left 계산과 반드시 같은 값을 써야 한다.
const COMPARE_GAP = 50;

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
      // 모든 프리셋이 공유하는 고정 왼쪽 앵커(--device-left) — "Z TriFold(1080)가
      // 패널 오른쪽 영역 가운데 정렬됐을 때의 화면 왼쪽 x". 트라이폴드는 정확히
      // 그 센터 자리에 앉고, 작은 프리셋들은 같은 왼쪽에서 시작해 오른쪽으로만
      // 커진다. 현재 기기가 오른쪽으로 넘치지 않게 클램프한다.
      const setAnchor = (curScale: number) => {
        // 비교하기: As Is + 시안을 '한 쌍'으로 묶어 패널 오른쪽 영역 가운데에 놓는다.
        // 두 기기의 바깥(베젤) 사이 간격이 정확히 COMPARE_GAP 이 되도록 계산한다.
        // As Is 는 시안과 같은 크기라 바깥 폭도 동일하다.
        if (root.dataset.compare === "true") {
          const outerW = (w + margin * 2) * curScale;
          const pairW = outerW * 2 + COMPARE_GAP;
          const pairLeft = Math.max(
            panel + 16,
            panel + (window.innerWidth - panel - pairW) / 2,
          );
          // --device-left 는 시안 '화면' 왼쪽 = 시안 베젤 왼쪽 + margin·scale
          const anchor = pairLeft + outerW + COMPARE_GAP + margin * curScale;
          root.style.setProperty("--device-left", `${Math.round(anchor)}px`);
          return;
        }
        const TF_W = 1080;
        const TF_H = 792;
        const TF_M = 30;
        const sTF = Math.min(
          MAX_SCALE,
          (window.innerHeight - 32) / (TF_H + TF_M * 2),
          (window.innerWidth - panel - 72) / (TF_W + TF_M * 2),
        );
        const tfOuter = (TF_W + TF_M * 2) * sTF;
        let anchor =
          panel + (window.innerWidth - panel - tfOuter) / 2 + TF_M * sTF;
        const maxAnchor =
          window.innerWidth - 16 - (w + margin) * curScale;
        anchor = Math.max(panel + 40, Math.min(anchor, maxAnchor));
        root.style.setProperty("--device-left", `${Math.round(anchor)}px`);
      };
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
        setAnchor(scale);
        return;
      }
      // 목업/프레임 외곽(사방 margin) + 창 여백 기준으로 맞춘다.
      // 비교하기 중엔 같은 크기의 As Is 가 왼쪽에 하나 더 붙으므로, 가로 기준을
      // "기기 2대 + 갭"으로 잡아야 둘 다 창 안에 들어온다.
      const compare = root.dataset.compare === "true";
      const cols = compare ? 2 : 1;
      const gap = compare ? COMPARE_GAP : 0;
      const s = Math.max(
        0.1,
        Math.min(
          MAX_SCALE,
          (window.innerHeight - 32) / (h + margin * 2),
          (window.innerWidth - panel - 72 - gap) / ((w + margin * 2) * cols),
        ),
      );
      root.style.setProperty("--device-scale", String(s));
      setAnchor(s);
    };
    // 드래그 중(deviceresize)에는 자동 맞춤 배율을 고정해 두는 게 원래 동작이지만,
    // 실제 사이즈 모드에선 폭에 따라 물리 배율·mm 라벨이 달라지므로 실시간 갱신한다.
    const onDragResize = () => {
      if (document.documentElement.dataset.actualSize === "true") apply();
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("devicechange", apply);
    window.addEventListener("comparechange", apply);
    window.addEventListener("deviceresize", onDragResize);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("devicechange", apply);
      window.removeEventListener("comparechange", apply);
      window.removeEventListener("deviceresize", onDragResize);
    };
  }, []);
  return null;
}
