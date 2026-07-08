"use client";

import { useDeviceWidth } from "./useDeviceWidth";

// 안드로이드 시스템 하단 네비(디바이스 전체 폭). 3버튼은 한 번만 렌더해 재사용.
//  - <620: 3버튼이 화면 폭 전체에 균등.
//  - 620/750/1080: 왼쪽 앱 아이콘 태스크바 + (고정 GAP) + 3버튼 유닛, 가운데 정렬.
// 구간이 바뀌면 태스크바 아이콘 슬롯 폭이 0↔33 으로 전환돼 슬라이드하며 늘고 준다.

function RecentAppsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden>
      <line x1="7" y1="5" x2="7" y2="19" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="17" y1="5" x2="17" y2="19" />
    </svg>
  );
}

function SystemHomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="3.5" />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="15 6 9 12 15 18" />
    </svg>
  );
}

const GAP = 56; // 태스크바 ↔ 3버튼 고정 간격
const CLUSTER = 180; // 620+ 3버튼 그룹 폭
const ICON = 33;
const IGAP = 12;
const MAX_BEFORE = 6; // 구분선 앞 최대 아이콘 수
const MAX_AFTER = 3; // 구분선 뒤 최대 아이콘 수

// 구간별 태스크바(앱 아이콘) 구성 — 구분선 앞/뒤 개수.
function taskbarSpec(w: number) {
  if (w >= 1080) return { before: 5, after: 3 };
  if (w >= 750) return { before: 6, after: 2 };
  if (w >= 620) return { before: 4, after: 1 }; // 620~749
  return { before: 0, after: 0 };
}

// 폭이 0↔(ICON+IGAP) 로 전환되는 아이콘 슬롯(개수 대신 폭 애니메이션).
function IconSlot({ active }: { active: boolean }) {
  return (
    <span
      className="android-nav-slot flex flex-none items-center overflow-hidden"
      style={{ width: active ? `${ICON + IGAP}px` : "0px" }}
    >
      <span className="h-[33px] w-[33px] flex-none rounded-[13px] bg-[#ECECEC]" />
    </span>
  );
}

export default function AndroidNav({
  platform,
  chromeVisible,
}: {
  platform: "android" | "ios";
  chromeVisible: boolean;
}) {
  const w = useDeviceWidth();
  if (platform !== "android" || !chromeVisible) return null;

  const taskbar = w >= 620;
  const spec = taskbarSpec(w);

  return (
    <div
      className="relative z-40 w-full overflow-hidden"
      style={{ height: "48px", backgroundColor: "#F6F6F6" }}
    >
      {/* [태스크바] —(GAP)— [3버튼] 유닛. 가운데 정렬, 양옆 회색이 채운다. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ gap: taskbar ? `${GAP}px` : "0px" }}
      >
        {/* 왼쪽 앱 아이콘 태스크바 — 아이콘 슬롯 폭 전환으로 슬라이드하며 늘고 준다. */}
        <div className="flex items-center">
          {Array.from({ length: MAX_BEFORE }).map((_, i) => (
            <IconSlot key={`b${i}`} active={i < spec.before} />
          ))}
          {/* 구분선 — 태스크바가 있을 때만 폭 전환으로 등장. */}
          <span
            className="android-nav-slot flex flex-none items-center overflow-hidden"
            style={{ width: taskbar ? `${IGAP}px` : "0px" }}
          >
            <span className="h-[22px] w-px flex-none bg-[#D0D0D0]" />
          </span>
          {Array.from({ length: MAX_AFTER }).map((_, i) => (
            <IconSlot key={`a${i}`} active={i < spec.after} />
          ))}
        </div>

        {/* 3버튼 — 항상 한 번만 렌더(재사용). 폭만 전환(전체↔CLUSTER). */}
        <div
          className="android-nav-buttons flex flex-none items-center justify-around"
          style={{ width: taskbar ? `${CLUSTER}px` : `${w}px` }}
        >
          <RecentAppsIcon className="h-5 w-5 text-neutral-500" />
          <SystemHomeIcon className="h-6 w-6 text-neutral-500" />
          <BackIcon className="h-5 w-5 text-neutral-500" />
        </div>
      </div>
    </div>
  );
}
