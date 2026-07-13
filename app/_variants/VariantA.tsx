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
  "1x2" | "1x3" | "2x4" | "2x2" | "3x3" | "4x4",
  { cols: number; rows: number }
> = {
  "1x2": { cols: 1, rows: 2 },
  "1x3": { cols: 1, rows: 3 },
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
  const [vertLayout, setVertLayout] = useState<LayoutKey>("2x4");
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
    const id = setInterval(() => {
      const t = performance.now();
      const dt = t - prev;
      prev = t;
      setPlaybackMs((p) => (p === null ? null : p + dt * playbackRate));
    }, 50);
    return () => clearInterval(id);
  }, [mode, playbackMs === null, isScrubbing, isPlaying, playbackRate]);

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
          className="relative flex items-center justify-between bg-white px-5 text-[13px] font-semibold text-neutral-900"
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
          setVertLayout(vert);
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
        className="flex items-center px-5"
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
          className="relative flex items-center px-5"
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
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: zoom, opacity: driving ? 0 : paused ? 0 : 1 }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: "cover",
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
  // 녹화 모드 하단 탭: 카메라 목록 / 움직임 감지(세로 타임라인)
  const [recTab, setRecTab] = useState<"list" | "motion">("motion");
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
        className="flex items-center px-5"
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

      {/* 큰 영상 — 더블클릭 시 다채널로 복귀 */}
      <div className="px-0">
        <div
          className="relative aspect-video w-full cursor-pointer touch-pan-y select-none overflow-hidden bg-neutral-900"
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

      {/* LIVE / 녹화 / 날짜 / 카메라 아이콘 */}
      <div
        className="relative flex items-center px-5"
        style={{ height: "48px" }}
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
          className="ml-auto flex h-[30px] w-[30px] items-center justify-center rounded-full border border-neutral-300"
        >
          <img src={`${BASE}/camera.svg`} alt="카메라" className="h-6 w-6" />
        </button>
        <RowSkeleton visible={videoLoading} />
      </div>

      <div
        className="h-px"
        style={{ backgroundColor: "#DBDBDB" }}
      />

      {/* 녹화 모드일 때 플레이어 버튼 */}
      {mode === "recording" && (
        <>
          <div
            className="flex items-center justify-center"
            style={{
              gap: "20px",
              padding: "12px 0",
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

      {/* 녹화 모드 하단 탭: 카메라 목록 / 움직임 감지 */}
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

      {/* 카메라 목록 OR 녹화 이벤트 타임라인 */}
      <div className="relative flex min-h-0 flex-1 flex-col">
      {mode === "recording" && recTab === "motion" ? (
        <RecordingEventTimeline
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          cameraSrc={cam.src}
          onScrubbingChange={onScrubbingChange}
        />
      ) : (
      <div
        className="flex flex-1 flex-col overflow-y-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {mode === "live" && (
          <h2
            className="text-[16px] font-bold leading-none text-neutral-900"
            style={{ marginTop: "12px", marginBottom: "12px" }}
          >
            카메라 목록
          </h2>
        )}

        <div
          className="grid grid-cols-2 gap-2"
          style={mode === "recording" ? { marginTop: "12px" } : undefined}
        >
          {CAMERAS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className="relative aspect-video overflow-hidden bg-neutral-900"
              style={{ borderRadius: "4px" }}
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
  // 줌 레벨: 픽셀/초 — 가로 타임라인과 동일하게 기본 6px/sec. 핀치/휠로 연속 조정.
  const [pxPerSec, setPxPerSec] = useState(6);
  const [lineY, setLineY] = useState(20);
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
  const dragStartRef = useRef<{ y: number; ms: number } | null>(null);
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

  // 라벨 최소 세로 간격 = 60px 유지. 줌인 시 최소 라벨 간격은 5초(1초 미사용).
  const niceSeconds = [5, 10, 30, 60, 300, 600, 1800];
  const labelIntervalSec =
    niceSeconds.find((s) => s * pxPerSec >= 60) ?? 3600;

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

  // 이벤트 클러스터링 — 픽셀 거리가 MERGE_GAP 보다 가까우면 묶음.
  // (카드 높이 60 + 뒤 스택 여유 + 간격) 만큼 떨어뜨려 카드가 서로 겹치지 않게 함.
  // 펼치면 ROW_H 간격으로 나열되며, 늘어난 높이만큼 아래 컨텐츠를 밀어낸다(아코디언).
  const CARD_H = 80;
  const ROW_H = 80;
  const THUMB_HALF = 36; // 썸네일 높이 72의 절반 — 카드 중심 cy 에서 윗변까지 거리
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
    if (last && (occ.secOffset - last.secOffset) * pxPerSec < CARD_H) {
      last.members.push(occ);
    } else {
      clusters.push({ ...occ, members: [occ] });
    }
  }
  // 펼쳐진 클러스터들이 삽입하는 추가 높이 (anchor secOffset 오름차순)
  const expandedGaps = clusters
    .filter((c) => c.members.length > 1 && expandedClusters.has(c.key))
    .map((c) => ({ at: c.secOffset, gap: (c.members.length - 1) * ROW_H }))
    .sort((a, b) => a.at - b.at);
  const totalGap = expandedGaps.reduce((s, g) => s + g.gap, 0);
  // 세로 타임라인은 위=최신, 아래=과거. 따라서 컨텐츠 y는 secOffset 부호를 뒤집어 매핑한다
  // (미래/최신 = 작은 y = 위, 과거 = 큰 y = 아래).
  // 펼쳐진 클러스터는 아래쪽(과거)으로 카드를 나열하므로, 그보다 과거(secOffset가 더 작은)
  // 항목들을 아래로 밀어낸다 → gap은 g.at > secOffset 일 때 누적.
  const gapBefore = (secOffset: number) =>
    expandedGaps.reduce((s, g) => s + (g.at > secOffset ? g.gap : 0), 0);
  const yOf = (secOffset: number) => -secOffset * pxPerSec + gapBefore(secOffset);

  // 라인 위치: 컨테이너 상단에서 20px 아래
  useEffect(() => {
    setLineY(20);
  }, []);

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
      dragStartRef.current = { y: e.clientY, ms: playbackMs };
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
      const dy = e.clientY - dragStartRef.current.y;
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
            dragStartRef.current.ms += (alignOffset / pxPerSec) * 1000;
            setAlignOffset(0);
          }
        }
      }
      // 위=최신/아래=과거 이므로, 컨텐츠가 손가락을 따라가도록: 아래로 드래그 → 미래로,
      // 위로 드래그 → 과거로. ±VISIBLE_MINUTES 클램프.
      setPlaybackMs(clampMs(dragStartRef.current.ms + (dy / pxPerSec) * 1000));
    }
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 0) {
      // 거의 안 움직이고 짧게 눌렀다 떼면 탭 — 그 지점의 카드를 선택.
      // elementFromPoint는 카드 위를 덮는 canvas 오버레이를 집어 .closest가 null이 되므로,
      // 카드 사각형을 직접 히트테스트한다(겹치면 탭 지점에 가장 가까운 카드 선택).
      // 접힌 묶음(data-cluster-key)은 펼치고, 단일/펼친 카드는 그 시각으로 이동해
      // 선택한 썸네일이 파란 현재시간 라인에 오게 한다.
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
            const dist = Math.abs(tap.y - (rect.top + rect.bottom) / 2);
            if (dist < best) {
              best = dist;
              target = el;
            }
          }
        });
        if (target) {
          const clusterKey = target.dataset.clusterKey;
          if (clusterKey) {
            // 접힌 묶음 → 펼침.
            toggleCluster(clusterKey);
          } else if (playbackMs !== null && target.dataset.eventMs) {
            const ms = Number(target.dataset.eventMs);
            const ownerKey = target.dataset.clusterOwner;
            const occKey = target.dataset.occKey ?? null;
            // 파란 라인을 다크 막대의 아랫끝(이벤트 시작)에 맞춘다. 막대는 중앙 정렬이라
            // 아랫끝 = 카드 중심(cy) + 막대높이/2. 펼친 멤버는 아코디언 위치(anchorY+i·ROW_H)라
            // 시간축과 어긋나므로 카드가 그려진 위치(content-y)와 그 시각의 시간축 위치(time-y)
            // 차이로 보정하고, 거기서 막대높이/2 만큼 더 내려 아랫끝이 라인에 오게 한다.
            // 접기는 카드 밖 빈 곳 탭으로만 한다.
            const barH = Math.min(72, Math.max(6, Number(target.dataset.durSec) * pxPerSec));
            const timeY = Number(target.dataset.timeY);
            const contentY = Number(target.dataset.contentY);
            setAlignOffset(timeY - contentY - barH / 2);
            setSelectedOccKey(ownerKey ? occKey : null);
            setPlaybackMs(clampMs(ms));
            // 선택 지점까지 부드럽게 이동(약 320ms) 후 transition 해제 → 이후 시간 흐름은 또렷하게.
            setAnimateScroll(true);
            if (animTimerRef.current) clearTimeout(animTimerRef.current);
            animTimerRef.current = setTimeout(() => setAnimateScroll(false), 340);
          }
        } else if (expandedClusters.size > 0) {
          // 카드 밖 빈 곳 탭 → 펼친 묶음 모두 접기.
          setExpandedClusters(new Set());
          setSelectedOccKey(null);
          setAlignOffset(0);
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

  // anchor 기준 현재 재생 시각의 offset (초)
  const playbackOffsetSec =
    playbackMs !== null && anchor !== null
      ? (playbackMs - anchor) / 1000
      : 0;
  // 파란 라인(현재 시각)의 컨텐츠 y — 위쪽 클러스터가 펼쳐진 만큼(gapBefore) 함께 반영해야
  // 라벨 격자와 파란 라인이 어긋나지 않는다.
  const playbackY = yOf(playbackOffsetSec);
  const translateY = lineY - playbackY + alignOffset;

  // NOTE: 라벨 opacity를 playbackY(매 프레임 변함)에 의존시키면, 움직이는 트랙
  // 레이어가 매 프레임 다시 래스터되어 컴포지터 transform 보간이 무효화되고
  // 타임라인이 뚝뚝 끊긴다. 그래서 회색 라벨은 항상 opacity 1로 고정해 트랙
  // 콘텐츠를 정적으로 유지(레이어 래스터 캐시)하고, 파란 라인과 겹치는 부분은
  // 화면에 고정된 흰색 마스크(아래 고정 오버레이)로 가린다.

  const currentTimeLabel = playbackMs
    ? (() => {
        const d = new Date(playbackMs);
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      })()
    : "00:00:00";

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-hidden touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 컨텐츠 (transform으로 스크롤) — anchor 기준 0 = 화면 lineY.
          translateY 에 정렬 오프셋(alignOffset)이 포함돼, 탭으로 라인에 붙인 위치에서 흐른다. */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 0,
          height: 0,
          transform: `translateY(${translateY}px)`,
          // 재생 중(드래그 아님)에는 50ms 간격으로 들어오는 translateY 사이를
          // 컴포지터 스레드에서 linear로 보간 → 메인스레드 리렌더 잼과 무관하게 매끄럽게 흐른다.
          // 트랜지션을 틱 간격(50ms)보다 충분히 길게 잡아, 메인스레드 잼으로 다음 틱이
          // 늦거나 누락돼도 컴포지터가 목표점에 먼저 도착해 '멈춰 서는' 일이 없게 한다.
          // (이동 중엔 매 틱 더 앞을 목표로 재설정하므로 평균 속도는 실시간과 일치, 약간의 일정 지연만 생김)
          transition: animateScroll
            ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"
            : isDraggingRef.current
              ? "none"
              : "transform 260ms linear",
        }}
      >
        {/* 세로 실선 라인 — 가시 범위 ±VISIBLE_MINUTES 만큼 그림 */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: "100px",
            top: `${-totalSpanSec * pxPerSec}px`,
            height: `${totalSpanSec * 2 * pxPerSec + totalGap}px`,
            width: "6px",
            marginLeft: "-3px",
            backgroundColor: "#E0E0E0",
          }}
        />

        {/* 라벨 */}
        {labels.map(({ text, secOffset }) => {
          const y = yOf(secOffset);
          return (
            <span
              key={`L${secOffset}`}
              className="pointer-events-none absolute leading-none"
              style={{
                left: "20px",
                top: `${y}px`,
                transformOrigin: "left center",
                transform: "translateY(-50%)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#A4A4A4",
              }}
            >
              {text}
            </span>
          );
        })}

        {/* 이벤트 영상 길이 막대 — 선(x=100) 위, 막대 중심을 썸네일 세로 중앙(cy)에 정렬.
            영상 길이(durSec)만큼 길어진다(줌 비례, 최대 = 썸네일 높이 72px)라 항상 썸네일
            세로 범위 안에 있다. 펼친 상태에서는 anchorY 기준 ROW_H 간격으로 쌓는다. */}
        {clusters.flatMap((cluster) => {
          const { key, secOffset, members } = cluster;
          const count = members.length;
          const anchorY = yOf(secOffset);
          const expanded = count > 1 && expandedClusters.has(key);
          const bars = expanded
            ? members.map((m, i) => ({ cy: anchorY + i * ROW_H, dur: m.durSec }))
            : [{ cy: anchorY, dur: members[0].durSec }];
          return bars.map((b, i) => {
            const h = Math.min(72, Math.max(6, b.dur * pxPerSec));
            return (
              <span
                key={`BD${key}-${expanded ? "x" : "c"}-${i}`}
                className={`pointer-events-none absolute rounded-full${
                  expanded ? " cluster-bar-fan-in" : ""
                }`}
                style={{
                  left: "100px",
                  top: `${b.cy - h / 2}px`,
                  width: "6px",
                  height: `${h}px`,
                  marginLeft: "-3px",
                  backgroundColor: "#595959",
                  ...(expanded
                    ? {
                        ["--fan" as string]: `${i * ROW_H}px`,
                        animationDelay: `${i * 35}ms`,
                      }
                    : null),
                }}
              />
            );
          });
        })}

        {/* 이벤트 카드 — anchor 기준 secOffset 위치, ±VISIBLE_MINUTES 만 렌더.
            카드 픽셀 위치가 카드 높이(60px)보다 가까우면 묶어서 카운트 배지로 표시.
            줌인하면 자연스럽게 분리됨. */}
        {(() => {
          const eventCard = (
            occ: Occ,
            y: number,
            count: number,
            label: string,
            clusterKey?: string,
            fanIndex?: number,
            ownerKey?: string,
          ) => (
            <div
              key={`E${occ.key}${fanIndex != null ? "-x" : ""}`}
              data-cluster-key={clusterKey}
              data-cluster-owner={ownerKey}
              data-event-ms={occ.ms}
              data-dur-sec={occ.durSec}
              data-occ-key={occ.key}
              data-content-y={y}
              data-time-y={yOf(occ.secOffset)}
              className={`absolute flex items-center${
                fanIndex != null ? " cluster-card-fan-in" : ""
              }`}
              style={{
                left: "100px",
                top: `${y}px`,
                transform: "translateY(-50%)",
                gap: "12px",
                marginLeft: "12px",
                // 카드 위에서도 드래그가 통과하도록 stopPropagation 하지 않음.
                // 탭 판정은 컨테이너 pointerUp에서 data-event-ms / data-cluster-key로 한다.
                // clusterKey가 있으면(접힌 묶음) 탭 시 펼치고, 없으면 그 시각으로 이동.
                pointerEvents: "auto",
                cursor: "pointer",
                // 펼칠 때 anchorY 에서 각자 위치로 부채처럼 펼쳐지는 진입 애니메이션.
                ...(fanIndex != null
                  ? {
                      ["--fan" as string]: `${fanIndex * ROW_H}px`,
                      animationDelay: `${fanIndex * 35}ms`,
                    }
                  : null),
              }}
            >
              <div
                className="relative"
                style={{ width: "128px", height: "72px", flexShrink: 0 }}
              >
                {/* 겹친 이벤트일 때 뒤에 쌓인 카드 그래픽 — 사진 없이 그레이톤으로 가운데 정렬, 아래로 살짝 삐져나옴 */}
                {count > 1 && (
                  <>
                    <div
                      className="absolute rounded-md"
                      style={{ left: "8px", top: "8px", width: "112px", height: "72px", zIndex: 0, backgroundColor: "#D9D9D9" }}
                    />
                    <div
                      className="absolute rounded-md"
                      style={{ left: "4px", top: "4px", width: "120px", height: "72px", zIndex: 1, backgroundColor: "#BFBFBF" }}
                    />
                  </>
                )}
                {/* 앞쪽(대표) 썸네일 */}
                <div
                  className="absolute overflow-hidden rounded-md bg-neutral-900"
                  style={{
                    left: 0,
                    top: 0,
                    width: "128px",
                    height: "72px",
                    zIndex: 2,
                    // 펼친 상태에서 라인에 정렬해 선택된 멤버 표시.
                    ...(ownerKey != null && occ.key === selectedOccKey
                      ? { outline: "2px solid #1D6CEB", outlineOffset: "-1px" }
                      : null),
                  }}
                >
                  <FrozenImage
                    src={cameraSrc}
                    alt=""
                    className="h-full w-full"
                    style={{ objectFit: "cover", transform: "scale(1.1)" }}
                  />
                  {count > 1 && (
                    <span
                      className="absolute inline-flex items-center justify-center leading-none tabular-nums"
                      style={{
                        top: "4px",
                        left: "4px",
                        minWidth: "18px",
                        height: "18px",
                        padding: "0 5px",
                        borderRadius: "9px",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
          return clusters.map((cluster) => {
            const { key, secOffset, members } = cluster;
            const count = members.length;
            const anchorY = yOf(secOffset);
            const expanded = count > 1 && expandedClusters.has(key);

            if (!expanded) {
              return eventCard(
                cluster,
                anchorY,
                count,
                "움직임 감지",
                count > 1 ? key : undefined,
              );
            }

            // 펼친 상태 — 겹친 이벤트들을 아래로 나열.
            // 접힘 대표(members[0]=가장 오래된 멤버)와 맞추기 위해 맨 위(anchorY)에
            // 가장 오래된 멤버를 두고, 아래로 갈수록 최신 멤버를 나열한다.
            return (
              <div
                key={`EX${key}`}
                className="pointer-events-none absolute left-0 right-0"
                style={{ top: 0, height: 0 }}
              >
                {members.map((m, i) =>
                  eventCard(m, anchorY + i * ROW_H, 1, "움직임 감지", undefined, i, key),
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* 고정 파란 라인 + 현재 시간 라벨 */}
      <div
        className="pointer-events-none absolute left-0 right-0 flex items-center"
        style={{ top: `${lineY}px`, transform: "translateY(-50%)" }}
      >
        <span
          suppressHydrationWarning
          className="whitespace-nowrap leading-none"
          style={{
            paddingLeft: "20px",
            paddingRight: "4px",
            paddingTop: "5px",
            paddingBottom: "5px",
            // 화면에 고정된 흰색 배경 = 라인 아래로 지나가는 회색 라벨을 가리는 마스크.
            // (이 오버레이는 playbackMs로 위치가 변하지 않으므로 매 프레임 재래스터 없음)
            backgroundColor: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1D6CEB",
          }}
        >
          {currentTimeLabel}
        </span>
        <div
          className="flex-1"
          style={{
            height: "2px",
            backgroundColor: "#1D6CEB",
            marginRight: "20px",
          }}
        />
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
      {/* 타임라인 */}
      <div
        ref={timelineRef}
        className="relative flex flex-col overflow-hidden touch-pan-y select-none"
        style={{
          backgroundColor: "#FFFFFF",
          paddingTop: "12px",
          paddingBottom: "16px",
          cursor: "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* 스크롤 레일 (라벨 + 눈금) */}
        <div
          className="relative"
          style={{ height: "34px", transform: railTransform }}
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
                top: isMajor ? "20px" : "26px",
                width: "2px",
                height: isMajor ? "14px" : "8px",
                backgroundColor: isMajor ? "#797979" : "rgba(0,0,0,0.4)",
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
        {/* 중앙 화살표 — 타임라인 영역 하단에 붙임 */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 0 }}
        >
          <img src={`${BASE}/Polygon 1.svg`} alt="" width={9} height={8} />
        </div>
      </div>
      {/* 플레이어 컨트롤 */}
      <div
        className="flex items-center justify-center"
        style={{
          gap: "20px",
          padding: "12px 0",
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
        width: "48px",
        height: "48px",
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
        style={{ gap: "20px", padding: "12px 0" }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer rounded-full"
            style={{ width: "48px", height: "48px" }}
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
