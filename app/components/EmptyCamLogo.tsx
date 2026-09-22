"use client";

import { BASE } from "../basePath";

// ============================================================================
// 영상 없는 카메라(카메라 06 · 07)의 회색 화면 위 '에스원' 로고
// ============================================================================
// 회색 자체는 영상 소스(cam-empty.gif)라 카메라가 그려지는 모든 곳이 따라오지만,
// 로고는 칸 크기마다 달라야 해서 GIF 에 박을 수 없다 — 그려지는 자리마다 이 층을
// 영상 위에 얹는다(CameraFeed · 각 안의 ExpandedSlide · 목록 썸네일).
//
// 크기 규칙(사용자 지정 2026-09-22): 그 칸 가로의 1/3, 최소 40 · 최대 150,
// 정중앙. 세로는 로고 비율(160×61)을 따른다. 퍼센트는 이 층(= 칸 전체) 폭
// 기준이라 칸마다 1/3 로 계산된다.
//
// 원본 로고가 160 이라 최대 150 까지 키워도 흐려지지 않는다.
// ============================================================================

const EMPTY_CAM_SUFFIX = "/cameras/cam-empty.gif";

/** 영상 없는 카메라인가 — 소스가 단색 GIF 인지로 가른다. */
export function isEmptyCam(src?: string | null): boolean {
  return !!src && src.endsWith(EMPTY_CAM_SUFFIX);
}

export default function EmptyCamLogo() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <img
        src={`${BASE}/cameras/cam-empty-logo.png`}
        alt=""
        draggable={false}
        style={{ width: "clamp(40px, 33.333%, 150px)", height: "auto" }}
      />
    </div>
  );
}
