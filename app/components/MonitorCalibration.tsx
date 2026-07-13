"use client";

import { useEffect, useState } from "react";

// 모니터 물리 밀도(1mm 당 CSS px) 보정 오버레이.
// 브라우저는 모니터 실제 크기를 못 주므로, 일러스트가 환경설정에서 ppi 를 받던 것처럼
// 신용카드(ISO/IEC 7810 ID-1, 정확히 85.60 × 53.98mm)를 화면에 대고 한 번 맞춰
// 그 값을 localStorage 에 저장한다. 저장 후 DeviceScaler 가 이 값으로 실제 사이즈를 그린다.
// 좌측 패널의 "화면 보정" 버튼이 opencalibration 이벤트로 이 오버레이를 연다.

export const CALIB_KEY = "monitorPxPerMm";
const CSS_DEFAULT = 96 / 25.4; // 미보정 기본값(CSS 표준 96dpi)
const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

// 저장된 보정값(px/mm). 없으면 null.
export function readCalibration(): number | null {
  if (typeof window === "undefined") return null;
  const v = parseFloat(window.localStorage.getItem(CALIB_KEY) || "");
  return Number.isFinite(v) && v > 0 ? v : null;
}

export default function MonitorCalibration() {
  const [open, setOpen] = useState(false);
  const [pxPerMm, setPxPerMm] = useState(CSS_DEFAULT);

  useEffect(() => {
    const onOpen = () => {
      setPxPerMm(readCalibration() ?? CSS_DEFAULT);
      setOpen(true);
    };
    window.addEventListener("opencalibration", onOpen);
    return () => window.removeEventListener("opencalibration", onOpen);
  }, []);

  // 저장/초기화 후 배율을 다시 계산하게 한다.
  const notify = () => {
    window.dispatchEvent(new Event("calibrationchange"));
    window.dispatchEvent(new Event("devicechange"));
  };

  const save = () => {
    window.localStorage.setItem(CALIB_KEY, String(pxPerMm));
    notify();
    setOpen(false);
  };

  const reset = () => {
    window.localStorage.removeItem(CALIB_KEY);
    notify();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="mc-overlay" role="dialog" aria-label="화면 보정">
      <div className="mc-sheet">
        <h2 className="mc-title">실제 사이즈 보정</h2>
        <p className="mc-desc">
          실제 <b>신용카드</b>(또는 교통·체크카드)를 화면에 대고, 아래 사각형이
          카드와 <b>정확히 같은 크기</b>가 되도록 슬라이더를 맞춰주세요.
          <br />한 번 맞추면 이 모니터에서 실제 사이즈가 자로 재도 맞습니다.
        </p>

        {/* 카드 미리보기 — 보정 배율로 실제 CSS px 크기를 그린다. */}
        <div className="mc-card-wrap">
          <div
            className="mc-card"
            style={{
              width: `${CARD_W_MM * pxPerMm}px`,
              height: `${CARD_H_MM * pxPerMm}px`,
            }}
          >
            <span className="mc-card-chip" />
            <span className="mc-card-label">85.6 × 53.98 mm</span>
          </div>
        </div>

        <input
          type="range"
          className="mc-slider"
          min={2.5}
          max={9}
          step={0.01}
          value={pxPerMm}
          onChange={(e) => setPxPerMm(parseFloat(e.target.value))}
        />
        <p className="mc-readout">
          1mm = <b>{pxPerMm.toFixed(2)}</b> px
        </p>

        <div className="mc-actions">
          <button type="button" className="mc-btn mc-reset" onClick={reset}>
            초기화
          </button>
          <span className="mc-actions-right">
            <button
              type="button"
              className="mc-btn mc-cancel"
              onClick={() => setOpen(false)}
            >
              취소
            </button>
            <button type="button" className="mc-btn mc-save" onClick={save}>
              완료
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
