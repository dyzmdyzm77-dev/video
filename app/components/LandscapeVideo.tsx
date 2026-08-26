"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE } from "../basePath";
import { bestGridForCount } from "./layoutRules";
import { useGridAreaRatio } from "./useGridLayout";
import type React from "react";
import { CameraFeed, GridSelectionOverlay } from "./CameraFeed";
import { useAutoHide } from "./useAutoHide";
import { useDimSync } from "./dimSync";
import { VideoFitToast, useVideoFit } from "./VideoFitToast";
import { requestDeviceRotate, useRotatedInput } from "./deviceRotate";
import { useEdgeGaps } from "./useDeviceWidth";
import { exitImmersive, useImmersive } from "./immersive";
import { VIDEO_FIT_LABEL, type VideoFit } from "./videoFit";

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
  paused = false,
  onGallery,
  onMore,
  onAi,
  swapAiZoom = false,
  showOverlayAi = true,
  showOverlayZoom = true,
  topInset = 0,
  dimStyle,
  onMenu,
  centerControls,
  edgeInset,
  edgeInsetRight,
  bottomInset,
  headerAlign = "center",
  scrubbing = false,
  auxHidden = false,
  onExpand,
  onBack,
  title,
  subtitle,
  onTitleClick,
  mode = "live",
  recordingLabel = "녹화",
  hideStatusClock = false,
  statusRaise,
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
  /** 일시정지·스크럽 중인가. 캔버스 경로(디코딩 성공)에서는 playbackMs 가 안
   *  움직이니 저절로 멈추지만, 디코딩이 안 되는 기기는 GIF 를 그대로 재생하는
   *  폴백이라 이 값을 안 주면 멈추지 않는다(사용자 지적 2026-08-18: "일시 정지
   *  눌렀는데 영상이 안멈추고"). 세로 화면은 이미 같은 값을 넘기고 있었다. */
  paused?: boolean;
  /** 딤의 '갤러리' 버튼. 세로의 화면 구성 시트를 그대로 연다. */
  onGallery?: () => void;
  /** 딤의 '더보기'(⋮). 세로와 같은 더보기 시트를 연다. */
  onMore?: () => void;
  /** 딤의 AI 버튼. 안 주면 표시만 한다(안별 기본값 보존). */
  onAi?: () => void;
  /** AI·크게 보기 자리 재배치(A-3 전용) — GridSelectionOverlay 로 그대로 넘긴다.
   *  기본 false = 기존 그대로. */
  swapAiZoom?: boolean;
  /** 딤 아래 AI 원 버튼을 그릴지. 기본 true. A-3 은 AI 를 시간바 아래 줄로
   *  옮겨서 끈다(사용자 지정 2026-08-14). */
  showOverlayAi?: boolean;
  /** 딤 아래 '크게 보기' 원 버튼을 그릴지. 기본 true. A-3 은 그 버튼도 시간바
   *  아래 줄로 옮겨서 끈다(사용자 지정 2026-08-14). */
  showOverlayZoom?: boolean;
  /** 딤 위쪽 요소(장소명·칩 줄·아이콘 줄)를 위아래로 옮기는 값(px).
   *  기본 0 = 지금까지의 자리(top 12). 음수면 위로 올라간다.
   *  A-3 은 -10 을 넘긴다(사용자 지정 2026-08-14). */
  topInset?: number;
  /** 딤 위 원 버튼 스타일 — GridSelectionOverlay 로 그대로 넘긴다. "a3" 면
   *  A-3안 규격(40px · #666666 50% · blur 20). 안 주면 기존 그대로. */
  dimStyle?: "a3";
  /** 딤의 메뉴 버튼(AI 옆). 안 주면 안 그린다 — A-2안 가로 전용. */
  onMenu?: () => void;
  /** 화면 한가운데에 얹을 컨트롤. 아래 시간바 대신 플레이어 버튼만 가운데
   *  두는 A-2안 가로 사양에서 쓴다. 안 주면 아무것도 안 그린다. */
  centerControls?: React.ReactNode;
  /** 딤 위 UI(장소명·아이콘 줄·칩 줄·AI/메뉴)의 좌우 가장자리 여백(px).
   *  영상 자체는 해당 없음 — 화면을 끝까지 쓴다. 안 주면 지금 값 그대로. */
  edgeInset?: number;
  /** 오른쪽만 다른 값을 쓸 때. 오른쪽 패널이 열리면 그쪽은 패널이 막고 있어
   *  여백이 덜 필요하다(사용자 지정 2026-08-18: "오른쪽 패널 떴을떄는 딤 우측
   *  마진이 한 20정도면 될듯"). */
  edgeInsetRight?: number;
  /** 딤 아래 줄(메뉴·AI · 페이지 점)이 화면 아래에서 떨어지는 거리(px).
   *  기본 12. 아래에 시간바가 깔리는 안에서 그 위로 띄우는 용도. */
  bottomInset?: number;
  /** 장소명 줄을 오른쪽 아이콘 줄과 어떻게 맞출지.
   *   center = 지금까지의 기본. 56 높이 안에서 세로 가운데(중심 28).
   *   top    = 윗변끼리 맞춘다(둘 다 top 12). 장소명이 두 줄이라 가운데 정렬이면
   *            첫 줄이 아이콘보다 살짝 위로 뜬다(A-2안 가로 사양, 사용자 요청). */
  headerAlign?: "center" | "top";
  /** 시간바를 끄는 중인가. 켜면 딤 위 UI(장소명·아이콘 줄·칩 줄·AI/메뉴)를
   *  잠깐 걷어 시간바만 남긴다 — 끄는 동안 화면을 가리지 않게(사용자 요청).
   *  손을 떼면 그대로 돌아온다. */
  scrubbing?: boolean;
  /** 딤에서 '가운데 5버튼 + 아래 시간바'만 남기고 나머지(장소명·칩 줄·우상단
   *  아이콘·페이지 점)를 걷는다. A-3 이 플레이어 버튼을 누른 직후 켠다
   *  (사용자 지정 2026-08-14: "5버튼 누를 때는 5버튼만 남기고 나머지는 사라지고").
   *  스크럽과 달리 가운데 컨트롤은 살려 둔다. 기본 false = 기존 그대로. */
  auxHidden?: boolean;
  /** 타일 더블탭 — 그 카메라 단일 화면으로. */
  onExpand?: (i: number) => void;
  /** 단일 화면 더블탭 — 다채널로 복귀. */
  onBack?: () => void;
  /** 딤 위 헤더 — 장소명. 세로 딤(A-1 OverlayHeader)과 같은 자리·같은 서식이다.
   *  가로는 헤더 바가 없어서 여기 말고는 어디가 찍힌 화면인지 알 길이 없다. */
  title?: string;
  subtitle?: string;
  onTitleClick?: () => void;
  /** 딤 아래 왼쪽 표시 — 지금 실시간인지 녹화인지. 시각과 한 알약으로 묶인다.
   *  가로는 날짜 바가 없어서 여기 말고는 알 길이 없다.
   *  전환(실시간↔녹화)은 여기서 안 한다 — 세로 화면에서만 한다(사용자 지정
   *  2026-08-25: "가로에서 실시간/녹화 칩 빼라"). */
  mode?: "live" | "recording";
  /** 녹화 쪽 문구. 기본 "녹화" — 세로 토글을 "녹화영상"으로 바꾼 안(A-3)만
   *  같은 말로 맞춘다(사용자 지적: 가로만 말이 달랐다). */
  recordingLabel?: string;
  /** 알약에서 시각을 뺀다. 아래 시간바가 이미 한가운데에 현재 시각을 띄우는
   *  화면(가로 단일 녹화)에서 켠다 — 같은 값이 한 줄에 두 번 뜬다(사용자 지정
   *  2026-08-26: "그때 시간은 빼자"). 시간바가 없는 화면은 이 알약이 유일한
   *  시계라 그대로 둔다. */
  hideStatusClock?: boolean;
  /** 상태 알약의 '중심'을 딤 아래층 바닥에서 얼마나 띄울지(px).
   *
   *  녹화 화면에서는 시간바 한가운데 현재시각과 같은 높이여야 하고(사용자 지정
   *  2026-08-26), 실시간에서도 그 자리에 있어야 한다 — 모드를 바꿀 때 알약이
   *  위아래로 튀면 안 된다(사용자 지적: "실시간 + 현재시간은 위치가 왜 그래?").
   *  그래서 안마다 '시간바 클록이 앉는 높이'를 이 값으로 넘기고, 두 모드가 같은
   *  값을 쓴다. 안 넘기면 예전처럼 컨트롤 위에 쌓는다(시간바가 아예 없는 A-1).
   *
   *  값 = 컨트롤 블록 바닥에서 시간바 클록 중심까지의 거리(안마다 컨트롤 구성이
   *  달라 다르다 — A-2 는 시간바만이라 35, A-3 은 시간바 + 아이콘 줄이라 73). */
  statusRaise?: number;
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
  // 비교하기 — 옆 기기 딤과 같이 켜고 끈다(components/dimSync.ts).
  useDimSync(dim, setDim);
  // 바깥에서 맞춤 상태를 주면 그걸 쓰고, 안 주면 자체 상태(기존 동작).
  // 훅은 조건 없이 항상 부른다 — 안 쓰이면 그냥 놀고 있는 상태다.
  const ownFit = useVideoFit("fill");
  const fit = fitProp ?? ownFit.fit;
  const cycle = onFitCycle ?? ownFit.cycle;
  // 화면 맞춤 토스트 — 세로에는 있는데 가로에만 없었다(사용자 지적 2026-08-18:
  // "가로에서 그 화면 비율 조정할떄는 왜 토스트 안떠?"). 세로는 안이 useVideoFit
  // 의 toast 를 직접 그리는데, 가로는 그 훅을 안이 들고 있을 수도(fitProp) 여기서
  // 들 수도 있어 문구를 한쪽에서만 가져올 수가 없다. 그래서 '값이 바뀌면 띄운다'
  // 로 잡는다 — 어느 쪽이 들고 있든 같은 자리에서 같이 뜬다.
  // 첫 렌더는 건너뛴다(세로에서 고른 맞춤을 들고 들어오는 것뿐이라 알릴 게 없다).
  // 화면 정중앙 토스트 — 화면 맞춤 문구와 줌 배율이 같이 쓴다.
  const [centerToast, setCenterToast] = useState<string | null>(null);
  const [centerToastKey, setCenterToastKey] = useState(0);
  const centerToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCenterToast = (text: string) => {
    setCenterToast(text);
    // key 는 같은 문구를 연속으로 띄울 때도 등장 애니메이션을 다시 태우기 위한 것.
    setCenterToastKey((k) => k + 1);
    if (centerToastTimer.current) clearTimeout(centerToastTimer.current);
    centerToastTimer.current = setTimeout(() => setCenterToast(null), 2000);
  };
  useEffect(
    () => () => {
      if (centerToastTimer.current) clearTimeout(centerToastTimer.current);
    },
    [],
  );
  const prevFit = useRef(fit);
  useEffect(() => {
    if (prevFit.current === fit) return;
    prevFit.current = fit;
    showCenterToast(VIDEO_FIT_LABEL[fit]);
    // showCenterToast 는 렌더마다 새로 만들어지지만 하는 일은 같다 — 맞춤이
    // 바뀔 때만 돌면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit]);
  // 상태바 자리를 비울지는 화면 맞춤이 정한다(사용자 결정 2026-08-18: "다채널
  // 에서도 원본 비율이면 단일채널이랑 동일하게 상태바 제외한 영역으로").
  //   · 원본 비율(contain) — 비운다. 상태바를 뺀 영역 안에서 비율을 맞춘다.
  //   · 가득 채우기·늘리기 — 그 자리까지 덮는다.
  // 실제 치수는 globals.css 가 잡는다(프레임 폭에서 --status-h 를 빼느냐 마느냐).
  // 자식을 프레임 밖으로 넘기는 방식은 안 됐다 — 프레임에 overflow:hidden 이라 잘린다.
  // 단일·다채널이 이 플래그 하나를 공유하므로 둘이 어긋나지 않는다.
  useEffect(() => {
    const ds = document.documentElement.dataset;
    if (fit === "contain") delete ds.videoBleed;
    else ds.videoBleed = "true";
    return () => {
      delete document.documentElement.dataset.videoBleed;
    };
  }, [fit]);
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
  // 딤 위 UI 의 좌우 여백은 '기기 모서리' 기준이다(사용자 지정 2026-08-18:
  // "IOS는 기기 사이즈 기준으로 되어있어. 영상 뷰 기준으로 하지말라고").
  // 앱 창이 화면보다 작으면(안드로이드 시스템 바) 프레임 끝에서 재는 것만으로는
  // 기기 끝 기준이 안 된다 — 밀려난 만큼(useEdgeGaps) 빼서 실제 모서리에 맞춘다.
  // 아이폰 홈화면 앱처럼 창 = 화면이면 gap 이 0 이라 지금까지와 같다.
  const baseEdge = edgeInset ?? 20;
  // 폰을 눕힌 가로에서 컷아웃이 한 변을 깎으면 그쪽 여백만 그만큼 넓어 보인다 —
  // 깎인 만큼 빼서 기기 끝 기준을 맞춘다(useEdgeGaps). 잴 수 없거나 CSS 로
  // 눕힌 확대면 0 이라 좌우 같은 값이다.
  const edgeGaps = useEdgeGaps();
  // 좌우 모두 앱 화면 끝에서 baseEdge 다. 그냥 이게 맞다.
  //
  // 한동안 '앱 창이 물리 화면에서 밀려난 만큼'을 빼서 기기 모서리에 맞추려 했다
  // (useEdgeGaps). 그런데 그 밀림을 웹에서 정확히 재는 방법이 없다 — 창 위치
  // (screenX/Y)는 안 깎인 것처럼 0 을 주고, 안전영역(env)은 내비바 두께까지 섞여
  // 들어와 한쪽이 통째로 0 이 되기도 했다(오른쪽 패널이 기기 끝에 붙어 버렸다 —
  // 사용자 지적 2026-08-18). 값이 틀리면 여백이 눈에 띄게 어긋나는데, 맞아 봐야
  // 얻는 건 몇 십 px 이라 손익이 안 맞는다.
  //
  // 게다가 지금은 가로·확대에서 앱이 화면 전체를 받는다(안드로이드는 설치본
  // 전체화면, 아이폰은 홈화면 앱) — 앱 끝이 곧 기기 끝이라 보정할 것도 없다.
  const edgeL = Math.max(0, baseEdge - edgeGaps.left);
  const edgeR = Math.max(0, (edgeInsetRight ?? baseEdge) - edgeGaps.right);

  // ── 단일 영상 줌 ─────────────────────────────────────────────────────────
  // 세로 단일 화면에만 있던 핀치 줌을 가로에도 붙인다(사용자 지적 2026-08-18:
  // "가로로 돌려졌을때 단일 화면은 줌인아웃 안되나? 세로만 되고 있네?").
  // 규칙은 세로와 같다: 두 손가락으로 벌리면 확대, 확대된 동안은 한 손가락
  // 드래그가 이동(pan). 데스크톱은 휠(트랙패드 핀치 포함).
  // 다채널에는 안 건다 — 세로도 단일에만 있다.
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 5;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const ptsRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const zoomBoxRef = useRef<HTMLDivElement>(null);
  const zoomable = expandedIndex !== null;
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
  const applyZoom = (next: number) => {
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
    setZoom(z);
    setPan((prev) => (z <= ZOOM_MIN ? { x: 0, y: 0 } : clampPan(z, prev.x, prev.y)));
    // 배율 토스트 — 세로 단일과 같은 문구 규칙(사용자 지적 2026-08-18: "그
    // 토스트는 왜 안떠?"). 원래 크기면 숫자 대신 '원본'.
    showCenterToast(z <= ZOOM_MIN ? "원본" : `${z.toFixed(1)}X`);
  };
  // 카메라를 바꾸거나 다채널로 나가면 배율을 되돌린다 — 확대해 둔 채로 다른
  // 화면에 들어가면 그 화면이 확대돼 보인다(세로와 같은 규칙).
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [expandedIndex, page]);
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

  // 실시간 시계 — 아래 알약이 쓴다. 녹화면 playbackMs 를 쓰므로 안 돈다.
  const [nowTick, setNowTick] = useState<Date | null>(null);
  useEffect(() => {
    if (mode === "recording") return;
    setNowTick(new Date());
    const id = setInterval(() => setNowTick(new Date()), 1000);
    return () => clearInterval(id);
  }, [mode]);

  // 딤 아래 왼쪽 — '● 실시간/녹화영상 + 현재 시각' 알약 하나.
  //
  // 예전엔 여기(또는 위 가운데)에 실시간↔녹화 토글 칩이 있었는데 뺐다
  // (사용자 지정 2026-08-25: "가로에서 상단 센터 실시간/녹화 탭 빼자",
  //  "실시간, 녹화영상 칩 빼라니까"). 가로는 영상만 보는 화면이라 모드를 바꾸는
  // 자리가 아니고, 세로 화면에 같은 토글이 이미 있다. 남긴 건 '지금 무엇을
  // 보고 있는지 + 몇 시인지'뿐이다.
  //
  // 시각은 녹화면 재생 위치(playbackMs), 실시간이면 지금 시각이다 — 안마다
  // 따로 만들지 않게 여기서 센다(A-3 이 자기 아이콘 줄에 넣어 뒀던 그 알약을
  // 공통으로 올린 것).
  const clock = (() => {
    const d =
      mode === "recording"
        ? playbackMs != null
          ? new Date(playbackMs)
          : null
        : nowTick;
    if (!d) return "";
    const p2 = (n: number) => String(n).padStart(2, "0");
    return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  })();
  const statusRow = (
    <span
      suppressHydrationWarning
      className="rounded-full"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "22px",
        padding: "0 10px",
        fontSize: "13px",
        fontWeight: 700,
        lineHeight: "13px",
        color: "#FFFFFF",
        // 딤 위 버튼과 같은 규격(#666666 40% + blur) — A-3 이 쓰던 값을 셋이 같이 쓴다.
        backgroundColor: "rgba(102,102,102,0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        textShadow: "0 0 4px rgba(0,0,0,0.6)",
      }}
    >
      {/* 실시간은 빨강 점, 녹화는 흰 점 — 세로 딤의 두 배지와 같은 구분이다. */}
      <span
        aria-hidden
        className="rounded-full"
        style={{
          width: "5px",
          height: "5px",
          backgroundColor: mode === "recording" ? "#FFFFFF" : "#FF3B4A",
          marginRight: "5px",
          flex: "none",
        }}
      />
      <span style={hideStatusClock ? undefined : { marginRight: "6px" }}>
        {mode === "recording" ? recordingLabel : "실시간"}
      </span>
      {hideStatusClock ? null : clock}
    </span>
  );

  // 딤 위에 얹는 덩어리 공통 처리 — 딤과 같이 뜨고, 만지는 동안 자동 숨김 타이머를
  // 붙잡고, 클릭이 영상 탭(딤 토글·더블탭 전환)으로 새어나가지 않게 막는다.
  // 딤의 '보조' UI(장소명·칩 줄·우상단 아이콘·페이지 점)를 걷는 조건.
  // 스크럽 중이거나, 안이 5버튼만 남기라고 할 때(auxHidden).
  const auxOff = scrubbing || auxHidden;
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
    // 페이드 없이 바로 뜨고 질 층인가. backdrop-filter(블러)를 쓰는 버튼이 든
    // 층에 쓴다 — 부모 opacity 가 1 이 되기 전까지는 블러가 뒤를 못 읽어서,
    // 투명하게 떴다가 블러가 뒤늦게 붙는다(사용자 지적 2026-08-14).
    // opacity 가 1 미만이면 그 층이 격리돼 배경 샘플링이 끊기는 게 원인이라,
    // 중간 상태 자체를 없애는 쪽이 확실하다.
    noFade = false,
  ) => (
    <div
      className={`absolute ${noFade ? "" : "transition-opacity duration-300 ease-out"} ${className}`}
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


  const shellRef = useRef<HTMLDivElement>(null);

  // 알약은 늘 딤 아래 왼쪽이다(위 가운데·오른쪽 배치는 없앴다 — 사용자 지정
  // 2026-08-25). 그래서 폭이 좁은지 재던 것도, 아이콘 줄을 내리던 것도 필요 없다.

  // 딤 아래 — 상태 알약 + 녹화 플레이어·시간바. 둘을 한 덩어리로 쌓아 바 높이를
  // 몰라도 알약이 항상 그 위에 앉는다.
  // 이 층은 화면 폭 전체를 덮으므로 껍데기가 클릭을 받으면 안 된다 — 오른쪽
  // 아래 AI·메뉴 버튼이 같은 높이에 있어 통째로 삼켜졌다(사용자 지적: "메뉴
  // 아이콘이랑 AI 아이콘도 안눌려져"). 껍데기는 통과시키고, 실제 내용(칩 줄 ·
  // 컨트롤)만 자기 크기만큼 클릭을 받는다.
  const statusBottom = dimLayer(
          "inset-x-0",
          {
            // 딤 아래 줄(AI·페이지 점)이 12 보다 더 떠 있으면 이 층도 같이 뜬다
            // — 시간바만 바닥에 남으면 따로 논다(사용자 지적: "시간바는 왜 거기에
            // 적용 안 돼? 같이 올라가야지"). 칩 줄도 이 층에 있어서 자기 pb-3(12)
            // 위에 이 값이 더해져 AI 버튼과 같은 높이로 맞는다.
            bottom: `${(bottomInset ?? 12) - 12}px`,
          },
          <>
            {/* 알약 — statusRaise 를 받으면 이 층 바닥에서 그만큼 띄운 자리에
                절대배치한다(모드가 바뀌어도 같은 높이). 안 받으면 예전처럼
                컨트롤 위에 쌓는다. */}
            {statusRaise == null ? (
              <div
                className="pointer-events-none pb-3 transition-opacity duration-150 ease-out"
                style={{
                  paddingLeft: `${edgeL}px`,
                  paddingRight: `${edgeR}px`,
                  opacity: auxOff ? 0 : 1,
                }}
              >
                <span className="inline-flex">{statusRow}</span>
              </div>
            ) : (
              <div
                // flex 로 둔다 — 그냥 블록이면 안쪽 인라인 요소의 줄 상자가
                // 위에 4px 을 더 만들어 알약이 그만큼 내려간다.
                className="pointer-events-none absolute flex transition-opacity duration-150 ease-out"
                style={{
                  left: `${edgeL}px`,
                  // 알약 높이 22 의 절반을 빼서 '중심'을 맞춘다.
                  bottom: `${statusRaise - 11}px`,
                  // 이 층은 시간바 때문에 남겨 두지만 알약은 같이 걷는다.
                  opacity: auxOff ? 0 : 1,
                }}
              >
                <span className="inline-flex">{statusRow}</span>
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
          // 아이콘 원·시각 알약이 블러를 쓴다 — 이 층도 페이드 없이 바로 뜬다.
          true,
  );

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
          opacity: dim && !auxOff ? 1 : 0,
          paddingLeft: `${edgeL}px`,
          paddingRight: `${edgeR}px`,
          marginTop: `${topInset}px`,
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
        opacity: dim && !auxOff ? 1 : 0,
        paddingLeft: `${edgeL}px`,
        paddingRight: `${edgeR}px`,
        marginTop: `${topInset}px`,
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
      hideControls={auxOff}
      currentPage={page}
      totalPages={expandedIndex !== null ? 1 : totalPages}
      onGallery={onGallery}
      onMore={onMore}
      onAi={onAi}
      swapAiZoom={swapAiZoom}
      showAi={showOverlayAi}
      showZoom={showOverlayZoom}
      dimStyle={dimStyle}
      onMenu={onMenu}
      edgeInset={edgeR}
      edgeInsetLeft={edgeL}
      {...(bottomInset != null ? { bottomInset } : null)}
      // 칩을 오른쪽 위로 올린 안(A-3)에선 아이콘 줄이 그만큼 아래로 내려간다.
      topInset={topInset}
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
        if (zoomable) {
          ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (ptsRef.current.size === 2) {
            // 두 손가락 — 핀치 시작. 나가기·페이지 판정은 접는다.
            // 딤도 끈다(사용자 지정 2026-08-18: "단일 확대할때는 딤이 꺼져야지").
            // 확대는 영상을 자세히 보려는 동작인데 그 위에 UI 가 얹혀 있으면
            // 가려진다. 다시 보려면 화면을 한 번 탭하면 된다.
            setDim(false);
            const [a, b] = Array.from(ptsRef.current.values());
            pinchRef.current = {
              dist: Math.hypot(a.x - b.x, a.y - b.y),
              zoom,
            };
            panRef.current = null;
            dragRef.current = null;
            return;
          }
          if (zoom > 1) {
            // 확대 중 한 손가락 — 이동(pan). 스와이프로 새지 않게 여기서 끝낸다.
            panRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
            dragRef.current = null;
            return;
          }
        }
        startExitDrag(e);
      }}
      onPointerMove={(e) => {
        if (zoomable) {
          if (ptsRef.current.has(e.pointerId)) {
            ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          }
          const pinch = pinchRef.current;
          if (pinch && ptsRef.current.size >= 2) {
            const [a, b] = Array.from(ptsRef.current.values());
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinch.dist > 0) applyZoom((pinch.zoom * dist) / pinch.dist);
            return;
          }
          const p = panRef.current;
          if (p) {
            // 실기기 가로는 콘텐츠가 90° 돌아 있다 — 화면 좌표를 콘텐츠 기준으로
            // 환산한다(moveExitDrag 와 같은 규칙).
            const sx = e.clientX - p.x;
            const sy = e.clientY - p.y;
            const dx = rotatedInput ? sy : sx;
            const dy = rotatedInput ? -sx : sy;
            setPan(clampPan(zoom, p.px + dx, p.py + dy));
            return;
          }
        }
        moveExitDrag(e);
      }}
      onWheel={(e) => {
        // 데스크톱 미리보기용 — 휠(트랙패드 핀치 포함)로도 조절한다.
        if (!zoomable) return;
        applyZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
      }}
      onPointerUp={(e) => {
        auto.release();
        ptsRef.current.delete(e.pointerId);
        if (ptsRef.current.size < 2) pinchRef.current = null;
        panRef.current = null;
        dragRef.current = null;
      }}
      onPointerCancel={(e) => {
        auto.release();
        ptsRef.current.delete(e.pointerId);
        if (ptsRef.current.size < 2) pinchRef.current = null;
        panRef.current = null;
        dragRef.current = null;
      }}
    >
      {children}
      {/* 화면 맞춤 토스트 — 화면(디바이스) 정중앙(사용자 지정 2026-08-18:
          "디바이스 센터에 맞춰야지"). 세로는 영역 하단에서 20 인데, 가로는 아래가
          시간바·아이콘 줄로 꽉 차 기준이 애매했다. 딤 층이 아니라 껍데기에 두므로
          딤이 꺼져 있어도 뜬다 — 맞춤 버튼을 누른 직후라 딤은 보통 떠 있다. */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
        <VideoFitToast inline text={centerToast} toastKey={centerToastKey} />
      </div>
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
      {statusBottom}
      {/* 가운데 컨트롤 — 딤과 같이 뜨고 같이 사라진다. 자리만 잡아 주고 내용은
          안이 넘긴다(A-2안 가로: 시간바 없이 플레이어 버튼 5개만). */}
      {centerControls &&
        dimLayer(
          "inset-0 flex items-center justify-center",
          {},
          <div data-no-swipe="">{centerControls}</div>,
          "wrap",
          false,
          // 5버튼은 블러를 쓰므로 페이드 없이 바로 뜬다(위 noFade 주석 참고).
          true,
        )}
    </div>
  );

  if (expandedIndex !== null) {
    const cam = cameras[expandedIndex];
    return shell(
      <div
        className="landscape-video-area h-full w-full bg-black"
        onClick={() => handleTap(null)}
      >
        {/* 줌 껍데기 — 확대·이동은 이 한 겹에만 건다. 부모의 상태바 여백
            (padding-inline)을 그대로 받도록 absolute 가 아니라 h-full w-full 이다. */}
        <div
          ref={zoomBoxRef}
          className="h-full w-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
            // 손가락으로 조절하는 동안은 애니메이션을 걸지 않는다(따라오는 느낌이
            // 아니라 늦게 붙는 느낌이 된다). 손을 뗀 뒤에만 부드럽게(세로와 동일).
            transition:
              pinchRef.current || panRef.current
                ? "none"
                : "transform 200ms ease-out",
          }}
        >
          <CameraFeed
            label={cam.label}
            badge={singleBadge}
            badgeAlign={singleBadgeAlign}
            src={cam.src}
            fit={fit}
            paused={paused}
            playbackMs={playbackMs}
            driveByPlayback={driveByPlayback}
          />
        </div>
      </div>,
    );
  }

  // 다채널 — 타일 사이 구분선은 세로와 같은 흰색 2px(다채널 타일 구분선 규칙).
  const start = page * pageSize;
  const tiles = Array.from({ length: pageSize }, (_, i) => cameras[start + i]);
  // 원본 비율이면 격자 자체를 '타일이 16:9 가 되는 크기'로 잡고 가운데에 둔다.
  // 안 그러면 타일마다 좌우로 조금씩 남아, 큰 띠 하나 대신 얇은 띠가 타일 수만큼
  // 생긴다(사용자 지적: 단일엔 띠가 있는데 다채널엔 없어 보이던 것의 정체).
  // 남는 폭은 좌우로 똑같이 갈린다 — 단일과 같은 그림(사용자 지정 2026-08-18:
  // "영상이 결국 가운데로"). 가득 채우기·늘리기는 예전처럼 화면을 다 쓴다.
  const gridBox: React.CSSProperties =
    fit === "contain"
      ? {
          aspectRatio: `${cols * 16} / ${rows * 9}`,
          width: "auto",
          maxWidth: "100%",
          marginInline: "auto",
        }
      : { width: "100%" };
  return shell(
    <div
      ref={gridAreaRef as React.RefObject<HTMLDivElement>}
      // 남는 띠 자리는 검정이다 — 흰색이면 단일(검정 배경)과 달라 보인다
      // (사용자 지적 2026-08-18: "다채널일때는 그 공간이 왜 흰색이니?").
      // 안쪽 격자만 흰색을 유지한다 — 타일 사이 2px 구분선이 그 흰색이다.
      className="landscape-video-area h-full w-full bg-black"
    >
      <div
        className="grid h-full bg-white"
        style={{
          ...gridBox,
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
                paused={paused}
                playbackMs={playbackMs}
                driveByPlayback={driveByPlayback}
              />
            )}
          </div>
        ))}
      </div>
    </div>,
  );
}
