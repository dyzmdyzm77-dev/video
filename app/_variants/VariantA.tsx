"use client";

import { BASE } from "../basePath";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import {
  CameraFeed,
  GridSelectionOverlay,
  useGifFrameCanvas,
} from "../components/CameraFeed";
import VariantPicker from "../components/VariantPicker";
import AndroidNav from "../components/AndroidNav";
import { useDeviceWidth } from "../components/useDeviceWidth";
import { useListLayout } from "../components/useListLayout";
import {
  MOTION_MIN_H,
  THUMB_MAX_H,
  THUMB_MIN_H,
} from "../components/layoutRules";

const CAMERAS = [
  { label: "카메라 01", src: `${BASE}/cameras/cam1.gif`, zoom: 1.18 },
  { label: "카메라 02", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 03", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 04", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 05", src: `${BASE}/cameras/cam1.gif`, zoom: 1.18 },
  { label: "카메라 06", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 07", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 08", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 09", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 10", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 11", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 12", src: `${BASE}/cameras/cam1.gif`, zoom: 1.18 },
  { label: "카메라 13", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 14", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 15", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 16", src: `${BASE}/cameras/cam1.gif`, zoom: 1.18 },
];

const LAYOUT_DIMS: Record<
  "1x2" | "1x3" | "2x3" | "2x4" | "2x2" | "3x3" | "4x4",
  { cols: number; rows: number }
> = {
  "1x2": { cols: 1, rows: 2 },
  "1x3": { cols: 1, rows: 3 },
  "2x3": { cols: 2, rows: 3 },
  "2x4": { cols: 2, rows: 4 },
  "2x2": { cols: 2, rows: 2 },
  "3x3": { cols: 3, rows: 3 },
  "4x4": { cols: 4, rows: 4 },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
function formatNow(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.(${WEEKDAYS[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block bg-current ${className ?? ""}`}
      style={{
        WebkitMaskImage: `url(${BASE}/More.svg)`,
        maskImage: `url(${BASE}/More.svg)`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3.2 3 11h2v9h5v-6h4v6h5v-9h2L12 3.2z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3 4 6v6c0 4.5 3.4 8.5 8 9 4.6-.5 8-4.5 8-9V6l-8-3z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 6.5C7.3 6.5 3.5 8.5 3.5 11v3.5c0 .8.7 1.5 1.5 1.5h14c.8 0 1.5-.7 1.5-1.5V11c0-2.5-3.8-4.5-8.5-4.5zm0 3.7a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z" />
      <circle cx="12" cy="13" r="1.6" fill="#fff" />
    </svg>
  );
}

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

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="13" x2="20" y2="13" />
      <line x1="4" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export default function VariantA({
  platform = "android",
  initialChrome = false,
  onHome,
}: {
  platform?: "android" | "ios";
  initialChrome?: boolean;
  onHome?: () => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  // 다채널 세로 레이아웃 — 사용자가 레이아웃 설정에서 직접 고르기 전엔 폭 기반
  // 기본값을 쓴다(780 이상: 3×3, 620 이상: 2×3, 미만: 2×4). 드래그로 폭이
  // 바뀌면 즉시 따라간다.
  const deviceW = useDeviceWidth();
  const [userVertLayout, setUserVertLayout] = useState<LayoutKey | null>(null);
  const vertLayout =
    userVertLayout ?? (deviceW >= 780 ? "3x3" : deviceW >= 620 ? "2x3" : "2x4");
  const [horzLayout, setHorzLayout] = useState<LayoutKey>("2x2");
  const [mode, setMode] = useState<"live" | "recording">("live");
  // 위아래 가짜 시스템 바 표시 여부. 기본은 숨긴 몰입 상태(LIVE 칩으로 토글).
  // 단 데스크톱 진입(initialChrome)이면 켠 채로 시작한다.
  const [chromeVisible, setChromeVisible] = useState(initialChrome);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [playbackMs, setPlaybackMs] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // 배속(부호 포함): 1=기본, 2/4/16=빨리감기, 음수=되감기. 타임라인 진행 속도에 반영.
  const [playbackRate, setPlaybackRate] = useState(1);
  const [dateTimeOpen, setDateTimeOpen] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const toggleChrome = () => setChromeVisible((v) => !v);

  // 화면 캡처 토스트 — 카메라 버튼 누르면 잠깐 노출 후 자동 사라짐.
  const [captureToast, setCaptureToast] = useState(false);
  const captureToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCaptureToast = () => {
    setCaptureToast(true);
    if (captureToastTimer.current) clearTimeout(captureToastTimer.current);
    captureToastTimer.current = setTimeout(() => setCaptureToast(false), 2000);
  };

  // 녹화 모드일 때 playbackMs 자동 진행 — 실시간 흐름 반영 (탭이 hidden일 때도 동작)
  useEffect(() => {
    if (mode !== "recording") return;
    if (playbackMs === null) return;
    if (isScrubbing) return;
    if (!isPlaying) return; // 일시정지 상태면 시간 진행 멈춤
    let prev = performance.now();
    // 다채널(그리드)은 타일 수만큼 프레임 드로잉·리렌더가 배가되므로 틱을
    // 150ms 로 낮춘다(dt 기반이라 재생 속도는 동일). 단일 화면은 50ms 유지.
    const id = setInterval(() => {
      const t = performance.now();
      const dt = t - prev;
      prev = t;
      setPlaybackMs((p) => (p === null ? null : p + dt * playbackRate));
    }, expandedIndex === null ? 150 : 50);
    return () => clearInterval(id);
  }, [mode, playbackMs === null, isScrubbing, isPlaying, playbackRate, expandedIndex === null]);

  // 다채널→단일 진입: 같은 렌더에서 setExpandedIndex와 함께 스켈레톤을 켜
  // 이미지 페인트 전에 스켈레톤이 위(z-20)에 즉시 깔리도록 한다.
  const handleExpand = (idx: number) => {
    setVideoLoading(true);
    setExpandedIndex(idx);
    setTimeout(() => setVideoLoading(false), 600);
  };

  // 단일→다채널 복귀: 동일 처리
  const handleBack = () => {
    setGridLoading(true);
    setExpandedIndex(null);
    setTimeout(() => setGridLoading(false), 600);
  };

  // 비교하기(As Is) 연동 — 다채널/단일 상태가 바뀔 때마다 알리고, comparechange
  // (비교하기 토글) 시에도 현재 상태를 다시 알려 As Is 가 즉시 맞춰지게 한다.
  useEffect(() => {
    const broadcast = () => {
      window.dispatchEvent(
        new CustomEvent("channel-sync", {
          detail: {
            source: "variant",
            mode: expandedIndex === null ? "grid" : "single",
            index: expandedIndex ?? 0,
          },
        }),
      );
    };
    broadcast();
    window.addEventListener("comparechange", broadcast);
    return () => window.removeEventListener("comparechange", broadcast);
  }, [expandedIndex]);

  // As Is 쪽에서 온 다채널/단일 전환을 그대로 반영.
  useEffect(() => {
    const onSync = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d || d.source !== "asis") return;
      if (d.mode === "grid") {
        if (expandedIndex !== null) handleBack();
      } else if (expandedIndex !== d.index) {
        handleExpand(d.index);
      }
    };
    window.addEventListener("channel-sync", onSync);
    return () => window.removeEventListener("channel-sync", onSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedIndex]);

  const triggerTransitionSkeleton = () => {
    if (expandedIndex === null) {
      setGridLoading(true);
      setTimeout(() => setGridLoading(false), 600);
    } else {
      setVideoLoading(true);
      setTimeout(() => setVideoLoading(false), 600);
    }
  };

  // 라이브에서 녹화 탭 클릭 시 바텀시트 열기 (모드는 적용 시 변경)
  const handleSetMode = (m: "live" | "recording") => {
    if (m === "recording" && mode === "live") {
      setDateTimeOpen(true);
    } else if (m !== mode) {
      setMode(m);
      triggerTransitionSkeleton();
    }
  };
  const [now, setNow] = useState<Date | null>(null);

  const layoutDims = LAYOUT_DIMS[vertLayout];
  const pageSize = layoutDims.cols * layoutDims.rows;
  const totalPages = Math.ceil(CAMERAS.length / pageSize);

  // 폭 경계(620)를 넘나들며 레이아웃이 바뀌어 페이지 수가 줄면 현재 페이지를 범위 안으로.
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = now ? formatNow(now) : "";

  return (
    <div className="app-safe-frame h-full w-full flex flex-col items-center bg-white">
    <div className="relative flex min-h-0 flex-1 w-full flex-col overflow-hidden bg-white">
      {/* 펀치홀 카메라 점 — Android 환경에서 시스템 바가 보일 때만. 누르면 토글.
          iOS 환경에선 실제 상태바를 쓰므로 가짜 상단 바를 그리지 않는다. */}
      {platform === "android" && chromeVisible && (
        <button
          type="button"
          aria-label="시스템 바 토글"
          onClick={toggleChrome}
          className="punch-hole"
        />
      )}
      {/* 안드로이드 상태바 — Android 환경에서만 */}
      {platform === "android" && chromeVisible && (
        <div
          className="relative flex flex-none items-center justify-between bg-white px-5 text-[13px] font-semibold text-neutral-900"
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
      )}

      {expandedIndex === null ? (
        <GridView
          onExpand={handleExpand}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          dateLabel={dateLabel}
          onOpenSheet={() => setSheetOpen(true)}
          onOpenVariantPicker={() => setVariantPickerOpen(true)}
          cols={layoutDims.cols}
          rows={layoutDims.rows}
          pageSize={pageSize}
          totalPages={totalPages}
          mode={mode}
          setMode={handleSetMode}
          now={now}
          onToggleChrome={toggleChrome}
          chromeVisible={chromeVisible}
          isScrubbing={isScrubbing}
          onScrubbingChange={setIsScrubbing}
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          onOpenDateTime={() => setDateTimeOpen(true)}
          gridLoading={gridLoading}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onPlay={() => setIsPlaying(true)}
          onSpeedChange={setPlaybackRate}
        />
      ) : (
        <ExpandedView
          index={expandedIndex}
          onBack={handleBack}
          onSelect={setExpandedIndex}
          dateLabel={dateLabel}
          onOpenSheet={() => setSheetOpen(true)}
          mode={mode}
          setMode={handleSetMode}
          onToggleChrome={toggleChrome}
          chromeVisible={chromeVisible}
          onOpenDateTime={() => setDateTimeOpen(true)}
          videoLoading={videoLoading}
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          isScrubbing={isScrubbing}
          onScrubbingChange={setIsScrubbing}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onPlay={() => setIsPlaying(true)}
          onCapture={showCaptureToast}
          captureToast={captureToast}
          onSpeedChange={setPlaybackRate}
        />
      )}

      <DateTimePickerSheet
        open={dateTimeOpen}
        initialMs={playbackMs ?? now?.getTime() ?? Date.now()}
        onClose={() => setDateTimeOpen(false)}
        onApply={(ms) => {
          setPlaybackMs(ms);
          setIsPlaying(true);
          setMode("recording");
          setDateTimeOpen(false);
          triggerTransitionSkeleton();
        }}
      />

      <LayoutConfigSheet
        open={sheetOpen}
        initialVert={vertLayout}
        initialHorz={horzLayout}
        onClose={() => setSheetOpen(false)}
        onApply={(vert, horz) => {
          setUserVertLayout(vert);
          setHorzLayout(horz);
          setCurrentPage(0);
          setSheetOpen(false);
        }}
      />

      <VariantPicker
        open={variantPickerOpen}
        current="a"
        platform={platform}
        onClose={() => setVariantPickerOpen(false)}
      />

      {/* 하단 탭바 — 라이브·녹화 모드 모두에서 표시. */}
      <nav className="mx-auto mt-auto w-full border-t border-neutral-200 bg-white">
        <ul
          className="mx-auto grid w-full max-w-[480px] grid-cols-4 items-center"
          style={{ height: "60px" }}
        >
          <TabItem iconSrc={`${BASE}/nav/home.svg`} label="홈" onClick={onHome} />
          <TabItem iconSrc={`${BASE}/nav/security.svg`} label="경비" />
          <TabItem iconSrc={`${BASE}/nav/video.svg`} label="영상" active />
          <TabItem iconSrc={`${BASE}/nav/menu.svg`} label="전체" />
        </ul>
      </nav>

    </div>

      {/* 하단 안드로이드 네비 — 디바이스 전체 폭(콘텐츠 620 컬럼 밖). 해상도별 형태. */}
      <AndroidNav platform={platform} chromeVisible={chromeVisible} />
    </div>
  );
}

function GridView({
  onExpand,
  currentPage,
  setCurrentPage,
  dateLabel,
  onOpenSheet,
  onOpenVariantPicker,
  cols,
  rows,
  pageSize,
  totalPages,
  mode,
  setMode,
  now,
  onToggleChrome,
  chromeVisible = true,
  isScrubbing,
  onScrubbingChange,
  playbackMs,
  setPlaybackMs,
  onOpenDateTime,
  gridLoading,
  isPlaying = true,
  onTogglePlay,
  onPlay,
  onSpeedChange,
}: {
  onExpand: (i: number) => void;
  currentPage: number;
  setCurrentPage: (fn: (prev: number) => number) => void;
  dateLabel: string;
  onOpenSheet: () => void;
  onOpenVariantPicker: () => void;
  cols: number;
  rows: number;
  pageSize: number;
  totalPages: number;
  mode: "live" | "recording";
  setMode: (m: "live" | "recording") => void;
  now: Date | null;
  onToggleChrome: () => void;
  chromeVisible?: boolean;
  isScrubbing: boolean;
  onScrubbingChange: (s: boolean) => void;
  playbackMs: number | null;
  setPlaybackMs: (
    v: number | null | ((prev: number | null) => number | null),
  ) => void;
  onOpenDateTime: () => void;
  gridLoading: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onPlay?: () => void;
  onSpeedChange?: (rate: number) => void;
}) {
  const [gridSelected, setGridSelected] = useState(false);
  const [activityTick, setActivityTick] = useState(0);
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipedRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gridSelected) return;
    const timer = setTimeout(() => setGridSelected(false), 4000);
    return () => clearTimeout(timer);
  }, [gridSelected, activityTick]);

  const handleCellClick = (idx: number) => {
    if (swipedRef.current) return; // 스와이프 직후 클릭 무시
    if (clickTimerRef.current !== null) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onExpand(idx);
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      setGridSelected((prev) => !prev);
    }, 230);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = swipeRef.current;
    if (!start) return;
    swipeRef.current = null;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) < 50 || Math.abs(dy) > 60 || dt > 600) return;
    // 스와이프 성공: 직후의 click을 무시하도록 플래그
    swipedRef.current = true;
    setTimeout(() => {
      swipedRef.current = false;
    }, 350);
    // 딤이 켜져있다면 타이머 리셋 + 그대로 유지
    setActivityTick((t) => t + 1);
    if (dx < 0) {
      setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
    } else {
      setCurrentPage((p) => Math.max(p - 1, 0));
    }
  };

  return (
    <>
      {/* 상단 헤더(타이틀+실시간/녹화 탭) — 녹화 모드에서도 항상 표시.
          시스템 바를 끄는 몰입 모드에선 헤더 위 16px 여백도 함께 제거해 위로 붙인다. */}
      <header
        className="flex flex-none items-center px-5"
        style={{ height: "56px", marginTop: chromeVisible ? "16px" : "0px" }}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-[2px]">
            <button
              type="button"
              onClick={onOpenVariantPicker}
              className="flex items-center gap-1.5 text-[18px] font-bold leading-none text-neutral-900"
            >
              8층 사무실 A
              <ChevronDownIcon className="h-6 w-6 text-[#262626]" />
            </button>
            <p
              className="text-[12px] leading-none"
              style={{ color: "#BFBFBF" }}
            >
              에스원 본사 · N1234567
            </p>
          </div>

          <ModeToggle mode={mode} setMode={setMode} />
        </div>
      </header>

      <section
        className="relative min-h-0 flex-1 touch-pan-y select-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: `${totalPages * 100}%`,
            transform: `translateX(-${currentPage * (100 / totalPages)}%)`,
          }}
        >
          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const slice = Array.from(
              { length: pageSize },
              (_, i) => CAMERAS[pageIdx * pageSize + i] ?? null,
            );
            return (
              <div
                key={pageIdx}
                className="grid h-full gap-0.5 bg-neutral-300"
                style={{
                  width: `${100 / totalPages}%`,
                  flexShrink: 0,
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {slice.map((cam, i) => {
                  const absoluteIndex = pageIdx * pageSize + i;
                  return (
                    <div
                      key={absoluteIndex}
                      className={cam ? "relative cursor-pointer" : "relative"}
                      onClick={
                        cam ? () => handleCellClick(absoluteIndex) : undefined
                      }
                    >
                      {cam ? (
                        <CameraFeed
                          label={cam.label}
                          src={cam.src}
                          zoom={cam.zoom}
                          paused={
                            isScrubbing || (mode === "recording" && !isPlaying)
                          }
                          playbackMs={playbackMs}
                          driveByPlayback={
                            mode === "recording" && (isScrubbing || !isPlaying)
                          }
                        />
                      ) : (
                        <NoCameraPlaceholder />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <GridSelectionOverlay
          visible={gridSelected}
          currentPage={currentPage}
          totalPages={totalPages}
          onGallery={onOpenSheet}
        />
        <SectionSkeleton visible={gridLoading} cols={cols} rows={rows} />
      </section>

      {mode === "live" ? (
        <div
          className="relative flex flex-none items-center px-5"
          style={{ height: "48px", gap: "8px" }}
        >
          <LiveBadge onClick={onToggleChrome} />
          <span
            suppressHydrationWarning
            className="text-[14px] font-medium leading-none text-[#353535]"
          >
            {dateLabel}
          </span>
          <RowSkeleton visible={gridLoading} />
        </div>
      ) : (
        <RecordingControls
          now={now}
          onToggleChrome={onToggleChrome}
          onScrubbingChange={onScrubbingChange}
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          onOpenDateTime={onOpenDateTime}
          rowLoading={gridLoading}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onPlay={onPlay}
          onSpeedChange={onSpeedChange}
        />
      )}
    </>
  );
}

// 큰 영상 슬라이드 — 녹화 모드에선 타임라인(playbackMs) 프레임을 직접 그려
// 배속/되감기/탐색이 영상에 반영되게 하고, 그 외엔 GIF 첫 프레임으로 멈춤 표시
function ExpandedSlide({
  c,
  paused,
  playbackMs = null,
  driveByPlayback = false,
}: {
  c: (typeof CAMERAS)[number];
  paused: boolean;
  playbackMs?: number | null;
  driveByPlayback?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (driveByPlayback) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
    };
    img.src = c.src;
  }, [c.src, driveByPlayback]);

  useGifFrameCanvas(canvasRef, c.src, driveByPlayback ? playbackMs : null);

  const driving = driveByPlayback && playbackMs != null;
  const zoom = c.zoom ? `scale(${c.zoom})` : undefined;
  return (
    <>
      <img
        src={c.src}
        alt={c.label}
        className="absolute inset-0 h-full w-full object-fill"
        style={{ transform: zoom, opacity: driving ? 0 : paused ? 0 : 1 }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: "fill",
          transform: zoom,
          opacity: driving ? 1 : paused ? 1 : 0,
        }}
      />
      <div
        className="absolute inline-flex items-center bg-black/55 text-[10px] font-medium leading-none text-white"
        style={{
          top: "4px",
          left: "4px",
          height: "17px",
          padding: "0 4px",
          borderRadius: "2px",
        }}
      >
        {c.label}
      </div>
    </>
  );
}

function ExpandedView({
  index,
  onBack,
  onSelect,
  dateLabel,
  onOpenSheet,
  mode,
  setMode,
  onToggleChrome,
  chromeVisible = true,
  onOpenDateTime,
  videoLoading,
  playbackMs,
  setPlaybackMs,
  isScrubbing = false,
  onScrubbingChange,
  isPlaying = true,
  onTogglePlay,
  onPlay,
  onCapture,
  captureToast = false,
  onSpeedChange,
}: {
  index: number;
  onBack: () => void;
  onSelect: (i: number) => void;
  dateLabel: string;
  onOpenSheet: () => void;
  mode: "live" | "recording";
  setMode: (m: "live" | "recording") => void;
  onToggleChrome: () => void;
  chromeVisible?: boolean;
  onOpenDateTime: () => void;
  videoLoading: boolean;
  playbackMs: number | null;
  setPlaybackMs: (
    v: number | null | ((prev: number | null) => number | null),
  ) => void;
  isScrubbing?: boolean;
  onScrubbingChange?: (s: boolean) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onPlay?: () => void;
  onCapture?: () => void;
  captureToast?: boolean;
  onSpeedChange?: (rate: number) => void;
}) {
  const cam = CAMERAS[index];
  const [showControls, setShowControls] = useState(false);
  const [activityTick, setActivityTick] = useState(0);
  const [seekToast, setSeekToast] = useState<string | null>(null);
  const seekToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSeekToast = (text: string) => {
    setSeekToast(text);
    if (seekToastTimer.current) clearTimeout(seekToastTimer.current);
    seekToastTimer.current = setTimeout(() => setSeekToast(null), 2000);
  };
  // 배속: 0=아이콘(1배), 이후 2X→4X→16X→다시 아이콘. 되감기는 음수(-2X…), 각각 독립.
  const FWD_SPEED_LABELS = [null, "2X", "4X", "16X"];
  const BACK_SPEED_LABELS = [null, "-2X", "-4X", "-16X"];
  const SPEED_MULT = [null, 2, 4, 16];
  const [backSpeedIdx, setBackSpeedIdx] = useState(0);
  const [fwdSpeedIdx, setFwdSpeedIdx] = useState(0);
  const speedToastText = (idx: number) =>
    idx === 0 ? "기본 속도로 재생" : `${SPEED_MULT[idx]}배속으로 재생`;
  // 진입/이탈 시 배속을 기본(1)으로 동기화 — 부모의 playbackRate 잔존 방지.
  useEffect(() => {
    onSpeedChange?.(1);
    return () => onSpeedChange?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 녹화 모드 하단 탭: 카메라 목록 / 움직임 감지. 진입 시 '카메라 목록'이 기본.
  const [recTab, setRecTab] = useState<"list" | "motion">("list");
  // 레이아웃 기준은 app/components/layoutRules.ts 참고 — 단일 영상은 폭과 무관하게
  // 항상 16:9, 목록 방향은 안들이 공유하는 useListLayout 이 정한다.
  // headerPad = 목록 영역에서 타일이 못 쓰는 세로(제목 52 or 여백 24 + pb-4 16).
  // 움직임 감지 탭엔 타일 행이 없으니, 그 탭일 때 지켜야 할 최소 높이를 넘겨준다.
  const [listAreaRef, listRowRef, listWide, tileMaxH] =
    useListLayout(MOTION_MIN_H);
  // 카메라 목록 — 선택 카메라 타일을 가운데로 맞출 때 쓴다(가로면 좌우, 세로면 위아래).
  const listScrollRef = useRef<HTMLDivElement>(null);
  // 목록이 보일 때(진입·탭 전환·선택 변경·레이아웃 전환) 선택된 카메라 타일을 스크롤
  // 가운데로 맞춘다. 다채널에서 더블클릭해 단일로 들어오면 그 카메라가 가운데에 온다.
  useEffect(() => {
    const listVisible = mode === "live" || recTab === "list";
    if (!listVisible) return;
    const el = listScrollRef.current;
    if (!el) return;
    const center = () => {
      const tile = el.querySelector<HTMLElement>('[data-selected="true"]');
      if (!tile) return;
      const tr = tile.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      // 진입 직후엔 영상(16:9)·목록 높이가 아직 안 정해져 타일 폭이 0/부정확할 수 있다.
      if (tr.width === 0 || er.width === 0) return;
      if (el.scrollWidth > el.clientWidth + 1) {
        // 가로 한 줄: 좌우 가운데
        const left = tr.left - er.left + el.scrollLeft;
        el.scrollLeft = Math.max(0, left - (el.clientWidth - tr.width) / 2);
      } else if (el.scrollHeight > el.clientHeight + 1) {
        // 세로 2열: 위아래 가운데
        const top = tr.top - er.top + el.scrollTop;
        el.scrollTop = Math.max(0, top - (el.clientHeight - tr.height) / 2);
      }
    };
    // 다음 두 프레임에 걸쳐 맞추고(레이아웃/페인트 직후), 정착 중 크기 변화(영상 16:9
    // 계산·툴바 접힘 등)에도 잠깐 동안 다시 맞춘다.
    const raf1 = requestAnimationFrame(() => {
      center();
      requestAnimationFrame(center);
    });
    const ro = new ResizeObserver(center);
    ro.observe(el);
    const stop = setTimeout(() => ro.disconnect(), 1200);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(stop);
      ro.disconnect();
    };
  }, [index, mode, recTab, listWide]);
  // 실시간↔녹화 전환 시 되감기/빨리감기 배속을 0배(기본)로 원복.
  // ExpandedView는 모드가 바뀌어도 언마운트되지 않아 배속 인덱스가 남으므로 명시적으로 리셋.
  useEffect(() => {
    setBackSpeedIdx(0);
    setFwdSpeedIdx(0);
    onSpeedChange?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipedRef = useRef(false);

  const handleVideoClick = () => {
    if (swipedRef.current) return;
    if (clickTimerRef.current !== null) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onBack();
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      setShowControls((prev) => !prev);
    }, 230);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = swipeRef.current;
    if (!start) return;
    swipeRef.current = null;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) < 50 || Math.abs(dy) > 60 || dt > 600) return;
    swipedRef.current = true;
    setTimeout(() => {
      swipedRef.current = false;
    }, 350);
    setActivityTick((t) => t + 1);
    if (dx < 0) {
      if (index < CAMERAS.length - 1) onSelect(index + 1);
    } else {
      if (index > 0) onSelect(index - 1);
    }
  };

  useEffect(() => {
    if (!showControls) return;
    const t = setTimeout(() => setShowControls(false), 5000);
    return () => clearTimeout(t);
  }, [showControls, activityTick]);

  // 녹화 모드의 헤더 시간 라벨은 playbackMs(=사용자가 선택/스크럽한 시점) 기준이어야 함.
  // 라이브 모드는 현재 시간(dateLabel) 그대로 사용.
  const recordingDateLabel = playbackMs !== null
    ? (() => {
        const d = new Date(playbackMs);
        return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.(${WEEKDAYS[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      })()
    : dateLabel;

  const MAX_DOTS = 7;
  const totalDots = CAMERAS.length;
  const dotSizeByAbsOffset = [6, 5, 4, 3, 2];
  const desiredOffsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const visibleOffsets: number[] = desiredOffsets.filter(
    (o) => index + o >= 0 && index + o < totalDots,
  );
  while (visibleOffsets.length > MAX_DOTS) {
    if (
      Math.abs(visibleOffsets[0]) >=
      Math.abs(visibleOffsets[visibleOffsets.length - 1])
    ) {
      visibleOffsets.shift();
    } else {
      visibleOffsets.pop();
    }
  }
  return (
    <>
      {/* 확대뷰 헤더 — 다채널 화면과 동일. 녹화 모드에서도 항상 표시 */}
      <header
        className="flex flex-none items-center px-5"
        style={{ height: "56px", marginTop: chromeVisible ? "16px" : "0px" }}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-[2px]">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-[18px] font-bold leading-none text-neutral-900"
            >
              8층 사무실 A
              <ChevronDownIcon className="h-6 w-6 text-[#262626]" />
            </button>
            <p
              className="text-[12px] leading-none"
              style={{ color: "#BFBFBF" }}
            >
              에스원 본사 · N1234567
            </p>
          </div>

          <ModeToggle mode={mode} setMode={setMode} />
        </div>
      </header>

      {/* 큰 영상 — 더블클릭 시 다채널로 복귀. 폭과 무관하게 항상 정확히 16:9.
          크기 규칙은 globals.css 의 .single-video-area/.single-video-box 에 있다:
          넓은 화면에선 16:9 를 넘어 늘어나지 않고, 짧은 화면에선 비율을 지킨 채
          줄어든다(좌우에 검은 여백). */}
      <div className="single-video-area px-0">
        <div
          className="single-video-box relative cursor-pointer touch-pan-y select-none overflow-hidden bg-neutral-900"
          onClick={handleVideoClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div
            className="absolute inset-0 flex transition-transform duration-300 ease-out"
            style={{
              width: `${CAMERAS.length * 100}%`,
              transform: `translateX(-${index * (100 / CAMERAS.length)}%)`,
            }}
          >
            {CAMERAS.map((c, i) => (
              <div
                key={i}
                className="relative h-full overflow-hidden"
                style={{ width: `${100 / CAMERAS.length}%`, flexShrink: 0 }}
              >
                <ExpandedSlide
                  c={c}
                  paused={(isScrubbing || !isPlaying) && mode === "recording"}
                  playbackMs={playbackMs}
                  driveByPlayback={
                    mode === "recording" && (isScrubbing || !isPlaying)
                  }
                />
              </div>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
            style={{ opacity: showControls ? 1 : 0 }}
          >
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: "33%",
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "33%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div
              className="absolute flex items-center"
              style={{
                top: "12px",
                right: "12px",
                gap: "12px",
                pointerEvents: showControls ? "auto" : "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" aria-label="목록" onClick={onOpenSheet}>
                <img
                  src={`${BASE}/ic_list_gallery.svg`}
                  alt=""
                  className="h-8 w-8"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </button>
              <button type="button" aria-label="회전">
                <img src={`${BASE}/nav/rotate.svg`} alt="" className="h-8 w-8" />
              </button>
              <button type="button" aria-label="더보기">
                <img
                  src={`${BASE}/nav/etc.svg`}
                  alt=""
                  className="h-8 w-8"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </button>
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center rounded-full"
              style={{
                bottom: "12px",
                backgroundColor: "rgba(0,0,0,0.55)",
                padding: "8px 14px",
                gap: "8px",
              }}
            >
              {visibleOffsets.map((offset) => {
                const camIdx = index + offset;
                const size =
                  dotSizeByAbsOffset[
                    Math.min(Math.abs(offset), dotSizeByAbsOffset.length - 1)
                  ];
                const isActive = offset === 0;
                return (
                  <span
                    key={camIdx}
                    className="rounded-full transition-all duration-200 ease-out"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: isActive
                        ? "#ffffff"
                        : "rgba(255,255,255,0.4)",
                    }}
                  />
                );
              })}
            </div>
          </div>
          <VideoSkeleton visible={videoLoading} />
          {seekToast && (
            <div
              key={seekToast}
              className="toast-slide-up pointer-events-none absolute left-1/2 z-20 flex items-center justify-center"
              style={{
                bottom: "20px",
                transform: "translateX(-50%)",
                height: "32px",
                padding: "0 16px",
                borderRadius: "32px",
                backgroundColor: "rgba(34, 34, 34, 0.9)",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500 }}
              >
                {seekToast}
              </span>
            </div>
          )}
          {/* 화면 캡처 토스트 — 영상 영역 하단에서 20px 위(토스트 공통 규칙). */}
          {captureToast && (
            <div
              className="toast-slide-up pointer-events-none absolute left-1/2 z-20 flex items-center justify-center"
              style={{
                bottom: "20px",
                transform: "translateX(-50%)",
                width: "320px",
                height: "48px",
                borderRadius: "48px",
                backgroundColor: "rgba(34, 34, 34, 0.9)",
              }}
            >
              <span
                style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500 }}
              >
                현재 화면이 캡처 되었어요
              </span>
            </div>
          )}
        </div>
      </div>

      {/* LIVE / 녹화 / 날짜 / 카메라 아이콘 — 크기가 변해도 높이 고정(눌리지 않음). */}
      <div
        className="relative flex flex-none items-center px-5"
        style={{ height: "44px" }}
      >
        {mode === "recording" ? (
          <RecBadge onClick={onToggleChrome} />
        ) : (
          <LiveBadge onClick={onToggleChrome} />
        )}
        {mode === "recording" ? (
          <button
            type="button"
            onClick={onOpenDateTime}
            className="ml-2 flex items-center gap-0 text-[14px] font-medium leading-none text-[#353535]"
          >
            <span suppressHydrationWarning>{recordingDateLabel}</span>
            <ChevronDownIcon className="h-6 w-6 text-[#262626]" />
          </button>
        ) : (
          <span
            suppressHydrationWarning
            className="ml-2 text-[14px] font-medium leading-none text-[#353535]"
          >
            {dateLabel}
          </span>
        )}
        <button
          type="button"
          onClick={onCapture}
          className="ml-auto flex h-[28px] w-[28px] items-center justify-center rounded-full border border-neutral-300"
        >
          <img src={`${BASE}/camera.svg`} alt="카메라" className="h-6 w-6" />
        </button>
        <RowSkeleton visible={videoLoading} />
      </div>

      <div
        className="h-px"
        style={{ backgroundColor: "#DBDBDB" }}
      />

      {/* 녹화 모드일 때 플레이어 버튼 — 시간바(타임라인) 위 */}
      {mode === "recording" && (
        <>
          <div
            className="flex flex-none items-center justify-center"
            style={{
              gap: "20px",
              padding: "8px 0",
              backgroundColor: "#FFFFFF",
            }}
          >
            <PlayerButton
              kind="skip-back"
              label={BACK_SPEED_LABELS[backSpeedIdx]}
              onClick={() => {
                const next = (backSpeedIdx + 1) % BACK_SPEED_LABELS.length;
                setBackSpeedIdx(next);
                setFwdSpeedIdx(0);
                onSpeedChange?.(next === 0 ? 1 : -SPEED_MULT[next]!);
                onPlay?.();
                showSeekToast(speedToastText(next));
              }}
            />
            <PlayerButton
              kind="back10"
              onClick={() => {
                setPlaybackMs((p) => (p === null ? p : p - 10000));
                onPlay?.();
                showSeekToast("10초 전으로 이동");
              }}
            />
            <PlayerButton
              kind={isPlaying ? "pause" : "play"}
              onClick={onTogglePlay}
              held={!isPlaying}
            />
            <PlayerButton
              kind="forward10"
              onClick={() => {
                setPlaybackMs((p) => (p === null ? p : p + 10000));
                onPlay?.();
                showSeekToast("10초 후로 이동");
              }}
            />
            <PlayerButton
              kind="skip-forward"
              label={FWD_SPEED_LABELS[fwdSpeedIdx]}
              onClick={() => {
                const next = (fwdSpeedIdx + 1) % FWD_SPEED_LABELS.length;
                setFwdSpeedIdx(next);
                setBackSpeedIdx(0);
                onSpeedChange?.(next === 0 ? 1 : SPEED_MULT[next]!);
                onPlay?.();
                showSeekToast(speedToastText(next));
              }}
            />
          </div>
          <div className="h-px" style={{ backgroundColor: "#DBDBDB" }} />
        </>
      )}

      {/* 녹화 모드 하단 탭: 카메라 목록 / 움직임 감지 — 플레이어 버튼(5개) 아래. */}
      {mode === "recording" && (
        <>
          <div className="flex items-center px-5" style={{ gap: "20px" }}>
            {([
              { key: "list", label: "카메라 목록" },
              { key: "motion", label: "움직임 감지" },
            ] as const).map((t) => {
              const active = recTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setRecTab(t.key)}
                  className="relative text-[15px] font-bold leading-none"
                  style={{
                    padding: "14px 0",
                    color: active ? "#1D6CEB" : "#A6A6A6",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="h-px" style={{ backgroundColor: "#DBDBDB" }} />
        </>
      )}

      {/* 카메라 목록 OR 녹화 이벤트 타임라인. 두 탭 모두 남는 공간을 채우는 영역(flex-1)
          이라, 탭을 바꿔도 위(영상·날짜·버튼·탭) 위치가 안 움직인다. 최소 높이는
          useListLayout 이 배치에 따라 잡는다 — 가로 한 줄이면 타일 세로 기준
          (TILE_MIN_H), 세로 2열이면 영역 기준(LIST_MIN_H). layoutRules.ts 참고. */}
      <div
        ref={listAreaRef}
        className="relative flex min-h-0 flex-col flex-1"
      >
      {mode === "recording" && recTab === "motion" ? (
        <RecordingEventTimeline
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          cameraSrc={cam.src}
          onScrubbingChange={onScrubbingChange}
        />
      ) : (
      <div
        ref={listWide ? undefined : listScrollRef}
        className={
          listWide
            ? "flex min-h-0 flex-1 flex-col pb-3"
            : "flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >

        {/* 가로(620+): 한 줄 가로 스크롤(carousel), 타일 = 16:9(높이 = 영역 높이).
            세로(~619): 2열 그리드(세로 스크롤), 타일 = 16:9(폭 = (영역폭−갭)/2).
            좌우 여백(px-5)은 스크롤 안쪽 패딩이라 첫/마지막만 20px 띄운다. */}
        <div
          ref={(el) => {
            listRowRef.current = el;
            if (listWide) listScrollRef.current = el;
          }}
          className={
            listWide
              ? "flex min-h-0 flex-1 gap-2 px-5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "grid grid-cols-2 gap-2 px-5"
          }
          style={{ marginTop: "12px" }}
        >
          {CAMERAS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              data-selected={i === index ? "true" : undefined}
              className={
                listWide
                  ? "relative h-full aspect-video flex-none overflow-hidden bg-neutral-900"
                  : "relative aspect-video overflow-hidden bg-neutral-900"
              }
              style={{
                borderRadius: "4px",
                // 가로 한 줄: LIST_MIN_VISIBLE 개는 보이도록 타일 크기 상한(훅이 계산).
                ...(listWide && tileMaxH ? { maxHeight: `${tileMaxH}px` } : null),
              }}
            >
              <FrozenImage
                src={c.src}
                alt={c.label}
                className="absolute inset-0 h-full w-full"
                style={
                  c.zoom
                    ? {
                        transform: `scale(${c.zoom})`,
                        objectFit: "cover",
                      }
                    : { objectFit: "cover" }
                }
              />
              <div
                className="absolute inline-flex items-center bg-black/55 text-[10px] font-medium leading-none text-white"
                style={{
                  top: "4px",
                  left: "4px",
                  height: "17px",
                  padding: "0 4px",
                  borderRadius: "2px",
                }}
              >
                {c.label}
              </div>
              {i === index && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      boxShadow: "inset 0 0 0 2px #1D6CEB",
                      borderRadius: "4px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={`${BASE}/nav/playing.gif`}
                      alt="재생 중"
                      className="h-6 w-6"
                    />
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
      )}
      <CameraListSkeleton visible={videoLoading} />
      </div>
    </>
  );
}

// 시간대별 상대 활동량(0~23시) — 클수록 이벤트가 촘촘하다. 심야 한산, 출퇴근·저녁 붐빔.
const HOURLY_ACTIVITY = [
  3, 2, 2, 2, 2, 3, // 0-5시 심야
  5, 8, 9, 8, 7, 7, // 6-11시 오전
  8, 7, 7, 7, 8, 9, // 12-17시 오후
  10, 9, 8, 6, 5, 4, // 18-23시 저녁
];

// 시드 기반 PRNG — 매 렌더마다 동일한 랜덤 분포 보장
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 가상 이벤트 — 자정부터 하루를 연속으로 걸으며 '묶음' 단위로 배치한다.
// at: 자정 기준 초 오프셋, dur: 영상 길이(초). dur 로 타임라인 막대 길이를 그린다.
//
// 설계 의도(두 가지를 동시에 만족):
//  1) 빽빽한 리본 — 활동 시간대 평균 ~16~24초 간격이라 기본 줌에서도 화면이 썸네일로 찬다.
//  2) 상식적인 겹침 — 한 묶음은 1개(78%)·2개(18%)·3개(4%)뿐이고, 멤버는 4~8초 간격.
//     다음 묶음은 마지막 멤버에서 최소 16초 떨어뜨려 '격리'하므로 묶음끼리는 절대 붙지 않는다
//     → 같은 1초에 떼박히거나 4개 이상 겹치는 비상식적 분포가 구조적으로 불가능.
const TIMELINE_EVENTS = (() => {
  const rng = mulberry32(20260529);
  const arr: { at: number; dur: number }[] = [];
  let t = 0;
  while (t < 86400) {
    const h = Math.min(23, Math.floor(t / 3600));
    // 활동량이 높을수록 평균 간격이 짧다(12초) ~ 한산할수록 길다(30초). 하루 ~4900건.
    const meanGap = 12 + (30 - 12) * (1 - (HOURLY_ACTIVITY[h] - 2) / 8);
    const r = rng();
    const size = r < 0.78 ? 1 : r < 0.96 ? 2 : 3; // 묶음 크기
    let last = t;
    arr.push({ at: Math.round(t), dur: 4 + Math.floor(rng() * 12) }); // 4~15초
    for (let k = 1; k < size; k++) {
      last += 4 + Math.floor(rng() * 5); // 묶음 내 멤버 간 4~8초
      arr.push({ at: Math.round(last), dur: 4 + Math.floor(rng() * 12) });
    }
    // 다음 묶음 시작 — 마지막 멤버에서 ≥16초 떨어뜨려 묶음을 격리.
    t = last + Math.max(16, Math.round(meanGap * (0.5 + rng())));
  }
  return arr.sort((a, b) => a.at - b.at);
})();

// ── 가로 움직임-감지 타임라인 ────────────────────────────────────────────
// 오른쪽 = 최신, 왼쪽 = 과거. 시간 축을 X 로 잡고, 움직임 이벤트 썸네일 카드는
// 트랙(회색 가로선) '아래쪽'에 가로로 나열한다. 카드가 겹치면 묶어 개수 배지로
// 표시하고, 탭하면 오른쪽(최신 방향)으로 부채처럼 펼친다(아코디언). 파란 세로선이
// 화면 가운데(현재 시각)에 고정되고, 콘텐츠가 translateX 로 흐른다.
function RecordingEventTimeline({
  playbackMs,
  setPlaybackMs,
  cameraSrc,
  onScrubbingChange,
}: {
  playbackMs: number | null;
  setPlaybackMs: (
    v: number | null | ((prev: number | null) => number | null),
  ) => void;
  cameraSrc: string;
  onScrubbingChange?: (s: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 썸네일 영역(시간바 아래 남는 공간). 이 높이에 맞춰 썸네일 세로 크기를 유동
  // 조절한다(화면이 짧아지면 잘리지 않게 줄인다). 최대 72(원본), 폭은 16:9 로 연동.
  const thumbAreaRef = useRef<HTMLDivElement>(null);
  const [thumbH, setThumbH] = useState(THUMB_MAX_H);
  const updateThumbH = () => {
    const el = thumbAreaRef.current;
    if (!el || el.clientHeight <= 0) return;
    // 남는 영역 높이에서 상하 여백(위 4 + 아래 PAD_TOP)을 뺀 값. 일반 48 로 캡.
    const avail = el.clientHeight - (4 + PAD_TOP);
    setThumbH(Math.max(THUMB_MIN_H, Math.min(THUMB_MAX_H, Math.round(avail))));
  };
  // 매 렌더 뒤 재계산 — 기기 폭/높이 전환처럼 ResizeObserver 만으로는 놓치는 경우가
  // 있어서(관측 노드 교체·콜백 누락) 렌더 기준으로도 한 번 더 맞춘다. 값이 같으면
  // setState 가 리렌더를 만들지 않으므로 루프가 되지 않는다.
  useEffect(() => {
    updateThumbH();
  });
  useEffect(() => {
    const el = thumbAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateThumbH());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 줌 레벨: 픽셀/초 — 기본 5px/sec(눈금·시간 간격을 조금 더 촘촘하게). 핀치/휠로 조정.
  const [pxPerSec, setPxPerSec] = useState(5);
  // 펼쳐진 이벤트 클러스터 (클러스터 첫 이벤트 key 기준)
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleCluster = (key: string) =>
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; ms: number } | null>(null);
  // 탭 판정용 — 카드 위에서 시작해도 드래그는 통과시키고, 거의 안 움직이면 탭으로 처리
  const tapRef = useRef<{ x: number; y: number; t: number; moved: boolean } | null>(
    null,
  );
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; pxPerSec: number } | null>(
    null,
  );

  // 썸네일 탭 정렬: 펼친 멤버는 gap 안에 쌓여 어떤 재생시각으로도 라인에 못 맞춘다.
  // 선택 순간 그 카드 상단이 라인에 딱 닿도록 컨텐츠를 추가로 밀어두는 '정렬 오프셋'.
  // 이 오프셋을 유지한 채 playbackMs(=선택 시각)부터 시간이 흐르므로 되돌아가는 미끄러짐 없이
  // 선택 지점에서 자연스럽게 흘러간다. 새로 드래그(스크럽)를 시작하면 실제 시각축으로 되돌린다.
  const [alignOffset, setAlignOffset] = useState(0);
  // 썸네일 선택 시 라인까지 '띡' 점프하지 않고 부드럽게 미끄러져 가도록, 잠깐만 transform에
  // transition을 건다. 시간 흐름(50ms 틱)·드래그가 시작되면 즉시 끈다.
  const [animateScroll, setAnimateScroll] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 펼친 클러스터에서 라인에 정렬해 '선택'한 멤버(occ.key). 같은 멤버를 다시 탭하면 접는다.
  const [selectedOccKey, setSelectedOccKey] = useState<string | null>(null);

  // 가로 타임라인과 동일: ±2시간(VISIBLE_MINUTES) 윈도우
  const VISIBLE_MINUTES = TIMELINE_VISIBLE_MIN;

  // 라벨 최소 세로 간격 = 50px(눈금·시간 간격을 조금 더 촘촘하게). 최소 라벨 간격 5초.
  const niceSeconds = [5, 10, 30, 60, 300, 600, 1800];
  const labelIntervalSec =
    niceSeconds.find((s) => s * pxPerSec >= 50) ?? 3600;

  // anchor: 라벨 영역의 기준 시각. 초기에는 playbackMs(분 단위 스냅),
  // playbackMs가 ±VISIBLE_MINUTES/2를 크게 벗어나면 재정렬.
  const [anchor, setAnchor] = useState<number | null>(null);
  useEffect(() => {
    if (playbackMs === null) return;
    setAnchor((prev) => {
      if (prev === null) {
        const a = new Date(playbackMs);
        a.setSeconds(0, 0);
        return a.getTime();
      }
      if (Math.abs(playbackMs - prev) > (VISIBLE_MINUTES / 2) * 60 * 1000) {
        const a = new Date(playbackMs);
        a.setSeconds(0, 0);
        return a.getTime();
      }
      return prev;
    });
  }, [playbackMs, VISIBLE_MINUTES]);

  // 재생 시점이 ±VISIBLE_MINUTES 범위를 넘지 않도록 클램프
  const clampMs = (ms: number) => {
    if (anchor === null) return ms;
    const minMs = anchor - VISIBLE_MINUTES * 60 * 1000;
    const maxMs = anchor + VISIBLE_MINUTES * 60 * 1000;
    return Math.max(minMs, Math.min(maxMs, ms));
  };

  // 라벨 (labelIntervalSec 단위) — anchor 기준 ±VISIBLE_MINUTES
  const totalSpanSec = VISIBLE_MINUTES * 60;
  const labelStepCount = Math.ceil(totalSpanSec / labelIntervalSec);
  const labels = anchor
    ? Array.from({ length: labelStepCount * 2 + 1 }, (_, i) => {
        const secOffset = (i - labelStepCount) * labelIntervalSec;
        const t = new Date(anchor + secOffset * 1000);
        const text =
          labelIntervalSec >= 60
            ? `${pad(t.getHours())}:${pad(t.getMinutes())}`
            : `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
        return { text, secOffset };
      })
    : [];

  // 이벤트 — anchor 기준 ±VISIBLE_MINUTES 범위에 들어오는 occurrence 만 렌더.
  // 매일 반복되므로 anchor 날짜 ±1일 내에서 검색.
  // key는 (day, eventIndex) 조합으로 항상 고유 (같은 초가 중복돼도 인덱스가 다름)
  const eventOccurrences: {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
  }[] = [];
  if (anchor !== null) {
    const anchorDay = new Date(anchor);
    anchorDay.setHours(0, 0, 0, 0);
    const windowSec = VISIBLE_MINUTES * 60 + 120; // 약간의 여유
    for (const dayOffset of [-1, 0, 1]) {
      const dayStart = anchorDay.getTime() + dayOffset * 86400000;
      for (let i = 0; i < TIMELINE_EVENTS.length; i++) {
        const ev = TIMELINE_EVENTS[i];
        const eventMs = dayStart + ev.at * 1000;
        const secOffset = (eventMs - anchor) / 1000;
        if (Math.abs(secOffset) <= windowSec) {
          eventOccurrences.push({
            key: `${dayStart}-${i}`,
            ms: eventMs,
            secOffset,
            durSec: ev.dur,
          });
        }
      }
    }
  }

  // 이벤트 클러스터링 — 픽셀 거리가 카드 폭보다 가까우면 묶음(가로로 겹침).
  // 펼치면 COL_W 간격으로 나열되며, 늘어난 폭만큼 오른쪽(최신) 컨텐츠를 밀어낸다(아코디언).
  const thumbW = Math.round((thumbH * 16) / 9); // 썸네일 폭(16:9, 세로 크기에 연동)
  const CARD_W = thumbW; // 이 간격보다 가까운 이벤트는 한 자리로 묶는다.
  const COL_W = thumbW + 12; // (미사용) 멤버 간 가로 간격.
  type Occ = { key: string; ms: number; secOffset: number; durSec: number };
  const clusters: {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
    members: Occ[];
  }[] = [];
  for (const occ of eventOccurrences) {
    const last = clusters[clusters.length - 1];
    if (last && (occ.secOffset - last.secOffset) * pxPerSec < CARD_W) {
      last.members.push(occ);
    } else {
      clusters.push({ ...occ, members: [occ] });
    }
  }
  // 펼쳐진 클러스터들이 삽입하는 추가 폭 (secOffset 오름차순)
  const expandedGaps = clusters
    .filter((c) => c.members.length > 1 && expandedClusters.has(c.key))
    .map((c) => ({ at: c.secOffset, gap: (c.members.length - 1) * COL_W }))
    .sort((a, b) => a.at - b.at);
  const totalGap = expandedGaps.reduce((s, g) => s + g.gap, 0);
  // 오른쪽=최신, 왼쪽=과거. 컨텐츠 x = +secOffset*pxPerSec.
  // 펼쳐진 클러스터는 오른쪽(최신)으로 멤버를 나열하므로, 그보다 최신(secOffset 큰)
  // 항목들을 오른쪽으로 밀어낸다 → gap은 g.at < secOffset 일 때 누적.
  const gapBefore = (secOffset: number) =>
    expandedGaps.reduce((s, g) => s + (g.at < secOffset ? g.gap : 0), 0);
  const xOf = (secOffset: number) => secOffset * pxPerSec + gapBefore(secOffset);

  // 드래그 + 핀치 줌
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (playbackMs === null) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}
    if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        distance: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        pxPerSec,
      };
      isDraggingRef.current = false;
      dragStartRef.current = null;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, ms: playbackMs };
      tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false };
      onScrubbingChange?.(true);
    }
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const newDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const scale = newDist / pinchStartRef.current.distance;
      setPxPerSec(
        Math.max(0.05, Math.min(30, pinchStartRef.current.pxPerSec * scale)),
      );
    } else if (
      isDraggingRef.current &&
      dragStartRef.current &&
      pointersRef.current.size === 1
    ) {
      const dx = e.clientX - dragStartRef.current.x;
      if (tapRef.current && !tapRef.current.moved) {
        const moveDist = Math.hypot(
          e.clientX - tapRef.current.x,
          e.clientY - tapRef.current.y,
        );
        if (moveDist > 8) {
          tapRef.current.moved = true;
          // 스크럽이 시작되면 선택 애니메이션 transition을 즉시 꺼 또렷하게 따라오게 한다.
          if (animTimerRef.current) {
            clearTimeout(animTimerRef.current);
            animTimerRef.current = null;
          }
          setAnimateScroll(false);
          // 스크럽 시작 — 멤버 정렬로 생긴 오프셋을 재생시각에 흡수해 실제 시각축으로 되돌린다.
          // (화면 위치는 그대로 두고 시각만 보정하므로 튐 없이 자연스러운 스크럽으로 이어진다.)
          if (alignOffset !== 0) {
            dragStartRef.current.ms -= (alignOffset / pxPerSec) * 1000;
            setAlignOffset(0);
          }
        }
      }
      // 오른쪽=최신/왼쪽=과거. 컨텐츠가 손가락을 따라가도록: 오른쪽으로 드래그 →
      // 과거로(ms 감소), 왼쪽으로 드래그 → 최신으로. ±VISIBLE_MINUTES 클램프.
      setPlaybackMs(clampMs(dragStartRef.current.ms - (dx / pxPerSec) * 1000));
    }
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 0) {
      // 거의 안 움직이고 짧게 눌렀다 떼면 탭 — 그 지점의 카드를 선택해 그 시각으로 이동.
      // elementFromPoint는 카드 위를 덮는 canvas 오버레이를 집으므로, 카드 사각형을
      // 직접 히트테스트한다(겹치면 탭 지점에 가장 가까운 카드 선택).
      const tap = tapRef.current;
      if (tap && !tap.moved && Date.now() - tap.t < 350) {
        const cards = containerRef.current?.querySelectorAll<HTMLElement>(
          "[data-event-ms]",
        );
        let target: HTMLElement | undefined;
        let best = Infinity;
        cards?.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (
            tap.x >= rect.left &&
            tap.x <= rect.right &&
            tap.y >= rect.top &&
            tap.y <= rect.bottom
          ) {
            const dist = Math.abs(tap.x - (rect.left + rect.right) / 2);
            if (dist < best) {
              best = dist;
              target = el;
            }
          }
        });
        if (target && playbackMs !== null && target.dataset.eventMs) {
          // 선택한 썸네일 시각으로 이동(그 카드가 중앙 파란선에 온다).
          const ms = Number(target.dataset.eventMs);
          setPlaybackMs(clampMs(ms));
          // 선택 지점까지 부드럽게 이동(약 320ms) 후 transition 해제.
          setAnimateScroll(true);
          if (animTimerRef.current) clearTimeout(animTimerRef.current);
          animTimerRef.current = setTimeout(() => setAnimateScroll(false), 340);
        }
      }
      tapRef.current = null;
      if (isDraggingRef.current) onScrubbingChange?.(false);
      isDraggingRef.current = false;
      dragStartRef.current = null;
    }
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  };
  // 휠/트랙패드 핀치 줌 — React onWheel은 passive라 preventDefault가 안 먹으므로
  // non-passive 네이티브 리스너로 직접 등록해 브라우저 페이지 줌을 막는다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setPxPerSec((p) =>
        Math.max(0.05, Math.min(30, p * Math.exp(-e.deltaY * 0.003))),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // anchor 기준 현재 재생 시각의 offset (초) → 컨텐츠 x
  const playbackOffsetSec =
    playbackMs !== null && anchor !== null
      ? (playbackMs - anchor) / 1000
      : 0;
  // 파란 세로선(현재 시각)의 컨텐츠 x — 펼쳐진 클러스터만큼(gapBefore) 반영해 라벨
  // 격자와 파란 선이 어긋나지 않게 한다. 레일을 -playbackX 만큼 밀어 playback 을
  // 화면 가운데(50%)에 고정한다. alignOffset 은 탭으로 카드를 선에 붙인 오프셋.
  const playbackX = xOf(playbackOffsetSec);
  const railTransform = `translateX(${-playbackX + alignOffset}px)`;

  // 눈금(subInterval) — 녹화 시간바와 동일. 라벨 사이를 10등분한 간격의 눈금(대/소).
  const subIntervalSec = Math.max(1, Math.round(labelIntervalSec / 10));
  const subStepCount = Math.ceil(totalSpanSec / subIntervalSec);
  const ticks = anchor
    ? Array.from({ length: subStepCount * 2 + 1 }, (_, i) => {
        const secOffset = (i - subStepCount) * subIntervalSec;
        const isMajor = secOffset % labelIntervalSec === 0;
        return { secOffset, isMajor };
      })
    : [];
  // 중앙(현재 시각)에 가까운 라벨일수록 작아지고 사라짐 — 다채널 RecordingControls
  // 시간바와 동일. (라벨/눈금은 썸네일과 '다른 레일'에 있고 컬링으로 개수도 적어,
  // 매 틱 재계산해도 가볍다. 썸네일 레일은 정적이라 부드럽게 흐른다.)
  const labelVisualStyle = (secOffset: number) => {
    const distPx = Math.abs((secOffset - playbackOffsetSec) * pxPerSec);
    const HIDE = 28;
    const FULL = 56;
    const t = Math.max(0, Math.min(1, (distPx - HIDE) / (FULL - HIDE)));
    return {
      opacity: t,
      transform: `translateX(-50%) scale(${0.6 + 0.4 * t})`,
    };
  };

  // 레이아웃(px) — 다채널 RecordingControls 시간바 블록과 완전히 동일한 치수로
  // 시간바(라벨+눈금)를 그리고, 그 아래에 썸네일만 별도 레일로 붙인다.
  const PAD_TOP = 12; // 시간바 위 여백(다채널과 동일)
  const PAD_BOTTOM = 4; // 시간바 아래 여백. 삼각형 제거로 줄여 썸네일을 위로 붙인다.
  const RAIL_H = 28; // 라벨+눈금 영역 높이. 눈금 아래 빈 공간 줄여 썸네일을 위로.
  const BAR_H = PAD_TOP + RAIL_H + PAD_BOTTOM; // 시간바 블록 전체 높이(=62)
  const CARD_TOP = 8; // 썸네일 레일 기준 카드 윗변(시간바 바로 아래 약간 띄움)

  const currentTimeLabel = playbackMs
    ? (() => {
        const d = new Date(playbackMs);
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      })()
    : "00:00:00";

  const railTransition = animateScroll
    ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"
    : isDraggingRef.current
      ? "none"
      : "transform 260ms linear";

  // 성능: 라벨·눈금·카드는 ±2시간 전체가 아니라 '화면에 보이는 범위'만 렌더한다.
  // (안 그러면 눈금 수천 개 + 썸네일 수백 개를 매 틱 리렌더해 렉이 걸린다.) 중심(현재
  // 시각)에서 화면 반폭(px)/pxPerSec 초 + 여유만큼만 그린다. 레일은 매 틱 재계산되므로
  // 스크롤해도 항상 중심 부근만 유지된다.
  const cullSec = 700 / pxPerSec + 90;
  const inView = (secOffset: number) =>
    Math.abs(secOffset - playbackOffsetSec) <= cullSec;

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden touch-none select-none"
      style={{ backgroundColor: "#FFFFFF", cursor: "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── 시간바(다채널 RecordingControls 와 동일한 마크업·치수) ── */}
      <div
        className="relative flex-none overflow-hidden"
        style={{ height: `${BAR_H}px`, paddingTop: `${PAD_TOP}px` }}
      >
        {/* 스크롤 레일 (라벨 + 눈금) — 다채널과 동일 */}
        <div
          className="relative"
          style={{
            height: `${RAIL_H}px`,
            transform: railTransform,
            transition: railTransition,
          }}
        >
          {/* 라벨 — 중앙 근처 페이드(다채널과 동일). 화면에 보이는 범위만 렌더. */}
          {labels.filter(({ secOffset }) => inView(secOffset)).map(({ text, secOffset }) => (
            <span
              key={`L${secOffset}`}
              suppressHydrationWarning
              className="pointer-events-none absolute whitespace-nowrap"
              style={{
                left: `calc(50% + ${xOf(secOffset)}px)`,
                top: "0",
                color: "#A4A4A4",
                transformOrigin: "center center",
                ...labelVisualStyle(secOffset),
                fontSize: "10px",
                fontWeight: 500,
                lineHeight: "10px",
              }}
            >
              {text}
            </span>
          ))}
          {/* 눈금 (대/소) — 화면에 보이는 범위만 렌더(수천 개 방지). */}
          {ticks.filter(({ secOffset }) => inView(secOffset)).map(({ secOffset, isMajor }) => (
            <div
              key={`T${secOffset}`}
              className="pointer-events-none absolute rounded-[1px]"
              style={{
                left: `calc(50% + ${xOf(secOffset)}px)`,
                // 대/소 눈금 길이를 짧은 것(8px)으로 통일. 소 눈금 색만 밝은 그레이.
                // 라벨(top 0~10)과 눈금 사이 간격을 좁히려 top 26→18.
                top: "18px",
                width: "2px",
                height: "8px",
                backgroundColor: isMajor ? "#797979" : "#C4C4C4",
              }}
            />
          ))}
        </div>
        {/* 좌우 페이드(다채널과 동일 — 블록 전체 높이) */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: 0,
            top: 0,
            bottom: 0,
            width: "39%",
            background:
              "linear-gradient(to left, rgba(255,255,255,0) 0%, #FFFFFF 89.9%)",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            right: 0,
            top: 0,
            bottom: 0,
            width: "39%",
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, #FFFFFF 89.9%)",
          }}
        />
        {/* 중앙 고정 현재 시각 라벨(다채널과 동일 — 다크) */}
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
          style={{ top: "10px", lineHeight: 0 }}
        >
          <span
            suppressHydrationWarning
            style={{
              display: "inline-block",
              color: "#353535",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: "12px",
              padding: "0 6px",
              verticalAlign: "top",
            }}
          >
            {currentTimeLabel}
          </span>
        </div>
        {/* 중앙 고정 현재 시각 선 — 눈금(8px)보다 살짝 길고 검정. 세모 대신 현재 시각 표시.
            눈금은 top 18(+PAD_TOP 12 = 30)~38, 이 선은 27~41 로 위아래 살짝 더 길다. */}
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-[1px]"
          style={{
            top: "27px",
            width: "2px",
            height: "14px",
            backgroundColor: "#111111",
          }}
        />
      </div>

      {/* ── 썸네일 영역(시간바 아래 남는 세로 공간). 카드 높이는 CSS min(60px,100%)
          라 이 영역보다 절대 커지지 않는다(짧은 화면에서도 잘리지 않고 줄어든다). ── */}
      <div ref={thumbAreaRef} className="relative min-h-0 flex-1">
        {/* 레일 — 영역 전체 높이(top0 bottom0)를 갖고 시간바와 같은 translateX 로 흐른다 */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: 0,
            bottom: 0,
            transform: railTransform,
            transition: railTransition,
          }}
        >
          {/* 움직임 이벤트 썸네일 — 위치마다 단일 카드 하나만(겹침·묶음·개수배지 없음).
              가까운 이벤트는 클러스터로 묶여 한 자리에 대표 1개만 나온다. 탭하면 그 시각으로 이동. */}
          {clusters.filter((c) => inView(c.secOffset)).map((cluster) => (
            <div
              key={`E${cluster.key}`}
              data-event-ms={cluster.ms}
              className="absolute flex items-start"
              style={{
                left: `calc(50% + ${xOf(cluster.secOffset)}px)`,
                top: "4px",
                // 아래 여백은 시간바 위 여백(PAD_TOP 12)과 같게 — 세로가 빡빡한
                // 실기기에서 위는 12, 아래는 4로 붙어 보이던 걸 맞춘 값이다.
                bottom: `${PAD_TOP}px`,
                transform: "translateX(-50%)",
                // 카드 위에서도 드래그가 통과하도록 stopPropagation 하지 않음.
                pointerEvents: "auto",
                cursor: "pointer",
              }}
            >
              <div
                className="overflow-hidden rounded-md bg-neutral-900"
                style={{
                  // 높이는 thumbH 하나만 본다 — 예전엔 CSS min(48px,100%) 로
                  // 따로 정해서 폭 계산(thumbW)의 근거인 thumbH 와 어긋날 수
                  // 있었다(THUMB_MIN_H 가 실제 높이엔 안 걸렸음).
                  height: `${thumbH}px`,
                  aspectRatio: "16 / 9",
                }}
              >
                <FrozenImage
                  src={cameraSrc}
                  alt=""
                  className="h-full w-full"
                  style={{ objectFit: "cover", transform: "scale(1.1)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full bg-[#ff3b4a] text-[10px] font-bold leading-none tracking-wide text-white"
      style={{
        height: "18px",
        paddingLeft: "8px",
        paddingRight: "8px",
        gap: "2px",
      }}
    >
      <span className="h-1 w-1 rounded-full bg-white" />
      LIVE
    </button>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function PhotoCameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 8h2l1.5-2h7L17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function FrozenImage({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src]);
  return <canvas ref={canvasRef} aria-label={alt} className={className} style={style} />;
}

type LayoutKey =
  | "1x2"
  | "1x3"
  | "2x3"
  | "2x4"
  | "2x2"
  | "3x3"
  | "4x4";

const VERTICAL_LAYOUTS: { key: LayoutKey; label: string; iconSrc: string }[] = [
  { key: "1x2", label: "1×2", iconSrc: `${BASE}/solid%2Bcontailner.svg` },
  { key: "1x3", label: "1×3", iconSrc: `${BASE}/solid%2Bcontailner-1.svg` },
  { key: "2x4", label: "2×4", iconSrc: `${BASE}/solid%2Bcontailner-2.svg` },
];

const HORIZONTAL_LAYOUTS: { key: LayoutKey; label: string; iconSrc: string }[] = [
  { key: "2x2", label: "2×2", iconSrc: `${BASE}/4%20channel.svg` },
  { key: "3x3", label: "3×3", iconSrc: `${BASE}/9%20channel.svg` },
  { key: "4x4", label: "4×4", iconSrc: `${BASE}/16%20channel.svg` },
];

function LayoutConfigSheet({
  open,
  initialVert,
  initialHorz,
  onClose,
  onApply,
}: {
  open: boolean;
  initialVert: LayoutKey;
  initialHorz: LayoutKey;
  onClose: () => void;
  onApply: (vert: LayoutKey, horz: LayoutKey) => void;
}) {
  const [vert, setVert] = useState<LayoutKey>(initialVert);
  const [horz, setHorz] = useState<LayoutKey>(initialHorz);

  useEffect(() => {
    if (open) {
      setVert(initialVert);
      setHorz(initialHorz);
    }
  }, [open, initialVert, initialHorz]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden={!open}
    >
      {/* 배경 딤 */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
        }}
        onClick={onClose}
      />
      {/* 시트 */}
      <div
        className={`absolute inset-x-0 mx-auto w-full max-w-[480px] flex max-h-[90%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          // 시트의 기준 컨테이너(콘텐츠 컬럼)가 안드로이드 시스템 네비 위에서 끝나므로
          // bottom:0 이면 시스템 네비 바로 위에 딱 붙는다.
          bottom: 0,
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          transform: open ? "translateY(0%)" : "translateY(100%)",
          // 닫혔을 땐 그림자를 끈다: 시트 윗변이 화면 하단에 걸쳐 shadow-2xl 이
          // 화면 안쪽 하단 가장자리로 새어 올라오는 걸 막는다.
          boxShadow: open ? undefined : "none",
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between"
          style={{ height: "74px", padding: "0 20px" }}
        >
          <h2 className="text-[20px] font-bold leading-none text-neutral-900">
            화면 구성
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={`${BASE}/close.svg`} alt="" className="h-6 w-6" />
          </button>
        </div>

        <div className="px-5 pb-2">
          <h3 className="text-[20px] font-bold leading-none text-neutral-900" style={{ marginBottom: "16px" }}>
            세로방향
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {VERTICAL_LAYOUTS.map((opt) => (
              <LayoutOption
                key={opt.key}
                label={opt.label}
                iconSrc={opt.iconSrc}
                iconWidth={60}
                iconHeight={85}
                selected={vert === opt.key}
                onClick={() => setVert(opt.key)}
              />
            ))}
          </div>
        </div>

        <div className="px-5" style={{ paddingTop: "20px" }}>
          <h3 className="text-[20px] font-bold leading-none text-neutral-900" style={{ marginBottom: "16px" }}>
            가로방향
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {HORIZONTAL_LAYOUTS.map((opt) => (
              <LayoutOption
                key={opt.key}
                label={opt.label}
                iconSrc={opt.iconSrc}
                iconWidth={85}
                iconHeight={60}
                selected={horz === opt.key}
                onClick={() => setHorz(opt.key)}
              />
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div
          className="flex items-center"
          style={{ gap: "8px", padding: "0 20px", height: "90px", marginTop: "16px" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-neutral-300 bg-white text-[16px] font-semibold text-neutral-900"
            style={{ height: "50px", borderRadius: "4px" }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onApply(vert, horz)}
            className="flex-1 bg-[#1D6CEB] text-[16px] font-semibold text-white"
            style={{ height: "50px", borderRadius: "4px" }}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

function LayoutOption({
  label,
  iconSrc,
  iconWidth,
  iconHeight,
  selected,
  onClick,
}: {
  label: string;
  iconSrc: string;
  iconWidth: number;
  iconHeight: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center"
      style={{ gap: "8px" }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          padding: "8px",
          borderRadius: "8px",
          boxShadow: selected ? "inset 0 0 0 2px #1D6CEB" : "none",
        }}
      >
        <span
          aria-hidden
          className="block"
          style={{
            width: `${iconWidth}px`,
            height: `${iconHeight}px`,
            backgroundColor: selected ? "#1D6CEB" : "#F2F2F2",
            WebkitMaskImage: `url("${iconSrc}")`,
            maskImage: `url("${iconSrc}")`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      </div>
      <span
        className="text-[14px] font-medium leading-none"
        style={{ color: selected ? "#1D6CEB" : "#262626" }}
      >
        {label}
      </span>
    </button>
  );
}

function ModeToggle({
  mode,
  setMode,
}: {
  mode: "live" | "recording";
  setMode: (m: "live" | "recording") => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setMode("live")}
        className="inline-flex items-center justify-center rounded-full text-[14px] font-semibold leading-none transition-colors"
        style={{
          padding: "8px 16px",
          backgroundColor: mode === "live" ? "#1D6CEB" : "#F2F2F2",
          color: mode === "live" ? "#ffffff" : "#7F7F7F",
        }}
      >
        실시간
      </button>
      <button
        type="button"
        onClick={() => setMode("recording")}
        className="inline-flex items-center justify-center rounded-full text-[14px] font-semibold leading-none transition-colors"
        style={{
          padding: "8px 16px",
          backgroundColor: mode === "recording" ? "#1D6CEB" : "#F2F2F2",
          color: mode === "recording" ? "#ffffff" : "#7F7F7F",
        }}
      >
        녹화
      </button>
    </div>
  );
}

function RecBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full text-[10px] font-bold leading-none tracking-wide"
      style={{
        height: "18px",
        paddingLeft: "8px",
        paddingRight: "8px",
        gap: "4px",
        backgroundColor: "#757575",
        color: "#ffffff",
      }}
    >
      <span
        className="rounded-full"
        style={{ width: "4px", height: "4px", backgroundColor: "#ffffff" }}
      />
      녹화
    </button>
  );
}

const TIMELINE_VISIBLE_MIN = 120; // ±2시간 = 총 4시간

function RecordingControls({
  now,
  onToggleChrome,
  onScrubbingChange,
  playbackMs,
  setPlaybackMs,
  onOpenDateTime,
  rowLoading = false,
  isPlaying = true,
  onTogglePlay,
  onPlay,
  onSpeedChange,
}: {
  now: Date | null;
  onToggleChrome?: () => void;
  onScrubbingChange?: (scrubbing: boolean) => void;
  playbackMs: number | null;
  setPlaybackMs: (
    v: number | null | ((prev: number | null) => number | null),
  ) => void;
  onOpenDateTime: () => void;
  rowLoading?: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onPlay?: () => void;
  onSpeedChange?: (rate: number) => void;
}) {
  const VISIBLE_MINUTES = TIMELINE_VISIBLE_MIN;
  // 줌 레벨: 픽셀/초 — 핀치 너비 비율로 연속적으로 조정 (기본 6px/sec → 라벨 10초 간격)
  const [pxPerSec, setPxPerSec] = useState(6);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; ms: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; pxPerSec: number } | null>(
    null,
  );
  const timelineRef = useRef<HTMLDivElement>(null);

  const [seekToast, setSeekToast] = useState<string | null>(null);
  const seekToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSeekToast = (text: string) => {
    setSeekToast(text);
    if (seekToastTimer.current) clearTimeout(seekToastTimer.current);
    seekToastTimer.current = setTimeout(() => setSeekToast(null), 2000);
  };
  // 배속: 0=아이콘(1배), 이후 2X→4X→16X→다시 아이콘. 되감기는 음수(-2X…), 각각 독립.
  const FWD_SPEED_LABELS = [null, "2X", "4X", "16X"];
  const BACK_SPEED_LABELS = [null, "-2X", "-4X", "-16X"];
  const SPEED_MULT = [null, 2, 4, 16];
  const [backSpeedIdx, setBackSpeedIdx] = useState(0);
  const [fwdSpeedIdx, setFwdSpeedIdx] = useState(0);
  const speedToastText = (idx: number) =>
    idx === 0 ? "기본 속도로 재생" : `${SPEED_MULT[idx]}배속으로 재생`;
  // 진입/이탈 시 배속을 기본(1)으로 동기화 — 부모의 playbackRate 잔존 방지.
  useEffect(() => {
    onSpeedChange?.(1);
    return () => onSpeedChange?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 휠/트랙패드 핀치 줌 — React onWheel은 passive라 preventDefault가 안 먹으므로
  // non-passive 네이티브 리스너로 직접 등록해 브라우저 페이지 줌을 막는다.
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setPxPerSec((p) =>
        Math.max(0.05, Math.min(80, p * Math.exp(-e.deltaY * 0.003))),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // 현재 pxPerSec 기준 라벨/눈금 간격 — 라벨 최소 60px 간격 유지. 줌인 시 최소 라벨 간격 5초.
  const niceSeconds = [5, 10, 30, 60, 300, 600, 1800];
  const labelIntervalSec =
    niceSeconds.find((s) => s * pxPerSec >= 60) ?? 3600;
  const subIntervalSec = Math.max(1, Math.round(labelIntervalSec / 10));

  if (playbackMs === null && now) {
    setPlaybackMs(now.getTime());
  }

  // anchor: 라벨 영역의 기준 시각. 최초에는 현재 시각, 이후 playbackMs가 가시 범위를
  // 크게 벗어나면(±VISIBLE_MINUTES/2 초과) playbackMs로 재정렬한다.
  // 이렇게 해야 DateTimePicker로 먼 시각으로 점프했을 때 라벨이 그쪽으로 따라간다.
  const [anchor, setAnchor] = useState<number | null>(null);
  useEffect(() => {
    if (now === null) return;
    setAnchor((prev) => {
      if (prev === null) {
        const seed = playbackMs ?? now.getTime();
        const a = new Date(seed);
        a.setSeconds(0, 0);
        return a.getTime();
      }
      if (
        playbackMs !== null &&
        Math.abs(playbackMs - prev) > (VISIBLE_MINUTES / 2) * 60 * 1000
      ) {
        const a = new Date(playbackMs);
        a.setSeconds(0, 0);
        return a.getTime();
      }
      return prev;
    });
  }, [now, playbackMs]);

  // 재생 시점이 ±VISIBLE_MINUTES 범위를 넘지 않도록 클램프
  const clampMs = (ms: number) => {
    if (anchor === null) return ms;
    const minMs = anchor - VISIBLE_MINUTES * 60 * 1000;
    const maxMs = anchor + VISIBLE_MINUTES * 60 * 1000;
    return Math.max(minMs, Math.min(maxMs, ms));
  };

  // 자동 진행은 Page 레벨에서 관리

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (playbackMs === null) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}
    if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        distance: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        pxPerSec,
      };
      isDraggingRef.current = false;
      dragStartRef.current = null;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, ms: playbackMs };
      onScrubbingChange?.(true);
    }
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const newDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const scale = newDist / pinchStartRef.current.distance;
      setPxPerSec(
        Math.max(0.05, Math.min(80, pinchStartRef.current.pxPerSec * scale)),
      );
    } else if (
      isDraggingRef.current &&
      dragStartRef.current &&
      pointersRef.current.size === 1
    ) {
      const dx = e.clientX - dragStartRef.current.x;
      setPlaybackMs(clampMs(dragStartRef.current.ms - (dx / pxPerSec) * 1000));
    }
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 0) {
      if (isDraggingRef.current) onScrubbingChange?.(false);
      isDraggingRef.current = false;
      dragStartRef.current = null;
    }
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  };
  const centerDate = playbackMs !== null ? new Date(playbackMs) : null;
  const labelDate = centerDate
    ? `${centerDate.getFullYear()}.${pad(centerDate.getMonth() + 1)}.${pad(centerDate.getDate())}.(${WEEKDAYS[centerDate.getDay()]}) ${pad(centerDate.getHours())}:${pad(centerDate.getMinutes())}:${pad(centerDate.getSeconds())}`
    : "";
  const centerLabel = centerDate
    ? `${pad(centerDate.getHours())}:${pad(centerDate.getMinutes())}:${pad(centerDate.getSeconds())}`
    : "";

  // 라벨 (labelIntervalSec 단위) 및 눈금 (subIntervalSec 단위) 생성
  const totalSpanSec = VISIBLE_MINUTES * 60;
  const labelStepCount = Math.ceil(totalSpanSec / labelIntervalSec);
  const labels = anchor
    ? Array.from({ length: labelStepCount * 2 + 1 }, (_, i) => {
        const secOffset = (i - labelStepCount) * labelIntervalSec;
        const t = new Date(anchor + secOffset * 1000);
        const text =
          labelIntervalSec >= 60
            ? `${pad(t.getHours())}:${pad(t.getMinutes())}`
            : `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
        return { text, secOffset };
      })
    : [];
  const subStepCount = Math.ceil(totalSpanSec / subIntervalSec);
  const ticks = anchor
    ? Array.from({ length: subStepCount * 2 + 1 }, (_, i) => {
        const secOffset = (i - subStepCount) * subIntervalSec;
        const isMajor = secOffset % labelIntervalSec === 0;
        return { secOffset, isMajor };
      })
    : [];

  const playbackOffsetSec =
    playbackMs !== null && anchor !== null
      ? (playbackMs - anchor) / 1000
      : 0;
  const railTransform =
    playbackMs !== null && anchor !== null
      ? `translateX(${-playbackOffsetSec * pxPerSec}px)`
      : undefined;

  // 라벨이 중앙(현재 시간 표시)에 가까울수록 작아지고 사라짐
  const labelVisualStyle = (secOffset: number) => {
    const distPx = Math.abs((secOffset - playbackOffsetSec) * pxPerSec);
    const HIDE = 28; // 28px 이내는 완전히 숨김
    const FULL = 56; // 56px 이상은 완전히 표시
    const t = Math.max(0, Math.min(1, (distPx - HIDE) / (FULL - HIDE)));
    return {
      opacity: t,
      transform: `translateX(-50%) scale(${0.6 + 0.4 * t})`,
    };
  };

  return (
    <div className="relative flex flex-col">
      {/* 녹화 + 날짜 */}
      <div
        className="relative flex items-center px-5"
        style={{ height: "48px", gap: "8px" }}
      >
        <RecBadge onClick={onToggleChrome} />
        <button
          type="button"
          onClick={onOpenDateTime}
          className="flex items-center gap-0 text-[14px] font-medium leading-none text-[#353535]"
        >
          <span suppressHydrationWarning>{labelDate}</span>
          <ChevronDownIcon className="h-6 w-6 text-[#262626]" />
        </button>
        <RowSkeleton visible={rowLoading} />
      </div>
      <div className="h-px" style={{ backgroundColor: "#DBDBDB" }} />
      <div className="relative">
      {/* 플레이어 컨트롤 — 시간바(타임라인) 위 */}
      <div
        className="flex items-center justify-center"
        style={{
          gap: "20px",
          padding: "8px 0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <PlayerButton
          kind="skip-back"
          label={BACK_SPEED_LABELS[backSpeedIdx]}
          onClick={() => {
            const next = (backSpeedIdx + 1) % BACK_SPEED_LABELS.length;
            setBackSpeedIdx(next);
            setFwdSpeedIdx(0);
            onSpeedChange?.(next === 0 ? 1 : -SPEED_MULT[next]!);
            onPlay?.();
            showSeekToast(speedToastText(next));
          }}
        />
        <PlayerButton
          kind="back10"
          onClick={() => {
            setPlaybackMs((p) => (p === null ? p : p - 10000));
            onPlay?.();
            showSeekToast("10초 전으로 이동");
          }}
        />
        <PlayerButton
          kind={isPlaying ? "pause" : "play"}
          onClick={onTogglePlay}
          held={!isPlaying}
        />
        <PlayerButton
          kind="forward10"
          onClick={() => {
            setPlaybackMs((p) => (p === null ? p : p + 10000));
            onPlay?.();
            showSeekToast("10초 후로 이동");
          }}
        />
        <PlayerButton
          kind="skip-forward"
          label={FWD_SPEED_LABELS[fwdSpeedIdx]}
          onClick={() => {
            const next = (fwdSpeedIdx + 1) % FWD_SPEED_LABELS.length;
            setFwdSpeedIdx(next);
            setBackSpeedIdx(0);
            onSpeedChange?.(next === 0 ? 1 : SPEED_MULT[next]!);
            onPlay?.();
            showSeekToast(speedToastText(next));
          }}
        />
      </div>
      <div className="h-px" style={{ backgroundColor: "#DBDBDB" }} />
      {/* 타임라인 */}
      <div
        ref={timelineRef}
        className="relative flex flex-col overflow-hidden touch-pan-y select-none"
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: "12px",
          // 삼각형을 없앤 만큼 줄여 단일채널 시간바(PAD_BOTTOM 4)와 같게 맞춘다.
          paddingBottom: "4px",
          cursor: "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* 스크롤 레일 (라벨 + 눈금) — 단일채널 RAIL_H 와 동일한 28px.
            눈금은 top 18~26 이라 28 안에 다 들어간다(예전 34 는 아래가 빈 공간). */}
        <div
          className="relative"
          style={{ height: "28px", transform: railTransform }}
        >
          {/* 라벨 */}
          {labels.map(({ text, secOffset }) => (
            <span
              key={`L${secOffset}`}
              suppressHydrationWarning
              className="absolute whitespace-nowrap"
              style={{
                left: `calc(50% + ${secOffset * pxPerSec}px)`,
                top: "0",
                color: "#A4A4A4",
                transformOrigin: "center center",
                ...labelVisualStyle(secOffset),
                fontSize: "10px",
                fontWeight: 500,
                lineHeight: "10px",
              }}
            >
              {text}
            </span>
          ))}
          {/* 눈금 */}
          {ticks.map(({ secOffset, isMajor }) => (
            <div
              key={`T${secOffset}`}
              className="absolute rounded-[1px]"
              style={{
                left: `calc(50% + ${secOffset * pxPerSec}px)`,
                // 대/소 눈금 길이를 짧은 것(8px)으로 통일. 소 눈금 색만 밝은 그레이.
                // 라벨(top 0~10)과 눈금 사이 간격을 좁히려 top 26→18.
                top: "18px",
                width: "2px",
                height: "8px",
                backgroundColor: isMajor ? "#797979" : "#C4C4C4",
              }}
            />
          ))}
        </div>
        {/* 좌우 페이드 (배경 그라데이션) — 가운데에서 바깥으로 갈수록 흰색으로 가려짐 */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: 0,
            top: 0,
            bottom: 0,
            width: "39%",
            background:
              "linear-gradient(to left, rgba(255,255,255,0) 0%, #FFFFFF 89.9%)",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            right: 0,
            top: 0,
            bottom: 0,
            width: "39%",
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, #FFFFFF 89.9%)",
          }}
        />
        {/* 중앙 고정 현재 시간 — 사이드 라벨과 베이스라인 정렬 */}
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
          style={{ top: "10px", lineHeight: 0 }}
        >
          <span
            suppressHydrationWarning
            style={{
              display: "inline-block",
              color: "#353535",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: "12px",
              padding: "0 6px",
              verticalAlign: "top",
            }}
          >
            {centerLabel}
          </span>
        </div>
        {/* 중앙 고정 현재 시각 선 — 단일채널 RecordingEventTimeline 과 동일한 마커.
            눈금(top 30~38)보다 위아래로 살짝 긴 27~41. 예전엔 삼각형(Polygon 1.svg)
            이었는데 단일채널만 선으로 바꿔서 두 화면이 달라 보였다. */}
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-[1px]"
          style={{
            top: "27px",
            width: "2px",
            height: "14px",
            backgroundColor: "#111111",
          }}
        />
      </div>
      <TimelineSkeleton visible={rowLoading} />
      </div>
      {/* 탐색 토스트 — 이 블록은 영상 그리드 바로 아래에 붙으므로, 블록 상단(100%)
          기준 +20px = 영상 그리드 하단에서 20px 위(토스트 공통 규칙). */}
      {seekToast && (
        <div
          key={seekToast}
          className="toast-slide-up pointer-events-none absolute left-1/2 z-20 flex items-center justify-center"
          style={{
            bottom: "calc(100% + 20px)",
            transform: "translateX(-50%)",
            height: "32px",
            padding: "0 16px",
            borderRadius: "32px",
            backgroundColor: "rgba(34, 34, 34, 0.9)",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500 }}
          >
            {seekToast}
          </span>
        </div>
      )}
    </div>
  );
}

const DATE_PICK_RANGE = 30; // 오늘 기준 과거 30일 (오늘 포함 31일)

function DateTimePickerSheet({
  open,
  initialMs,
  onClose,
  onApply,
}: {
  open: boolean;
  initialMs: number;
  onClose: () => void;
  onApply: (ms: number) => void;
}) {
  // anchorMs = "오늘" 자정(시스템 현재 시각 기준). 과거 DATE_PICK_RANGE일까지 선택 가능.
  // initialMs(이미 선택해둔 시각)가 이 범위 안에 있으면 그 위치로 스크롤 초기화.
  const [anchorMs, setAnchorMs] = useState(() => {
    const a = new Date();
    a.setHours(0, 0, 0, 0);
    return a.getTime();
  });
  const [dateIdx, setDateIdx] = useState(DATE_PICK_RANGE); // 마지막 = 오늘
  const [hourIdx, setHourIdx] = useState(0);
  const [minuteIdx, setMinuteIdx] = useState(0);

  // 시트가 열린 시점의 initialMs만 한 번 사용한다. 부모의 now가 매초 갱신되며
  // initialMs가 바뀌어도 사용자가 스크롤한 위치를 덮어쓰지 않도록 ref로 캡처.
  const initialMsRef = useRef(initialMs);
  useEffect(() => {
    initialMsRef.current = initialMs;
  });
  useEffect(() => {
    if (open) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setAnchorMs(today.getTime());

      const initial = new Date(initialMsRef.current);
      const initialMidnight = new Date(initial);
      initialMidnight.setHours(0, 0, 0, 0);
      // dayDiff: 오늘=0, 어제=1, ..., 30일 전=30. 음수면(미래) 오늘로 클램프.
      const dayDiff = Math.round(
        (today.getTime() - initialMidnight.getTime()) / 86400000,
      );
      const idx = Math.max(
        0,
        Math.min(DATE_PICK_RANGE, DATE_PICK_RANGE - dayDiff),
      );
      setDateIdx(idx);
      setHourIdx(initial.getHours());
      setMinuteIdx(initial.getMinutes());
    }
  }, [open]);

  // i=0 -> anchorMs - DATE_PICK_RANGE일, i=DATE_PICK_RANGE -> 오늘
  const selectedDate = new Date(
    anchorMs - (DATE_PICK_RANGE - dateIdx) * 86400000,
  );
  const displayLabel = `${String(selectedDate.getFullYear()).slice(-2)}.${selectedDate.getMonth() + 1}.${selectedDate.getDate()}. (${WEEKDAYS[selectedDate.getDay()]}) ${pad(hourIdx)}:${pad(minuteIdx)}`;

  const dateItems = Array.from({ length: DATE_PICK_RANGE + 1 }, (_, i) => {
    const d = new Date(anchorMs - (DATE_PICK_RANGE - i) * 86400000);
    return `${d.getMonth() + 1}.${d.getDate()}. (${WEEKDAYS[d.getDay()]})`;
  });
  const hourItems = Array.from({ length: 24 }, (_, i) => pad(i));
  const minuteItems = Array.from({ length: 60 }, (_, i) => pad(i));

  const handleApply = () => {
    const d = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hourIdx,
      minuteIdx,
      0,
      0,
    );
    // 사용자가 오늘 날짜에서 미래 시각을 골라도 현재 시각으로 클램프
    onApply(Math.min(d.getTime(), Date.now()));
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
        }}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 mx-auto w-full max-w-[480px] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          // 시트의 기준 컨테이너(콘텐츠 컬럼)가 안드로이드 시스템 네비 위에서 끝나므로
          // bottom:0 이면 시스템 네비 바로 위에 딱 붙는다(앱 탭바는 시트가 덮어도 됨).
          bottom: 0,
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          transform: open ? "translateY(0%)" : "translateY(100%)",
          // 닫혔을 땐 그림자를 끈다: 시트 윗변이 화면 하단에 걸쳐 shadow-2xl 이
          // 화면 안쪽 하단 가장자리로 새어 올라오는 걸 막는다.
          boxShadow: open ? undefined : "none",
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between"
          style={{ height: "74px", padding: "0 20px" }}
        >
          <h2 className="text-[20px] font-bold leading-none text-neutral-900">
            날짜, 시간 선택
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={`${BASE}/close.svg`} alt="" className="h-6 w-6" />
          </button>
        </div>
        {/* 선택된 날짜시간 표시 */}
        <div
          className="text-center text-[18px] font-bold text-neutral-900"
          style={{ marginBottom: "16px" }}
        >
          {displayLabel}
        </div>
        {/* 3-column scrollable picker */}
        <div
          className="flex relative"
          style={{ padding: "0 20px", marginBottom: "20px" }}
        >
          {/* 중앙 강조 라인 — 좌우 50px 마진 */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: "50px",
              right: "50px",
              top: `50%`,
              transform: "translateY(-50%)",
              height: "44px",
              borderTop: "1px solid #ECECEC",
              borderBottom: "1px solid #ECECEC",
            }}
          />
          {/* 위/아래 페이드 그라데이션 */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: "20px",
              right: "20px",
              top: 0,
              height: "44px",
              background:
                "linear-gradient(to bottom, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
              zIndex: 2,
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              left: "20px",
              right: "20px",
              bottom: 0,
              height: "44px",
              background:
                "linear-gradient(to top, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
              zIndex: 2,
            }}
          />
          <ScrollPickerColumn
            items={dateItems}
            initialIndex={dateIdx}
            onChange={setDateIdx}
            wide
            open={open}
          />
          <ScrollPickerColumn
            items={hourItems}
            initialIndex={hourIdx}
            onChange={setHourIdx}
            open={open}
          />
          <ScrollPickerColumn
            items={minuteItems}
            initialIndex={minuteIdx}
            onChange={setMinuteIdx}
            open={open}
          />
        </div>
        {/* 적용 버튼 */}
        <div style={{ padding: "0 20px", paddingBottom: "20px" }}>
          <button
            type="button"
            onClick={handleApply}
            className="w-full bg-[#1D6CEB] text-[16px] font-semibold text-white"
            style={{ height: "50px", borderRadius: "4px" }}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

