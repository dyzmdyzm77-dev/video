"use client";

import { useCallback, useRef, useState } from "react";
import { bestGridForCount } from "./layoutRules";
import { useGridAreaRatio } from "./useGridLayout";
import type React from "react";
import { CameraFeed, GridSelectionOverlay } from "./CameraFeed";
import { useAutoHide } from "./useAutoHide";
import { useVideoFit } from "./VideoFitToast";
import type { VideoFit } from "./videoFit";

// 가로 모드의 영상 화면 — 지금은 '영상만'이다(사용자 결정).
// 헤더·날짜 바·카메라 목록·하단 탭바·시스템 바 전부 빼고 화면을 영상이 다 쓴다.
// 다채널이면 세로에서 보던 페이지의 카메라들을 그대로, 단, 배치(cols×rows)는
// 가로 영역 비율로 다시 고른다. 단일이면 그 카메라 하나를 꽉 채운다.
//
// 조작은 세로와 같다:
//   · 한 번 탭  — 딤 토글(5초 뒤 자동으로 걷힘, useAutoHide)
//   · 두 번 탭  — 다채널↔단일 전환
// 판정도 세로(GridView.handleCellClick)와 같은 방식이다. 첫 탭을 CLICK_GAP 만큼
// 붙잡아 뒀다가 두 번째가 안 오면 그때 딤을 토글한다. 안 그러면 더블탭 할 때마다
// 딤이 켜졌다 꺼졌다 한다.
//
// 회전이 끝나면 기기 크기가 눕혀지고 각도는 0 으로 돌아온다(deviceRotate.ts).
// 그래서 여기 콘텐츠는 똑바로 선 가로 화면으로 그리면 된다 — 역회전 보정 없음.
//
// 세 안이 같은 화면을 쓴다. 안마다 달라질 부분이 생기면 그때 쪼갤 것.

/** 더블탭 판정 시간(ms). 세로 다채널과 같은 값. */
const CLICK_GAP = 230;

