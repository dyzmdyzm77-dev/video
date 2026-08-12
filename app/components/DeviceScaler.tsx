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
// 기기 위로 비워 두는 세로 여유(px). 해상도 칩 줄 + 치수 눈금자가 여기 들어간다 —
// 안 비워 두면 기기가 화면 꼭대기까지 올라와 칩·눈금자와 겹친다.
const TOP_CHROME = 76;

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
      // 가로 모드에서는 --device-w/h 가 눕힌 값이라 배율·왼쪽 앵커가 새로 계산돼
      // 프레임이 회전하면서 크기와 자리까지 같이 변한다. 그래서 회전 중·가로일
      // 때는 회전 기준인 세로 크기(--device-rot-w/h)로 계산한다 — 배율도 왼쪽
      // 앵커도 세로일 때 값 그대로라 "세로에 있던 그 자리"가 유지된다.
      // 비교하기는 예외다. 두 대를 나란히 놓는데 가로가 되면 한 쌍의 폭이 배로
      // 늘어, 세로 기준 배율·앵커를 그대로 쓰면 As Is 가 창 왼쪽으로 밀려난다.
      // 그래서 비교하기일 때는 지금 크기(눕힌 값)로 다시 계산해 둘 다 창 안에
      // 들어오게 한다 — '제자리 회전'은 기기 한 대만 볼 때의 규칙이다.
      const rotating =
        root.dataset.compare !== "true" &&
        (root.dataset.rotate === "true" ||
          root.dataset.landscape === "true");
      const w =
        parseFloat(
          cs.getPropertyValue(rotating ? "--device-rot-w" : "--device-w"),
        ) || 360;
      const h =
        parseFloat(
          cs.getPropertyValue(rotating ? "--device-rot-h" : "--device-h"),
        ) || 780;
      // 베젤 사방 여백(--device-margin, 기본 10px). 목업/프레임은 화면보다 2·margin 큼.
      const margin = parseFloat(cs.getPropertyValue("--device-margin")) || 10;
      // 왼쪽 패널 폭을 뺀 가용 폭 기준으로 맞춘다(패널과 겹치지 않게).
      const panel = parseFloat(cs.getPropertyValue("--panel-w")) || 0;
      // 아래쪽 앵커 — 세로가 커지면 위로만 자라도록 '바닥 기준선'을 고정한다.
      // 기준선(=화면 바닥 y)은 왼쪽 앵커와 동일하게 Z TriFold(가장 큰 footprint)가
      // 세로 가운데 정렬됐을 때의 바닥. --device-bottom-pad = 뷰포트 바닥에서 그
      // 기준선까지의 거리(CSS 가 body padding-bottom·프레임 bottom 에 쓴다).
      {
        const TF_W = 1080,
          TF_H = 792,
          TF_M = 30;
        const sTF = Math.min(
          MAX_SCALE,
          (window.innerHeight - TOP_CHROME) / (TF_H + TF_M * 2),
          (window.innerWidth - panel - 72) / (TF_W + TF_M * 2),
        );
        const tfOuterH = (TF_H + TF_M * 2) * sTF;
        const pad = Math.max(16, window.innerHeight / 2 - tfOuterH / 2);
        root.style.setProperty("--device-bottom-pad", `${Math.round(pad)}px`);
      }
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
        // 기기를 '패널 오른쪽 영역 가로 정중앙'에 놓는다. --device-left 는 화면
        // 왼쪽이므로 그 중심에서 화면 폭의 절반을 뺀 값이다.
        //
        // 예전엔 모든 프리셋이 공유하는 고정 왼쪽 앵커(Z TriFold 가 가운데 왔을 때의
        // 화면 왼쪽 x)를 썼다. 프리셋을 바꿔도 왼쪽이 안 움직이게 하려던 것인데,
        // 회전과 맞지 않았다 — 세로 폭 360 이 가로에선 780 이 되면서 좌우로 반씩
        // 퍼지면 왼쪽이 좌측 패널 밑으로 깔렸다. 회전을 '제자리 회전'(세로·가로
        // 중심 동일)으로 두기로 해서(사용자 결정), 그 중심을 애초에 안 깔릴 자리 =
        // 가용 영역 가운데로 잡는다. 대신 프리셋을 바꾸면 좌우로 같이 움직인다.
        //
        // w 는 위에서 회전 기준(세로) 크기로 읽으므로 세로·가로가 같은 중심을 낸다.
        const centerX = panel + (window.innerWidth - panel) / 2;
        let anchor = centerX - (w * curScale) / 2;
        // 창이 좁아 가운데로도 안 들어가면 최소한 베젤이 패널 밑으로는 안 들어가게.
        anchor = Math.max(panel + 16 + margin * curScale, anchor);
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
        // 실제 사이즈는 기기가 fit 배율보다 커질 수 있어 바닥앵커/왼쪽앵커(모두
        // fit 기준 TriFold 로 계산)를 그대로 쓰면 큰 기기(TriFold 등)가 한쪽으로
        // 밀려 잘린다. 그래서 이 모드에선 현재 기기를 '남은 영역(패널 제외) 가로·
        // 세로 정중앙'에 직접 놓는다 → TriFold 도 화면 가운데 대칭으로 보인다.
        // (창보다 크면 대칭으로 잘림. 세로는 body padding 이 음수로 못 가므로 최소 16.)
        const outerH = (h + margin * 2) * scale;
        const outerW = (w + margin * 2) * scale;
        const padA = Math.max(16, (window.innerHeight - outerH) / 2);
        root.style.setProperty("--device-bottom-pad", `${Math.round(padA)}px`);
        if (root.dataset.compare === "true") {
          // 비교하기: As Is+시안 한 쌍을 가운데(setAnchor 의 compare 분기가 처리).
          setAnchor(scale);
        } else {
          // 목업 왼쪽 = 패널 오른쪽 영역 가운데. --device-left 는 '화면' 왼쪽이라
          // 목업왼쪽 + margin·scale. 패널 밑으로 숨지 않게 최소 panel+16 로 클램프.
          const mockLeft = Math.max(
            panel + 16,
            panel + (window.innerWidth - panel - outerW) / 2,
          );
          root.style.setProperty(
            "--device-left",
            `${Math.round(mockLeft + margin * scale)}px`,
          );
        }
        return;
      }
      // 목업/프레임 외곽(사방 margin) + 창 여백 기준으로 맞춘다.
      // 비교하기 중엔 같은 크기의 As Is 가 왼쪽에 하나 더 붙으므로, 가로 기준을
      // "기기 2대 + 갭"으로 잡아야 둘 다 창 안에 들어온다.
      const compare = root.dataset.compare === "true";
      const cols = compare ? 2 : 1;
      const gap = compare ? COMPARE_GAP : 0;
      // 현재 기기가 창에 들어오는 최대 배율(오버플로 방지 상한).
      const sFit = Math.min(
        MAX_SCALE,
        (window.innerHeight - TOP_CHROME) / (h + margin * 2),
        (window.innerWidth - panel - 72 - gap) / ((w + margin * 2) * cols),
      );
      // 기본 모드도 '실제 사이즈 모드처럼' 기종 간 물리 크기 비례를 유지한다.
      // 모든 기종이 공통 캔버스 밀도(px/mm)를 쓰도록: 가장 큰 프리셋(Z TriFold)이
      // 창에 들어오는 배율(sTF)로 px/mm 를 정하고 → 각 기기 배율 = 그 기기 물리밀도
      // (mm/dp) × px/mm. 그래서 작은 기기(S26)는 작게, 큰 기기(TriFold)는 크게 나온다.
      // 단, 현재 기기가 창을 넘치면(수동 드래그로 아주 크게 등) sFit 로 클램프한다.
      const TF_OUTER_W = 1080 + 30 * 2;
      const sTF = Math.min(
        MAX_SCALE,
        (window.innerHeight - TOP_CHROME) / (792 + 30 * 2),
        (window.innerWidth - panel - 72) / TF_OUTER_W,
      );
      const canvasPxPerMm = sTF / (214.1 / TF_OUTER_W);
      const a = anchorFor(w);
      const sPhys = (a.mm / a.outerDp) * canvasPxPerMm;
      const s = Math.max(0.1, Math.min(sPhys, sFit));
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