function ScrollPickerColumn({
  items,
  initialIndex,
  onChange,
  wide,
  open,
}: {
  items: string[];
  initialIndex: number;
  onChange: (idx: number) => void;
  wide?: boolean;
  open: boolean;
}) {
  const ITEM_H = 44;
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(initialIndex);

  // open되거나 initialIndex가 바뀔 때 해당 위치로 스크롤
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = initialIndex * ITEM_H;
    setCurrentIdx(initialIndex);
  }, [open, initialIndex]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    if (idx >= 0 && idx < items.length && idx !== currentIdx) {
      setCurrentIdx(idx);
      onChange(idx);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        flex: wide ? 2 : 1,
        height: `${ITEM_H * 3}px`,
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
      }}
    >
      <div style={{ height: `${ITEM_H}px` }} />
      {items.map((text, i) => {
        const isCenter = i === currentIdx;
        return (
          <div
            key={i}
            className="flex w-full items-center justify-center text-center"
            style={{
              height: `${ITEM_H}px`,
              scrollSnapAlign: "center",
              fontSize: "20px",
              fontWeight: isCenter ? 700 : 500,
              color: isCenter ? "#1D6CEB" : "#D9D9D9",
              transition: "color 120ms ease-out, font-weight 120ms ease-out",
            }}
          >
            {text}
          </div>
        );
      })}
      <div style={{ height: `${ITEM_H}px` }} />
    </div>
  );
}

