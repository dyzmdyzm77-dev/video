"use client";

import { useEffect } from "react";

// 데스크톱 폰 목업/프레임을 창 크기에 맞춰 축소하기 위한 배율(--device-scale)을
// 계산해 문서 루트에 설정한다. 기준 크기는 선택된 디바이스(--device-w/--device-h)
// + 사방 여백 10px(목업이 앱보다 사방 10px 큼). 창·디바이스가 바뀌면 재계산한다.
// (transform: scale 은 데스크톱 미디어쿼리에서만 적용되므로 모바일엔 영향 없음)
// 큰 창에서의 최대 배율. 1 이면 원본 크기, 낮출수록 작게.
const MAX_SCALE = 0.8;

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
      // 목업/프레임 외곽(사방 margin) + 창 여백 32px 기준으로 맞춘다.
      const s = Math.min(
        MAX_SCALE,
        (window.innerHeight - 32) / (h + margin * 2),
        (window.innerWidth - panel - 32) / (w + margin * 2),
      );
      root.style.setProperty("--device-scale", String(Math.max(0.1, s)));
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("devicechange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("devicechange", apply);
    };
  }, []);
  return null;
}