/** 딤 헤더 높이(px). 세로 A-1 의 OVERLAY_HEADER_H 와 같은 값. */
const OVERLAY_HEADER_H = 56;

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function LandscapeVideo({
  cameras,
  expandedIndex,
  page,
  pageSize,
  totalPages = 1,
  playbackMs,
  driveByPlayback,
  onGallery,
  onExpand,
  onBack,
  title,
  subtitle,
  onTitleClick,
  mode = "live",
  setMode,
  timeLabel,
  controls,
  controlsOnDim = false,
  statusPlacement = "bottom-left",
  dimAlpha,
  dimTopHeight,
  dimBottomHeight,
  fit: fitProp,
  onFitCycle,
  showPageIndicator = true,
}: {
  cameras: { label: string; src: string }[];
  /** 단일 화면이면 그 인덱스, 다채널이면 null. */
  expandedIndex: number | null;
  page: number;
  /** 한 페이지 타일 수. cols×rows 는 가로 영역 비율로 여기서 다시 고른다. */
  pageSize: number;
  /** 다채널 총 페이지 수 — 딤 하단 페이지 인디케이터용. */
  totalPages?: number;
  playbackMs?: number | null;
  driveByPlayback?: boolean;
  /** 딤의 '갤러리' 버튼. 세로의 화면 구성 시트를 그대로 연다. */
  onGallery?: () => void;
  /** 타일 더블탭 — 그 카메라 단일 화면으로. */
  onExpand?: (i: number) => void;
  /** 단일 화면 더블탭 — 다채널로 복귀. */
  onBack?: () => void;
  /** 딤 위 헤더 — 장소명. 세로 딤(A-1 OverlayHeader)과 같은 자리·같은 서식이다.
   *  가로는 헤더 바가 없어서 여기 말고는 어디가 찍힌 화면인지 알 길이 없다. */
  title?: string;
  subtitle?: string;
  onTitleClick?: () => void;
  /** 딤 하단 왼쪽 — 지금 실시간인지 녹화인지, 그리고 현재 시각.
   *  가로는 날짜 바가 없어서 여기 말고는 알 길이 없다. 세로 날짜 바와 같은 정보다. */
  mode?: "live" | "recording";
  setMode?: (m: "live" | "recording") => void;
  timeLabel?: string;
  /** 녹화일 때 딤 하단에 얹는 플레이어 버튼 + 시간바. 안마다 컴포넌트가 달라
   *  여기서 만들지 않고 받아서 자리만 잡는다(세로에서 쓰던 그것을 그대로 넘긴다).
   *  기본은 흰 바 위 — 세로와 같은 밝은 UI 를 그대로 넘기는 안(A·B)을 위해서다. */
  controls?: React.ReactNode;
  /** controls 가 이미 딤 위에 얹히도록 색을 맞춰 왔는가. 켜면 흰 바를 걷어
   *  영상이 비친다(A-1). 끄면(기본) 기존처럼 흰 바에 얹는다 — 밝은 UI 를 그대로
   *  넘기는 안은 배경이 없으면 글자·눈금이 영상에 묻힌다. */
  controlsOnDim?: boolean;
  /** 실시간/녹화 칩 + 시각을 어디에 둘지.
   *  "bottom-left"(기본) — 딤 아래 왼쪽, 녹화 컨트롤 바로 위. 기존 그대로.
   *  "top-center"      — 딤 위 가운데. 장소명(왼쪽)·딤 아이콘(오른쪽)과 같은 줄에
   *                      앉는다. 녹화 컨트롤은 그대로 아래 남는다. */
  statusPlacement?: "bottom-left" | "top-center";
  /** 딤 그라데이션 사양 — 안 주면 GridSelectionOverlay 기본값(0.6 / 25% / 20%).
   *  세로에서 더 진한 딤을 쓰는 안(A-1: 0.8)은 가로도 같은 값을 넘겨야 한다.
   *  안 그러면 같은 화면인데 가로만 옅어 보인다. */
  dimAlpha?: number;
  dimTopHeight?: string;
  dimBottomHeight?: string;
  /** 화면 맞춤(원본비율·늘리기·채우기)을 바깥에서 관리할 때 넘긴다.
   *  안 주면(기본) 이 컴포넌트가 자체 상태를 들고 "채우기"에서 시작한다.
   *  회전하면 세로 화면이 통째로 언마운트되므로, 세로에서 보던 맞춤을 그대로
   *  이어가려면 세로와 같은 상태를 여기로 넘겨야 한다. */
  fit?: VideoFit;
  onFitCycle?: () => void;
  /** 딤 아래 페이지 인디케이터(점)를 그릴지. 기본 true = 기존 그대로. */
  showPageIndicator?: boolean;
}) {
  // 가로로 들어오면 딤을 켠 채로 시작한다(사용자 결정) — 세로 영상 탭 첫 진입과
  // 같은 규칙이다(GridView 의 initialDim). 5초 뒤 자동으로 걷힌다(useAutoHide).
  // 가로는 헤더·탭바가 없어 화면에 영상뿐이라, 딤이 안 뜨면 무엇을 누를 수 있는지
  // 알 길이 없다.
  const [dim, setDim] = useState(true);
  const hide = useCallback(() => setDim(false), []);
  const auto = useAutoHide(dim, hide);
  // 바깥에서 맞춤 상태를 주면 그걸 쓰고, 안 주면 자체 상태(기존 동작).
  // 훅은 조건 없이 항상 부른다 — 안 쓰이면 그냥 놀고 있는 상태다.
  const ownFit = useVideoFit("fill");
  const fit = fitProp ?? ownFit.fit;
  const cycle = onFitCycle ?? ownFit.cycle;
  // 배치(cols×rows)는 가로 영역 비율로 다시 고른다. 세로에서 고른 값을 그대로
  // 들고 오면 안 된다 — 16채널 기준 세로는 2×8 이 맞지만 가로(≈2.17:1)에서 그
  // 배치는 타일이 0.54:1 로 길쭉해진다. 같은 영역에서 4×4 면 2.17:1 로 16:9 에
  // 훨씬 가깝다. 판정 기준은 세로와 같은 bestGridForCount 하나를 쓴다.
  const [gridAreaRef, landscapeRatio] = useGridAreaRatio();
  const { cols, rows } = bestGridForCount(pageSize, landscapeRatio);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 한 번이면 딤 토글, 두 번이면 전환. index 는 다채널 타일에서만 온다.
  const handleTap = (index: number | null) => {
    if (clickTimer.current !== null) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      if (index === null) onBack?.();
      else onExpand?.(index);
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      setDim((v) => !v);
      auto.keepAlive();
    }, CLICK_GAP);
  };

  // 딤 아래 왼쪽 — 실시간/녹화 + 현재 시각. 세로 날짜 바의 내용을 그대로 옮겼다.
  // 칩 색은 딤(어두운 배경)에 맞춰 바꾼다 — 세로의 밝은 회색 트랙은 여기서 안 보인다.
  const seg = (active: boolean, activeBg: string) => ({
    height: "20px",
    paddingLeft: "10px",
    paddingRight: "10px",
    borderRadius: "9999px",
    backgroundColor: active ? activeBg : "transparent",
    color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
  });
  // 실시간/녹화 칩 + 현재 시각 한 줄. 내용은 자리와 무관하게 같고, statusPlacement
  // 가 아래 왼쪽에 둘지 위 가운데에 둘지만 정한다.
  const statusRow = (
    <div className="flex items-center gap-2">
      <div
        className="inline-flex items-center rounded-full"
        style={{
          backgroundColor: "rgba(255,255,255,0.22)",
          padding: "2px",
          gap: "2px",
        }}
      >
        <button
          type="button"
          onClick={() => setMode?.("live")}
          className="inline-flex items-center text-[10px] font-bold leading-none tracking-wide transition-colors"
          style={seg(mode === "live", "#ff3b4a")}
        >
          LIVE
        </button>
        <button
          type="button"
          onClick={() => setMode?.("recording")}
          className="inline-flex items-center text-[10px] font-bold leading-none tracking-wide transition-colors"
          style={seg(mode === "recording", "#757575")}
        >
          녹화
        </button>
      </div>
      {timeLabel && (
        <span
          suppressHydrationWarning
          className="text-[14px] font-medium leading-none text-white"
        >
          {timeLabel}
        </span>
      )}
    </div>
  );

  // 딤 위에 얹는 덩어리 공통 처리 — 딤과 같이 뜨고, 만지는 동안 자동 숨김 타이머를
  // 붙잡고, 클릭이 영상 탭(딤 토글·더블탭 전환)으로 새어나가지 않게 막는다.
  const dimLayer = (
    className: string,
    style: React.CSSProperties,
    children: React.ReactNode,
  ) => (
    <div
      className={`absolute transition-opacity duration-300 ease-out ${className}`}
      style={{
        ...style,
        opacity: dim ? 1 : 0,
        pointerEvents: dim ? "auto" : "none",
      }}
      {...auto.holdProps}
      onClick={(e) => {
        e.stopPropagation();
        auto.keepAlive();
      }}
    >
      {children}
    </div>
  );

  const topCenter = statusPlacement === "top-center";

  // 위 가운데 — 장소명(왼쪽)·딤 아이콘(오른쪽)과 한 줄로 읽히게 맞춘다. 아이콘 줄이
  // top 12 에 높이 32(중심 28)라 여기도 같은 값을 쓴다. 헤더(pointer-events:none)
  // 보다 뒤에 그려지므로 가운데 칩 클릭이 헤더에 먹히지 않는다.
  const statusTop = topCenter
    ? dimLayer(
        "left-1/2 flex -translate-x-1/2 items-center",
        { top: "12px", height: "32px" },
        statusRow,
      )
    : null;

  // 딤 아래 — (기본이면) 칩 줄 + 녹화 플레이어·시간바. 둘을 한 덩어리로 쌓아
  // 바 높이를 몰라도 칩 줄이 항상 그 위에 앉는다. 위 가운데로 올린 경우엔
  // 컨트롤만 남으므로, 컨트롤도 없으면 아예 그리지 않는다.
  const statusBottom =
    !topCenter || controls
      ? dimLayer(
          "inset-x-0 bottom-0",
          {},
          <>
            {!topCenter && <div className="px-5 pb-3">{statusRow}</div>}
            {controls && (
              <div className={`w-full${controlsOnDim ? "" : " bg-white"}`}>
                {controls}
              </div>
            )}
          </>,
        )
      : null;

  // 딤 위 헤더 — 딤과 같이 뜨고 같이 사라진다(세로 A-1 OverlayHeader 와 동일).
  // 껍데기는 가로 전체를 덮는 띠라 클릭을 통과시켜야 한다(pointer-events: none).
  // 안 그러면 같은 줄 오른쪽 딤 아이콘을 덮어 눌러도 반응하지 않는다.
  const header = title ? (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center px-5 transition-opacity duration-300 ease-out"
      style={{ height: `${OVERLAY_HEADER_H}px`, opacity: dim ? 1 : 0 }}
    >
      <div
        className="flex flex-col gap-[2px]"
        style={{ pointerEvents: dim ? "auto" : "none" }}
        {...auto.holdProps}
        onClick={(e) => {
          // 영상 탭(딤 토글·더블탭 전환)으로 새어나가지 않게 막고 타이머만 되돌린다.
          e.stopPropagation();
          auto.keepAlive();
        }}
      >
        <button
          type="button"
          onClick={onTitleClick}
          className="flex items-center gap-1.5 text-[18px] font-bold leading-none text-white"
        >
          {title}
          <ChevronDownIcon className="h-6 w-6 text-white" />
        </button>
        {subtitle && (
          <p
            className="text-[12px] leading-none"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  ) : null;

  const overlay = (
    <GridSelectionOverlay
      visible={dim}
      currentPage={page}
      totalPages={expandedIndex !== null ? 1 : totalPages}
      onGallery={onGallery}
      onFit={cycle}
      fit={fit}
      dimAlpha={dimAlpha}
      topHeight={dimTopHeight}
      bottomHeight={dimBottomHeight}
      showPageIndicator={showPageIndicator}
      auto={auto}
    />
  );

  // 딤을 붙이는 껍데기. 딤 안 버튼을 누르고 있는 동안은 타이머를 붙잡는다.
  const shell = (children: React.ReactNode) => (
    <div className="relative h-full w-full select-none" {...auto.holdProps}>
      {children}
      {overlay}
      {header}
      {statusTop}
      {statusBottom}
    </div>
  );

  if (expandedIndex !== null) {
    const cam = cameras[expandedIndex];
    return shell(
      <div className="h-full w-full bg-black" onClick={() => handleTap(null)}>
        <CameraFeed
          label={cam.label}
          src={cam.src}
          fit={fit}
          playbackMs={playbackMs}
          driveByPlayback={driveByPlayback}
        />
      </div>,
    );
  }

  // 다채널 — 타일 사이 구분선은 세로와 같은 흰색 2px(다채널 타일 구분선 규칙).
  const start = page * pageSize;
  const tiles = Array.from({ length: pageSize }, (_, i) => cameras[start + i]);
  return shell(
    <div
      ref={gridAreaRef as React.RefObject<HTMLDivElement>}
      className="grid h-full w-full bg-white"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: "2px",
      }}
    >
      {tiles.map((cam, i) => (
        <div
          key={i}
          className="relative cursor-pointer overflow-hidden bg-neutral-900"
          onClick={() => handleTap(start + i)}
        >
          {cam && (
            <CameraFeed
              label={cam.label}
              src={cam.src}
              fit={fit}
              playbackMs={playbackMs}
              driveByPlayback={driveByPlayback}
            />
          )}
        </div>
      ))}
    </div>,
  );
}
