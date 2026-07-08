"use client";

import { useDeviceWidth } from "./useDeviceWidth";

// 안드로이드 시스템 하단 네비(디바이스 전체 폭). 3버튼은 한 번만 렌더해 재사용.
//  - <620: 3버튼이 화면 폭 전체에 균등(왼쪽·오른쪽 0 앵커).
//  - 620~1080: 3버튼은 오른쪽 끝에서 고정 마진(back ≈ RIGHTPAD+…≈67px)으로 붙고,
//    태스크바(앱 아이콘)는 왼쪽 정렬. 화면이 넓어져도 버튼은 오른쪽 고정, 태스크바는
//    왼쪽 고정, 가운데 회색만 늘어난다(둘 다 CSS 앵커라 드래그 지연·구간 튐 없음).

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

const CLUSTER = 180; // 620+ 3버튼 그룹 폭
const RIGHTPAD = 37; // 그룹 오른쪽 여백 → back 버튼이 화면 오른쪽에서 ≈67px
const TB_GAP = 60; // 태스크바 오른쪽 끝 ↔ 3버튼 사이 간격
// 태스크바 오른쪽 앵커 위치(화면 오른쪽에서). 3버튼 그룹 왼쪽에 TB_GAP 만큼 붙는다.
const TB_RIGHT = RIGHTPAD + CLUSTER + TB_GAP;
const IGAP = 12; // 앱 아이콘 간격

// 구간별 태스크바(앱 아이콘) 구성 — 구분선 앞/뒤 개수.
function taskbarSpec(w: number) {
  if (w >= 1080) return { before: 5, after: 3 };
  if (w >= 750) return { before: 6, after: 2 };
  if (w >= 620) return { before: 4, after: 1 }; // 620~749
  return { before: 0, after: 0 };
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
  // 619→620 경계에서 전환이 트리거되도록, 전환 클래스는 619 이상에서만 붙인다.
  // (360~618 은 클래스가 없어 폭이 즉시 바뀜 → 지연 없음. 그대로 둠)
  const animate = w >= 619;
  // 항상 620 세트를 렌더(양방향 애니메이션용). 620 미만이면 클립 밖(오른쪽)으로 숨김.
  const spec = taskbarSpec(Math.max(w, 620));

  return (
    <div
      className="relative z-40 w-full overflow-hidden"
      style={{ height: "48px", backgroundColor: "#F6F6F6" }}
    >
      {/* 앱 아이콘 태스크바 — 3버튼 왼쪽에 TB_GAP 간격으로 오른쪽 앵커. 클립(overflow-hidden)
          안에서 아이콘이 왼쪽에서 드러나며 등장/퇴장한다(둘 다 애니메이션, 모든 폭에서 <620엔 숨김). */}
      <div
        className="absolute inset-y-0 flex items-center overflow-hidden"
        style={{ right: `${TB_RIGHT}px` }}
      >
        <div
          className="android-nav-taskbar flex items-center"
          style={{ gap: `${IGAP}px`, transform: taskbar ? "translateX(0)" : "translateX(100%)" }}
        >
          {Array.from({ length: spec.before }).map((_, i) => (
            <span key={`b${i}`} className="h-[33px] w-[33px] flex-none rounded-[13px] bg-[#ECECEC]" />
          ))}
          <span className="h-[22px] w-px flex-none bg-[#D0D0D0]" />
          {Array.from({ length: spec.after }).map((_, i) => (
            <span key={`a${i}`} className="h-[33px] w-[33px] flex-none rounded-[13px] bg-[#ECECEC]" />
          ))}
        </div>
      </div>

      {/* 3버튼 — 오른쪽 앵커 유지. 620+ 은 폭 CLUSTER(클러스터), <620 은 폭 w(전체 균등).
          전환 클래스는 620+ 에서만 → 480→620 진입 시 폭 w→CLUSTER 이 부드럽게 슬라이드,
          360~479 연속 드래그는 전환 없이 즉시 추종(지연 없음). 같은 요소 재사용. */}
      <div
        className={`absolute inset-y-0 flex items-center justify-around ${animate ? "android-nav-buttons" : ""}`}
        style={
          taskbar
            ? { right: `${RIGHTPAD}px`, width: `${CLUSTER}px` }
            : { right: 0, width: `${w}px` }
        }
      >
        <RecentAppsIcon className="h-5 w-5 text-neutral-500" />
        <SystemHomeIcon className="h-6 w-6 text-neutral-500" />
        <BackIcon className="h-5 w-5 text-neutral-500" />
      </div>
    </div>
  );
}
