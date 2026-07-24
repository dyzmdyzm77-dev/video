"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BASE } from "../basePath";
import AndroidNav from "./AndroidNav";
import { CameraFeed } from "./CameraFeed";
import { Inner as HomeScreen } from "../home/page";

// 데스크톱 전용: "비교하기"를 켜면 현재 시안(가운데 기기) 왼쪽에 As Is(현재 앱)
// 영상 화면을 나란히 띄운다.
//
// 크기: 시안 기기와 항상 동일(--device-w/--device-h). 시안이 넓어지면 As Is 도
//   같이 넓어지고, 시안처럼 '리플로우' 한다 — 글자·아이콘 크기는 그대로,
//   영상 타일만 넓어진다(항상 16:9 유지). 카메라 목록은 세로 스크롤.
// 영상: 상단 큰 영상은 재생, 아래 카메라 목록 타일은 스틸(첫 프레임 — paused).
// 시스템 바: 상단 상태바·하단 안드로이드 네비 모두 시안과 동일한 것을 쓴다.
//
// 디자인 출처는 As Is SVG(9.3 실시간 영상(세로)). 고정 크기 SVG 로는 리플로우가
// 안 되므로 HTML 로 재구성하고, 아이콘만 원본 SVG 의 path 를 좌표 그대로 쓴다.

// 카메라 목록 타일 — 전부 영상(16:9). 원본의 회색 '에스원' 카드도 영상으로 대체.
const CAMS = [
  "cam1",
  "cam2",
  "cam3",
  "cam4",
  "cam1",
  "cam2",
  "cam3",
  "cam4",
];