type PlayerButtonKind =
  | "skip-back"
  | "back10"
  | "pause"
  | "play"
  | "forward10"
  | "skip-forward";

function PlayerButton({
  kind,
  onClick,
  held = false,
  label = null,
}: {
  kind: PlayerButtonKind;
  onClick?: () => void;
  // held=true면 계속 눌린 상태(F2F2F2) 유지(재생/일시정지 토글). 나머지는 누르는 동안만.
  held?: boolean;
  // label이 있으면 아이콘 대신 배속 텍스트("2배" 등)를 표시하고 active 상태로 둔다.
  label?: string | null;
}) {
  const [pressed, setPressed] = useState(false);
  const active = held || pressed || label != null;
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="flex items-center justify-center rounded-full"
      style={{
        width: "40px",
        height: "40px",
        border: "1px solid #D9D9D9",
        backgroundColor: active ? "#F2F2F2" : "#FFFFFF",
      }}
    >
      {label != null ? (
        <span
          style={{ fontSize: "14px", fontWeight: 500, color: "#262626" }}
        >
          {label}
        </span>
      ) : (
        <PlayerIcon kind={kind} size={24} />
      )}
    </button>
  );
}

const PLAYER_ICON_SRC: Record<PlayerButtonKind, string> = {
  "skip-back": `${BASE}/ic_skip_back.svg`,
  back10: `${BASE}/ic_back10.svg`,
  pause: `${BASE}/ic_pause.svg`,
  play: `${BASE}/ic_play.svg`,
  forward10: `${BASE}/ic_forward10.svg`,
  "skip-forward": `${BASE}/ic_skip_forward.svg`,
};

