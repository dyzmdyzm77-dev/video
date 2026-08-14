"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE } from "../basePath";
import { bestGridForCount } from "./layoutRules";
import { useGridAreaRatio } from "./useGridLayout";
import type React from "react";
import { CameraFeed, GridSelectionOverlay } from "./CameraFeed";
import { useAutoHide } from "./useAutoHide";
import { useVideoFit } from "./VideoFitToast";
import { requestDeviceRotate, useRotatedInput } from "./deviceRotate";
import { exitImmersive, useImmersive } from "./immersive";
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

/** 확대(몰입)를 드래그로 풀 때 필요한 세로 이동량(px). 탭·스크럽과 헷갈리지
 *  않을 만큼은 크고, 한 손으로 한 번에 그을 수 있을 만큼은 작게 잡았다. */
const EXIT_DRAG_PX = 60;

/** 좌우 스와이프로 페이지를 넘길 때 필요한 가로 이동량(px).
 *  세로 다채널(GridView)의 스와이프 판정과 같은 값이라 조작감이 같다. */
const PAGE_SWIPE_PX = 50;

/** 딤 헤더 높이(px). 세로 A-1 의 OVERLAY_HEADER_H 와 같은 값. */
const OVERLAY_HEADER_H = 56;

// 가로 딤 그라데이션 사양 — 세 안이 공유한다. 세로 A-1 값(DIM_ALPHA 0.8,
// 상단 40%/50%)에서 가져왔다. 공용 기본값(0.6/25%/20%)을 쓰면 같은 화면인데
// 가로만 옅어 보인다.
const LANDSCAPE_DIM_ALPHA = 0.8;
const LANDSCAPE_DIM_TOP_GRID = "40%";
const LANDSCAPE_DIM_TOP_SINGLE = "50%";
// 하단은 세로(20%/33%)보다 더 올린다 — 가로는 화면이 짧은데 아래에 플레이어
// 버튼 + 시간바가 통째로 얹혀서, 20% 로는 그라데이션이 컨트롤까지 못 올라와
// 글자·눈금이 영상에 묻힌다(사용자 요청).
// 45% → 60%: 5버튼 배경을 검정 50% 로 낮추면서 그 아래 깔린 딤이 더 받쳐 줘야
// 아이콘·눈금이 밝은 영상 위에서 안 묻힌다(사용자 지정 2026-08-14).
const LANDSCAPE_DIM_BOTTOM = "60%";

// 딤 위 첫 줄에 '장소명(왼쪽) + 실시간/녹화·시각(가운데) + 아이콘(오른쪽)' 셋을
// 한 줄로 넣으려면 이만큼은 있어야 한다. 실측으로 장소명 ~125 + 칩줄 ~180 +
// 아이콘 ~165 = 470 에 사이 여백까지 필요해서 560 으로 잡았다.
// 이보다 좁으면(세로에서 '크게 보기'로 들어온 경우) 셋이 서로 물린다 — 그때는
// 아이콘 줄만 헤더 아래(둘째 줄)로 내린다. 장소명 + 칩줄은 둘이서는 들어간다.
const ONE_ROW_MIN_W = 560;

// 장소명 옆 화살표 — 세로 화면과 같은 에셋(More.svg)을 마스크로 찍는다.
// 예전엔 여기서만 인라인 SVG(M6 9l6 6 6-6)로 직접 그려, 같은 자리인데 굵기와
// 모양이 세로와 달랐다(사용자 지적). 색은 currentColor 를 따라간다.
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

