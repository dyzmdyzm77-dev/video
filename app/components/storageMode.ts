"use client";

import { useEffect, useState } from "react";

// ============================================================================
// 저장 방식 — NVR / 클라우드 (프로토타입 스위치)
// ============================================================================
// 같은 안이라도 영상이 NVR(로컬 녹화기)에 있느냐 클라우드에 있느냐에 따라
// 화면에서 달라질 게 생긴다. 그때마다 안을 따로 파지 않고, 좌측 데스크톱
// 패널(DesktopVariantNav)의 토글 하나로 두 상태를 다 볼 수 있게 한다.
//
//   nvr (기본) — 로컬 녹화기
//   cloud      — 클라우드
//
// 전달 방식은 eventThumbs·compareTarget 과 같다 — 문서 루트의 data 속성에 쓰고
// 이벤트를 쏘면 안들이 구독한다. 안이 좌측 패널을 직접 import 하지 않아도
// 되므로(모바일에선 패널 자체가 없다) 이 방식을 유지한다.
//
// 좌측 패널은 데스크톱 전용이라, 폰으로 미리보기를 열 땐 ?storage=cloud 쿼리가
// 유일한 진입점이다(thumbs=0 과 같은 자리에서 읽는다).
// ============================================================================

export type StorageMode = "nvr" | "cloud";

export const STORAGE_MODE_EVENT = "storagemodechange";

const MODES: StorageMode[] = ["nvr", "cloud"];

/** 문서 루트에서 현재 값을 읽는다. 기본은 NVR. */
export function readStorageMode(): StorageMode {
  if (typeof document === "undefined") return "nvr";
  const v = document.documentElement.dataset.storage;
  return (MODES as string[]).includes(v ?? "") ? (v as StorageMode) : "nvr";
}

export function requestStorageMode(m: StorageMode) {
  document.documentElement.dataset.storage = m;
  window.dispatchEvent(new Event(STORAGE_MODE_EVENT));
}

/** 저장 방식을 구독한다. SSR·첫 렌더는 항상 nvr(기본값)로 맞춰 하이드레이션 불일치를 막는다. */
export function useStorageMode(): StorageMode {
  const [m, setM] = useState<StorageMode>("nvr");
  useEffect(() => {
    const sync = () => setM(readStorageMode());
    sync();
    window.addEventListener(STORAGE_MODE_EVENT, sync);
    return () => window.removeEventListener(STORAGE_MODE_EVENT, sync);
  }, []);
  return m;
}