function PlayerIcon({
  kind,
  size,
}: {
  kind: PlayerButtonKind;
  size: number;
}) {
  const marginLeft = kind === "skip-forward" ? "2px" : undefined;
  const marginRight = kind === "skip-back" ? "2px" : undefined;
  return (
    <img
      src={PLAYER_ICON_SRC[kind]}
      alt=""
      style={{ width: `${size}px`, height: `${size}px`, marginLeft, marginRight }}
    />
  );
}

function SectionSkeleton({
  visible,
  cols,
  rows,
}: {
  visible: boolean;
  cols: number;
  rows: number;
}) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 grid bg-white"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap: "2px",
      }}
      aria-hidden
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className="skeleton-shimmer" />
      ))}
    </div>
  );
}

function VideoSkeleton({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="skeleton-shimmer pointer-events-none absolute inset-0 z-20"
      aria-hidden
    />
  );
}

function TimelineSkeleton({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col"
      style={{ backgroundColor: "#F7F7F7" }}
      aria-hidden
    >
      <div
        className="skeleton-shimmer"
        style={{ height: "62px" }}
      />
      <div
        className="flex items-center justify-center"
        style={{ gap: "20px", padding: "8px 0" }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer rounded-full"
            style={{ width: "40px", height: "40px" }}
          />
        ))}
      </div>
    </div>
  );
}

function CameraListSkeleton({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col overflow-hidden bg-white px-5"
      aria-hidden
    >
      <div
        className="skeleton-shimmer rounded"
        style={{
          width: "80px",
          height: "16px",
          marginTop: "12px",
          marginBottom: "12px",
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer aspect-video"
            style={{ borderRadius: "4px" }}
          />
        ))}
      </div>
    </div>
  );
}

function RowSkeleton({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center bg-white px-5"
      style={{ gap: "8px" }}
      aria-hidden
    >
      <div
        className="skeleton-shimmer rounded-full"
        style={{ width: "44px", height: "18px" }}
      />
      <div
        className="skeleton-shimmer rounded"
        style={{ width: "180px", height: "14px" }}
      />
    </div>
  );
}

function NoCameraPlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: "#B0B0B0" }}
    >
      <img
        src={`${BASE}/no_camera.svg`}
        alt=""
        style={{ width: "30%", maxWidth: "70px" }}
      />
    </div>
  );
}

function PlayingBarsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="5" y="10" width="3" height="9" rx="1" />
      <rect x="10.5" y="5" width="3" height="14" rx="1" />
      <rect x="16" y="13" width="3" height="6" rx="1" />
    </svg>
  );
}

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