export default function LandscapeVideo({
  cameras,
  expandedIndex,
  page,
  pageSize,
  totalPages = 1,
  playbackMs,
  driveByPlayback,
  onGallery,
  onMore,
  onAi,
  swapAiZoom = false,
  onMenu,
  centerControls,
  edgeInset,
  bottomInset,
  iconBottomInset,
  headerAlign = "center",
  statusStyle = "segment",
  statusActiveStyle = "brand",
  scrubbing = false,
  onExpand,
  onBack,
  title,
  subtitle,
  onTitleClick,
  mode = "live",
  setMode,
  timeLabel,
  recordingLabel = "녹화",
  singleBadge,
  singleBadgeAlign,
  singleHeaderCamera = false,
  gridHeaderLabel,
  controls,
  controlsOnDim = false,
  // ── 아래 넷은 '가로 화면' 자체의 사양이라 안이 정하지 않는다 ──────────────
  // 예전엔 안마다 넘기게 뒀는데, A-1 만 넘기고 A·B 는 안 넘겨서 같은 가로
  // 화면인데 딤 농도·칩 위치·페이지 점이 서로 달랐다(사용자 지적).
  // 기본값을 여기로 올려 세 안이 자동으로 같아지게 한다. 바꿀 일이 있으면
  // 이 파일만 고치면 된다.
  statusPlacement = "top-center",
  showPageIndicator = false,
  dimAlpha = LANDSCAPE_DIM_ALPHA,
  dimTopHeight,
  dimBottomHeight = LANDSCAPE_DIM_BOTTOM,
  fit: fitProp,
  onFitCycle,
  onPageChange,
  loading = false,
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
  /** 딤의 '더보기'(⋮). 세로와 같은 더보기 시트를 연다. */
  onMore?: () => void;
  /** 딤의 AI 버튼. 안 주면 표시만 한다(안별 기본값 보존). */
  onAi?: () => void;
  /** AI·크게 보기 자리 재배치(A-3 전용) — GridSelectionOverlay 로 그대로 넘긴다.
   *  기본 false = 기존 그대로. */
  swapAiZoom?: boolean;
  /** 딤의 메뉴 버튼(AI 옆). 안 주면 안 그린다 — A-2안 가로 전용. */
  onMenu?: () => void;
  /** 화면 한가운데에 얹을 컨트롤. 아래 시간바 대신 플레이어 버튼만 가운데
   *  두는 A-2안 가로 사양에서 쓴다. 안 주면 아무것도 안 그린다. */
  centerControls?: React.ReactNode;
  /** 딤 위 UI(장소명·아이콘 줄·칩 줄·AI/메뉴)의 좌우 가장자리 여백(px).
   *  영상 자체는 해당 없음 — 화면을 끝까지 쓴다. 안 주면 지금 값 그대로. */
  edgeInset?: number;
  /** 딤 아래 줄(메뉴·AI · 페이지 점)이 화면 아래에서 떨어지는 거리(px).
   *  기본 12. 아래에 시간바가 깔리는 안에서 그 위로 띄우는 용도. */
  bottomInset?: number;
  /** 딤 아이콘(AI·크게 보기·페이지 점)만 따로 띄울 거리(px). 안 주면 bottomInset
   *  을 그대로 쓴다(지금까지의 동작 — 시간바 층과 아이콘이 같이 움직인다).
   *  A-3 은 아이콘을 시간바 '위'로 올려야 해서 둘을 갈랐다(사용자 지정
   *  2026-08-14: "AI버튼이랑 축소버튼은 시간바 상단에서 10정도 띄운 곳으로"). */
  iconBottomInset?: number;
  /** 장소명 줄을 오른쪽 아이콘 줄과 어떻게 맞출지.
   *   center = 지금까지의 기본. 56 높이 안에서 세로 가운데(중심 28).
   *   top    = 윗변끼리 맞춘다(둘 다 top 12). 장소명이 두 줄이라 가운데 정렬이면
   *            첫 줄이 아이콘보다 살짝 위로 뜬다(A-2안 가로 사양, 사용자 요청). */
  headerAlign?: "center" | "top";
  /** 시간바를 끄는 중인가. 켜면 딤 위 UI(장소명·아이콘 줄·칩 줄·AI/메뉴)를
   *  잠깐 걷어 시간바만 남긴다 — 끄는 동안 화면을 가리지 않게(사용자 요청).
   *  손을 떼면 그대로 돌아온다. */
  scrubbing?: boolean;
  /** 실시간/녹화 표시 방식.
   *   segment = 지금까지의 기본. 한 덩어리 알약 안에 LIVE·녹화(빨강/회색).
   *   chips   = '실시간'·'녹화' 칩 두 개. 고른 쪽만 흰 배경 + 검정 글자
   *             (사용자 지정, A-1안 가로). */
  statusStyle?: "segment" | "chips";
  /** 토글에서 '고른 쪽' 색.
   *   brand = 지금까지의 기본(LIVE 빨강 · 녹화 회색, 흰 글자).
   *   white = 흰 배경 + 검정 글자(사용자 지정, A-2안 가로). */
  statusActiveStyle?: "brand" | "white";
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
  /** 녹화 쪽 칩 문구. 기본 "녹화" — 세로 토글을 "녹화영상"으로 바꾼 안(A-3)만
   *  같은 말로 맞춘다(사용자 지적: 가로만 말이 달랐다). */
  recordingLabel?: string;
  /** 단일 화면 영상 배지 문구. 안 주면 카메라 이름(지금까지의 동작).
   *  A-3 은 세로와 같이 시각을 띄운다(사용자 결정 2026-08-14).
   *  다채널 타일은 그대로 카메라 이름이다 — 세로에서도 타일은 안 바꿨다. */
  singleBadge?: string;
  /** 그 배지를 어디에 둘지. 기본 "left" = 왼쪽 위 구석(지금까지의 동작).
   *  A-3 은 세로와 같이 아래 가운데("bottom-center"). */
  singleBadgeAlign?: "left" | "center" | "bottom-left" | "bottom-center";
  /** 단일 화면 딤 헤더를 '뒤로가기 + 카메라 이름'으로 바꿀지. 기본 false =
   *  지금까지처럼 장소명 + 지점명(계약번호). A-3 만 켠다(사용자 결정 2026-08-14) —
   *  가로 단일에서 지금 보는 게 어느 카메라인지가 장소보다 급하고, 다채널로
   *  돌아가는 길이 더블탭뿐이라 버튼이 필요하다.
   *  다채널일 땐 켜도 그대로 장소명이다 — 거긴 카메라가 하나가 아니다. */
  singleHeaderCamera?: boolean;
  /** singleHeaderCamera 를 켠 안에서, 다채널일 때 그 자리에 쓸 글자.
   *  안 주면 장소명(title)을 그대로 쓴다 — 세로 헤더와 같은 값이라 두 화면이
   *  같은 말을 한다. 다채널은 카메라가 하나가 아니라 카메라 이름을 못 쓴다. */
  gridHeaderLabel?: string;
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
  /** 좌우 스와이프로 페이지를 넘길 때. 안 주면 스와이프가 아무 일도 안 한다.
   *  세로 다채널의 스와이프 페이징을 가로·확대 화면에서도 그대로 쓰기 위한 것 —
   *  '위아래는 확대 취소, 좌우는 페이지 넘김'이 원래 사양이다. */
  onPageChange?: (next: number) => void;
  /** 화면 전환(실시간↔녹화, 다채널↔단일) 중인가. 켜면 세로와 같은 스켈레톤을
   *  덮는다 — 세로에만 있고 여긴 없어서 확대 화면만 전환이 뚝 끊겨 보였다.
   *  세로 것(SectionSkeleton)은 안 안에 있는 컴포넌트라 못 가져다 쓰고,
   *  배치(cols×rows)도 가로 기준으로 다시 잡혀야 해서 여기서 직접 그린다. */
  loading?: boolean;
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
  // 배치(cols×rows)는 가로 영역 비율로 다시 고른다. 세로에서 쓰던 배치를 그대로
  // 들고 오면 안 된다 — 16채널 기준 세로는 2×8 이 맞지만 가로(≈2.17:1)에서 그
  // 배치는 타일이 0.54:1 로 길쭉해진다. 같은 영역에서 4×4 면 2.17:1 로 16:9 에
  // 훨씬 가깝다. 판정 기준은 세로와 같은 bestGridForCount 하나를 쓴다.
  // (사용자가 정하는 건 '방향별 채널 수'다 — 그 수를 어떻게 나눌지는 여기 몫.)
  const [gridAreaRef, landscapeRatio] = useGridAreaRatio();
  const { cols, rows } = bestGridForCount(pageSize, landscapeRatio);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 확대(몰입) 중 영상 영역을 위/아래로 그으면 확대를 푼다(사용자 요청).
  // 실기기 가로에선 콘텐츠가 CSS 로 90° 돌아 있어 화면 좌표의 x·y 가 콘텐츠
  // 기준과 맞바뀐다 — 사용자가 느끼는 '위아래'를 쓰려면 환산해야 한다
  // (rotate(90deg) 는 콘텐츠 아래를 화면 왼쪽으로 보낸다 → dy = -dx_screen).
  const immersive = useImmersive();
  const rotatedInput = useRotatedInput();
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const startExitDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    // 딤(헤더·칩줄·플레이어·시간바) 위에서 시작한 건 그쪽 조작이다.
    // 시간바·플레이어 위에서 시작한 건 그쪽 조작(스크럽)이다. 그 외 딤 요소
    // (헤더·칩줄·아이콘 줄) 위에서는 스와이프를 받는다 — 가로는 화면이 짧아
    // 딤 전체를 빼면 스와이프할 자리가 거의 안 남는다.
    if ((e.target as HTMLElement).closest?.("[data-no-swipe]")) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  // 판정은 '손을 뗄 때'가 아니라 '움직이는 동안' 한다. 터치에서 세로로 그으면
  // 브라우저가 스크롤 제스처로 가로채면서 pointerup 대신 pointercancel 을
  // 보내는데, up 에서만 보면 그때 판정이 통째로 사라진다. 문턱을 넘는 순간
  // 바로 풀면 취소가 와도 이미 처리된 뒤다.
  const moveExitDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragRef.current;
    if (!s) return;
    const sx = e.clientX - s.x;
    const sy = e.clientY - s.y;
    // 실기기 가로는 콘텐츠가 90° 돌아 있어 화면 좌표를 콘텐츠 기준으로 환산한다.
    const dy = rotatedInput ? -sx : sy;
    const dx = rotatedInput ? sy : sx;
    const vertical = Math.abs(dy) > Math.abs(dx);
    // 위아래 = 확대 취소. 확대 중일 때만이다.
    if (vertical) {
      if (immersive && Math.abs(dy) >= EXIT_DRAG_PX) {
        dragRef.current = null;
        exitImmersive();
      }
      return;
    }
    // 좌우 = 페이지 넘김(원래 사양). 단일 화면은 넘길 페이지가 없다.
    if (
      expandedIndex === null &&
      totalPages > 1 &&
      Math.abs(dx) >= PAGE_SWIPE_PX
    ) {
      dragRef.current = null;
      const next = dx < 0 ? page + 1 : page - 1;
      const clamped = Math.max(0, Math.min(totalPages - 1, next));
      if (clamped !== page) onPageChange?.(clamped);
      auto.keepAlive();
    }
  };

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
    // statusActiveStyle="white" 면 고른 쪽을 흰 배경 + 검정 글자로 채운다
    // (사용자 지정, A-2안 가로). 기본은 예전대로 LIVE 빨강 · 녹화 회색.
    backgroundColor: active
      ? statusActiveStyle === "white"
        ? "#FFFFFF"
        : activeBg
      : "transparent",
    color: active
      ? statusActiveStyle === "white"
        ? "#262626"
        : "#ffffff"
      : "rgba(255,255,255,0.7)",
  });
  // 실시간/녹화 칩 + 현재 시각 한 줄. 내용은 자리와 무관하게 같고, statusPlacement
  // 가 아래 왼쪽에 둘지 위 가운데에 둘지만 정한다.
  // 칩 두 개 방식(statusStyle="chips") — 한 덩어리 세그먼트 대신 '실시간'·'녹화'
  // 를 따로 떼고, 고른 쪽만 흰 배경 + 검정 글자로 채운다(사용자 지정, A-1안 가로).
  const chip = (on: boolean) => ({
    height: "26px",
    padding: "0 12px",
    borderRadius: "9999px",
    border: on ? "1px solid #FFFFFF" : "1px solid rgba(255,255,255,0.35)",
    backgroundColor: on ? "#FFFFFF" : "rgba(0,0,0,0.35)",
    color: on ? "#262626" : "#FFFFFF",
  });
  const statusRow = (
    <div className="flex items-center gap-2">
      {statusStyle === "chips" ? (
        <div className="flex items-center" style={{ gap: "6px" }}>
          <button
            type="button"
            onClick={() => setMode?.("live")}
            className="inline-flex items-center text-[12px] font-bold leading-none transition-colors"
            style={chip(mode === "live")}
          >
            실시간
          </button>
          <button
            type="button"
            onClick={() => setMode?.("recording")}
            className="inline-flex items-center text-[12px] font-bold leading-none transition-colors"
            style={chip(mode === "recording")}
          >
            {recordingLabel}
          </button>
        </div>
      ) : (
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
          {recordingLabel}
        </button>
      </div>
      )}
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
    // 껍데기가 클릭을 통과시킬지. 딤 아이콘 줄·버튼과 같은 높이에 겹쳐 놓는
    // 층에 쓴다 — 껍데기가 클릭을 받으면 아이콘 위를 덮어 눌러도 반응이 없다.
    // (헤더가 같은 이유로 이미 pointer-events:none 이다.)
    //   "wrap"  = 껍데기는 통과, 내용을 감싼 한 겹이 대신 받는다. 내용이
    //             자기 크기만큼만 차지하는 층(위 가운데 칩 줄, 가운데 컨트롤).
    //   "shell" = 껍데기만 통과. 내용이 폭을 다 쓰는 층(아래 칩 줄 + 시간바)은
    //             감싸 봐야 그 한 겹이 다시 오른쪽 버튼을 덮으므로, 내용 쪽에
    //             박아 둔 pointer-events-auto 에 맡긴다.
    // 반드시 인라인으로 꺼야 한다 — className 에 pointer-events-none 을 얹어도
    // 같은 요소의 인라인 pointerEvents 가 이겨서 그대로 클릭을 삼킨다
    // (사용자 지적: "메뉴 아이콘이랑 AI 아이콘도 안눌려져").
    passThrough: false | "wrap" | "shell" = false,
    // 시간바를 끄는 동안에도 남길 층인가. 시간바 자체가 든 층만 true 다 —
    // 나머지는 걷어야 '시간바만 남는다'가 된다.
    keepWhileScrubbing = false,
  ) => (
    <div
      className={`absolute transition-opacity duration-300 ease-out ${className}`}
      style={{
        ...style,
        opacity: dim && (keepWhileScrubbing || !scrubbing) ? 1 : 0,
        pointerEvents: passThrough ? "none" : dim ? "auto" : "none",
      }}
      {...auto.holdProps}
      onClick={(e) => {
        e.stopPropagation();
        auto.keepAlive();
      }}
    >
      {passThrough === "wrap" ? (
        <div style={{ pointerEvents: dim ? "auto" : "none" }}>{children}</div>
      ) : (
        children
      )}
    </div>
  );


  // 딤 첫 줄에 셋(장소명·칩줄·아이콘)이 다 들어가는 폭인가. 세로에서 '크게
  // 보기'로 들어오면 폭이 기기 폭 그대로라 못 들어간다 — 그때는 아이콘 줄만
  // 둘째 줄로 내린다(ONE_ROW_MIN_W 주석 참고).
  const shellRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const measure = () => {
      const el = shellRef.current;
      if (!el || el.offsetWidth <= 0) return;
      setNarrow(el.offsetWidth < ONE_ROW_MIN_W);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (shellRef.current) ro.observe(shellRef.current);
    // 프리셋 변경·드래그 리사이즈·회전은 ResizeObserver 만으로는 놓칠 수 있다
    // (useGridLayout 과 같은 이유).
    const evts = ["devicechange", "deviceresize", "resize"];
    evts.forEach((e) => window.addEventListener(e, measure));
    return () => {
      ro.disconnect();
      evts.forEach((e) => window.removeEventListener(e, measure));
    };
  }, []);

  // 칩줄을 위 가운데 두는 건 폭이 넉넉할 때만이다. 좁으면(세로에서 '크게 보기')
  // 가운데 정렬한 칩줄이 왼쪽 장소명과 물린다 — 실측으로 폭 285 에서 장소명
  // 16~115, 칩줄 71~213 로 44px 겹쳤다. 그때는 칩줄을 원래 자리(딤 아래 왼쪽,
  // 컨트롤 바로 위)로 내린다. 위 첫 줄엔 장소명 + 아이콘만 남아 편하게 들어간다.
  const topCenter = statusPlacement === "top-center" && !narrow;

  // 위 가운데 — 장소명(왼쪽)·딤 아이콘(오른쪽)과 한 줄로 읽히게 맞춘다. 아이콘 줄이
  // top 12 에 높이 32(중심 28)라 여기도 같은 값을 쓴다.
  // 이 층은 아이콘 줄과 같은 높이에 겹쳐 있고 딤(overlay)보다 뒤에 그려진다.
  // 껍데기까지 클릭을 받으면 폭이 좁을 때 아이콘 위를 덮어 삼키므로 통과시킨다.
  const statusTop = topCenter
    ? dimLayer(
        "left-1/2 flex -translate-x-1/2 items-center",
        { top: "12px", height: "32px" },
        statusRow,
        "wrap",
      )
    : null;

  // 딤 아래 — (기본이면) 칩 줄 + 녹화 플레이어·시간바. 둘을 한 덩어리로 쌓아
  // 바 높이를 몰라도 칩 줄이 항상 그 위에 앉는다. 위 가운데로 올린 경우엔
  // 컨트롤만 남으므로, 컨트롤도 없으면 아예 그리지 않는다.
  // 이 층은 화면 폭 전체를 덮으므로 껍데기가 클릭을 받으면 안 된다 — 오른쪽
  // 아래 AI·메뉴 버튼이 같은 높이에 있어 통째로 삼켜졌다(사용자 지적: "메뉴
  // 아이콘이랑 AI 아이콘도 안눌려져"). 껍데기는 통과시키고, 실제 내용(칩 줄 ·
  // 컨트롤)만 자기 크기만큼 클릭을 받는다.
  const statusBottom =
    !topCenter || controls
      ? dimLayer(
          "inset-x-0",
          {
            // 딤 아래 줄(AI·페이지 점)이 12 보다 더 떠 있으면 이 층도 같이 뜬다
            // — 시간바만 바닥에 남으면 따로 논다(사용자 지적: "시간바는 왜 거기에
            // 적용 안 돼? 같이 올라가야지"). 칩 줄도 이 층에 있어서 자기 pb-3(12)
            // 위에 이 값이 더해져 AI 버튼과 같은 높이로 맞는다.
            bottom: `${(bottomInset ?? 12) - 12}px`,
          },
          <>
            {!topCenter && (
              <div
                className="pointer-events-none pb-3 transition-opacity duration-150 ease-out"
                style={{
                  paddingLeft: `${edgeInset ?? 20}px`,
                  paddingRight: `${edgeInset ?? 20}px`,
                  // 이 층은 시간바 때문에 남겨 두지만 칩 줄은 같이 걷는다.
                  opacity: scrubbing ? 0 : 1,
                }}
              >
                {/* 칩만 클릭을 받는다 — 줄 전체가 받으면 오른쪽 버튼을 덮는다. */}
                <span className="pointer-events-auto inline-flex">
                  {statusRow}
                </span>
              </div>
            )}
            {controls && (
              <div
                data-no-swipe=""
                className={`pointer-events-auto w-full${controlsOnDim ? "" : " bg-white"}`}
              >
                {controls}
              </div>
            )}
          </>,
          "shell",
          true,
        )
      : null;

  // 딤 위 헤더 — 딤과 같이 뜨고 같이 사라진다(세로 A-1 OverlayHeader 와 동일).
  // 껍데기는 가로 전체를 덮는 띠라 클릭을 통과시켜야 한다(pointer-events: none).
  // 안 그러면 같은 줄 오른쪽 딤 아이콘을 덮어 눌러도 반응하지 않는다.
  // 단일 화면 헤더를 '뒤로가기 + 카메라 이름'으로 바꾼 경우(singleHeaderCamera).
  // 장소명/지점명 대신이라 자리·높이·여백은 아래 기본 헤더와 같게 두고 내용만 바꾼다.
  // 다채널이면 카메라가 하나가 아니라 이름을 못 쓴다 — 기본은 장소명(title),
  // 따로 받은 글자가 있으면 그걸 쓴다.
  const backHeaderLabel =
    expandedIndex !== null
      ? cameras[expandedIndex]?.label
      : (gridHeaderLabel ?? title);
  const cameraHeader =
    singleHeaderCamera && backHeaderLabel ? (
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center transition-opacity duration-300 ease-out"
        style={{
          height: `${OVERLAY_HEADER_H}px`,
          opacity: dim && !scrubbing ? 1 : 0,
          paddingLeft: `${edgeInset ?? 20}px`,
          paddingRight: `${edgeInset ?? 20}px`,
        }}
      >
        <div
          className="flex items-center"
          style={{ gap: "8px", pointerEvents: dim ? "auto" : "none" }}
          {...auto.holdProps}
          onClick={(e) => {
            e.stopPropagation();
            auto.keepAlive();
          }}
        >
          {/* 뒤로가기 — 세로로 돌아간다(사용자 결정 2026-08-14). 보던 카메라는
              그대로 두고 방향만 세운다. 들어온 경로가 둘이라 갈라 준다:
              확대(크게 보기)로 눕었으면 exitImmersive 가 전체화면·방향잠금까지
              정리하고, 회전으로 눕었으면 그건 아무 일도 안 하므로(readImmersive
              가 false 면 즉시 return) 회전만 되돌린다.
              화살표는 받은 에셋(Property 1=Solid.svg). 파일 자체 색은 #757575 인데
              딤 위에서 옆 글자(흰색)와 어긋나므로, img 가 아니라 마스크로 찍어
              흰색을 입힌다 — 같은 파일에 있는 ChevronDownIcon 과 같은 방식이다. */}
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => {
              if (immersive) exitImmersive();
              else requestDeviceRotate(false);
            }}
            className="flex h-8 w-8 items-center justify-center"
          >
            <span
              aria-hidden
              className="inline-block h-7 w-7 bg-white"
              style={{
                WebkitMaskImage: `url("${BASE}/Property 1=Solid.svg")`,
                maskImage: `url("${BASE}/Property 1=Solid.svg")`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          </button>
          <span className="text-[18px] font-bold leading-none text-white">
            {backHeaderLabel}
          </span>
        </div>
      </div>
    ) : null;

  const header = cameraHeader ?? (title ? (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 flex transition-opacity duration-300 ease-out ${
        headerAlign === "top" ? "items-start" : "items-center"
      }`}
      style={{
        height: `${OVERLAY_HEADER_H}px`,
        opacity: dim && !scrubbing ? 1 : 0,
        paddingLeft: `${edgeInset ?? 20}px`,
        paddingRight: `${edgeInset ?? 20}px`,
        // 윗변 맞춤이면 아이콘 줄과 같은 12 에서 시작한다.
        ...(headerAlign === "top" ? { paddingTop: "12px" } : null),
      }}
    >
      <div
        className="flex flex-col"
        style={{ pointerEvents: dim ? "auto" : "none" }}
        {...auto.holdProps}
        onClick={(e) => {
          // 영상 탭(딤 토글·더블탭 전환)으로 새어나가지 않게 막고 타이머만 되돌린다.
          e.stopPropagation();
          auto.keepAlive();
        }}
      >
        {/* 장소명 + 지점명을 한 버튼으로 묶는다 — 첫 줄만 버튼이면 아래 지점명이나
            화살표 옆 빈 곳을 눌러도 안 먹는다(세로 딤과 같은 규칙). */}
        <button
          type="button"
          onClick={onTitleClick}
          className="flex flex-col items-start gap-[2px] pb-1 pr-3 text-left"
        >
          <span className="flex items-center gap-1.5 text-[18px] font-bold leading-none text-white">
            {title}
            <ChevronDownIcon className="h-6 w-6 text-white" />
          </span>
          {subtitle && (
            <span
              className="text-[12px] leading-none"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {subtitle}
            </span>
          )}
        </button>
      </div>
    </div>
  ) : null);

  const overlay = (
    <GridSelectionOverlay
      visible={dim}
      hideControls={scrubbing}
      currentPage={page}
      totalPages={expandedIndex !== null ? 1 : totalPages}
      onGallery={onGallery}
      onMore={onMore}
      onAi={onAi}
      swapAiZoom={swapAiZoom}
      onMenu={onMenu}
      edgeInset={edgeInset}
      {...(iconBottomInset ?? bottomInset) != null
        ? { bottomInset: iconBottomInset ?? bottomInset }
        : null}
      onFit={cycle}
      fit={fit}
      dimAlpha={dimAlpha}
      // 상단 길이만 화면 종류에 따라 다르다(단일이 더 김) — 세로와 같은 규칙.
      topHeight={
        dimTopHeight ??
        (expandedIndex !== null
          ? LANDSCAPE_DIM_TOP_SINGLE
          : LANDSCAPE_DIM_TOP_GRID)
      }
      bottomHeight={dimBottomHeight}
      showPageIndicator={showPageIndicator}
      auto={auto}
    />
  );

  // 딤을 붙이는 껍데기. 딤 안 버튼을 누르고 있는 동안은 타이머를 붙잡는다.
  const shell = (children: React.ReactNode) => (
    <div
      ref={shellRef}
      className="relative h-full w-full select-none"
      // 브라우저가 제스처를 가져가지 않게 한다. 이 화면은 스크롤할 게 없고,
      // 안 막으면 긋는 순간 pointercancel 이 와서 위아래·좌우 판정이 다 죽는다.
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        auto.hold();
        startExitDrag(e);
      }}
      onPointerMove={moveExitDrag}
      onPointerUp={() => {
        auto.release();
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        auto.release();
        dragRef.current = null;
      }}
    >
      {children}
      {/* 전환 스켈레톤 — 세로와 같은 결(skeleton-shimmer, 타일 사이 2px 흰 선).
          단일이면 화면 전체, 다채널이면 지금 가로 배치대로 칸을 나눈다. */}
      {loading &&
        (expandedIndex !== null ? (
          <div
            className="skeleton-shimmer pointer-events-none absolute inset-0 z-20"
            aria-hidden
          />
        ) : (
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
        ))}
      {overlay}
      {header}
      {statusTop}
      {statusBottom}
      {/* 가운데 컨트롤 — 딤과 같이 뜨고 같이 사라진다. 자리만 잡아 주고 내용은
          안이 넘긴다(A-2안 가로: 시간바 없이 플레이어 버튼 5개만). */}
      {centerControls &&
        dimLayer(
          "inset-0 flex items-center justify-center",
          {},
          <div data-no-swipe="">{centerControls}</div>,
          "wrap",
        )}
    </div>
  );

  if (expandedIndex !== null) {
    const cam = cameras[expandedIndex];
    return shell(
      <div className="h-full w-full bg-black" onClick={() => handleTap(null)}>
        <CameraFeed
          label={cam.label}
          badge={singleBadge}
          badgeAlign={singleBadgeAlign}
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