// ---- 시안(VariantA)과 동일한 하단 탭 아이템 ----
function TabItem({
  iconSrc,
  label,
  active,
  onClick,
}: {
  iconSrc: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const iconColor = active ? "#1D6CEB" : "#C4C4C4";
  const textColor = active ? "#1D6CEB" : "#7F7F7F";
  return (
    <li
      onClick={onClick}
      className={`flex flex-col items-center gap-1${onClick ? " cursor-pointer" : ""}`}
    >
      <span
        aria-hidden
        className="block"
        style={{
          width: "32px",
          height: "32px",
          backgroundColor: iconColor,
          WebkitMaskImage: `url(${iconSrc})`,
          maskImage: `url(${iconSrc})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      <span
        className="text-[12px] font-semibold leading-none"
        style={{ color: textColor }}
      >
        {label}
      </span>
    </li>
  );
}

// ---- 원본 As Is SVG 에서 그대로 가져온 아이콘(viewBox 는 원본 360×996 좌표계) ----
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="73.5 496 32 32" className={className} aria-hidden>
      <path d="M86.4729 519.827C86.5603 519.828 86.647 519.811 86.7273 519.776C86.8077 519.742 86.88 519.691 86.9395 519.627L101.286 505.333L100.34 504.387L86.4729 518.213L78.6195 510.36L77.6729 511.307L86.0062 519.627C86.0667 519.69 86.1391 519.74 86.2193 519.774C86.2994 519.808 86.3857 519.826 86.4729 519.827Z" fill="currentColor" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="103.5 56 13 9" fill="none" className={className} aria-hidden>
      <path d="M114.25 58.375L110 62.625L105.75 58.375" stroke="currentColor" strokeLinecap="square" />
    </svg>
  );
}

// ---- 시안(VariantA)과 동일한 상태바 아이콘 ----
function MuteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 4C7.5 4 3.5 5.7.5 8.4l2 2.3C5 8.5 8.3 7 12 7s7 1.5 9.5 3.7l2-2.3C20.5 5.7 16.5 4 12 4zm0 5c-3 0-5.7 1.1-7.8 3l2 2.3C7.8 12.9 9.8 12 12 12s4.2.9 5.8 2.3l2-2.3C17.7 10.1 15 9 12 9zm0 5c-1.5 0-2.9.6-4 1.5l4 4.5 4-4.5c-1.1-.9-2.5-1.5-4-1.5z" />
    </svg>
  );
}

function DndIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon({ className, level }: { className?: string; level: number }) {
  return (
    <div className={`relative flex items-center justify-center rounded-[4px] bg-neutral-800 text-[8px] font-bold leading-none text-white ${className ?? ""}`}>
      {level}
    </div>
  );
}

export default function AsIsPanel() {
  const [on, setOn] = useState(false);
  // 기본은 다채널(그리드, 시안과 동일) — 큰 영상 없이 목록 8개가 모두 재생된다.
  // 타일을 클릭하면 그 카메라가 큰 영상으로 올라오는 단일채널 모드로 전환되고,
  // 큰 영상을 더블클릭하면 다채널로 복귀한다(시안과 동일한 규칙).
  const [mode, setMode] = useState<"grid" | "single">("grid");
  // 단일채널 모드에서 큰 영상에 떠 있는 카메라 인덱스.
  const [featured, setFeatured] = useState(0);
  // 화면 전환(다채널↔단일) 로딩 — 시안은 스켈레톤 UI를 쓰지만, As Is(옛날 앱)는
  // 그냥 로딩 스피너가 뜬다(사양 차이). 600ms 로 시안 스켈레톤과 지속시간을
  // 맞춘다(VariantA 의 handleExpand/handleBack setTimeout 600).
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // 시스템 바 표시(?chrome=1)·플랫폼은 시안과 동일한 쿼리를 그대로 따른다.
  const chromeVisible = params.get("chrome") === "1";
  const platform = params.get("platform") === "ios" ? "ios" : "android";
  const qs = `platform=${platform}${chromeVisible ? "&chrome=1" : ""}`;
  // 지금 어떤 화면인지 — 라우트를 그대로 따라간다(양방향 연동의 핵심).
  const isHome = pathname === "/home";
  const from = ["a", "a1", "b"].includes(params.get("from") ?? "")
    ? (params.get("from") as string)
    : "a";

  useEffect(() => {
    const read = () =>
      setOn(document.documentElement.dataset.compare === "true");
    read();
    window.addEventListener("comparechange", read);
    return () => window.removeEventListener("comparechange", read);
  }, []);

  // 시안 쪽 다채널/단일 전환을 그대로 반영 — 비교하기가 꺼져 있어도 구독은
  // 계속 켜둬서(컴포넌트는 항상 마운트돼 있다), 나중에 켰을 때 최신 상태로
  // 시작한다.
  useEffect(() => {
    const onSync = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d || d.source !== "variant") return;
      if (d.mode === "grid") setMode("grid");
      else {
        setFeatured(d.index);
        setMode("single");
      }
    };
    window.addEventListener("channel-sync", onSync);
    return () => window.removeEventListener("channel-sync", onSync);
  }, []);

  // As Is 쪽 전환도 시안에 알린다(양방향). 비교하기 켜져 있을 때만 — 꺼진 동안의
  // 내부 상태 변화로 시안을 억지로 흔들지 않는다.
  useEffect(() => {
    if (!on) return;
    window.dispatchEvent(
      new CustomEvent("channel-sync", {
        detail: { source: "asis", mode, index: featured },
      }),
    );
  }, [on, mode, featured]);

  // 다채널↔단일 전환(내 클릭이든 시안에서 넘어온 동기화든) 때마다 잠깐 로딩.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [mode]);

  if (!on) return null;

  // 홈 화면은 시안과 동일 — 같은 홈 컴포넌트를 그대로 재사용한다.
  // (자체 상태바·하단탭·안드로이드 네비 포함. 중첩 .app-safe-frame 는 CSS 로 무력화)
  if (isHome) {
    return (
      <div className="asis-frame" aria-hidden>
        <span className="asis-caption">As Is</span>
        <div className="asis-screen asis-home">
          <Suspense>
            <HomeScreen />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="asis-frame" aria-hidden>
      <span className="asis-caption">As Is</span>
      <div className="asis-screen">
        {/* 상단 상태바 — 시안과 동일. */}
        {chromeVisible && (
          <>
            <span className="punch-hole" />
            <div
              className="asis-statusbar flex items-center justify-between bg-white px-5 text-[13px] font-semibold text-neutral-900"
              style={{ height: "27px" }}
            >
              <span>5:14</span>
              <div className="flex items-center gap-1.5 text-neutral-700">
                <MuteIcon className="h-3.5 w-3.5" />
                <WifiIcon className="h-3.5 w-3.5" />
                <DndIcon className="h-3.5 w-3.5" />
                <BatteryIcon className="h-3.5 w-5" level={80} />
              </div>
            </div>
          </>
        )}

        {/* 헤더 — 현장명·사업장·영상 종류 탭. 폭이 늘어도 크기 그대로. */}
        <header className="asis-header">
          <div className="asis-title">
            <span>8층 사무실</span>
            <ChevronDownIcon className="asis-chevron" />
          </div>
          <p className="asis-subtitle">에스원 본사 · N1234567</p>
          <div className="asis-pills">
            <span className="asis-pill asis-pill-on">실시간영상</span>
            <span className="asis-pill">녹화영상</span>
          </div>
        </header>

        {/* 여기까지는 고정 — 스크롤되지 않는다. */}
        <p className="asis-timestamp">2022.08.24&nbsp;&nbsp;18:20:00</p>

        {/* 큰 영상 + 카메라 목록을 한 스크롤 영역으로 묶는다. 자리가 넉넉하면
            (폰~폴드7, 트라이폴드) 스크롤 없이 그대로 다 보이고, 세로가 아주
            짧은 기기(폴드8 823×590 등)에서만 스크롤이 생겨 — 큰 영상·목록
            어느 것도 잘리거나 안 보이는 슬라이버가 되지 않는다. */}
        <div
          className={`asis-scroll${mode === "grid" ? " asis-scroll--grid" : ""}`}
        >
          {/* 큰 영상 — 단일채널 모드에서만. 더블클릭하면 다채널(그리드)로 복귀. */}
          {mode === "single" && (
            <div className="asis-hero" onDoubleClick={() => setMode("grid")}>
              <span className="asis-feed" key={featured}>
                <CameraFeed
                  label={`사무실 ${String(featured + 1).padStart(2, "0")}`}
                  src={`${BASE}/cameras/${CAMS[featured]}.gif`}
                />
              </span>
              <span className="asis-scrim" />
              <span className="asis-cam-label">
                사무실 {String(featured + 1).padStart(2, "0")}
              </span>
            </div>
          )}

          {/* '카메라 목록' 타이틀 — 원본 SVG 그대로, 큰 영상 아래에 있을 때만
              (단일채널 모드). 그리드(다채널) 모드는 원본에 없던 화면이라
              화면 전체가 이미 목록이므로 타이틀이 필요 없다. */}
          {mode === "single" && <p className="asis-section">카메라 목록</p>}

          {/* 카메라 목록 — 2열 고정. 다채널 모드에서 자연 크기(폭 기준 16:9,
              타일 딱 붙여서)가 하단 탭 위 영역에 자연히 다 들어가면 그대로
              패킹(여백 없음) — 넘칠 때만(823 등) 강제로 줄여서 맞춘다
              (letterbox). '들어가는지'는 CSS 컨테이너 쿼리로 판단한다(JS
              측정 없이 항상 정확 — globals.css 의 @container 참고). 단일채널
              모드는 항상 자연 크기 + 필요하면 스크롤. 다채널은 8개 모두 재생,
              단일채널은 스틸 + 타일 클릭으로 큰 영상만 바뀐다. */}
          <div className="asis-grid">
            {CAMS.map((cam, i) => (
              <div
                key={i}
                className="asis-tile"
                onClick={() => {
                  setFeatured(i);
                  setMode("single");
                }}
              >
                <span className="asis-feed">
                  <CameraFeed
                    label={`사무실 ${String(i + 1).padStart(2, "0")}`}
                    src={`${BASE}/cameras/${cam}.gif`}
                    paused={mode === "single"}
                  />
                </span>
                <span className="asis-scrim" />
                <span className="asis-cam-label">
                  사무실 {String(i + 1).padStart(2, "0")}
                </span>
                {/* 단일채널 모드에서, 현재 큰 영상에 떠 있는 카메라를 선택 상태(딤 + 체크)로. */}
                {mode === "single" && i === featured && (
                  <span className="asis-tile-selected">
                    <CheckIcon className="asis-check" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 탭바 — 시안과 동일한 마크업/아이콘(TabItem + nav/*.svg 마스크). */}
        <nav className="asis-tabbar mx-auto w-full border-t border-neutral-200 bg-white">
          <ul
            className="mx-auto grid w-full max-w-[480px] grid-cols-4 items-center"
            style={{ height: "60px" }}
          >
            <TabItem
              iconSrc={`${BASE}/nav/home.svg`}
              label="홈"
              onClick={() => router.push(`/home?${qs}&from=${from}`)}
            />
            <TabItem iconSrc={`${BASE}/nav/security.svg`} label="경비" />
            <TabItem iconSrc={`${BASE}/nav/video.svg`} label="영상" active />
            <TabItem iconSrc={`${BASE}/nav/menu.svg`} label="전체" />
          </ul>
        </nav>

        {/* 하단 안드로이드 네비 — 시안과 동일한 컴포넌트(폭은 기기 폭 따라감). */}
        {chromeVisible && (
          <div className="asis-nav">
            <AndroidNav platform="android" chromeVisible />
          </div>
        )}

        {/* 화면 전환 로딩 — 시안의 스켈레톤 UI 대신, As Is 는 그냥 스피너. */}
        {loading && (
          <div className="asis-loading">
            <span className="asis-loading-spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
