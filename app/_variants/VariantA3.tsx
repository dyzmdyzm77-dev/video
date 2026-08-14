"use client";

// A-3안. VariantA(A-2안)를 그대로 복사해 출발점으로 삼았다(2026-08-14).
// 아직 내용 차이는 라벨("A-3안")뿐 — 여기서부터 갈라 나간다.

import { BASE } from "../basePath";
import { readScreenState, writeScreenState } from "../components/screenState";
import {
  requestCompareTarget,
  useCompareTarget,
} from "../components/compareTarget";
import {
  useDeviceLandscape,
  useRotatedInput,
} from "../components/deviceRotate";
import { toggleImmersive, useImmersive } from "../components/immersive";
import LandscapeVideo from "../components/LandscapeVideo";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  CameraFeed,
  GridSelectionOverlay,
  useGifFrameCanvas,
} from "../components/CameraFeed";
import EventCardFace, { formatEventTime } from "../components/EventCardFace";
import EventKindChip from "../components/EventKindChip";
import { useEventThumbs } from "../components/eventThumbs";
import VariantPicker from "../components/VariantPicker";
import { VARIANT_LABEL } from "../components/variantRoute";
import MoreSheet from "../components/MoreSheet";
import AiSearchSheet from "../components/AiSearchSheet";
import { VideoFitToast, useVideoFit } from "../components/VideoFitToast";
import { nextVideoFit, videoFitIcon } from "../components/videoFit";
import { useAutoHide } from "../components/useAutoHide";
import AndroidNav from "../components/AndroidNav";
import {
  useDeviceRatio,
  useDeviceWide,
  useDeviceWidth,
} from "../components/useDeviceWidth";
import { useListLayout } from "../components/useListLayout";
import { useGridAreaRatio } from "../components/useGridLayout";
import {
  MOTION_MIN_H,
  SIDE_PANEL_RATIO,
  SIDE_PANEL_W,
  THUMB_MAX_H,
  THUMB_MIN_H,
  autoGridCount,
  bestGridForCount,
  GRID_COUNT_OPTIONS,
  nearestGridCountIndex,
} from "../components/layoutRules";

const CAMERAS = [
  { label: "카메라 01", src: `${BASE}/cameras/cam1.gif` },
  { label: "카메라 02", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 03", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 04", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 05", src: `${BASE}/cameras/cam1.gif` },
  { label: "카메라 06", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 07", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 08", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 09", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 10", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 11", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 12", src: `${BASE}/cameras/cam1.gif` },
  { label: "카메라 13", src: `${BASE}/cameras/cam4.gif` },
  { label: "카메라 14", src: `${BASE}/cameras/cam3.gif` },
  { label: "카메라 15", src: `${BASE}/cameras/cam2.gif` },
  { label: "카메라 16", src: `${BASE}/cameras/cam1.gif` },
];

// 화면 개수(1~16)에서 cols×rows 를 고르는 건 layoutRules.ts 의
// bestGridForCount(count, ratio) 다 — 영상 영역 비율에 따라 같은 개수도
// 모양이 달라질 수 있어 고정 표를 안 쓴다.

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
function formatNow(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

export default function VariantA3({
  platform = "android",
  initialChrome = false,
  onHome,
  inCompare = false,
}: {
  platform?: "android" | "ios";
  initialChrome?: boolean;
  onHome?: () => void;
  /** 비교 프레임(왼쪽) 안에 떠 있는 사본인가. 켜면 이 안에서 고른 시안이
   *  '지금 보고 있는 안'이 아니라 '비교 대상'을 바꾼다 — 왼쪽에서 고른 게
   *  오른쪽을 바꿔 버리면 안 된다(사용자 지적). */
  inCompare?: boolean;
}) {
  // 안을 바꿔도 보던 화면 종류(다채널/단일 · 실시간/녹화)는 이어진다 —
  // 문서 루트에 남겨 두고 새로 뜨는 안이 물려받는다(components/screenState.ts).
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    () => readScreenState().single,
  );
  const [currentPage, setCurrentPage] = useState(0);
  const landscape = useDeviceLandscape();
  const immersive = useImmersive();
  const compareTarget = useCompareTarget();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  // 다채널 화면 개수 — 사용자가 '화면 구성'에서 직접 고르기 전엔 영상 영역
  // 비율(gridRatio) 기반 기본값을 쓴다(layoutRules.ts 의 autoGridCount). 그
  // 비율에서 가장 16:9 에 가까운 cols×rows 는 bestGridForCount 가 고른다.
  // videoAreaRef 는 GridView 의 슬라이드 섹션에 달아 실측한다 — 섹션 크기는
  // cols×rows 선택과 무관해서(그 안을 나누기만 하므로) 순환 의존이 없다.
  const [videoAreaRef, gridRatio] = useGridAreaRatio();
  // 사용자가 직접 고른 '한 화면에 볼 채널 수' — 기기 방향별로 따로 기억한다.
  // 눕혀 보면 16채널, 세로로 들면 8채널처럼 방향마다 알맞은 수가 다르다
  // (사용자 요청 2026-08-11, A-1 과 같은 사양). null 이면 그 방향은 '자동'.
  const [userCounts, setUserCounts] = useState<{
    portrait: number | null;
    landscape: number | null;
  }>({ portrait: null, landscape: null });
  // 방향별로 마지막에 잰 '자동' 개수. 시트는 두 방향을 한 화면에 같이 보여
  // 주는데, 지금 안 보고 있는 방향은 실측할 길이 없어 마지막 값을 쓴다.
  const autoCountSeen = useRef<{
    portrait: number | null;
    landscape: number | null;
  }>({ portrait: null, landscape: null });
  // 기기가 가로로 긴 상태인가 — 판정은 useDeviceWide 하나에 모아 뒀다
  // (데스크톱 미리보기와 실기기가 회전을 다르게 표현해서다. useDeviceWidth.ts).
  const orientKey: "portrait" | "landscape" = useDeviceWide()
    ? "landscape"
    : "portrait";
  const autoCount = autoGridCount(gridRatio);
  autoCountSeen.current[orientKey] = autoCount;
  const gridCount = userCounts[orientKey] ?? autoCount;
  // 시트의 두 슬라이더 시작값 — 방향마다 '지금 쓰이는 개수'.
  const sheetCounts = {
    portrait: userCounts.portrait ?? autoCountSeen.current.portrait ?? autoCount,
    landscape:
      userCounts.landscape ?? autoCountSeen.current.landscape ?? autoCount,
  };
  const [mode, setMode] = useState<"live" | "recording">(
    () => readScreenState().mode,
  );
  // 바뀔 때마다 남겨 둔다 — 다음에 뜨는 안이 같은 화면에서 시작하게.
  useEffect(() => {
    writeScreenState({ single: expandedIndex, mode });
  }, [expandedIndex, mode]);
  // 위아래 가짜 시스템 바 표시 여부. 기본은 숨긴 몰입 상태(LIVE 칩으로 토글).
  // 단 데스크톱 진입(initialChrome)이면 켠 채로 시작한다.
  const [chromeVisible, setChromeVisible] = useState(initialChrome);
  // 녹화 모드 REC 칩 — 예전엔 가짜 시스템 바(chromeVisible)를 같이 토글했는데,
  // 이제 시간바(플레이어 버튼+눈금 타임라인)만 숨긴다/보인다로 바뀐다. 기본은
  // 보임. 헤더의 REC+날짜 행은 이 상태와 무관하게 항상 남아 다시 누를 수 있다.
  const [timelineVisible, setTimelineVisible] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [playbackMs, setPlaybackMs] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // 배속(부호 포함): 1=기본, 2/4/16=빨리감기, 음수=되감기. 타임라인 진행 속도에 반영.
  const [playbackRate, setPlaybackRate] = useState(1);
  const [dateTimeOpen, setDateTimeOpen] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const toggleChrome = () => setChromeVisible((v) => !v);
  const toggleTimeline = () => setTimelineVisible((v) => !v);

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
    // '녹화영상'은 누를 때마다 날짜·시간 시트를 연다(사용자 결정 2026-08-14).
    // 예전엔 실시간에서 넘어올 때만 열려서, 이미 녹화 중이면 다시 눌러도 아무 일도
    // 없었다. 시점을 다시 고르는 게 이 탭의 일이라 매번 여는 게 맞다.
    // (시트는 지금 보던 시각에서 열린다 — initialMs 가 playbackMs 를 먼저 본다.)
    if (m === "recording") {
      setDateTimeOpen(true);
    } else if (m !== mode) {
      setMode(m);
      triggerTransitionSkeleton();
    }
  };
  const [now, setNow] = useState<Date | null>(null);

  // 화면 맞춤(원본비율·늘리기·채우기) 상태는 여기서 들고 아래로 내려 준다.
  // 세 화면(다채널·단일·가로)이 각자 useVideoFit 을 갖고 있으면, 회전할 때
  // 세로가 통째로 언마운트되면서 맞춤이 기본값으로 되돌아간다(A-1 과 동일).
  // 딤의 '더보기'(⋮) 시트. 다채널·단일·가로 딤이 모두 이 하나를 연다.
  const [moreOpen, setMoreOpen] = useState(false);
  // 딤의 AI 버튼이 여는 'AI 검색 기능' 시트(A-1 과 같은 사양).
  const [aiOpen, setAiOpen] = useState(false);
  const gridFitState = useVideoFit("fill");
  const videoFitState = useVideoFit("fill");

  const layoutDims = bestGridForCount(gridCount, gridRatio);
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

  // 가로 모드 — 지금은 영상만 보여준다(헤더·목록·탭바·시스템 바 전부 없음).
  // '영상만' 화면은 크게 보기(확대)일 때만이다.
  //
  // 회전(왼쪽으로 회전)은 그냥 가로 해상도로 바꾸는 것이지 확대가 아니다 —
  // 헤더·목록·하단 탭바가 그대로 있고, 그 폭에 맞춰 다시 배치될 뿐이다.
  // 예전엔 회전만 해도 여기로 빠져 영상만 남았는데, '확대 = 영상 최대화 /
  // 회전 = 방향 전환' 이라는 기준과 어긋났다(사용자 지적).
  //
  // 확대하면서 눕힌 경우엔 landscape 와 immersive 가 같이 켜지므로 여기로 온다.
  if (immersive) {
    return (
      <div className="app-safe-frame h-full w-full overflow-hidden bg-black">
        <LandscapeVideo
          cameras={CAMERAS}
          expandedIndex={expandedIndex}
          page={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          playbackMs={playbackMs}
          driveByPlayback={mode === "recording"}
          onGallery={() => setSheetOpen(true)}
          onMore={() => setMoreOpen(true)}
          onAi={() => setAiOpen(true)}
          // A-3: 가로 딤도 세로와 같은 재배치 — 크게 보기 우하단 원.
          swapAiZoom
          // AI·크게 보기를 시간바 아래 가운데 줄로 옮겼다 — 딤 좌우 아래 원은 끈다.
          showOverlayAi={false}
          showOverlayZoom={false}
          // 실시간/녹화를 칩 두 개로 — 고른 쪽만 흰 배경 + 검정 글자.
          statusStyle="chips"
          // 시간바를 끄는 동안엔 딤 UI 를 걷어 시간바만 남긴다.
          scrubbing={isScrubbing}
          // 딤 위 UI 좌우 여백 40 — A-1 가로와 같은 값으로(사용자 지정).
          edgeInset={40}
          // 이 층(시간바 + 그 아래 아이콘 줄)은 이 값에서 12 를 뺀 만큼 뜬다.
          // 32 → 아이콘 줄 아래 마진 20(사용자 지정 2026-08-14). 시간바는 그
          // 아이콘 줄 위에 얹히므로 자연히 더 올라간다.
          bottomInset={32}
          // 전환 스켈레톤 — 세로와 같은 상태를 그대로 넘긴다.
          loading={expandedIndex !== null ? videoLoading : gridLoading}
          onExpand={handleExpand}
          onBack={handleBack}
          title={VARIANT_LABEL["a3"]}
          subtitle="에스원 본사 · N1234567"
          // 좌우 스와이프로 페이지 넘김(세로 다채널과 같은 사양).
          onPageChange={setCurrentPage}
          onTitleClick={() => setVariantPickerOpen(true)}
          mode={mode}
          setMode={handleSetMode}
          // timeLabel 을 안 넘긴다 — 딤 상단의 시각 표시를 없앤다(사용자 결정
          // 2026-08-14). 시각은 영상 위 배지에 있어서 둘이 겹쳤고, 칩 옆에 시각이
          // 붙어 있으면 가운데 정렬도 칩 기준이 아니라 '칩+시각' 기준이라
          // 칩이 왼쪽으로 밀려 보였다. 빼면 칩만 남아 정확히 가운데에 온다.
          // 세로 토글과 같은 말로 — 가로만 '녹화'라 어긋났다(사용자 지적).
          recordingLabel="녹화영상"
          // 딤 헤더는 계약번호(지점명) 없이 '뒤로가기 + 이름'. 단일은 카메라 이름,
          // 다채널은 위 title 과 같은 장소명을 그대로 쓴다(사용자 지적: 다채널에
          // 리터럴을 박아 뒀더니 세로 헤더와 말이 달랐다).
          singleHeaderCamera
          // 딤 농도·칩 위치·페이지 점은 LandscapeVideo 기본값을 그대로 쓴다
          // — 가로 화면은 세 안이 같아야 해서 그쪽에 모아 뒀다.
          // 화면 맞춤은 세로에서 쓰던 상태를 그대로 이어받는다(회전해도 유지).
          fit={expandedIndex !== null ? videoFitState.fit : gridFitState.fit}
          onFitCycle={
            expandedIndex !== null ? videoFitState.cycle : gridFitState.cycle
          }
          // 플레이어·시간바를 딤 색에 맞춰 넘긴다(overlay) — 흰 바를 걷어
          // 영상이 비치게 한다.
          controlsOnDim
          // 아래는 시간바만, 플레이어 버튼 5개는 화면 한가운데로(사용자 지정).
          // 둘을 따로 얹으므로 RecordingControls 를 두 벌 쓴다 — 각자 자기 몫만
          // 그리게 timelineOnly / playerOnly 로 갈라 준다.
          controls={
            // 실시간에도 아래 아이콘 줄은 나온다(사용자 지적: 녹화에만 있었다).
            // 시간바만 녹화 전용이다.
            <div style={{ paddingLeft: "10px", paddingRight: "10px" }}>
              {mode === "recording" && (
              <RecordingControls
                overlay
                timelineOnly
                now={now}
                onScrubbingChange={setIsScrubbing}
                playbackMs={playbackMs}
                setPlaybackMs={setPlaybackMs}
                onOpenDateTime={() => setDateTimeOpen(true)}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onPlay={() => setIsPlaying(true)}
                onSpeedChange={setPlaybackRate}
              />
              )}
              {/* 시간바 아래 아이콘 줄 — AI · 메뉴 · 움직임 감지 셋을 가운데로
                  모은다(사용자 지정 2026-08-14). 원 모양은 딤의 다른 원 버튼
                  (34 · 반투명 검정 + 흰 테두리)과 같은 규격이다.
                  AI 는 원래 딤 왼쪽 아래에 있던 그 버튼이라, 그쪽은 껐다
                  (showOverlayAi={false}) — 안 끄면 같은 버튼이 두 개가 된다. */}
              <div
                className="pointer-events-auto flex items-center justify-between transition-opacity duration-150 ease-out"
                // 시간바와 붙인다 — 12 → 4(사용자 지정 2026-08-14). 시간바 자체가
                // 아래 여백(paddingBottom 12)을 갖고 있어 실제로는 그만큼 더 뜬다.
                // 자리를 둘로 나눈다: AI·메뉴·움직임 감지는 왼쪽, 축소는 오른쪽
                // (사용자 지정). 좌우 여백은 30 을 더 줘 딤의 다른 요소(장소명·
                // 우상단 아이콘)가 쓰는 40 에 맞춘다 — 감싼 층이 이미 10 을 갖고
                // 있어서 30 만 더하면 된다. 화면 끝에 붙으면 손가락이 걸린다.
                style={{
                  paddingTop: "4px",
                  paddingLeft: "30px",
                  paddingRight: "30px",
                  // 시간바를 끄는 동안엔 같이 걷는다(사용자 지정 2026-08-14).
                  // 이 줄은 시간바와 한 층에 있어서, 그 층이 스크럽 중에도 남는
                  // 규칙(keepWhileScrubbing)을 그대로 물려받아 혼자 남아 있었다.
                  opacity: isScrubbing ? 0 : 1,
                  pointerEvents: isScrubbing ? "none" : "auto",
                }}
              >
                {(() => {
                  const btn = (b: {
                    key: string;
                    label: string;
                    src: string;
                    onClick?: () => void;
                  }) => (
                    <button
                      key={b.key}
                      type="button"
                      aria-label={b.label}
                      onClick={b.onClick}
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: "34px",
                        height: "34px",
                        // 테두리는 없다(사용자 지정) — 배경이 회색 70% 라 원 모양이
                        // 이미 잡히고, 흰 선까지 있으면 아이콘보다 테두리가 먼저 보였다.
                        // 회색 55%(사용자 지정 2026-08-14). 반투명 검정 0.35 → 불투명
                        // 회색 → 0.7 을 거쳐 여기로 왔다. 톤은 앱에 이미 쓰는
                        // 회색(#757575, 녹화 배지 배경)이고 알파만 조절한다.
                        backgroundColor: "rgba(117,117,117,0.75)",
                      }}
                    >
                      <img
                        src={b.src}
                        alt=""
                        className="h-7 w-7"
                        style={{ filter: "brightness(0) invert(1)" }}
                      />
                    </button>
                  );
                  return (
                    <>
                      <div className="flex items-center" style={{ gap: "16px" }}>
                        {btn({ key: "ai", label: "AI 검색", src: `${BASE}/ai_Icon.svg`, onClick: () => setAiOpen(true) })}
                        {btn({ key: "menu", label: "메뉴", src: `${BASE}/nav/menu.svg` })}
                        {/* 움직임 감지는 녹화에만 — 실시간엔 지나간 이벤트가 없다
                            (사용자 지적 2026-08-14). */}
                        {mode === "recording" &&
                          btn({ key: "motion", label: "움직임 감지", src: `${BASE}/Type=Line.svg` })}
                      </div>
                      {/* 크게 보기 ↔ 원래 크기로. 가로에서만 뜨는 줄이라 늘
                          '원래 크기로'다. 딤 오른쪽 아래에 있던 그 버튼이다. */}
                      {btn({ key: "zoom", label: "원래 크기로", src: `${BASE}/zoom_out.svg`, onClick: toggleImmersive })}
                    </>
                  );
                })()}
              </div>
            </div>
          }
          centerControls={
            mode === "recording" ? (
              <RecordingControls
                overlay
                playerOnly
                now={now}
                onScrubbingChange={setIsScrubbing}
                playbackMs={playbackMs}
                setPlaybackMs={setPlaybackMs}
                onOpenDateTime={() => setDateTimeOpen(true)}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onPlay={() => setIsPlaying(true)}
                onSpeedChange={setPlaybackRate}
              />
            ) : null
          }
        />
        {/* 화면 구성 시트는 가로에서도 세로와 똑같이 뜬다. 예전엔 이 분기가
            시트보다 먼저 return 해서, 딤의 갤러리 버튼을 눌러도 열릴 시트가
            아예 렌더되지 않았다. */}
        <LayoutConfigSheet
          open={sheetOpen}
          selected={userCounts}
          resolved={sheetCounts}
          onClose={() => setSheetOpen(false)}
          onPreview={(counts) => {
            setUserCounts(counts);
            setCurrentPage(0);
          }}
        />
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
        <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
        <AiSearchSheet open={aiOpen} onClose={() => setAiOpen(false)} />
        <VariantPicker
          open={variantPickerOpen}
          current={
            inCompare && compareTarget !== "asis"
              ? compareTarget
              : "a3"
          }
          onSelect={inCompare ? requestCompareTarget : undefined}
          platform={platform}
          onClose={() => setVariantPickerOpen(false)}
        />
      </div>
    );
  }

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
          onOpenMore={() => setMoreOpen(true)}
          onOpenAi={() => setAiOpen(true)}
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
          timelineVisible={timelineVisible}
          onToggleTimeline={toggleTimeline}
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
          videoAreaRef={videoAreaRef}
          fitState={gridFitState}
        />
      ) : (
        <ExpandedView
          index={expandedIndex}
          onBack={handleBack}
          onOpenMore={() => setMoreOpen(true)}
          onOpenAi={() => setAiOpen(true)}
          onSelect={setExpandedIndex}
          dateLabel={dateLabel}
          mode={mode}
          setMode={handleSetMode}
          onToggleChrome={toggleChrome}
          chromeVisible={chromeVisible}
          timelineVisible={timelineVisible}
          onToggleTimeline={toggleTimeline}
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
          fitState={videoFitState}
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
        selected={userCounts}
        resolved={sheetCounts}
        onClose={() => setSheetOpen(false)}
        onPreview={(counts) => {
          setUserCounts(counts);
          setCurrentPage(0);
        }}
      />

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
        <AiSearchSheet open={aiOpen} onClose={() => setAiOpen(false)} />
      <VariantPicker
        open={variantPickerOpen}
        current={
            inCompare && compareTarget !== "asis"
              ? compareTarget
              : "a3"
          }
          onSelect={inCompare ? requestCompareTarget : undefined}
        platform={platform}
        onClose={() => setVariantPickerOpen(false)}
      />

      {/* 하단 탭바 — 라이브·녹화 모드 모두에서 표시. */}
      <nav className="mx-auto mt-auto w-full border-t border-[#EBEBEB] bg-white">
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
  onOpenMore,
  onOpenAi,
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
  timelineVisible = true,
  onToggleTimeline,
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
  videoAreaRef,
  fitState,
}: {
  onExpand: (i: number) => void;
  currentPage: number;
  setCurrentPage: (fn: (prev: number) => number) => void;
  dateLabel: string;
  onOpenSheet: () => void;
  /** 딤의 더보기(⋮) — 안이 더보기 시트를 연다. */
  onOpenMore: () => void;
  onOpenAi: () => void;
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
  timelineVisible?: boolean;
  onToggleTimeline?: () => void;
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
  // 화면 개수(1~16)에서 cols×rows 를 고르는 데 쓰는 '영상 영역 비율' 실측용.
  // 이 섹션(헤더·하단 컨트롤 제외 나머지)에 단다 — 크기가 cols×rows 선택과
  // 무관해서(그 안을 나누기만 하므로) 순환 의존이 없다.
  videoAreaRef?: React.RefObject<HTMLElement | null>;
  // 화면 맞춤 상태. 회전(가로 전환)에도 유지돼야 해서 VariantA 가 들고 내려 준다.
  fitState: ReturnType<typeof useVideoFit>;
}) {
  const [gridSelected, setGridSelected] = useState(false);
  // 다채널 타일 맞춤 모드 — 딤 상태의 '화면 맞춤' 버튼으로 돌린다. 순서·아이콘·
  // 문구·기본값은 단일 화면과 같은 곳(components/videoFit.ts)에서 온다.
  // 상태 자체는 VariantA 가 들고 있다(회전해도 유지되도록) — 여기선 받아 쓴다.
  const { fit: gridFit, cycle: cycleGridFit, toast: gridFitToast, toastKey: gridFitToastKey } =
    fitState;
  // 딤 자동 숨김 — 마지막 조작이 끝난 시점부터 5초. 규칙은 useAutoHide 참고.
  const hideGrid = useCallback(() => setGridSelected(false), []);
  const gridAuto = useAutoHide(gridSelected, hideGrid);
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const swipedRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


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
    // 누르고 있는 동안 딤을 붙잡는다(길게 누르기·드래그 중 안 사라지게).
    gridAuto.hold();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // 손을 뗀 시점부터 5초를 다시 센다. 아래 조기 반환들보다 먼저 놓아야
    // 붙잡은 상태가 남아 딤이 영영 안 꺼지는 일이 없다.
    gridAuto.release();
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
    gridAuto.keepAlive();
    if (dx < 0) {
      setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
    } else {
      setCurrentPage((p) => Math.max(p - 1, 0));
    }
  };

  // 타일이 캔버스로 프레임을 직접 그리는 건 스크럽·일시정지 때뿐이다. 재생 중엔
  // GIF 가 자체 재생되므로 playbackMs 가 쓰이지 않는다 — 그때 null 을 넘겨야
  // memo 된 CameraFeed 가 150ms 틱마다 타일 전부를 재조정하지 않는다.
  const gridDriven = mode === "recording" && (isScrubbing || !isPlaying);

  return (
    <>
      {/* 상단 헤더(타이틀+실시간/녹화 탭) — 녹화 모드에서도 항상 표시.
          시스템 바를 끄는 몰입 모드에선 헤더 위 16px 여백도 함께 제거해 위로 붙인다. */}
      <header
        className="flex flex-none items-center px-5"
        style={{ height: "56px", marginTop: chromeVisible ? "16px" : "0px" }}
      >
        <div className="flex w-full items-center justify-between">
          {/* 장소명 + 지점명을 한 버튼으로 묶는다 — 첫 줄만 버튼이면 아래
              지점명이나 화살표 옆 빈 곳을 눌러도 안 먹는다(사용자 지적). */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onOpenVariantPicker}
              className="flex flex-col items-start gap-[2px] pb-1 pr-3 text-left"
            >
              <span className="flex items-center gap-1.5 text-[18px] font-bold leading-none text-neutral-900">
                {VARIANT_LABEL["a3"]}
                <ChevronDownIcon className="h-6 w-6 text-[#262626]" />
              </span>
              <span className="text-[12px] leading-none" style={{ color: "#BFBFBF" }}>
                에스원 본사 · N1234567
              </span>
            </button>
          </div>

          <ModeToggle mode={mode} setMode={setMode} />
        </div>
      </header>

      <section
        ref={videoAreaRef}
        className="relative min-h-0 flex-1 touch-pan-y select-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
                          paused={
                            isScrubbing || (mode === "recording" && !isPlaying)
                          }
                          playbackMs={gridDriven ? playbackMs : null}
                          driveByPlayback={gridDriven}
                          fit={gridFit}
                          // 스와이프용으로 모든 페이지를 렌더하지만 GIF 는 보이는
                          // 페이지에서만 돌린다(2×4 면 16→8, 3×3 이면 18→9).
                          animate={pageIdx === currentPage}
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
          onMore={onOpenMore}
          onAi={onOpenAi}
          onFit={cycleGridFit}
          fit={gridFit}
          auto={gridAuto}
          // A-3: AI 는 우상단 아이콘 줄로, 크게 보기는 우하단 원 버튼으로 맞바꾼다.
          swapAiZoom
        />
        <VideoFitToast text={gridFitToast} toastKey={gridFitToastKey} />
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
          timelineVisible={timelineVisible}
          onToggleTimeline={onToggleTimeline}
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
  fit = "fill",
}: {
  c: (typeof CAMERAS)[number];
  paused: boolean;
  playbackMs?: number | null;
  driveByPlayback?: boolean;
  // 딤 상태의 '화면 맞춤' 버튼이 고르는 값. fill=가득 채움(비율 무시),
  // contain=원본 비율 유지·빈 공간 검정, cover=원본 비율 유지·크롭.
  // CameraFeed(그리드 타일)와 달리 이 컴포넌트는 원본 비율을 그대로 보여줄 일이
  // 있어(contain) object-fit 을 상수로 안 두고 prop 으로 받는다.
  fit?: "fill" | "contain" | "cover";
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
  return (
    <>
      <img
        src={c.src}
        alt={c.label}
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: fit,
          opacity: driving ? 0 : paused ? 0 : 1,
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: fit,
          opacity: driving ? 1 : paused ? 1 : 0,
        }}
      />
      {/* 라벨 — 카메라 이름, 왼쪽 위 구석. 한동안 시각을 띄웠다가(상단 가운데 →
          왼쪽 아래 → 상단 가운데 → 딤) 원래대로 돌아왔다(사용자 지정 2026-08-14).
          시각은 영상 아래 날짜 바가 맡는다. */}
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
  onOpenMore,
  onOpenAi,
  onSelect,
  dateLabel,
  mode,
  setMode,
  onToggleChrome,
  chromeVisible = true,
  timelineVisible = true,
  onToggleTimeline,
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
  fitState,
}: {
  index: number;
  onBack: () => void;
  /** 딤의 더보기(⋮) — 안이 더보기 시트를 연다. */
  onOpenMore: () => void;
  onOpenAi: () => void;
  onSelect: (i: number) => void;
  dateLabel: string;
  mode: "live" | "recording";
  setMode: (m: "live" | "recording") => void;
  onToggleChrome: () => void;
  chromeVisible?: boolean;
  timelineVisible?: boolean;
  onToggleTimeline?: () => void;
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
  // 화면 맞춤 상태. 회전(가로 전환)에도 유지돼야 해서 VariantA 가 들고 내려 준다.
  fitState: ReturnType<typeof useVideoFit>;
}) {
  const cam = CAMERAS[index];
  const [showControls, setShowControls] = useState(false);
  // 영상 맞춤 모드 — 딤(showControls) 상태의 화면맞춤 버튼으로 돌린다.
  //   fill    : 영상 뷰 영역을 가득 채운다(원본 비율 무시, 늘어남/찌그러짐).
  //   contain : 원본 비율 그대로, 빈 공간은 검정으로 채운다(레터박스/필러박스).
  //   cover   : 원본 비율 유지한 채 가로나 세로 중 짧은 쪽 기준으로 최대로 키워
  //             넘치는 쪽을 자른다(크롭) — object-fit: cover 와 같다.
  // 순서·아이콘·문구는 components/videoFit.ts 한 곳에서 온다.
  // 상태 자체는 VariantA 가 들고 있다(회전해도 유지되도록) — 여기선 받아 쓴다.
  const { fit: videoFit, cycle: cycleVideoFit, toast: fitToast, toastKey: fitToastKey } =
    fitState;
  // 딤 자동 숨김 — 마지막 조작이 끝난 시점부터 5초. 규칙은 useAutoHide 참고.
  const hideControls = useCallback(() => setShowControls(false), []);
  const controlsAuto = useAutoHide(showControls, hideControls);
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
  // A-3: 녹화 모드에서 카메라 목록/움직임 감지를 탭으로 가르지 않는다 — 플레이어
  // (5버튼) 아래에 움직임 감지(가로 시간바), 그 아래 카메라 목록을 쌓아 항상 같이
  // 보인다(사용자 결정 2026-08-14). 단, 오른쪽 사이드 패널(1080+)은 A-2 그대로
  // 탭 + 세로 타임라인을 유지한다(사용자 결정: "오른쪽 패널은 기존 유지").
  // recTab 은 그 사이드 패널 전용 상태다.
  const [recTab, setRecTab] = useState<"list" | "motion">("list");
  // 아래 스트립에서 '움직임 감지' 탭을 보고 있나(사용자 결정 2026-08-14 — 탭이
  // 아래에도 생겼다). 실시간엔 감지 탭 자체가 없으니 녹화일 때만이다.
  const motionTab = mode === "recording" && recTab === "motion";
  // 가로로 넓적한 화면(가로/세로 >= SIDE_PANEL_RATIO)이면 카메라 목록·움직임 감지가
  // 화면 아래 가로 스트립이 아니라 오른쪽 끝 세로 패널로 간다(탭도 패널 안 위쪽).
  // 그런 화면은 영상이 세로에 갇혀 있어서 하단 스트립이 영상 폭을 크게 깎는다 —
  // 근거와 실측은 layoutRules.ts 의 SIDE_PANEL_RATIO 주석 참고.
  const sidePanel = useDeviceRatio() >= SIDE_PANEL_RATIO;
  // 레이아웃 기준은 app/components/layoutRules.ts 참고 — 단일 영상은 폭과 무관하게
  // 항상 16:9, 목록 방향은 안들이 공유하는 useListLayout 이 정한다.
  //
  // pin(두 번째 인자)을 켠다 — 가로 한 줄일 때 목록 영역을 MOTION_MIN_H 로 못 박고
  // 남는 세로는 영상이 가져간다(layoutRules.ts 의 집안 규칙, 사용자 지정 2026-08-14).
  // 껐을 때는 목록이 flex-1 로 남는 세로를 다 먹어, 플레이어·시간바가 없는 실시간
  // 쪽 타일만 훨씬 커졌다(750×832 에서 423×238 vs 녹화 230×129).
  // 못 박으면 두 모드의 목록 스트립이 108 로 같아진다. 세로 2열일 땐 pin 이
  // 관여하지 않는다 — 그때 타일 크기는 영역 폭에서 나오므로 두 모드가 자동으로 같다.
  //
  // 사이드 패널일 땐 이 훅이 할 일이 없다(가로/세로 스트립 자체가 없으니까). 인자를
  // 빼서 넘기면 훅이 이전 배치에서 걸어 둔 인라인 값들을 걷어내고 손을 뗀다.
  const [listAreaRef, listRowRef, listWide, videoAreaRef] = useListLayout(
    sidePanel ? undefined : MOTION_MIN_H,
    true,
  );
  // 카메라 목록 — 선택 카메라 타일을 가운데로 맞출 때 쓴다(가로면 좌우, 세로면 위아래).
  const listScrollRef = useRef<HTMLDivElement>(null);
  // 목록 타일 하나. 아래 가로 스트립과 오른쪽 세로 패널이 같은 걸 쓴다 — 타일 자체는
  // 어디 놓이든 같고(16:9 · 라벨 · 선택 표시), 크기를 어떻게 잡느냐만 다르다.
  const cameraTile = (c: (typeof CAMERAS)[number], i: number, cls: string) => (
    <button
      key={i}
      type="button"
      onClick={() => onSelect(i)}
      data-selected={i === index ? "true" : undefined}
      className={cls}
      style={{ borderRadius: "4px" }}
    >
      <FrozenImage
        src={c.src}
        alt={c.label}
        className="absolute inset-0 h-full w-full"
        style={
          { objectFit: "cover" }
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
            style={{ boxShadow: "inset 0 0 0 2px #1D6CEB", borderRadius: "4px" }}
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
  );
  // 목록이 보일 때(진입·탭 전환·선택 변경·레이아웃 전환) 선택된 카메라 타일을 스크롤
  // 가운데로 맞춘다. 다채널에서 더블클릭해 단일로 들어오면 그 카메라가 가운데에 온다.
  //
  // 움직이는 방식이 두 가지다:
  //   · 선택이 바뀐 경우 — 사용자가 방금 고른 결과라 눈으로 따라갈 수 있어야 한다.
  //     부드럽게(smooth) 한 번만 움직인다. 위 큰 영상도 300ms 로 미끄러지므로 결이 같다.
  //   · 그 외(진입·탭 전환·배치 전환) — 이미 가운데 있어야 하는 상태라 즉시 맞춘다.
  //     이때는 레이아웃이 정착하는 동안(영상 16:9 계산 등) 여러 번 다시 맞춰야 한다.
  //
  // 예전엔 두 경우를 안 나누고 scrollLeft 를 직접 대입했다. 그래서 선택할 때마다
  // 즉시 점프했고, 그 점프가 rAF 2회 + ResizeObserver 1.2초 동안 여러 번 겹쳐
  // "띡 띡" 끊겨 보였다.
  const prevIndexRef = useRef(index);
  useEffect(() => {
    const selectionChanged = prevIndexRef.current !== index;
    prevIndexRef.current = index;
    // 목록 가시성 — 세로/가로 스트립은 항상 보인다(적층). 사이드 패널은 A-2 처럼
    // 탭이라 '카메라 목록' 탭일 때만 보인다.
    const listVisible = !sidePanel || mode === "live" || recTab === "list";
    if (!listVisible) return;
    const el = listScrollRef.current;
    if (!el) return;
    const center = (behavior: ScrollBehavior) => {
      const tile = el.querySelector<HTMLElement>('[data-selected="true"]');
      if (!tile) return;
      const tr = tile.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      // 진입 직후엔 영상(16:9)·목록 높이가 아직 안 정해져 타일 폭이 0/부정확할 수 있다.
      if (tr.width === 0 || er.width === 0) return;
      if (el.scrollWidth > el.clientWidth + 1) {
        // 가로 한 줄: 좌우 가운데
        const left = tr.left - er.left + el.scrollLeft;
        const target = Math.max(0, left - (el.clientWidth - tr.width) / 2);
        // 이미 제자리면 건너뛴다 — 안 그러면 정착 중 재보정이 애니메이션을 끊는다.
        if (Math.abs(el.scrollLeft - target) < 1) return;
        el.scrollTo({ left: target, behavior });
      } else if (el.scrollHeight > el.clientHeight + 1) {
        // 세로 2열: 위아래 가운데
        const top = tr.top - er.top + el.scrollTop;
        const target = Math.max(0, top - (el.clientHeight - tr.height) / 2);
        if (Math.abs(el.scrollTop - target) < 1) return;
        el.scrollTo({ top: target, behavior });
      }
    };

    if (selectionChanged) {
      // 움직임을 줄이는 설정이면 부드러운 스크롤을 쓰지 않는다.
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const raf = requestAnimationFrame(() => center(reduce ? "auto" : "smooth"));
      return () => cancelAnimationFrame(raf);
    }

    // 다음 두 프레임에 걸쳐 맞추고(레이아웃/페인트 직후), 정착 중 크기 변화(영상 16:9
    // 계산·툴바 접힘 등)에도 잠깐 동안 다시 맞춘다.
    const instant = () => center("auto");
    const raf1 = requestAnimationFrame(() => {
      instant();
      requestAnimationFrame(instant);
    });
    const ro = new ResizeObserver(instant);
    ro.observe(el);
    const stop = setTimeout(() => ro.disconnect(), 1200);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(stop);
      ro.disconnect();
    };
  }, [index, mode, recTab, listWide, sidePanel]);
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

  // ── 단일 영상 줌 ─────────────────────────────────────────────────────────
  // 두 손가락으로 벌리면 확대, 오므리면 축소(사용자 요청 2026-08-14).
  // 확대된 동안은 한 손가락 드래그가 카메라 넘김이 아니라 '이동(pan)'이 된다 —
  // 확대해 놓고 구석을 보려는 게 자연스러운 다음 동작이라서다.
  // 데스크톱에서는 휠(트랙패드 핀치 포함)로도 조절된다.
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 5;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // 화면에 닿아 있는 포인터들. 두 개가 되면 그 사이 거리로 배율을 잡는다.
  const ptsRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const zoomBoxRef = useRef<HTMLDivElement>(null);
  // 확대한 만큼만 움직일 수 있게 가둔다 — 안 그러면 영상이 화면 밖으로 빠진다.
  const clampPan = (z: number, x: number, y: number) => {
    const el = zoomBoxRef.current;
    if (!el) return { x: 0, y: 0 };
    const maxX = (el.clientWidth * (z - 1)) / 2;
    const maxY = (el.clientHeight * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };
  const applyZoom = (z: number, nextPan?: { x: number; y: number }) => {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    setZoom(clamped);
    const p = nextPan ?? pan;
    setPan(clamped <= 1 ? { x: 0, y: 0 } : clampPan(clamped, p.x, p.y));
    // 배율 토스트 — 되감기·배속과 같은 토스트를 쓴다(사용자 요청 2026-08-14).
    // 원래 크기면 숫자 대신 '원본'이라고 적는다.
    showSeekToast(
      clamped <= ZOOM_MIN ? "원본" : `${clamped.toFixed(1)}X`,
    );
  };
  // 카메라를 바꾸거나 실시간↔녹화로 넘어가면 원래 크기로 돌린다 —
  // 확대한 채로 다른 화면에 들어가면 어디를 보는지 알 수 없다.
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index, mode]);

  // 확대 중 이동(pan)한 직후인가 — 그 뒤 따라오는 click(딤 토글)을 막는다.
  const pannedRef = useRef(false);
  const handleVideoClick = () => {
    if (swipedRef.current) return;
    if (pannedRef.current) return;
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
    ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptsRef.current.size === 2) {
      // 두 번째 손가락이 닿는 순간 — 그때의 거리와 배율을 기준으로 잡는다.
      const [a, b] = [...ptsRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      panRef.current = null;
      swipeRef.current = null;
      return;
    }
    if (zoom > 1) {
      // 확대 중엔 한 손가락 드래그가 이동(pan)이다 — 카메라 넘김이 아니다.
      panRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      swipeRef.current = null;
    } else {
      swipeRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
    // 누르고 있는 동안 딤을 붙잡는다(길게 누르기·드래그 중 안 사라지게).
    controlsAuto.hold();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!ptsRef.current.has(e.pointerId)) return;
    ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pinch = pinchRef.current;
    if (pinch && ptsRef.current.size >= 2) {
      const [a, b] = [...ptsRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.dist > 0) applyZoom((pinch.zoom * dist) / pinch.dist);
      return;
    }
    const p = panRef.current;
    if (p && zoom > 1) {
      const nx = p.px + (e.clientX - p.x);
      const ny = p.py + (e.clientY - p.y);
      // 조금이라도 움직였으면 '이동'으로 친다 — 뒤따라오는 click(딤 토글)을 막는다.
      if (Math.abs(e.clientX - p.x) > 4 || Math.abs(e.clientY - p.y) > 4) {
        pannedRef.current = true;
      }
      setPan(clampPan(zoom, nx, ny));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    ptsRef.current.delete(e.pointerId);
    if (ptsRef.current.size < 2) pinchRef.current = null;
    if (ptsRef.current.size === 0) {
      panRef.current = null;
      if (pannedRef.current) {
        setTimeout(() => {
          pannedRef.current = false;
        }, 50);
      }
    }
    // 손을 뗀 시점부터 5초를 다시 센다. 아래 조기 반환들보다 먼저 놓아야
    // 붙잡은 상태가 남아 딤이 영영 안 꺼지는 일이 없다.
    controlsAuto.release();
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
    controlsAuto.keepAlive();
    if (dx < 0) {
      if (index < CAMERAS.length - 1) onSelect(index + 1);
    } else {
      if (index > 0) onSelect(index - 1);
    }
  };

  // 데스크톱 — 휠(트랙패드 핀치 포함)로도 조절한다. 목업을 마우스로 볼 때 필요하다.
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 2) return;
    applyZoom(zoom * (1 - e.deltaY / 300));
  };


  // 녹화 모드의 헤더 시간 라벨은 playbackMs(=사용자가 선택/스크럽한 시점) 기준이어야 함.
  // 라이브 모드는 현재 시간(dateLabel) 그대로 사용.
  const recordingDateLabel = playbackMs !== null
    ? (() => {
        const d = new Date(playbackMs);
        return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      })()
    : dateLabel;

  const headerBlock = (
    <>
      {/* 확대뷰 헤더 — 다채널 화면과 동일. 녹화 모드에서도 항상 표시 */}
      <header
        className="flex flex-none items-center px-5"
        style={{ height: "56px", marginTop: chromeVisible ? "16px" : "0px" }}
      >
        <div className="flex w-full items-center justify-between">
          {/* 장소명 + 지점명을 한 버튼으로 — 다채널 헤더와 같은 규칙. */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onBack}
              className="flex flex-col items-start gap-[2px] pb-1 pr-3 text-left"
            >
              <span className="flex items-center gap-1.5 text-[18px] font-bold leading-none text-neutral-900">
                {VARIANT_LABEL["a3"]}
                <ChevronDownIcon className="h-6 w-6 text-[#262626]" />
              </span>
              <span className="text-[12px] leading-none" style={{ color: "#BFBFBF" }}>
                에스원 본사 · N1234567
              </span>
            </button>
          </div>

          <ModeToggle mode={mode} setMode={setMode} />
        </div>
      </header>
    </>
  );
  const videoBlock = (
    <>
      {/* 큰 영상 — 더블클릭 시 다채널로 복귀. 크기 규칙은 globals.css 의
          .single-video-area/.single-video-box: 기본은 정확히 16:9(짧은 화면에선
          비율을 지킨 채 줄고 좌우에 검은 여백). 단 카메라 목록이 가로 스크롤이거나
          (useListLayout 이 상한을 풀어 목록 스트립(108) 아래로 남는 세로를 영상이
          가져감) 오른쪽 세로 패널일 땐(아래) 한도 없이 16:9 를 넘겨 늘어난다. */}
      <div
        ref={sidePanel ? undefined : videoAreaRef}
        className="single-video-area px-0"
        // 사이드 패널일 땐 왼쪽 컬럼의 남는 세로를 영상이 한도 없이 가져간다
        // (16:9 상한 해제). 크기는 globals.css 의 [data-side] 가 잡는다.
        // 훅이 쓰는 data-fill 과 속성을 나눠 둔 건, 배치가 바뀔 때 React 가 건 값과
        // 훅이 건 값이 서로를 못 지우고 남는 걸 막기 위해서다.
        data-side={sidePanel ? "true" : undefined}
        // 영역이 16:9 보다 낮아져도 폭은 꽉 채운다(사용자 결정 2026-08-14:
        // "그냥 다 채웠으면"). 규칙은 globals.css 의 [data-wide="fill"] 참고.
        // 사이드 패널은 data-side 가 이미 폭까지 채우므로 겹쳐 걸지 않는다.
        data-wide={sidePanel ? undefined : "fill"}
      >
        <div
          ref={zoomBoxRef}
          className="single-video-box relative cursor-pointer select-none overflow-hidden bg-neutral-900"
          // 확대 중엔 브라우저에 제스처를 넘기지 않는다 — 안 그러면 두 손가락
          // 벌리기가 페이지 확대로, 드래그가 스크롤로 새어 나간다.
          style={{ touchAction: zoom > 1 ? "none" : "pan-y" }}
          onClick={handleVideoClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* 줌 껍데기 — 확대·이동은 여기 한 겹에만 건다. 안쪽 슬라이드 띠는
              카메라 넘김(translateX)을 그대로 쓰므로 둘이 안 부딪힌다. */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
              // 손가락으로 조절하는 동안은 애니메이션을 걸지 않는다(따라오는 느낌이
              // 아니라 늦게 붙는 느낌이 된다). 손을 떼고 원래대로 돌아갈 때만 부드럽게.
              transition: pinchRef.current || panRef.current
                ? "none"
                : "transform 200ms ease-out",
            }}
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
                  fit={videoFit}
                />
              </div>
            ))}
          </div>
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
                // 버튼 좌우 패딩(6+6)이 예전 gap 12 를 대신한다 — 아이콘 사이
                // 간격은 그대로면서 손가락이 닿는 면적만 넓어진다.
                gap: "0px",
                pointerEvents: showControls ? "auto" : "none",
              }}
              // 버튼을 누르고 있는 동안 딤을 붙잡고, 떼는 순간부터 5초를 다시 센다.
              {...controlsAuto.holdProps}
              onClick={(e) => {
                e.stopPropagation();
                controlsAuto.keepAlive();
              }}
            >
              {/* 화면 맞춤 — 누를 때마다 가득 채우기(fill) → 원본 비율(contain,
                  빈 공간 검정) → 크롭(cover, 짧은 쪽 기준 확대) 순으로 돈다. */}
              <button
                type="button"
                aria-label="화면 맞춤"
                className="px-1.5 py-2"
                onClick={cycleVideoFit}
              >
                <img
                  src={videoFitIcon(BASE, nextVideoFit(videoFit))}
                  alt=""
                  className="h-7 w-7"
                />
              </button>
              {/* 크게 보기는 이 줄에서 빠졌다(A-3) — 우하단 원 버튼으로. */}
              <button
                type="button"
                aria-label="더보기"
                className="px-1.5 py-2"
                onClick={onOpenMore}
              >
                <img
                  src={`${BASE}/nav/etc.svg`}
                  alt=""
                  className="h-7 w-7"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </button>
            </div>
            {/* 크게 보기 — 딤 오른쪽 아래, 원래 AI 가 쓰던 원 버튼 자리(A-3 에서
                자리 맞바꿈). 원 스타일(반투명 검정 + 흰 테두리)은 그대로 물려받고,
                아이콘 원본이 진회색이라 흰색으로 뒤집는다. 다채널 딤
                (GridSelectionOverlay swapAiZoom)과 같은 자리·같은 크기다. */}
            <button
              type="button"
              aria-label="크게 보기"
              onClick={toggleImmersive}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                bottom: "12px",
                right: "16px",
                width: "34px",
                height: "34px",
                border: "1px solid rgba(255,255,255,0.35)",
                backgroundColor: "rgba(0,0,0,0.35)",
                pointerEvents: showControls ? "auto" : "none",
              }}
            >
              <img
                src={`${BASE}/zoom_in.svg`}
                alt=""
                className="h-6 w-6"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </button>
            {/* 딤 왼쪽 아래 — AI · 메뉴 · 움직임 감지. 가로 딤의 같은 줄과 구성을
                맞춘다(사용자 지정 2026-08-14). 오른쪽 아래 크게 보기와 같은
                높이(bottom 12)에 앉는다. 움직임 감지는 녹화에만 — 실시간엔
                지나간 이벤트가 없다. */}
            <div
              className="absolute flex items-center"
              style={{
                bottom: "12px",
                left: "16px",
                gap: "12px",
                pointerEvents: showControls ? "auto" : "none",
              }}
            >
              {[
                { key: "ai", label: "AI 검색", src: `${BASE}/ai_Icon.svg`, onClick: onOpenAi },
                { key: "menu", label: "메뉴", src: `${BASE}/nav/menu.svg`, onClick: undefined },
                ...(mode === "recording"
                  ? [{ key: "motion", label: "움직임 감지", src: `${BASE}/Type=Line.svg`, onClick: undefined }]
                  : []),
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  aria-label={b.label}
                  onClick={b.onClick}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "34px",
                    height: "34px",
                    backgroundColor: "rgba(117,117,117,0.75)",
                  }}
                >
                  <img
                    src={b.src}
                    alt=""
                    className="h-7 w-7"
                    style={{
                      filter:
                        "brightness(0) invert(1) drop-shadow(0 0 4px rgba(0,0,0,0.6))",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          <VideoSkeleton visible={videoLoading} />
          {/* 화면 맞춤 토스트 — 탐색·캡처 토스트와 같은 자리(영역 하단 20px 위). */}
          <VideoFitToast text={fitToast} toastKey={fitToastKey} />
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
    </>
  );
  // 영상 아래 '실시간/녹화 배지 + 날짜·시각' 줄. 한 번 없앴다가 되살렸다
  // (사용자 지정 2026-08-14: "다채널에 있는 그거 단일에도 다 같이 넣어줘").
  // 다채널 화면의 같은 줄과 내용·서식이 같다. 캡처 버튼만 빠져 있는데, 그건
  // 그 사이에 '카메라 목록' 탭 줄 오른쪽으로 옮겼기 때문이다(두 번 두지 않는다).
  // 녹화일 때 날짜를 누르면 날짜·시간 선택 시트가 열린다 — 다채널과 같다.
  const dateBarBlock = (
    <>
      <div
        className="relative flex flex-none items-center px-5"
        style={{ height: "44px" }}
      >
        {mode === "recording" ? (
          <RecBadge onClick={onToggleTimeline} />
        ) : (
          <LiveBadge onClick={onToggleChrome} />
        )}
        {mode === "recording" ? (
          // 시각 옆 아래 화살표는 뺐다(사용자 지정 2026-08-14). 날짜·시간 선택으로
          // 들어가는 길은 시간바 왼쪽 달력 버튼과 '녹화영상' 탭이 이미 있어서,
          // 여기 화살표는 같은 말을 세 번 하는 셈이었다. 글자는 그대로 누를 수 있다.
          <button
            type="button"
            onClick={onOpenDateTime}
            className="ml-2 flex items-center text-[14px] font-medium leading-none text-[#353535]"
          >
            <span suppressHydrationWarning>{recordingDateLabel}</span>
          </button>
        ) : (
          <span
            suppressHydrationWarning
            className="ml-2 text-[14px] font-medium leading-none text-[#353535]"
          >
            {dateLabel}
          </span>
        )}
        {/* 화면 캡처 — 이 줄 오른쪽 끝으로 복귀(사용자 지정 2026-08-14).
            그 사이 '카메라 목록' 탭 줄에 가 있었는데, 원래 자리인 여기로 돌렸다.
            규격은 그대로 28 원 + 아이콘 24. */}
        {onCapture && (
          <button
            type="button"
            aria-label="화면 캡처"
            onClick={onCapture}
            className="ml-auto flex h-[28px] w-[28px] items-center justify-center rounded-full border border-neutral-300"
          >
            <img src={`${BASE}/camera.svg`} alt="" className="h-6 w-6" />
          </button>
        )}
        <RowSkeleton visible={videoLoading} />
      </div>
      <div className="h-px" style={{ backgroundColor: "#EBEBEB" }} />
    </>
  );
  const playerBlock = (
    <>
      {/* 녹화 모드일 때 플레이어 버튼 — 시간바(타임라인) 위. REC 칩을 누르면
          이 블록이 숨겨진다/보인다(timelineVisible) — 예전엔 REC 칩이 가짜
          시스템 바(chromeVisible)를 같이 토글했는데 무관한 기능이라 분리했다. */}
      {mode === "recording" && timelineVisible && (
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
          {/* 5버튼 아래 구분선. 사이드 패널에서도 이제는 그린다 — 예전엔 이 선
              바로 아래가 하단 탭바(위 테두리 있음)라 두 줄이 2px 로 붙어서 껐는데,
              지금은 그 아래에 시간바가 들어온다(사용자 지적: "왜 구분선은 없지"). */}
          <div className="h-px" style={{ backgroundColor: "#EBEBEB" }} />
        </>
      )}
    </>
  );
  // 사이드 패널(1080+) 전용 — A-2 그대로: 녹화 모드에서 카메라 목록/움직임 감지
  // 탭을 패널 위쪽에 둔다. 세로/가로 스트립(아래 bottomStrip)은 탭 없이 적층이라
  // 여기서만 쓴다.
  const tabsBlock = (
    <>
      {mode !== "recording" && (
        // 실시간엔 감지가 없어 탭이 아니라 제목 하나다 — 아래 스트립과 같은 규칙
        // (사용자 지정 2026-08-14). 예전엔 패널 위가 아예 비어 있어서 오른쪽에
        // 뭐가 있는지 이름표가 없었다. 서식·여백(14/14)은 탭과 같다.
        <>
          <div
            className="flex items-center px-5"
            style={{ paddingTop: "14px", paddingBottom: "14px" }}
          >
            <span
              className="text-[15px] font-bold leading-none"
              style={{ color: "#262626" }}
            >
              카메라 목록
            </span>
          </div>
          <div className="h-px" style={{ backgroundColor: "#EBEBEB" }} />
        </>
      )}
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
          <div className="h-px" style={{ backgroundColor: "#EBEBEB" }} />
        </>
      )}
    </>
  );
  // A-3(세로/가로 스트립): 녹화 모드엔 플레이어(5버튼) 바로 아래 움직임 감지
  // (가로 시간바) — 탭 없이 항상 보인다. 높이는 A-2 감지 탭 스트립과 같은
  // MOTION_MIN_H 로 고정하고, 남는 세로는 아래 카메라 목록 영역이 쓴다.
  // 시간바 — 탭 위에 늘 있다(사용자 결정 2026-08-14). 재생 위치를 잡는 조작기라
  // 어느 탭을 보든 쓸 수 있어야 하고, 달력 버튼도 여기 얹혀 있다.
  // 썸네일 줄은 여기서 빠져 '움직임 감지' 탭의 리스트로 갔다 — 그래서 접기
  // 화살표도 없앴다(접을 게 없다). 높이는 위아래 여백을 맞춘 BAR_H_CLOSED.
  const motionBlock = mode === "recording" && (
    <div
      className="relative flex flex-none flex-col"
      style={{
        height: `${BAR_H_CLOSED}px`,
        // 아래 구분선 — 시간바와 탭의 경계(사용자 요청).
        // 색·두께는 A-2 탭 스트립 밑줄과 같은 #EBEBEB 1px.
        // 사이드 패널에선 이게 왼쪽 컬럼의 마지막이라 바로 아래가 하단 탭바다.
        // 탭바가 이미 위 테두리를 갖고 있어 두 줄이 2px 로 붙는다 — 그때만 뺀다.
        borderBottom: sidePanel ? undefined : "1px solid #EBEBEB",
      }}
    >
      <RecordingEventTimeline
        playbackMs={playbackMs}
        setPlaybackMs={setPlaybackMs}
        cameraSrc={cam.src}
        onScrubbingChange={onScrubbingChange}
        onOpenDateTime={onOpenDateTime}
      />
    </div>
  );
  const bottomStrip = (
    <>
      {motionBlock}
      {/* 카메라 목록 — 남는 공간을 채우는 영역(flex-1). 최소 높이는
          useListLayout 이 배치에 따라 잡는다 — 가로 한 줄이면 타일 세로 기준
          (TILE_MIN_H), 세로 2열이면 영역 기준(LIST_MIN_H). layoutRules.ts 참고. */}
      <div
        ref={listAreaRef}
        className="relative flex min-h-0 flex-col flex-1"
      >
      {/* 탭 줄 — 녹화면 '카메라 목록 | 움직임 감지' 두 탭(사용자 결정 2026-08-14),
          실시간이면 감지가 없으니 '카메라 목록' 제목 하나만.
          위아래 14 로 같다 — 사이드 패널 탭(tabsBlock)의 padding 14px 0 과 같은 값.
          그 여백의 기준은 버튼이 아니라 글자다(사용자 지정) — 그래서 캡처 버튼은
          흐름이 아니라 절대 위치다. 아래 참고.
          useListLayout 이 이 줄 높이를 실측해 영역 최소 높이에 더한다. */}
      <div
        className="relative flex flex-none items-center px-5"
        // (좌우는 px-5 가 잡는다 — 인라인 padding 축약형을 쓰면 그걸 덮어쓴다.)
        style={{ paddingTop: "14px", paddingBottom: "14px", gap: "20px" }}
      >
        {mode === "recording" ? (
          ([
            { key: "list", label: "카메라 목록" },
            { key: "motion", label: "움직임 감지" },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRecTab(t.key)}
              className="text-[15px] font-bold leading-none"
              style={{ color: recTab === t.key ? "#1D6CEB" : "#A6A6A6" }}
            >
              {t.label}
            </button>
          ))
        ) : (
          <span
            className="text-[15px] font-bold leading-none"
            style={{ color: "#262626" }}
          >
            카메라 목록
          </span>
        )}
      </div>
      {motionTab ? (
        <MotionEventList
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          cameraSrc={cam.src}
          // 세로가 모자라면(카메라 목록이 가로 한 줄로 넘어간 그 판정) 감지도
          // 가로 스크롤로 간다 — 같은 영역이라 판정을 새로 만들지 않고 나눠 쓴다.
          wide={listWide}
          // 감지 탭일 때도 훅이 잴 '행'이 있어야 판정이 계속 돈다.
          rowRef={listRowRef}
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
          // 위 제목이 아래 여백(14)을 이미 갖고 있으니 겹쳐 주지 않는다.
        >
          {CAMERAS.map((c, i) =>
            cameraTile(
              c,
              i,
              listWide
                ? "relative h-full aspect-video flex-none overflow-hidden bg-neutral-900"
                : "relative aspect-video overflow-hidden bg-neutral-900",
            ),
          )}
        </div>
      </div>
      )}
      <CameraListSkeleton visible={videoLoading} />
      </div>
    </>
  );
  // 오른쪽 세로 패널 본문 — A-2 그대로: 목록은 1열 세로 스크롤(타일 폭 = 패널 폭),
  // 감지는 아래 스트립과 같은 리스트(MotionEventList). 패널이 좁아 가로 시간바가 안 맞아
  // 적층·가로 교체에서 제외했다(사용자 결정 2026-08-14: "오른쪽 패널은 기존 유지").
  const sidePanelBody = (
    <div ref={listAreaRef} className="relative flex min-h-0 flex-1 flex-col">
      {mode === "recording" && recTab === "motion" ? (
        // 세로 타임라인(SideEventTimeline)이 아니라 아래 스트립과 같은 리스트다
        // (사용자 결정 2026-08-14). 패널이 좁고 세로로 길어 리스트가 잘 맞고,
        // 무엇보다 같은 안에서 감지 화면이 두 종류면 안 된다.
        // 패널은 세로로 길어 항상 세로 리스트다 — wide 를 안 넘긴다.
        <MotionEventList
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          cameraSrc={cam.src}
        />
      ) : (
        <div
          ref={listScrollRef}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CAMERAS.map((c, i) =>
            cameraTile(
              c,
              i,
              "relative aspect-video w-full flex-none overflow-hidden bg-neutral-900",
            ),
          )}
        </div>
      )}
      <CameraListSkeleton visible={videoLoading} />
    </div>
  );

  return (
    <>
      {headerBlock}
      {sidePanel ? (
        // 1080+ : 왼쪽 컬럼(영상 + 날짜 + 플레이어) | 오른쪽 세로 패널(탭 + 본문,
        // A-2 그대로)
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {videoBlock}
            {dateBarBlock}
            {playerBlock}
            {/* 시간바 — 5버튼 바로 아래(사용자 지정 2026-08-14). 패널이 나와도
                재생 위치를 잡을 게 있어야 한다. 세로 화면과 같은 시간바라
                달력 버튼·감지 빨간 선도 그대로 따라온다. */}
            {motionBlock}
          </div>
          <div
            className="flex min-h-0 flex-none flex-col overflow-hidden"
            style={{ width: `${SIDE_PANEL_W}px`, borderLeft: "1px solid #EBEBEB" }}
          >
            {tabsBlock}
            {sidePanelBody}
          </div>
        </div>
      ) : (
        <>
          {videoBlock}
          {dateBarBlock}
          {playerBlock}
          {bottomStrip}
        </>
      )}
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
// 감지 유형 — 썸네일 위 칩에 쓴다. 대부분은 단순 '움직임'이고 이상 상황은
// 드물게 섞인다(넘어짐 > 폭행). 실제 분포를 흉내 낸 값이라, 화면을 훑을 때
// 빨간 칩이 드문드문 보이는 정도가 된다.
const EVENT_KINDS = ["움직임", "넘어짐", "폭행"] as const;
type EventKind = (typeof EVENT_KINDS)[number];
function pickKind(r: number): EventKind {
  if (r < 0.86) return "움직임";
  if (r < 0.95) return "넘어짐";
  return "폭행";
}

const TIMELINE_EVENTS = (() => {
  const rng = mulberry32(20260529);
  const arr: { at: number; dur: number; kind: EventKind }[] = [];
  let t = 0;
  while (t < 86400) {
    const h = Math.min(23, Math.floor(t / 3600));
    // 활동량이 높을수록 평균 간격이 짧다(12초) ~ 한산할수록 길다(30초). 하루 ~4900건.
    const meanGap = 12 + (30 - 12) * (1 - (HOURLY_ACTIVITY[h] - 2) / 8);
    const r = rng();
    const size = r < 0.78 ? 1 : r < 0.96 ? 2 : 3; // 묶음 크기
    let last = t;
    // 4~15초. 유형은 같은 rng 에서 뽑아 매번 같은 하루가 나오게 한다.
    arr.push({
      at: Math.round(t),
      dur: 4 + Math.floor(rng() * 12),
      kind: pickKind(rng()),
    });
    for (let k = 1; k < size; k++) {
      last += 4 + Math.floor(rng() * 5); // 묶음 내 멤버 간 4~8초
      arr.push({
        at: Math.round(last),
        dur: 4 + Math.floor(rng() * 12),
        kind: pickKind(rng()),
      });
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
// ── 세로 움직임-감지 타임라인 (1080+ 오른쪽 패널 전용) ──────────────────────
// 시간이 위→아래로 흐르고 이벤트 카드가 쌓인다. 가로 시간바(RecordingEventTimeline)는
// 폭이 넓어야 쓸 만한데 세로 패널은 폭이 좁아서, 1080 이상 사이드 패널에서는 이걸 쓴다.
// A-1안의 같은 컴포넌트를 그대로 가져왔다 — 안마다 컴포넌트를 복제해 두는 이 파일들의
// 관례를 따랐다(각 안이 독립적으로 굴러가야 해서 공유 모듈로 빼지 않는다).
function SideEventTimeline({
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
  // 썸네일을 못 뽑는 기기 사양이면 카드에 시각+타이틀만 남긴다(eventThumbs.ts).
  const eventThumbs = useEventThumbs();
  // 줌 레벨: 픽셀/초 — 가로 타임라인과 동일하게 기본 6px/sec. 핀치/휠로 연속 조정.
  const [pxPerSec, setPxPerSec] = useState(6);
  const [lineY, setLineY] = useState(20);
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
  // playbackMs 는 매 틱마다 갱신되지만 라벨은 anchor·줌에만 의존한다. 메모이즈 없이는
  // 재생 중 매 틱마다 최대 1,441개를 새로 만든다.
  const labels = useMemo(
    () =>
      anchor
        ? Array.from({ length: labelStepCount * 2 + 1 }, (_, i) => {
            const secOffset = (i - labelStepCount) * labelIntervalSec;
            const t = new Date(anchor + secOffset * 1000);
            const text =
              labelIntervalSec >= 60
                ? `${pad(t.getHours())}:${pad(t.getMinutes())}`
                : `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
            return { text, secOffset };
          })
        : [],
    [anchor, labelStepCount, labelIntervalSec],
  );

  // 이벤트 — anchor 기준 ±VISIBLE_MINUTES 범위에 들어오는 occurrence 만 렌더.
  // 매일 반복되므로 anchor 날짜 ±1일 내에서 검색.
  // key는 (day, eventIndex) 조합으로 항상 고유 (같은 초가 중복돼도 인덱스가 다름)
  const eventOccurrences: {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
    kind: EventKind;
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
            kind: ev.kind,
          });
        }
      }
    }
  }

  // 썸네일 크기는 가로 타임라인과 같은 값을 쓴다(THUMB_MIN_H 48, 폭은 16:9 로 따라옴).
  // 예전엔 이 컴포넌트만 72×128 을 하드코딩하고 있어서 두 타임라인의 썸네일이 달랐다.
  const THUMB_H = THUMB_MIN_H;
  const THUMB_W = Math.round((THUMB_H * 16) / 9);
  // 이벤트 클러스터링 — 픽셀 거리가 카드 높이 + 간격보다 가까우면 한 자리로 묶어
  // 카드가 서로 겹치지 않게 한다. 대표 하나만 그린다(겹쳐 쌓기·개수 배지·펼침 없음
  // — 가로 타임라인과 동일).
  const CARD_H = THUMB_H + 8;
  type Occ = {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
    kind: EventKind;
  };
  const clusters: {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
    kind: EventKind;
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
  // 펼침(아코디언)을 안 쓰므로 아래로 밀어낼 간격도 없다 — 가로 타임라인처럼
  // 한 자리에 대표 카드 하나만 뜬다.
  const expandedGaps: { at: number; gap: number }[] = [];
  const totalGap = expandedGaps.reduce((s, g) => s + g.gap, 0);
  // 세로 타임라인은 위=최신, 아래=과거. 따라서 컨텐츠 y는 secOffset 부호를 뒤집어 매핑한다
  // (미래/최신 = 작은 y = 위, 과거 = 큰 y = 아래).
  // 펼쳐진 클러스터는 아래쪽(과거)으로 카드를 나열하므로, 그보다 과거(secOffset가 더 작은)
  // 항목들을 아래로 밀어낸다 → gap은 g.at > secOffset 일 때 누적.
  const gapBefore = (secOffset: number) =>
    expandedGaps.reduce((s, g) => s + (g.at > secOffset ? g.gap : 0), 0);
  const yOf = (secOffset: number) => -secOffset * pxPerSec + gapBefore(secOffset);

  // 지금 재생 중인 이벤트인가 — 카드를 탭하면 그 시각(ms)으로 이동하므로, 선택
  // 직후부터 그 이벤트 영상이 끝날 때까지(ms ~ ms+durSec) 참이 된다. 스크럽으로
  // 그 구간에 들어가도 똑같이 켜진다. 썸네일을 켜든 끄든 같은 규칙이다.
  const isActiveEvent = (ms: number, durSec: number) =>
    playbackMs !== null && playbackMs >= ms && playbackMs < ms + durSec * 1000;

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
          if (playbackMs !== null && target.dataset.eventMs) {
            const ms = Number(target.dataset.eventMs);
            // 파란 라인을 다크 막대의 아랫끝(이벤트 시작)에 맞춘다. 막대는 중앙 정렬이라
            // 아랫끝 = 카드 중심(cy) + 막대높이/2. 카드가 그려진 위치(content-y)와
            // 그 시각의 시간축 위치(time-y) 차이로 보정하고, 거기서 막대높이/2 만큼
            // 더 내려 아랫끝이 라인에 오게 한다.
            const barH = Math.min(THUMB_H, Math.max(6, Number(target.dataset.durSec) * pxPerSec));
            const timeY = Number(target.dataset.timeY);
            const contentY = Number(target.dataset.contentY);
            setAlignOffset(timeY - contentY - barH / 2);
            setPlaybackMs(clampMs(ms));
            // 선택 지점까지 부드럽게 이동(약 320ms) 후 transition 해제 → 이후 시간 흐름은 또렷하게.
            setAnimateScroll(true);
            if (animTimerRef.current) clearTimeout(animTimerRef.current);
            animTimerRef.current = setTimeout(() => setAnimateScroll(false), 340);
          }
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
            영상 길이(durSec)만큼 길어진다(줌 비례, 최대 = 썸네일 높이 THUMB_H)라 항상
            썸네일 세로 범위 안에 있다. */}
        {clusters.map((cluster) => {
          const cy = yOf(cluster.secOffset);
          const h = Math.min(THUMB_H, Math.max(6, cluster.members[0].durSec * pxPerSec));
          return (
            <span
              key={`BD${cluster.key}`}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: "100px",
                top: `${cy - h / 2}px`,
                width: "6px",
                height: `${h}px`,
                marginLeft: "-3px",
                backgroundColor: "#595959",
              }}
            />
          );
        })}

        {/* 이벤트 카드 — anchor 기준 secOffset 위치, ±VISIBLE_MINUTES 만 렌더.
            카드 픽셀 위치가 카드 높이(60px)보다 가까우면 묶어서 카운트 배지로 표시.
            줌인하면 자연스럽게 분리됨. */}
        {(() => {
          const eventCard = (occ: Occ, y: number) => (
            <div
              key={`E${occ.key}`}
              data-event-ms={occ.ms}
              data-dur-sec={occ.durSec}
              data-occ-key={occ.key}
              data-content-y={y}
              data-time-y={yOf(occ.secOffset)}
              className="absolute flex items-center"
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
              }}
            >
              <div
                className="relative"
                style={{ width: `${THUMB_W}px`, height: `${THUMB_H}px`, flexShrink: 0 }}
              >
                {/* 썸네일 — 한 자리에 하나만. 겹침 표시(쌓인 카드·개수 배지)는 안 쓴다.
                    지금 재생 중인 이벤트면 파란 테두리를 두른다 — 썸네일을 끈
                    사양(EventCardFace)과 같은 규칙이라 켜고 꺼도 표시가 같다. */}
                <div
                  className={`absolute overflow-hidden rounded-md ${eventThumbs ? "bg-neutral-900" : ""}`}
                  style={{
                    left: 0,
                    top: 0,
                    width: `${THUMB_W}px`,
                    height: `${THUMB_H}px`,
                    zIndex: 2,
                    ...(eventThumbs && isActiveEvent(occ.ms, occ.durSec)
                      ? { border: "2px solid #1D6CEB" }
                      : null),
                  }}
                >
                  {eventThumbs && <EventKindChip kind={occ.kind} />}
                  {eventThumbs ? (
                    <FrozenImage
                      src={cameraSrc}
                      alt=""
                      className="h-full w-full"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <EventCardFace
                      ms={occ.ms}
                      active={isActiveEvent(occ.ms, occ.durSec)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
          // 한 자리에 대표 카드 하나. 가까운 이벤트는 클러스터로 묶여 대표만 뜨고,
          // 줌인하면 자연스럽게 분리된다(가로 타임라인과 같은 방식).
          return clusters.map((cluster) => eventCard(cluster, yOf(cluster.secOffset)));
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


// 시간바 블록 치수(px) — 다채널 RecordingControls 시간바와 같은 값이다.
// 컴포넌트 안에 있던 걸 밖으로 뺐다: 썸네일을 접으면 감지 영역 높이가 딱 BAR_H 가
// 되는데, 그 높이를 부모(motionBlock)가 알아야 해서다.
const PAD_TOP = 12; // 시간바 위 여백
const PAD_BOTTOM = 4; // 시간바 아래 여백. 삼각형 제거로 줄여 썸네일을 위로 붙인다.
const RAIL_H = 28; // 라벨+눈금 영역 높이. 눈금 아래 빈 공간 줄여 썸네일을 위로.
const BAR_H = PAD_TOP + RAIL_H + PAD_BOTTOM; // 시간바 블록 전체 높이(=44)
// 접었을 때(썸네일 없음)는 위아래를 같게 — PAD_BOTTOM 4 는 바로 아래 썸네일을
// 위로 붙이려고 줄인 값이라, 썸네일이 사라지면 아래만 얇아 보인다.
const BAR_H_CLOSED = PAD_TOP + RAIL_H + PAD_TOP; // =52

function RecordingEventTimeline({
  playbackMs,
  setPlaybackMs,
  cameraSrc,
  onScrubbingChange,
  onOpenDateTime,
}: {
  playbackMs: number | null;
  setPlaybackMs: (
    v: number | null | ((prev: number | null) => number | null),
  ) => void;
  cameraSrc: string;
  onScrubbingChange?: (s: boolean) => void;
  /** 시간바 왼쪽 달력 버튼 — 날짜·시간 선택 시트를 연다. 넘기면 버튼이 생긴다.
   *  영상 아래 날짜 줄을 없애면서 사라졌던 진입점이 여기로 돌아온다. */
  onOpenDateTime?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 썸네일을 못 뽑는 기기 사양이면 카드에 시각+타이틀만 남긴다(eventThumbs.ts).
  const eventThumbs = useEventThumbs();
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
  // playbackMs 는 매 틱마다 갱신되지만 라벨은 anchor·줌에만 의존한다. 메모이즈 없이는
  // 재생 중 매 틱마다 최대 1,441개를 새로 만든다.
  const labels = useMemo(
    () =>
      anchor
        ? Array.from({ length: labelStepCount * 2 + 1 }, (_, i) => {
            const secOffset = (i - labelStepCount) * labelIntervalSec;
            const t = new Date(anchor + secOffset * 1000);
            const text =
              labelIntervalSec >= 60
                ? `${pad(t.getHours())}:${pad(t.getMinutes())}`
                : `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
            return { text, secOffset };
          })
        : [],
    [anchor, labelStepCount, labelIntervalSec],
  );

  // 이벤트 — anchor 기준 ±VISIBLE_MINUTES 범위에 들어오는 occurrence 만 렌더.
  // 매일 반복되므로 anchor 날짜 ±1일 내에서 검색.
  // key는 (day, eventIndex) 조합으로 항상 고유 (같은 초가 중복돼도 인덱스가 다름)
  const eventOccurrences: {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
    kind: EventKind;
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
            kind: ev.kind,
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
  type Occ = {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
    kind: EventKind;
  };
  const clusters: {
    key: string;
    ms: number;
    secOffset: number;
    durSec: number;
    kind: EventKind;
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

  // 지금 재생 중인 이벤트인가 — 세로 타임라인과 같은 판정.
  const isActiveEvent = (ms: number, durSec: number) =>
    playbackMs !== null && playbackMs >= ms && playbackMs < ms + durSec * 1000;

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
  // playbackMs 는 매 틱(50ms) 갱신되지만 눈금은 anchor·줌에만 의존한다. 기본 줌에서
  // 4시간 범위를 1초 간격으로 찍으면 14,401개 — 메모이즈 없이는 재생 중 매 틱마다
  // 그 개수를 통째로 새로 만들어 저사양 PC 에서 스크럽이 심하게 끊긴다.
  const ticks = useMemo(
    () =>
      anchor
        ? Array.from({ length: subStepCount * 2 + 1 }, (_, i) => {
            const secOffset = (i - subStepCount) * subIntervalSec;
            const isMajor = secOffset % labelIntervalSec === 0;
            return { secOffset, isMajor };
          })
        : [],
    [anchor, subStepCount, subIntervalSec, labelIntervalSec],
  );
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
        style={{
          height: `${BAR_H_CLOSED}px`,
          paddingTop: `${PAD_TOP}px`,
        }}
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
                // 큰 눈금은 흰색(사용자 지정 2026-08-14). 이 시간바는 흰 바탕이라
                // 사실상 안 보이게 된다 — 작은 눈금만 남는 셈이다.
                // 그 작은 눈금은 #C4C4C4 → #ADADAD 로 살짝 진하게(사용자 지정
                // 2026-08-14). 흰 바탕에서 너무 옅어 눈금이 안 읽혔다.
                backgroundColor: isMajor ? "#FFFFFF" : "#ADADAD",
              }}
            />
          ))}
          {/* 움직임이 감지된 시각 — 빨간 세로선(사용자 요청 2026-08-14).
              눈금과 같은 레일에 있어 같이 흐른다. 크기는 작은 눈금과 똑같이
              2×8 · top 18 이다(사용자 지정 2026-08-14) — 길이로 구분하지 않고
              색으로만 구분한다.
              색은 노랑과 주황 사이(#F59E0B, 사용자 지정). 빨강(#E2202D)이었는데
              감지 유형 칩의 '이상 상황' 빨강과 뜻이 겹쳐 보였다.
              눈금과 마찬가지로 화면에 보이는 범위만 그린다 — 하루 ~4900건이라
              다 그리면 스크롤이 죽는다.
              묶음(clusters)이 아니라 낱개(eventOccurrences)로 긋는다 — 묶음은
              썸네일 카드가 겹치지 않게 만든 것이라 가까운 이벤트 여럿이 대표
              하나로 접힌다. 그러면 감지 목록에는 있는데 시간바엔 선이 없는 게
              생긴다(사용자 지적: "그 지점에 빨간 선이 있어야지"). */}
          {eventOccurrences.filter((c) => inView(c.secOffset)).map((c) => (
            <div
              key={`M${c.key}`}
              className="pointer-events-none absolute rounded-[1px]"
              style={{
                left: `calc(50% + ${xOf(c.secOffset)}px)`,
                top: "18px",
                width: "2px",
                height: "8px",
                backgroundColor: "#F59E0B",
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
        {/* 중앙 고정 현재 시각 라벨(다채널과 동일 — 다크).
            top 은 10 → 6: 알약 배지(20)가 되면서 아래 현재시각 마커(27~41)와
            겹쳤다. 6 이면 배지가 6~26 이라 마커 바로 위에 앉는다. */}
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
        style={{ top: "6px", lineHeight: 0 }}
        >
          {/* 알약 배지 — 흰 배경 + 원래 글자색(#353535). 검정 반투명으로 갔다가
              되돌렸다(사용자 지정). '원'을 넣어 달라고 했지만 글자가 가로로 길어
              정원은 안 맞는다. 높이 20 · 좌우 8 · rounded-full, 테두리는 없다.
              배경을 깔아야 하는 이유는 달력 버튼과 같다: 아래로 흐르는 눈금이
              글자에 겹쳐 지저분해진다. */}
          <span
            suppressHydrationWarning
            className="rounded-full"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "20px",
              // 흰색 70% + 어두운 글자(사용자 지정). 50% 는 흰 바탕에 묻혀 흐렸고
              // 검정 반투명은 너무 셌다 — 70% 면 눈금을 덮으면서 바 톤도 안 깬다.
              color: "#353535",
              backgroundColor: "rgba(255,255,255,0.7)",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: "12px",
              padding: "0 8px",
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
        {/* 날짜·시간 선택 — 원(흰 배경 · border-neutral-300)을 도로 넣었다
            (사용자 결정 2026-08-14). 크기는 딤의 확대·AI 원 버튼과 같은 34
            (사용자 지정: "확대 아이콘 마냥"). 아이콘은 24 — 확대 쪽은 28 을 쓰지만
            그 에셋은 안쪽 여백이 있고 time.svg 는 박스를 거의 꽉 채우는 그림이라,
            28 로 넣으면 원에 닿아 동그라미가 안 보인다. 24 면 사방 5 가 남는다.
            그 오른쪽 세로 구분선은 그대로 둔다 — 흐르는 눈금과 갈라 준다.
            원 왼쪽 끝은 화면 좌우 여백 20, 세로는 눈금 레일(RAIL_H) 가운데.
            구분선 색은 앱 공용 #EBEBEB, 높이는 눈금(8)보다 길고 레일(28)보다 짧은 16.
            감싼 층에 흰 배경을 깐 건 아래로 흐르는 눈금이 겹쳐 지저분해지는 걸
            막기 위해서다(왼쪽 페이드만으로는 눈금이 비친다).
            시간바는 드래그로 스크럽되니 포인터를 막는다. */}
        {onOpenDateTime && (
          <div
            className="absolute z-20 flex items-center"
            style={{
              left: "20px",
              top: `${PAD_TOP + (RAIL_H - 34) / 2}px`,
              height: "34px",
              gap: "12px",
              backgroundColor: "#FFFFFF",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="날짜, 시간 선택"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-neutral-300"
              style={{ backgroundColor: "#FFFFFF" }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDateTime();
              }}
            >
              <img src={`${BASE}/time.svg`} alt="" className="h-6 w-6" />
            </button>
            <span
              aria-hidden
              style={{
                width: "1px",
                height: "16px",
                backgroundColor: "#EBEBEB",
              }}
            />
          </div>
        )}
      </div>

    </div>
  );
}

// 움직임 감지 리스트 — 아래 스트립의 '움직임 감지' 탭 내용(사용자 결정 2026-08-14).
// 예전엔 시간바 아래 가로 썸네일 줄이었는데, 한 줄이라 몇 개 못 보고 잘렸다.
// 세로 리스트로 바꾸면서 한 줄에 담는 정보도 늘렸다 — 왼쪽 썸네일, 오른쪽에
// 감지 유형과 시각.
//
// 보여 주는 범위는 '보고 있는 그 날'이다. 재생 시각(playbackMs)이 속한 날의
// 0시부터를 최신순으로 쌓되, 아직 오지 않은 시각은 뺀다(녹화가 없다).
// 하루치가 ~4900건이라 다 그리면 스크롤이 버벅인다 — 상한을 두고 그만큼만 그린다.
const MOTION_LIST_MAX = 200;

function MotionEventList({
  playbackMs,
  setPlaybackMs,
  cameraSrc,
  wide = false,
  rowRef,
}: {
  playbackMs: number | null;
  setPlaybackMs: (v: number | null) => void;
  cameraSrc: string;
  /** useListLayout 의 '타일 행' 자리. 감지 탭일 때도 배치 판정이 계속 돌게 하려고
   *  이 컨테이너를 대신 물려 준다 — 안 물리면 훅이 행을 못 찾아 판정을 건너뛰고,
   *  그동안 화면이 바뀌어도 방향이 그대로 굳는다(사용자 지적: 기준이 적용 안 됨).
   *  판정 자체는 영역 폭에서 나오는 카메라 타일 기하를 쓰므로, 여기 뭐가 들었든
   *  카메라 목록과 같은 답이 나온다. */
  rowRef?: React.Ref<HTMLDivElement>;
  /** 세로로 쌓을 자리가 없나. 켜면 한 덩어리씩 가로로 나열하고 가로 스크롤한다
   *  (사용자 결정 2026-08-14). 판정은 카메라 목록과 같은 것(useListLayout)을 쓴다 —
   *  같은 영역을 두 탭이 나눠 쓰므로 기준이 갈리면 안 된다. */
  wide?: boolean;
}) {
  // 그 날 0시(로컬). 이벤트의 at 은 자정으로부터의 초라 여기에 더하면 실제 시각이 된다.
  const dayStart = (() => {
    const d = new Date(playbackMs ?? Date.now());
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  // 목록을 어디까지 담을지 — '그 날을 열어 본 시점'에 한 번만 정하고 붙잡는다.
  // playbackMs 를 기준으로 삼으면 안 된다: 항목을 고르는 순간 그 시각이 새 기준이
  // 되어 그 뒤 이벤트가 통째로 잘리고, 고른 게 최신이 되어 맨 위로 올라간다
  // (사용자 지적: "왜 선택하면 맨위로 가니?"). 재생 중에도 매 틱 다시 계산돼
  // 목록이 계속 밀렸다. 날짜가 바뀔 때만 다시 잡는다.
  const [cutoff, setCutoff] = useState(() => Date.now());
  useEffect(() => {
    setCutoff(Date.now());
  }, [dayStart]);
  const rows = useMemo(() => {
    // 지난 날이면 그 날 끝까지, 오늘이면 지금까지(아직 안 온 시각은 녹화가 없다).
    const until = Math.min(cutoff, dayStart + 86400000);
    const out: { ms: number; dur: number; kind: EventKind }[] = [];
    // 뒤에서부터(최신) 훑어 상한만큼만 담는다 — 앞에서 담고 자르면 새벽 것만 남는다.
    for (let i = TIMELINE_EVENTS.length - 1; i >= 0; i--) {
      const ev = TIMELINE_EVENTS[i];
      const ms = dayStart + ev.at * 1000;
      if (ms > until) continue;
      out.push({ ms, dur: ev.dur, kind: ev.kind });
      if (out.length >= MOTION_LIST_MAX) break;
    }
    return out;
  }, [dayStart, cutoff]);

  // 고른 항목을 가운데로 맞춘다 — 카메라 목록과 같은 규칙(사용자 요청).
  // 가로 배치면 좌우, 세로면 위아래. scrollIntoView 대신 직접 계산하는 것도
  // 카메라 목록과 같은 이유다: 그쪽은 부모까지 같이 스크롤해 화면이 튄다.
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMs = useMemo(() => {
    if (playbackMs === null) return null;
    const hit = rows.find(
      (r) => playbackMs >= r.ms && playbackMs < r.ms + r.dur * 1000,
    );
    return hit ? hit.ms : null;
  }, [rows, playbackMs]);
  // 고른 항목을 스크롤 가운데로. 카메라 목록과 같은 방식이다 — 컨테이너의
  // scrollTo 를 직접 부르고 부드럽게(smooth) 움직인다.
  //
  // scrollIntoView 를 썼다가 되돌렸다: 그건 '조상까지' 스크롤해서, 화면 아래에
  // 숨어 있던 바텀시트 층이 딸려 올라왔다(사용자 지적: "화면안 선택 바텀시트는
  // 왜 뜨는거야?"). 컨테이너만 움직이면 그런 일이 없다.
  //
  // 좌표는 offsetLeft/offsetTop 으로 잡는다(컨테이너가 relative 라 그 기준이다).
  // getBoundingClientRect 를 쓰면 안 된다 — 데스크톱 목업은 프레임을 CSS
  // transform 으로 축소해 두는데, rect 는 축소된 값을, scrollLeft/clientWidth 는
  // 축소 전 값을 준다. 둘을 섞으면 엉뚱한 데로 간다.
  // 부드러운 이동은 프레임마다 값을 직접 넣어 만든다. 브라우저 기본
  // behavior:"smooth" 는 이 화면에서 아예 안 먹는다 — 녹화 틱(150ms)이 계속
  // 리렌더를 돌려 스크롤 애니메이션이 매번 취소된다(실측: smooth 로 5000 을 주면
  // 1.2초 뒤에도 0, auto 면 바로 5000). 매 프레임 대입하는 쪽은 리렌더가 끼어도
  // 그다음 프레임에 다시 넣으므로 끊기지 않는다.
  const tweenRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
    };
  }, []);
  const centerOn = (ms: number, smooth = true) => {
    const el = scrollRef.current;
    const target = el?.querySelector<HTMLElement>(`[data-ms="${ms}"]`);
    if (!el || !target) return;
    // 좌표는 offsetLeft/offsetTop 으로 잡는다(컨테이너가 relative 라 그 기준이다).
    // getBoundingClientRect 를 쓰면 안 된다 — 데스크톱 목업은 프레임을 CSS
    // transform 으로 축소해 두는데, rect 는 축소된 값을, scrollLeft/clientWidth 는
    // 축소 전 값을 준다. 둘을 섞으면 엉뚱한 데로 간다.
    const to = wide
      ? Math.max(0, target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2)
      : Math.max(0, target.offsetTop - (el.clientHeight - target.offsetHeight) / 2);
    const read = () => (wide ? el.scrollLeft : el.scrollTop);
    const write = (v: number) => {
      if (wide) el.scrollLeft = v;
      else el.scrollTop = v;
    };
    if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
    const from = read();
    const dist = to - from;
    if (Math.abs(dist) < 1) return;
    // 움직임을 줄이는 설정이면 즉시 이동한다(카메라 목록과 같은 규칙).
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!smooth || reduce) {
      write(to);
      return;
    }
    // 320ms · easeOutCubic — 위 큰 영상 전환(300ms)과 결이 같다.
    const DUR = 320;
    const t0 = performance.now();
    let done = false;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR);
      write(from + dist * (1 - Math.pow(1 - t, 3)));
      if (t < 1) tweenRef.current = requestAnimationFrame(step);
      else {
        tweenRef.current = null;
        done = true;
      }
    };
    tweenRef.current = requestAnimationFrame(step);
    // 안전장치 — 화면이 안 보이는 탭에서는 requestAnimationFrame 이 아예 안 돈다
    // (실측: 백그라운드 탭에서 700ms 동안 0프레임). 그때도 자리는 맞아야 하니
    // 시간이 지나면 목적지로 스냅한다. 눈에 보이는 상태면 이미 도착해 있어
    // 아무 일도 안 한다.
    window.setTimeout(() => {
      if (!done) write(to);
    }, DUR + 80);
  };
  // 재생이 이벤트를 만나면(시간바의 빨간 선과 겹치는 순간) 그 항목이 선택되고,
  // 자리도 가운데로 따라온다(사용자 지적 2026-08-14: "위치도 가운데로 와야지").
  // 예전에 이걸 껐던 건 즉시 이동이라 몇 초마다 툭툭 끊겨 보였기 때문이다 —
  // 지금은 320ms 로 미끄러지므로 따라와도 눈에 거슬리지 않는다.
  // 탭에 처음 들어온 순간만 즉시 맞춘다(그때는 이미 가운데 있어야 하는 상태다).
  // 그림이 그려진 뒤에 재야 해서 한 프레임 미룬다.
  const openedRef = useRef(false);
  useEffect(() => {
    openedRef.current = false;
  }, [wide]);
  useEffect(() => {
    if (activeMs === null) return;
    const first = !openedRef.current;
    openedRef.current = true;
    // 한 프레임 미룬다 — 그림이 그려진 뒤에 offset 을 재야 한다. rAF 가 아니라
    // setTimeout 인 건, 화면이 안 보이는 탭에서 rAF 가 아예 안 돌아 호출 자체가
    // 사라지기 때문이다(실측: 그 상태에서 재생이 다음 이벤트로 넘어가도 목록이
    // 그대로 있었다).
    const t = window.setTimeout(() => centerOn(activeMs, !first), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMs, wide]);

  // 가로로 나열할 땐 오른쪽이 최신이다 — 시간바와 같은 방향(오른쪽 = 최신,
  // 왼쪽 = 과거)이라야 둘이 같은 축으로 읽힌다(사용자 지적 2026-08-14).
  // rows 는 최신순(내림차순)이라 가로일 때만 뒤집는다. 세로로 쌓을 땐 최신이
  // 맨 위인 게 목록의 상식이라 그대로 둔다.
  const ordered = wide ? [...rows].reverse() : rows;

  return (
    // 바깥 껍데기 — 카메라 목록과 같은 구조다(껍데기가 pb-3, 그 안이 '행').
    // useListLayout 은 chrome 을 '행의 offsetTop + 껍데기의 아래 여백'으로 재는데,
    // 스크롤 컨테이너에 직접 rowRef 를 물리면 그 컨테이너 자기 여백이 chrome 에서
    // 빠져 감지 쪽 영역만 12 작아진다(131 vs 143). 그러면 카드 높이도 카메라
    // 타일보다 작아진다(사용자 지적: "항목 높이를 카메라 목록 썸네일에 맞추라니까").
    <div className="flex min-h-0 flex-1 flex-col pb-3">
    <div
      ref={(el) => {
        scrollRef.current = el;
        if (typeof rowRef === "function") rowRef(el);
        else if (rowRef) (rowRef as React.RefObject<HTMLDivElement | null>).current = el;
      }}
      className={
        wide
          ? // 가로 한 줄 — 한 덩어리씩 옆으로 나열하고 가로 스크롤(사용자 결정).
            // 세로로 쌓을 자리가 없을 때다. 좌우 여백(px-5)은 스크롤 안쪽 패딩이라
            // 첫/마지막만 20px 띄운다 — 카메라 목록 가로 배치와 같은 규칙.
            "relative flex min-h-0 flex-1 items-stretch gap-2 px-5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "relative flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
    >
      {ordered.map((r) => {
        // 지금 재생 중인 이벤트인가. 구간(ms ~ ms+dur)만 보고 각자 판정하면 둘이
        // 같이 켜진다 — 이벤트가 4~8초 간격으로 묶여 나오고 길이가 4~15초라
        // 구간이 겹친다(사용자 지적: "리스트 두개가 선택되는건 뭐지?").
        // 위에서 하나만 고른 activeMs 와 맞춰 항상 한 줄만 켠다.
        const active = r.ms === activeMs;
        return (
          <button
            key={r.ms}
            data-ms={r.ms}
            type="button"
            onClick={() => {
              setPlaybackMs(r.ms);
              // 이미 활성인 항목을 다시 눌러도 가운데로 와야 한다 — 그때는
              // activeMs 가 안 바뀌어 위 효과가 안 돈다(사용자 요청).
              centerOn(r.ms);
            }}
            className={
              wide
                ? "flex h-full flex-none items-center gap-2 text-left"
                : "flex flex-none items-center gap-3 px-5 text-left"
            }
            style={
              wide
                ? {
                    // 가로 덩어리 — 고른 것만 파란 테두리, 나머지는 회색
                    // (사용자 지정 2026-08-14). 썸네일 쪽 파란 테두리는 뺐다 —
                    // 덩어리 테두리와 겹쳐 두 겹으로 보였다.
                    // 라운드는 8 — 4 는 각져 보였다(사용자 지정). 안쪽 썸네일은
                    // 카메라 목록 타일과 같은 4 로 둔다(덩어리 안쪽이라 안 겹친다).
                    padding: "6px 8px",
                    borderRadius: "8px",
                    border: active ? "1px solid #1D6CEB" : "1px solid #EBEBEB",
                    backgroundColor: active
                      ? "rgba(29,108,235,0.08)"
                      : undefined,
                  }
                : {
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    backgroundColor: active
                      ? "rgba(29,108,235,0.08)"
                      : undefined,
                  }
            }
          >
            {/* 썸네일 — 카메라 목록 타일과 같은 16:9 · 같은 4px 라운드.
                움직이는 GIF 를 그대로 쓰면 한 화면에 수십 장이 동시에 디코딩되니
                첫 프레임만 그리는 FrozenImage 를 쓴다(목록 타일과 같은 이유). */}
            {/* 썸네일 — 가로일 땐 높이를 덩어리(= 목록 영역)에 맞춘다. 카메라 목록
                타일도 같은 기준(h-full aspect-video)이라 두 탭의 그림 높이가 같아
                보인다. 덩어리 안쪽 여백(6)만큼만 타일보다 작다(사용자 지정).
                세로일 땐 예전처럼 폭 96 고정. */}
            <div
              className={
                wide
                  ? "relative h-full flex-none overflow-hidden bg-neutral-900"
                  : "relative flex-none overflow-hidden bg-neutral-900"
              }
              style={
                wide
                  ? { aspectRatio: "16 / 9", borderRadius: "4px" }
                  : {
                      width: "96px",
                      aspectRatio: "16 / 9",
                      borderRadius: "4px",
                    }
              }
            >
              <FrozenImage
                src={cameraSrc}
                alt=""
                className="absolute inset-0 h-full w-full"
                style={{ objectFit: "cover" }}
              />
            </div>
            {/* 유형 + 시각. 유형은 이상 상황(넘어짐·폭행)만 빨강 — 썸네일 위 칩
                (EventKindChip)과 같은 규칙이라 화면을 훑을 때 눈이 같은 것에 걸린다. */}
            <div className="flex min-w-0 flex-col gap-[6px]">
              <span
                className="text-[14px] font-bold leading-none"
                style={{ color: r.kind === "움직임" ? "#262626" : "#E2202D" }}
              >
                {r.kind}
              </span>
              <span
                className="text-[12px] leading-none"
                style={{ color: "#8C8C8C" }}
              >
                {formatEventTime(r.ms)}
              </span>
            </div>
          </button>
        );
      })}
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
      실시간
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

// '화면 구성' 시트 — 기기 방향마다 '한 화면에 볼 채널 수'를 따로 정한다.
// 눕혀 보면 16채널, 세로로 들면 8채널처럼 방향마다 알맞은 수가 다르다는 게
// 사용자 요구다(2026-08-11). 두 슬라이더를 한 화면에 같이 두어, 지금 어느
// 방향이든 두 값을 다 보고 정할 수 있게 한다.
//
// 여기서 정하는 건 개수뿐이다 — 그 개수를 몇 열 × 몇 행으로 나눌지는 그 화면
// 에서 타일이 16:9 에 가장 가깝도록 bestGridForCount 가 고른다(layoutRules.ts).
// 같은 8채널이라도 세로면 2×4, 가로면 4×2 가 되는 식이다.
//
// '자동'은 개수를 정하지 않고 영상 영역 비율에 맞춰(autoGridCount) 그때그때
// 쓰겠다는 뜻 — 슬라이더를 만지면 그 순간 두 방향 모두 지금 값으로 고정된다.
//
// 슬라이더는 '적용'을 눌러야 반영되는 게 아니라 끄는 즉시(onPreview) 뒤 화면이
// 따라온다 — 몇 개가 어떻게 보이는지 드래그하며 눈으로 확인하는 게 자연스럽다
// (밝기 슬라이더처럼). '취소'는 시트를 열었을 때 값으로 되돌린다.
type OrientCounts = { portrait: number | null; landscape: number | null };

function LayoutConfigSheet({
  open,
  selected,
  resolved,
  onClose,
  onPreview,
}: {
  open: boolean;
  /** 방향별로 사용자가 직접 고른 개수. null 이면 그 방향은 '자동'. */
  selected: OrientCounts;
  /** 방향별로 지금 쓰이는 개수(자동이면 계산 결과) — 슬라이더 시작값. */
  resolved: { portrait: number; landscape: number };
  onClose: () => void;
  /** 값이 바뀔 때마다 즉시 호출 — 화면이 바로 따라온다. */
  onPreview: (counts: OrientCounts) => void;
}) {
  const [auto, setAuto] = useState(
    selected.portrait === null && selected.landscape === null,
  );
  const [counts, setCounts] = useState({
    portrait: resolved.portrait,
    landscape: resolved.landscape,
  });
  // 시트를 열었을 때의 선택값 — '취소' 누르면 이 값으로 되돌린다.
  const originalRef = useRef<OrientCounts>(selected);

  useEffect(() => {
    if (open) {
      setAuto(selected.portrait === null && selected.landscape === null);
      setCounts({ portrait: resolved.portrait, landscape: resolved.landscape });
      originalRef.current = selected;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 자동인 채로 방향이 바뀌면(회전) 슬라이더도 새로 잰 값을 따라간다.
  useEffect(() => {
    if (!open || !auto) return;
    setCounts({ portrait: resolved.portrait, landscape: resolved.landscape });
  }, [open, auto, resolved.portrait, resolved.landscape]);

  const preview = (
    nextAuto: boolean,
    next: { portrait: number; landscape: number },
  ) => {
    onPreview(nextAuto ? { portrait: null, landscape: null } : next);
  };

  const ROWS = [
    {
      key: "portrait" as const,
      label: "세로 화면",
      hint: "기기를 세로로 들었을 때",
    },
    { key: "landscape" as const, label: "가로 화면", hint: "기기를 눕혔을 때" },
  ];

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

        <div className="px-5 pb-2 overflow-y-auto">
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: "16px" }}
          >
            <h3 className="text-[20px] font-bold leading-none text-neutral-900">
              화면 개수
            </h3>
            <button
              type="button"
              onClick={() => {
                const next = !auto;
                setAuto(next);
                preview(next, counts);
              }}
              className="inline-flex items-center justify-center text-[14px] font-semibold leading-none"
              style={{
                height: "32px",
                padding: "0 14px",
                borderRadius: "16px",
                backgroundColor: auto ? "#1D6CEB" : "#F2F2F2",
                color: auto ? "#FFFFFF" : "#7F7F7F",
              }}
            >
              자동
            </button>
          </div>

          {/* disabled 를 안 쓴다 — 자동일 때 슬라이더를 막으면 자동을 먼저 꺼야만
              드래그할 수 있어 한 단계가 더 든다. 항상 드래그 가능하게 두고
              흐림(opacity)만 자동 상태를 알린다 — 만지는 순간 자동이 꺼진다.
              슬라이더는 GRID_COUNT_OPTIONS 의 '인덱스'를 움직인다 — native range
              의 step 은 균일 간격만 지원해 2,3,4,6,8,9,12,16 처럼 듬성듬성한
              목록엔 못 쓴다. */}
          {ROWS.map(({ key, label, hint }) => (
            <div key={key} style={{ marginBottom: "18px" }}>
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-semibold leading-none text-neutral-900">
                  {label}
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: "#A4A4A4", marginLeft: "6px" }}
                  >
                    {hint}
                  </span>
                </span>
                <span className="text-[15px] font-semibold leading-none text-neutral-900">
                  {counts[key]}채널
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={GRID_COUNT_OPTIONS.length - 1}
                step={1}
                value={nearestGridCountIndex(counts[key])}
                onChange={(e) => {
                  const next = {
                    ...counts,
                    [key]: GRID_COUNT_OPTIONS[Number(e.target.value)],
                  };
                  setAuto(false);
                  setCounts(next);
                  preview(false, next);
                }}
                className="w-full"
                style={{
                  accentColor: "#1D6CEB",
                  opacity: auto ? 0.4 : 1,
                  marginTop: "8px",
                }}
              />
              <div
                className="flex items-center justify-between text-[12px]"
                style={{ color: "#A4A4A4" }}
              >
                <span>{GRID_COUNT_OPTIONS[0]}</span>
                <span>{GRID_COUNT_OPTIONS[GRID_COUNT_OPTIONS.length - 1]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div
          className="flex items-center"
          style={{ gap: "8px", padding: "0 20px", height: "90px" }}
        >
          <button
            type="button"
            onClick={() => {
              onPreview(originalRef.current);
              onClose();
            }}
            className="flex-1 border border-neutral-300 bg-white text-[16px] font-semibold text-neutral-900"
            style={{ height: "50px", borderRadius: "4px" }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onClose}
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
        녹화영상
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
      녹화영상
    </button>
  );
}

const TIMELINE_VISIBLE_MIN = 120; // ±2시간 = 총 4시간

function RecordingControls({
  now,
  onToggleChrome,
  timelineVisible = true,
  onToggleTimeline,
  onScrubbingChange,
  playbackMs,
  setPlaybackMs,
  onOpenDateTime,
  rowLoading = false,
  isPlaying = true,
  onTogglePlay,
  onPlay,
  onSpeedChange,
  overlay = false,
  playerOnly = false,
  timelineOnly = false,
}: {
  now: Date | null;
  onToggleChrome?: () => void;
  timelineVisible?: boolean;
  onToggleTimeline?: () => void;
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
  /** 딤 위에 얹히는 배치(가로 모드)인가. 기본은 세로 — 흰 바에 얹히는 밝은 UI.
   *  켜면 흰 배경을 걷고, 글자·눈금·버튼을 흰 계열로 뒤집고, 위쪽 '녹화 + 날짜'
   *  줄을 안 그린다(가로에선 LandscapeVideo 가 같은 정보를 이미 얹는다).
   *  A-1 과 같은 규칙 — 가로 화면은 세 안이 동일해야 한다. */
  overlay?: boolean;
  /** 플레이어 버튼 5개만 그린다(가로 딤 가운데용). 헤더 줄·시간바는 뺀다. */
  playerOnly?: boolean;
  /** playerOnly 의 반대 — 시간바만 그린다. 버튼 5개는 화면 한가운데에 따로
   *  얹으므로(centerControls) 여기선 빼야 두 벌이 안 된다(사용자 결정). */
  timelineOnly?: boolean;
}) {
  const VISIBLE_MINUTES = TIMELINE_VISIBLE_MIN;
  // 시간바를 끌고 있는 중인가. 가로(overlay)에서 플레이어 버튼 5개를 잠깐 감춘다.
  const [scrubbing, setScrubbing] = useState(false);
  // 실기기 가로에선 콘텐츠가 CSS 로 90° 돌아가 있어 화면 좌표의 x·y 가 콘텐츠
  // 기준과 맞바뀐다 — 시간바는 그때 clientY 를 읽어야 한다(deviceRotate.ts).
  const rotatedInput = useRotatedInput();
  const dragAxis = (e: { clientX: number; clientY: number }) =>
    rotatedInput ? e.clientY : e.clientX;
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
      dragStartRef.current = { x: dragAxis(e), ms: playbackMs };
      setScrubbing(true);
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
      const dx = dragAxis(e) - dragStartRef.current.x;
      setPlaybackMs(clampMs(dragStartRef.current.ms - (dx / pxPerSec) * 1000));
    }
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 0) {
      if (isDraggingRef.current) onScrubbingChange?.(false);
      setScrubbing(false);
      isDraggingRef.current = false;
      dragStartRef.current = null;
    }
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  };
  const centerDate = playbackMs !== null ? new Date(playbackMs) : null;
  const labelDate = centerDate
    ? `${centerDate.getFullYear()}.${pad(centerDate.getMonth() + 1)}.${pad(centerDate.getDate())}. ${pad(centerDate.getHours())}:${pad(centerDate.getMinutes())}:${pad(centerDate.getSeconds())}`
    : "";
  const centerLabel = centerDate
    ? `${pad(centerDate.getHours())}:${pad(centerDate.getMinutes())}:${pad(centerDate.getSeconds())}`
    : "";

  const playbackOffsetSec =
    playbackMs !== null && anchor !== null
      ? (playbackMs - anchor) / 1000
      : 0;
  const railTransform =
    playbackMs !== null && anchor !== null
      ? `translateX(${-playbackOffsetSec * pxPerSec}px)`
      : undefined;

  // 라벨(labelIntervalSec 단위)·눈금(subIntervalSec 단위)은 anchor 기준 ±2시간
  // 전체가 아니라 '화면에 보이는 구간 + 스크럽 대비 여유'만 만든다. 기본 줌에서
  // 전체 범위를 다 만들면 눈금만 14,401개라, useMemo 로 재계산 자체는 막아도
  // .map() 이 만드는 15,000+ 개의 React 엘리먼트를 React 가 매 틱(그리드는
  // 150ms)마다 다시 조정(reconcile)해야 해 저사양 PC 에서 다채널 녹화가 심하게
  // 끊긴다. 개수를 뷰포트 폭에 비례하게(수백 개) 줄이면 그 비용이 사실상 사라진다.
  //
  // 중심(windowCenterSec)은 재생 위치가 바뀔 때마다 갱신하지 않고, 화면 절반
  // 만큼 벗어났을 때만 갱신한다(히스테리시스) — 안 그러면 매 틱마다 중심이
  // 따라 움직여 결국 매 틱 재계산과 같아진다.
  const totalSpanSec = VISIBLE_MINUTES * 60;
  const timelineViewportPx = timelineRef.current?.clientWidth || 360;
  const viewportSec = timelineViewportPx / pxPerSec;
  const WINDOW_SCREENS = 3;
  const windowSpanSec = Math.min(totalSpanSec, viewportSec * WINDOW_SCREENS);
  const [windowCenterSec, setWindowCenterSec] = useState(0);
  useEffect(() => {
    const threshold = viewportSec / 2;
    setWindowCenterSec((prev) =>
      Math.abs(playbackOffsetSec - prev) > threshold ? playbackOffsetSec : prev,
    );
  }, [playbackOffsetSec, viewportSec]);

  const labelStepCount = Math.max(
    1,
    Math.min(
      Math.ceil(totalSpanSec / labelIntervalSec),
      Math.ceil(windowSpanSec / labelIntervalSec) + 1,
    ),
  );
  const labelCenterIdx = Math.round(windowCenterSec / labelIntervalSec);
  const labels = useMemo(
    () =>
      anchor
        ? Array.from({ length: labelStepCount * 2 + 1 }, (_, i) => {
            const secOffset = (labelCenterIdx - labelStepCount + i) * labelIntervalSec;
            const t = new Date(anchor + secOffset * 1000);
            const text =
              labelIntervalSec >= 60
                ? `${pad(t.getHours())}:${pad(t.getMinutes())}`
                : `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
            return { text, secOffset };
          })
        : [],
    [anchor, labelCenterIdx, labelStepCount, labelIntervalSec],
  );
  const subStepCount = Math.max(
    1,
    Math.min(
      Math.ceil(totalSpanSec / subIntervalSec),
      Math.ceil(windowSpanSec / subIntervalSec) + 1,
    ),
  );
  const tickCenterIdx = Math.round(windowCenterSec / subIntervalSec);
  const ticks = useMemo(
    () =>
      anchor
        ? Array.from({ length: subStepCount * 2 + 1 }, (_, i) => {
            const secOffset = (tickCenterIdx - subStepCount + i) * subIntervalSec;
            const isMajor = secOffset % labelIntervalSec === 0;
            return { secOffset, isMajor };
          })
        : [],
    [anchor, tickCenterIdx, subStepCount, subIntervalSec, labelIntervalSec],
  );

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

  // 움직임이 감지된 시각 — 단일 시간바와 같은 빨간 세로선(사용자 지적 2026-08-14:
  // 가로 시간바엔 표시가 없었다). anchor(레일 기준 시각)에서 몇 초 떨어졌는지로
  // 자리를 잡는다. 눈금과 같은 레일에 있어 같이 흐른다.
  // 화면에 보이는 범위(±cull)만 그린다 — 하루 ~4900건을 다 그리면 스크롤이 죽는다.
  const motionMarks = useMemo(() => {
    if (anchor === null) return [] as number[];
    const day = new Date(anchor);
    day.setHours(0, 0, 0, 0);
    const dayStart = day.getTime();
    const cull = 700 / pxPerSec + 90;
    const out: number[] = [];
    for (const ev of TIMELINE_EVENTS) {
      const secOffset = (dayStart + ev.at * 1000 - anchor) / 1000;
      if (Math.abs(secOffset - playbackOffsetSec) > cull) continue;
      out.push(secOffset);
    }
    return out;
  }, [anchor, pxPerSec, playbackOffsetSec]);

  return (
    <div className="relative flex flex-col">
      {/* 녹화 + 날짜 — 가로 딤(overlay)에선 안 그린다. LandscapeVideo 가 같은
          정보를 딤에 맞춘 색으로 이미 얹고 있어서 칩 줄이 두 번 겹친다. */}
      {!overlay && !playerOnly && (
      <div
        className="relative flex items-center px-5"
        style={{ height: "48px", gap: "8px" }}
      >
        <RecBadge onClick={onToggleTimeline} />
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
      )}
      {/* REC 칩을 누르면 이 아래(플레이어 버튼 + 시간바)만 숨겨진다 — 위 헤더
          행(REC+날짜)은 남아서 다시 누르면 되돌릴 수 있다. 예전엔 이 칩이
          가짜 시스템 바(chromeVisible)를 같이 토글했는데, 그 둘은 무관한
          기능이라 분리했다(사용자 결정). */}
      {/* 가로 딤엔 REC 칩(숨기기 토글)이 없으므로 항상 편다. */}
      {(overlay || timelineVisible) && (
      <>
      {/* 구분선 — 흰 바 위(세로)에서만 그린다. 확대·가로 딤에선 영상 위에
          흰 줄이 그어져 보여 뺐다(사용자 요청). */}
      {!overlay && (
        <div className="h-px" style={{ backgroundColor: "#EBEBEB" }} />
      )}
      <div className="relative">
      {/* 플레이어 컨트롤 — 시간바(타임라인) 위.
          가로(overlay)에선 시간바를 끄는 동안 잠깐 감춘다 — 손을 떼면 돌아온다.
          자리는 그대로 두고 투명도만 바꾼다(접으면 시간바가 위로 튄다).
          timelineOnly 면 아예 안 그린다 — 버튼 5개를 화면 한가운데 따로 얹는
          배치(가로)에서, 여기까지 그리면 같은 버튼이 두 벌이 된다. */}
      {!timelineOnly && (
      <div
        className="flex items-center justify-center transition-opacity duration-150 ease-out"
        style={{
          gap: "20px",
          padding: "8px 0",
          backgroundColor: overlay ? "transparent" : "#FFFFFF",
          opacity: overlay && scrubbing ? 0 : 1,
          pointerEvents: overlay && scrubbing ? "none" : undefined,
        }}
      >
        <PlayerButton
          overlay={overlay}
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
          overlay={overlay}
          kind="back10"
          onClick={() => {
            setPlaybackMs((p) => (p === null ? p : p - 10000));
            onPlay?.();
            showSeekToast("10초 전으로 이동");
          }}
        />
        <PlayerButton
          overlay={overlay}
          kind={isPlaying ? "pause" : "play"}
          onClick={onTogglePlay}
          held={!isPlaying}
        />
        <PlayerButton
          overlay={overlay}
          kind="forward10"
          onClick={() => {
            setPlaybackMs((p) => (p === null ? p : p + 10000));
            onPlay?.();
            showSeekToast("10초 후로 이동");
          }}
        />
        <PlayerButton
          overlay={overlay}
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
      )}
      {/* 구분선 — 흰 바 위(세로)에서만 그린다. 확대·가로 딤에선 영상 위에
          흰 줄이 그어져 보여 뺐다(사용자 요청). */}
      {!overlay && (
        <div className="h-px" style={{ backgroundColor: "#EBEBEB" }} />
      )}
      {!playerOnly && (
      <>
      {/* 타임라인 */}
      <div
        ref={timelineRef}
        className="relative flex flex-col overflow-hidden touch-pan-y select-none"
        style={{
          backgroundColor: overlay ? "transparent" : "#FFFFFF",
          // 좌우 페이드 — 흰 배경일 땐 흰 그라데이션 두 장으로 덮지만, 배경이
          // 없는 딤 위에선 덮을 색이 없다. 대신 영역을 마스크로 깎는다(A-1 동일).
          ...(overlay
            ? {
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 3.9%, #000 39%, #000 61%, transparent 96.1%)",
                maskImage:
                  "linear-gradient(to right, transparent 3.9%, #000 39%, #000 61%, transparent 96.1%)",
              }
            : null),
          // 위아래 같은 여백. 단일채널 감지 탭 시간바는 아래가 4 인데(PAD_BOTTOM),
          // 거긴 바로 아래 썸네일이 이어져서 그런 거다. 다채널은 시간바 아래가 바로
          // 하단 탭바라 그 4 를 그대로 가져오면 눈금이 탭바에 붙어 보인다.
          paddingTop: "12px",
          paddingBottom: "12px",
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
                color: overlay ? "rgba(255,255,255,0.75)" : "#A4A4A4",
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
                // 딤 위(가로) 작은 눈금은 흰색 50% 였는데 투명도를 뺐다
                // (사용자 지정 2026-08-14). 큰 눈금과 같은 흰색이라 이제 둘은
                // 길이·색이 같다 — 구분은 라벨이 한다.
                backgroundColor: overlay
                  ? "#FFFFFF"
                  : isMajor
                    ? "#797979"
                    : "#ADADAD",
              }}
            />
          ))}
          {/* 감지 표시 — 작은 눈금과 같은 규격(2×8, top 18)에 색만 #F59E0B. */}
          {motionMarks.map((secOffset, i) => (
            <div
              key={`M${i}`}
              className="pointer-events-none absolute rounded-[1px]"
              style={{
                left: `calc(50% + ${secOffset * pxPerSec}px)`,
                top: "18px",
                width: "2px",
                height: "8px",
                backgroundColor: "#F59E0B",
              }}
            />
          ))}
        </div>
        {/* 좌우 페이드 — 딤 위(overlay)에선 덮을 흰 배경이 없어 위 컨테이너의
            마스크가 대신한다. */}
        {!overlay && (
        <>
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
        </>
        )}
        {/* 중앙 고정 현재 시간 — 단일채널 시간바와 같은 알약 배지(사용자 지정:
            "다채널도 시간바 동일하게"). 흰 배경 + #353535, 높이 20 · 좌우 8 ·
            rounded-full, 테두리 없음. 딤 위(overlay)에서도 같은 배지다 — 흰 글자만
            띄우던 걸 배지로 바꿨다. 두 화면이 달라 보이면 안 된다.
            top 은 10 → 6: 배지가 20 이 되면서 아래 현재시각 마커(27~41)와 겹쳤다. */}
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
          style={{ top: "6px", lineHeight: 0 }}
        >
          <span
            suppressHydrationWarning
            className="rounded-full"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "20px",
              // 흰 바탕(세로·사이드 패널)에선 흰색 70% + 어두운 글자. 딤 위(가로)
              // 에선 아래 아이콘 원과 같은 회색 55% + 흰 글자다(사용자 지정
              // 2026-08-14) — 같은 화면에 있는 것끼리 결을 맞춘다.
              color: overlay ? "#FFFFFF" : "#353535",
              backgroundColor: overlay
                ? "rgba(117,117,117,0.75)"
                : "rgba(255,255,255,0.7)",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: "12px",
              padding: "0 8px",
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
            backgroundColor: overlay ? "#FFFFFF" : "#111111",
          }}
        />
      </div>
      <TimelineSkeleton visible={rowLoading} />
      </>
      )}
      </div>
      </>
      )}
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
  overlay = false,
}: {
  kind: PlayerButtonKind;
  onClick?: () => void;
  // 딤 위(가로)면 흰 알약 대신 반투명 검정 + 흰 아이콘. RecordingControls 참고.
  overlay?: boolean;
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
        // 가로 딤은 50 — 영상 위에 떠 있는 버튼이라 세로(40)보다는 커야 눌리는데,
        // 60 은 너무 컸다(사용자 지정 2026-08-14). 세로는 그대로 40.
        width: overlay ? "50px" : "40px",
        height: overlay ? "50px" : "40px",
        // 가로 딤 위 버튼은 테두리 없이 회색 55% + 흰 아이콘(사용자 지정 2026-08-14).
        // 검정 반투명에서 아래 아이콘 원과 같은 회색으로 맞췄다 — 같은 화면에
        // 있는 것끼리 결을 맞춘다. 아이콘 그림자와 아래 딤 60% 가 밝은 영상
        // 위에서도 안 묻히게 받쳐 준다. 눌린 상태는 한 단계 진하게(0.75).
        // 흰색 채우기(70% → 50%)를 거쳐 여기로 왔다 — 반투명 흰 배경은 밝은 영상
        // 위에서 아이콘 대비가 무너진다(흰 아이콘 1.2:1, 그레이도 배경과 붙는다).
        // 검정 쪽은 영상이 밝든 어둡든 흰 아이콘이 또렷하다.
        // 눌린 상태(active)는 한 단계 옅게 — 눌린 티가 나야 한다.
        border: overlay ? "none" : "1px solid #D9D9D9",
        backgroundColor: overlay
          ? active
            ? "rgba(117,117,117,0.9)"
            : "rgba(117,117,117,0.75)"
          : active
            ? "#F2F2F2"
            : "#FFFFFF",
      }}
    >
      {label != null ? (
        <span
          style={{
            fontSize: overlay ? "17px" : "14px",
            fontWeight: 500,
            // 배속 글자도 아이콘과 같은 규칙 — 가로 딤이면 흰색 + 같은 그림자.
            color: overlay ? "#FFFFFF" : "#262626",
            textShadow: overlay ? "0 0 4px rgba(0,0,0,0.6)" : undefined,
          }}
        >
          {label}
        </span>
      ) : (
        <PlayerIcon
          kind={kind}
          // 버튼(50)에 맞춰 32 → 27. 비율을 그대로 두면 아이콘만 꽉 차 보인다.
          size={overlay ? 27 : 24}
          // 가로 딤이면 흰색으로 뒤집는다 — 배경이 검정 50% 라 흰 아이콘이 또렷하다.
          invert={overlay}
        />
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
  invert = false,
}: {
  kind: PlayerButtonKind;
  size: number;
  // 딤 위(가로)에선 아이콘을 흰색으로 뒤집는다.
  invert?: boolean;
}) {
  const marginLeft = kind === "skip-forward" ? "2px" : undefined;
  const marginRight = kind === "skip-back" ? "2px" : undefined;
  return (
    <img
      src={PLAYER_ICON_SRC[kind]}
      alt=""
      style={{
        width: `${size}px`,
        height: `${size}px`,
        marginLeft,
        marginRight,
        // 뒤집을 때(가로 딤의 흰 아이콘) 뒤에 그림자를 깐다(사용자 지정) —
        // 밝은 영상 위에서 아이콘이 묻히지 않게 받쳐 준다.
        // 아래로 떨어뜨리지 않고 가운데에서 퍼지게 한다(오프셋 0 · 반경 4,
        // 사용자 지정 2026-08-14). drop-shadow 는 filter 체인이라 invert 뒤에 붙인다.
        filter: invert
          ? "brightness(0) invert(1) drop-shadow(0 0 4px rgba(0,0,0,0.6))"
          : undefined,
      }}
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
