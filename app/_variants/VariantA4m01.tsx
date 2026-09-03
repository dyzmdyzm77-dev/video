"use client";

// A-4(수정01)안. VariantA4(A-4안)를 그대로 복사해 출발점으로 삼았다(2026-09-03,
// 사용자 요청: "A-4안 하나 복사해줘. A-4(수정01) 으로 하나 복사해줘").
// 아직 내용 차이는 라벨("A-4(수정01)")뿐 — 여기서부터 갈라 나간다.
// (A-4 자신은 VariantA3 를 복사해 출발했다 — 2026-08-26.)
//
// 주석에 남은 'A-4 만' 같은 말은 그대로 뒀다 — 복사본이라 같은 사양을 쓰고,
// 그 결정들이 왜 그렇게 됐는지가 여기서도 그대로 근거다.
// dimStyle="a3" 처럼 'A-3 규격'을 가리키는 값은 그대로 둔다 — 그건 안 이름이
// 아니라 딤 버튼 생김새의 이름이고, 복사본이라 같은 생김새를 쓴다.

import { BASE } from "../basePath";
import { readScreenState, writeScreenState } from "../components/screenState";
import { usePlaybackSync } from "../components/playbackSync";
import {
  requestCompareTarget,
  useCompareTarget,
  type CompareSlot,
} from "../components/compareTarget";
import {
  useDeviceLandscape,
  useRotatedInput,
} from "../components/deviceRotate";
import {
  toggleImmersive,
  useImmersive,
  useImmersiveRotated,
} from "../components/immersive";
import LandscapeVideo from "../components/LandscapeVideo";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  CameraBadge,
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
import { AUTO_HIDE_MS, useAutoHide } from "../components/useAutoHide";
import { useDimSync } from "../components/dimSync";
import AndroidNav from "../components/AndroidNav";
import {
  useDeviceRatio,
  useDeviceWide,
  useIsAndroid,
  useDeviceWidth,
} from "../components/useDeviceWidth";
import { useListLayout } from "../components/useListLayout";
import { useDeviceScope } from "../components/deviceScope";
import { useDragScroll } from "../components/useDragScroll";
import {
  TIMELINE_EVENTS,
  type EventKind,
} from "../components/timelineEvents";
import CloudEventScreen from "../components/CloudEventScreen";
import DateTimePickerSheet from "../components/DateTimePickerSheet";
import { useStorageMode } from "../components/storageMode";
import { useGridAreaRatio } from "../components/useGridLayout";
import {
  MOTION_MIN_H,
  PANEL_BOTTOM_H,
  SIDE_PANEL_W,
  THUMB_MAX_H,
  THUMB_MIN_H,
  autoGridCount,
  bestGridForCount,
  GRID_COUNT_OPTIONS,
  nearestGridCountIndex,
  IMMERSIVE_EXTRA_INSET,
  LANDSCAPE_BOTTOM_INSET,
  LANDSCAPE_EDGE,
  LANDSCAPE_EDGE_ANDROID,
  LANDSCAPE_TOP_INSET,
} from "../components/layoutRules";

// 가로 딤에서 '아래로' 나오는 판의 높이(PANEL_BOTTOM_H)는 공용 값을 쓴다.
// 예전엔 A-4 만 스트립을 낮춰 써서 A4_* 상수를 따로 뒀는데, 2026-09-01 에 네
// 안이 같은 값(TILE_MIN_H 64 · MOTION_MIN_H 88)을 쓰기로 하면서 같아졌다.

// 가로 카드(움직임 감지)의 최소 폭(px). 카드는 원래 16:9 라 세로에서 폭이
// 따라오는데, 스트립이 얇아지는 좁은 화면(405×648 에서 85×48)에서는 그 폭이
// 날짜·시각 라벨보다 좁아 글자가 잘렸다(사용자 지적 2026-08-31: "카드가 가로
// 영역이 좀 작은지 텍스트가 잘려"). 그래서 16:9 는 그대로 두되 이 값 아래로는
// 안 좁아지게 바닥을 깐다 — 넓은 화면에서는 16:9 폭이 더 커서 이 값이 안 걸린다.
//
// 값의 근거: 라벨(글자 12 · 좌우 padding 4+4 = 89.6) + 좌우 여백 3+3 = 95.6 → 96.
// 여백 3 은 라벨을 얹는 자리(left/bottom 3)와 같은 값이다.
const A4_CARD_MIN_W = 96;

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

/** 딤 위에 얹는 것들(원 버튼 · 알약 · 플레이어 버튼)의 배경. A-4 는 검정 60%
 *  다. 같은 날 블러를 뺐는데(dimBlur), 회색 40% 는 블러가 받쳐 주던 값이라
 *  맨몸으로 두니 영상 무늬가 그대로 비쳤다 — 검정은 밝은 영상 위에서도 흰
 *  아이콘·글자를 받쳐 준다.
 *  #666666 40% → 검정 40%("블랙에 40% 어때") → 30% → 60%(전부 사용자 지정
 *  2026-09-03). 30% 은 밝은 구간에서 원 경계가 흐려 되돌렸다("너무 연하다").
 *  다른 안(A-1·A-2·A-3)은 회색 40% + 블러 그대로다. */
const DIM_TINT = "rgba(0,0,0,0.6)";

/** 눌린 상태 — 한 단계 진하게. 기본값과의 차(+0.2)를 유지한다 — 색·농도를
 *  바꿔도 '눌린 티'가 같은 폭으로 나야 한다. */
const DIM_TINT_ACTIVE = "rgba(0,0,0,0.8)";

/** 단일 화면 콘텐츠를 홈과 같은 700 컬럼으로 묶기 시작하는 기기 폭(px).
 *  이 아래에서는 예전처럼 프레임 폭을 다 쓴다.
 *
 *  750(Z Fold 8 울트라)은 묶지 않는다(사용자 지정 2026-09-03: "750은 냅둬").
 *  거기서 남는 여백이 25씩이라 의도한 여백이 아니라 어긋난 것처럼 보인다.
 *  800 으로 잡으면 750·780 은 전체 폭, 864(82씩)·1080(190씩)만 묶인다 —
 *  사용자가 지목한 것도 그 둘이다.
 *
 *  layoutRules 의 기준선(WIDE_BP·SIDE_PANEL_BP)과는 상관없는 값이다 —
 *  이 안에서만 쓰는 폭이라 여기 둔다. */
const M01_CLAMP_BP = 800;

/** 영상 화면 콘텐츠 컬럼의 폭(px) — 홈 2단의 바깥 폭과 같은 값(HOME_W_2COL).
 *
 *  값은 660 → 700 으로 갔다(사용자 지정 2026-09-03: "여백좀 빼고 그냥 660에
 *  맞춰라" → "700에 맞춰"). 홈은 700 안에서 좌우 20 을 패딩으로 먹고 내용이
 *  660 인데, 이 화면은 컬럼 폭 자체가 콘텐츠 폭이다 — 층마다 여백을 따로
 *  달지 않으려고 그렇게 뒀다. 그 방식은 '끝까지 가는' 층(영상·딤·구분선·
 *  시간바·목록)이 하나 생길 때마다 여백을 빠뜨리게 돼 있었다.
 *
 *  그래서 이 폭에서는 글자 줄들이 갖고 있던 px-5 를 0 으로 돌린다 — 컬럼이
 *  곧 좌우 끝선이라, 안에서 또 들이면 그 줄만 어긋난다. */
const M01_CONTENT_W = 700;

/** 가로 딤이 여는 패널의 폭(px) — 아래에서 나오는 판은 높이가 대신이라 안 쓴다. */
const LANDSCAPE_PANEL_W = 240;

/** 오른쪽 패널이 열렸을 때 딤의 오른쪽 여백(사용자 지정 2026-08-18:
 *  "오른쪽 패널 떴을떄는, 딤 우측 마진이 한 20정도면 될듯"). */
const DIM_EDGE_WITH_PANEL = 20;

/** 세로 화면 시간바 영역 배경 — 흰 바탕에서 살짝 내린 회색(사용자 지정
 *  2026-08-18: "A-3 세로, 시간바 영역 배경을 조금 연한 그레이로"). 위 영상·아래
 *  탭과 같은 흰색이면 시간바가 어디서 시작하는지 안 보였다.
 *  좌우 페이드와 날짜 버튼 뒤 마스크도 이 색을 써야 한다 — 다른 색이면 흰 띠가
 *  드러난다. 가로(딤 위)는 투명 그대로다.
 *  회색으로 갔다가 흰색으로 되돌아왔다 — #F7F7F7(안 보임) → #F2F2F2(진함) →
 *  #F5F5F5 → #FFFFFF(사용자 지정 2026-08-18: "그냥 흰색으로 바꾸자").
 *  상수는 남겨 둔다: 좌우 페이드와 날짜 버튼 뒤 마스크가 이 값을 같이 봐서,
 *  한 곳만 바꾸면 흰 띠가 드러나던 자리다. */
const TIMEBAR_BG = "#FFFFFF";

/** 시간바 아래 아이콘 줄을 감싼 층이 이미 갖고 있는 좌우 여백. 줄에 더 붙일 몫은
 *  LANDSCAPE_EDGE 에서 이만큼 뺀 값이다 — 안 빼면 10 이 더해져 더 들어간다. */
const LANDSCAPE_CONTROLS_PAD = 10;

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

export default function VariantA4({
  platform = "android",
  initialChrome = false,
  onHome,
  inCompare = false,
  compareSlot = 1,
}: {
  platform?: "android" | "ios";
  initialChrome?: boolean;
  onHome?: () => void;
  /** 비교 프레임(왼쪽) 안에 떠 있는 사본인가. 켜면 이 안에서 고른 시안이
   *  '지금 보고 있는 안'이 아니라 '비교 대상'을 바꾼다 — 왼쪽에서 고른 게
   *  오른쪽을 바꿔 버리면 안 된다(사용자 지적). */
  inCompare?: boolean;
  /** 비교 프레임 중 몇 번째 자리인가(1 = 시안 바로 왼쪽, 2 = 그 왼쪽).
   *  고른 안을 어느 자리에 반영할지 — 3개 비교에서 왼쪽 둘이 섞이면 안 된다. */
  compareSlot?: CompareSlot;
}) {
  // 확대(크게 보기)를 눌렀을 때 '어느 기기에서 눌렀나' — 비교하기에서 자리마다
  // 해상도가 다를 수 있어, 눕힐지 말지를 그 기기 크기로 판단한다(immersive.ts).
  const zoomScope = useDeviceScope();

  // 안을 바꿔도 보던 화면 종류(다채널/단일 · 실시간/녹화)는 이어진다 —
  // 문서 루트에 남겨 두고 새로 뜨는 안이 물려받는다(components/screenState.ts).
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    () => readScreenState().single,
  );
  const [currentPage, setCurrentPage] = useState(0);
  const landscape = useDeviceLandscape();
  const immersive = useImmersive();
  const compareTarget = useCompareTarget(compareSlot);
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
  // 처음 값은 세로 8 · 가로 16 이다(사용자 지정 2026-08-18: "화면 구성은 세로 8
  // 가로 16을 디폴트로 해"). 예전엔 둘 다 null(자동)이라 영상 영역 비율에서
  // 뽑은 수로 시작했는데, 기기마다 4~16 으로 들쭉날쭉해 UT 시작 화면이 달랐다.
  // 사용자가 시트에서 '자동'을 고르면 그때 다시 null 이 된다.
  const [userCounts, setUserCounts] = useState<{
    portrait: number | null;
    landscape: number | null;
  }>({ portrait: 8, landscape: 16 });
  // 방향별로 마지막에 잰 '자동' 개수. 시트는 두 방향을 한 화면에 같이 보여
  // 주는데, 지금 안 보고 있는 방향은 실측할 길이 없어 마지막 값을 쓴다.
  const autoCountSeen = useRef<{
    portrait: number | null;
    landscape: number | null;
  }>({ portrait: null, landscape: null });
  // 기기가 가로로 긴 상태인가 — 판정은 useDeviceWide 하나에 모아 뒀다
  // (데스크톱 미리보기와 실기기가 회전을 다르게 표현해서다. useDeviceWidth.ts).
  const wideNow = useDeviceWide();
  // 패널을 오른쪽에서 낼지, 아래에서 낼지.
  //
  // 기준은 '세로가 가로보다 긴가'(비율 < 1) 하나다. A-1 은 정사각형에 가까우면
  // (PANEL_BOTTOM_RATIO 1.5) 아래에서 내는데, 그 값을 그대로 가져왔더니 4:3
  // 처럼 가로가 더 긴 화면도 아래로 갔다(사용자 지적 2026-08-18: "가로가 긴데
  // 아래에서 나오면 어떡하니"). 가로가 길면 오른쪽이 맞다 — 아래로 내면 낮은
  // 판에 목록을 눕혀야 해서 영상 세로만 깎인다.
  //
  // 실기기 확대는 폰이 세로인 채 화면만 CSS 로 돌린 것이라 뷰포트 비율이 세로
  // 그대로다 — 회전이 걸려 있으면 뒤집어서 본다(A-1 과 같은 처리).
  const rawRatio = useDeviceRatio();
  // 단일 화면 콘텐츠를 700 컬럼으로 묶을지 판정하는 데 쓴다(M01_CLAMP_BP).
  const deviceW = useDeviceWidth();
  const ratioFlipped = useRotatedInput();
  const panelBottom =
    (ratioFlipped && rawRatio > 0 ? 1 / rawRatio : rawRatio) < 1;
  const orientKey: "portrait" | "landscape" = wideNow
    ? "landscape"
    : "portrait";
  // 딤 위 UI 좌우 여백 — 눕힌 화면과 제자리 확대가 다르다(layoutRules 주석 참고).
  // useDeviceWide 는 앱이 CSS 로 눕은 것과 실기기 물리 회전을 한 값으로 묶어 준다.
  const isAndroid = useIsAndroid();
  // '확대가 화면을 돌렸는가'. 폰을 이미 눕힌 채 확대를 누르면(제자리) false 다.
  const rotatedNow = useImmersiveRotated();
  // 눕힌 화면 값은 기기별로 다르다 — 아이폰 60, 안드로이드 30(사용자 지정
  // 2026-08-18).
  //
  // 어떻게 들어왔는지는 안 본다(사용자 지정 2026-08-27). 예전엔 '확대가 화면을
  // 돌렸는가'(rotatedNow)로 갈라, 세로에서 확대한 경우만 60/30 이고 가로모드나
  // 그 상태의 제자리 확대는 16 이었다. 그런데 360 짜리 폰이면 세 경우가 결국
  // 같은 화면이다(사용자 지적: "360은 제자리 확대랑 가로모드가 같잖아 …
  // 그게 같은 해상도가 있잖아") — 실기기에서도 카메라 구멍·라운드 모서리는
  // 어느 경로로 왔든 같은 변에 온다. 그래서 눕힌 값 하나로 통일한다.
  //
  // ※ 위아래(topInset·bottomInset)는 아직 rotatedNow 로 갈린다 —
  //    제자리 확대일 때만 IMMERSIVE_EXTRA_INSET 20 이 더 붙는다. 같은 이유로
  //    묶을 수 있지만 가로모드의 세로 위치가 통째로 움직이는 변경이라 그대로 뒀다.
  const dimEdge = isAndroid ? LANDSCAPE_EDGE_ANDROID : LANDSCAPE_EDGE;
  // 시간바 아래 아이콘 줄은 LandscapeVideo 밖(controls)에 있어 그쪽 보정을 못 받는다
  // — 같은 식으로 앱 창이 화면에서 밀려난 만큼 빼서 기기 모서리 기준으로 맞춘다.
  // 가로 패널 폭 — 240 고정(사용자 지정 2026-08-19: "그냥 고정하자 240으로").
  // 화면의 1/3 로 재서 주다가(780 에서 260) 과하다고 해서 되돌렸다. 220(1080+
  // 사이드 패널과 같은 값)보다 조금 넓은 자리다. 바깥 여백도 이 안에 포함된다 —
  // 흰 판이 화면에서 차지하는 몫이 곧 240 이다.
  const panelContentW = LANDSCAPE_PANEL_W;
  // 가로 딤 왼쪽 아래 아이콘이 여는 오른쪽 패널 — 어느 탭으로 열렸는지까지 담는다
  // (사용자 지정 2026-08-18). null 이면 닫힘.
  const [lsPanel, setLsPanel] = useState<"list" | "motion" | null>(null);
  // 열고 닫을 때 폭을 굴리려면 두 상태가 필요하다(사용자 지적 2026-08-18: "너무
  // 띡 띡 나오는거 아니야?"):
  //   lsPanelTab  — 지금 그릴 내용. 닫는 동안에도 남아 있어야 빈 판이 안 보인다.
  //   lsPanelOpen — 폭 0 ↔ 제 폭. 붙인 다음 프레임에 켜야 전환이 돈다.
  const [lsPanelTab, setLsPanelTab] = useState<"list" | "motion">("list");
  const [lsPanelOpen, setLsPanelOpen] = useState(false);
  // 패널이 열려 있는지 CSS 에도 알린다 — 영상 오른쪽 여백(상태바 자리 대칭분)을
  // 그때만 접는다(사용자 지적 2026-08-18: "오른쪽 패널 나올때는 검정띠 없어도
  // 될듯"). 패널이 그 자리를 이미 덮고 있어 띠가 두 겹으로 보인다.
  useEffect(() => {
    const ds = document.documentElement.dataset;
    if (lsPanel) ds.lsPanel = "true";
    else delete ds.lsPanel;
    return () => {
      delete document.documentElement.dataset.lsPanel;
    };
  }, [lsPanel]);
  useEffect(() => {
    if (lsPanel) {
      setLsPanelTab(lsPanel);
      const id = requestAnimationFrame(() => setLsPanelOpen(true));
      return () => cancelAnimationFrame(id);
    }
    setLsPanelOpen(false);
    // 내용은 전환이 끝난 뒤에 치운다(240ms + 여유).
    const t = setTimeout(() => setLsPanelTab("list"), 300);
    return () => clearTimeout(t);
  }, [lsPanel]);
  // 다채널로 나가면 패널을 닫는다. 패널을 여는 두 버튼(메뉴 · 움직임 감지)이
  // 둘 다 단일 전용이라, 단일에서 열어 둔 채 나가면 다시 누를 버튼이 없다.
  useEffect(() => {
    if (expandedIndex === null) setLsPanel(null);
  }, [expandedIndex]);
  // 시간바 아래 아이콘 줄도 같은 값을 쓴다(그 줄만 LandscapeVideo 밖에 있다).
  // 앱 창 밀림 보정은 폐기했다 — 이유는 LandscapeVideo 의 edgeL/edgeR 주석 참고.
  const dimEdgeL = dimEdge;
  // 오른쪽 패널이 열려 있으면 그쪽 여백은 20 이면 된다(사용자 지정 2026-08-18) —
  // 패널이 화면 끝을 막고 있어 손이 걸릴 일도, 노치가 올 일도 없다.
  const dimEdgeR = lsPanel ? DIM_EDGE_WITH_PANEL : dimEdge;

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
  // 위아래 가짜 시스템 바 표시 여부. 기본은 숨긴 몰입 상태(LIVE 칩으로 토글).
  // 단 데스크톱 진입(initialChrome)이면 켠 채로 시작한다.
  const [chromeVisible, setChromeVisible] = useState(initialChrome);
  // 녹화 모드 REC 칩 — 예전엔 가짜 시스템 바(chromeVisible)를 같이 토글했는데,
  // 이제 시간바(플레이어 버튼+눈금 타임라인)만 숨긴다/보인다로 바뀐다. 기본은
  // 보임. 헤더의 REC+날짜 행은 이 상태와 무관하게 항상 남아 다시 누를 수 있다.
  const [timelineVisible, setTimelineVisible] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  // 가로 딤에서 5버튼을 누른 직후 — 5버튼과 시간바만 남기고 나머지는 걷는다
  // (사용자 지정 2026-08-14). 딤 자체는 useAutoHide 가 마지막 조작 5초 뒤에
  // 걷으므로, 여기서도 같은 5초를 세어 상태를 되돌린다. 그러면 '5버튼만 →
  // 아무것도 없음' 순서로 보인다.
  const [playerFocus, setPlayerFocus] = useState(false);
  const notePlayerAction = useCallback(() => setPlayerFocus(true), []);
  useEffect(() => {
    if (!playerFocus) return;
    const t = setTimeout(() => setPlayerFocus(false), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [playerFocus]);
  // 녹화 재생 시각. 안을 갈아끼워도 보던 시각에서 이어지도록 물려받는다
  // (screenState.ts). 실시간이면 null 이다.
  const [playbackMs, setPlaybackMs] = useState<number | null>(
    () => readScreenState().ms,
  );
  // 바뀔 때마다 남겨 둔다 — 다음에 뜨는 안이 같은 화면에서 시작하게.
  // 재생 시각(playbackMs)도 같이 남긴다. 안 남기면 녹화 화면인 채로 안을 바꿨을 때
  // 새 안이 '녹화인데 시각은 없음'으로 떠서 시간바가 비고 시계가 멈춘다
  // (screenState.ts 주석 참고). 녹화 중엔 매 틱 바뀌지만 문서 루트 dataset 쓰기
  // 하나뿐이라(구독자 없음) 리렌더나 레이아웃을 만들지 않는다.
  useEffect(() => {
    writeScreenState({ single: expandedIndex, mode, ms: playbackMs });
  }, [expandedIndex, mode, playbackMs]);
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
  const [captureToastKey, setCaptureToastKey] = useState(0);
  const showCaptureToast = () => {
    setCaptureToast(true);
    // 가로 딤 토스트는 같은 문구를 연달아 띄우므로 key 로 애니메이션을 다시 태운다.
    setCaptureToastKey((k) => k + 1);
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

  // 녹화로 들어갈 때 — NVR 은 예전 그대로 날짜·시간 시트가 뜨고,
  // 클라우드는 '오늘 이벤트 내역' 화면으로 넘어간다(CloudEventScreen).
  // 둘 다 dateTimeOpen 하나로 켜고, 클라우드일 땐 시트를 열지 않는다.
  const storage = useStorageMode();
  const cloudEventScreen = storage === "cloud" && dateTimeOpen;

  // 저장 방식을 바꾸면, 녹화를 보던 중이었다면 그 방식의 '시점 고르기'로 다시
  // 들어간다(사용자 지적 2026-09-01: "NVR 녹화 영상 화면 보고 있는데 클라우드
  // 누르면 안 바뀌네"). 클라우드 화면 조건이 dateTimeOpen 이라, 이미 재생 중이면
  // (시트를 닫은 뒤라) 방식만 바꿔도 화면이 그대로였다. NVR 은 날짜·시간 시트,
  // 클라우드는 이벤트 목록이 그 자리다 — 둘 다 이 플래그 하나로 열린다.
  // 실시간을 보던 중이면 건드리지 않는다(저장 방식은 녹화에만 걸리는 얘기다).
  const storageRef = useRef(storage);
  useEffect(() => {
    if (storageRef.current === storage) return;
    storageRef.current = storage;
    if (mode === "recording") setDateTimeOpen(true);
  }, [storage, mode]);

  const triggerTransitionSkeleton = () => {
    if (expandedIndex === null) {
      setGridLoading(true);
      setTimeout(() => setGridLoading(false), 600);
    } else {
      setVideoLoading(true);
      setTimeout(() => setVideoLoading(false), 600);
    }
  };

  // 비교하기 — 옆 기기와 실시간/녹화·재생 시각을 맞춘다(components/playbackSync.ts).
  // 다채널/단일(channel-sync)과 달리 '화면을 옮긴 순간'만 오간다.
  usePlaybackSync({
    mode,
    playbackMs,
    isScrubbing,
    apply: ({ mode: m, ms }) => {
      setPlaybackMs(ms);
      if (ms !== null) setIsPlaying(true);
      if (m !== mode) {
        setMode(m);
        triggerTransitionSkeleton();
      }
    },
  });

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
  // 화면 맞춤은 다채널·단일이 한 상태를 쓴다(사용자 지적 2026-08-18: "단일 →
  // 다채널, 다채널 → 단일 바꿀때 왜 화면 비율도 바뀌는거야?"). 예전엔 화면마다
  // 따로 기억해서, 한쪽에서 맞춤을 바꾸고 다른 쪽으로 넘어가면 화면이 저절로
  // 바뀐 것처럼 보였다(가로에선 맞춤 토스트까지 떴다). 맞춤은 '이 영상들을 어떻게
  // 채워 볼지'라는 하나의 취향이라 화면 종류로 갈릴 이유가 없다.
  const fitState = useVideoFit("fill");

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
  // (가로 딤의 현재 시각은 LandscapeVideo 가 직접 센다 — 세 안 공통 표시.)
  if (immersive) {
    return (
      // 패널이 열리면 영상을 밀고 옆에 선다(덮지 않는다) — 그래서 가로 배치다.
      <div
        className={`app-safe-frame relative flex h-full w-full overflow-hidden bg-black${
          panelBottom ? " flex-col" : ""
        }`}
      >
        {/* 펀치홀 — 기기에 뚫린 구멍이라 확대·가로에서도 그대로 있어야 한다.
            프레임 직속이고 z 를 가장 높게 준다(사용자 지정 2026-08-26:
            "그게 레이어 최상단에 있어야 해"). A-4 만. */}
        {platform === "android" && chromeVisible && (
          <span className="punch-hole" style={{ zIndex: 100 }} aria-hidden />
        )}
        <div className="relative flex min-h-0 min-w-0 flex-1">
        <LandscapeVideo
          cameras={CAMERAS}
          expandedIndex={expandedIndex}
          page={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          playbackMs={playbackMs}
          driveByPlayback={mode === "recording"}
          // 일시정지·스크럽 중이면 폴백 GIF 도 멈춰야 한다(세로와 같은 값).
          paused={mode === "recording" && (!isPlaying || isScrubbing)}
          onGallery={() => setSheetOpen(true)}
          onMore={() => setMoreOpen(true)}
          onAi={() => setAiOpen(true)}
          // A-3: 가로 딤도 세로와 같은 재배치 — 크게 보기 우하단 원.
          swapAiZoom
          // 다채널 딤 버튼도 단일 화면과 같은 규격으로(사용자 지정 2026-08-14).
          dimStyle="a3"
          dimBlur={false}
          dimTint={DIM_TINT}
          // AI·크게 보기를 시간바 아래 가운데 줄로 옮겼다 — 딤 좌우 아래 원은 끈다.
          showOverlayAi={false}
          showOverlayZoom={false}
          // 시간바를 끄는 동안엔 딤 UI 를 걷어 시간바만 남긴다.
          scrubbing={isScrubbing}
          // 딤 위 UI 좌우 여백 — 아래 아이콘 줄과 한 값을 쓴다(dimEdge).
          edgeInset={dimEdge}
          // 패널이 열리면 오른쪽만 좁힌다(위 dimEdgeR 과 같은 값).
          edgeInsetRight={lsPanel ? DIM_EDGE_WITH_PANEL : undefined}
          // 위쪽 요소(장소명·칩 줄·아이콘 줄) — 네 안 공통(layoutRules).
          topInset={LANDSCAPE_TOP_INSET + (rotatedNow ? 0 : IMMERSIVE_EXTRA_INSET)}
          // 이 층(시간바 + 그 아래 아이콘 줄)은 이 값에서 12 를 뺀 만큼 뜬다.
          // 22 → 아이콘 줄 아래 마진 10(사용자 지정 2026-08-14: 20 에서 10 더 내림).
          // 시간바는 그 아이콘 줄 위에 얹히므로 같이 내려간다.
          bottomInset={LANDSCAPE_BOTTOM_INSET + (rotatedNow ? 0 : IMMERSIVE_EXTRA_INSET)}
          // 전환 스켈레톤 — 세로와 같은 상태를 그대로 넘긴다.
          loading={expandedIndex !== null ? videoLoading : gridLoading}
          onExpand={handleExpand}
          onBack={handleBack}
          title={VARIANT_LABEL["a4m01"]}
          subtitle="에스원 본사 · N1234567"
          // 좌우 스와이프로 페이지 넘김(세로 다채널과 같은 사양).
          onPageChange={setCurrentPage}
          onTitleClick={() => setVariantPickerOpen(true)}
          mode={mode}
          // 알약에는 모드만 남긴다 — 날짜·시각은 뺐다(사용자 지정 2026-08-27).
          // 딤 아래 왼쪽 줄에 달력 버튼이 생겨 날짜를 고르는 길이 따로 났고,
          // 녹화면 시간바가 이미 한가운데에 시각을 띄운다.
          hideStatusClock
          // 알약 높이 — 딤 오른쪽 아래 축소 아이콘과 같은 줄에 앉힌다(사용자 지정
          // 2026-08-27: "그 확대 아이콘 위치로 내려줘"). 73 은 시간바 클록 자리라
          // 아이콘 줄보다 한참 위였다. 실측으로 아이콘 중심이 영역 바닥에서 50,
          // 이 알약 층의 바닥이 30 이라 그 차이인 20 이 맞는 값이다.
          // (녹화 단일은 이 알약을 안 그린다 — hideStatusClock 이 켜져 시각이 없다.)
          statusRaise={20}
          // timeLabel 을 안 넘긴다 — 딤 상단의 시각 표시를 없앤다(사용자 결정
          // 2026-08-14). 시각은 영상 위 배지에 있어서 둘이 겹쳤고, 칩 옆에 시각이
          // 붙어 있으면 가운데 정렬도 칩 기준이 아니라 '칩+시각' 기준이라
          // 칩이 왼쪽으로 밀려 보였다. 빼면 칩만 남아 정확히 가운데에 온다.
          // 세로 토글과 같은 말로 — 가로만 '녹화'라 어긋났다(사용자 지적).
          recordingLabel="녹화영상"
          // 단일 화면 영상 위 배지는 끈다 — 딤 헤더에 이름이 있다(사용자 지정
          // 2026-08-14, 세로와 같은 규칙). 빈 문자열이면 배지 자리도 안 잡는다.
          singleBadge=""
          // 가로 딤 좌상단 — 뒤로가기 + 이름 헤더 대신 '● 실시간/녹화영상' 알약
          // 하나(사용자 지정 2026-08-26). 단일·다채널 둘 다에 건다(사용자 지정
          // 2026-08-27: "다 바꿔야지"). 자세한 건 LandscapeVideo 의
          // modePillHeader 주석 — singleHeaderCamera 는 이걸 켜면 안 쓰인다.
          modePillHeader
          // 딤 농도·칩 위치·페이지 점은 LandscapeVideo 기본값을 그대로 쓴다
          // — 가로 화면은 세 안이 같아야 해서 그쪽에 모아 뒀다.
          // 화면 맞춤은 세로에서 쓰던 상태를 그대로 이어받는다(회전해도 유지).
          fit={fitState.fit}
          onFitCycle={fitState.cycle}
          // 플레이어·시간바를 딤 색에 맞춰 넘긴다(overlay) — 흰 바를 걷어
          // 영상이 비치게 한다.
          controlsOnDim
          // 아래는 시간바만, 플레이어 버튼 5개는 화면 한가운데로(사용자 지정).
          // 둘을 따로 얹으므로 RecordingControls 를 두 벌 쓴다 — 각자 자기 몫만
          // 그리게 timelineOnly / playerOnly 로 갈라 준다.
          controls={
            // 실시간에도 아래 아이콘 줄은 나온다(사용자 지적: 녹화에만 있었다).
            // 시간바만 녹화 전용이다.
            <div
              style={{
                paddingLeft: `${LANDSCAPE_CONTROLS_PAD}px`,
                paddingRight: `${LANDSCAPE_CONTROLS_PAD}px`,
              }}
            >
              {mode === "recording" && expandedIndex !== null && (
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
                // (사용자 지정). 좌우 여백은 딤의 다른 요소(장소명·우상단 아이콘)
                // 와 같은 LANDSCAPE_EDGE 에 맞춘다 — 감싼 층이 이미
                // LANDSCAPE_CONTROLS_PAD 를 갖고 있어 그만큼 뺀 값만 더한다.
                // 화면 끝에 붙으면 손가락이 걸린다.
                style={{
                  // 시간바와의 간격을 6 줄인다 = 시간바가 그만큼 내려온다
                  // (사용자 지정 2026-08-14). 아이콘 줄은 아래에 고정이라
                  // 위쪽 시간바만 따라 내려온다.
                  marginTop: "-2px",
                  paddingLeft: `${Math.max(0, dimEdgeL - LANDSCAPE_CONTROLS_PAD)}px`,
                  paddingRight: `${Math.max(0, dimEdgeR - LANDSCAPE_CONTROLS_PAD)}px`,
                  // 시간바를 끄는 동안엔 같이 걷는다(사용자 지정 2026-08-14).
                  // 이 줄은 시간바와 한 층에 있어서, 그 층이 스크럽 중에도 남는
                  // 규칙(keepWhileScrubbing)을 그대로 물려받아 혼자 남아 있었다.
                  opacity: isScrubbing || playerFocus ? 0 : 1,
                  pointerEvents: isScrubbing || playerFocus ? "none" : "auto",
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
                        width: "40px",
                        height: "40px",
                        // 테두리는 없다(사용자 지정) — 배경이 회색 70% 라 원 모양이
                        // 이미 잡히고, 흰 선까지 있으면 아이콘보다 테두리가 먼저 보였다.
                        // 회색 40%(사용자 지정 2026-08-14). 반투명 검정 0.35 → 불투명
                        // 회색 → 0.7 → 0.5 을 거쳐 여기로 왔다. 톤은 앱에 이미 쓰는
                        // 회색(#757575, 녹화 배지 배경)이고 알파만 조절한다.
                        // A-3 의 딤 버튼·시간바 알약은 전부 이 값 하나로 맞춘다.
                        // 뒤를 흐리던 blur(20) 은 뺐다(사용자 지정 2026-09-03:
                        // "블러를 빼") — 세로 딤 위 원 버튼·알약 공통이다.
                        backgroundColor: DIM_TINT,
                      }}
                    >
                      <img
                        src={b.src}
                        alt=""
                        className="h-7 w-7"
                        style={{
                          // 흰 아이콘 + 가운데로 퍼지는 그림자(사용자 지정
                          // 2026-08-18: "둥근 원안에 있는 아이콘들 그림자좀 줘").
                          // 딤의 다른 원 버튼(GridSelectionOverlay 의 iconShadow)이
                          // 쓰는 값과 같다 — 0 0 4px 검정 60%.
                          filter:
                            "brightness(0) invert(1) drop-shadow(0 0 4px rgba(0,0,0,0.6))",
                        }}
                      />
                    </button>
                  );
                  return (
                    <>
                      {/* 양쪽 묶음에 flex-1 을 줘서 가운데 알약이 화면 정중앙에
                          오게 한다(사용자 지정 2026-08-19: "센터로 맞춰줘").
                          justify-between 만으로는 왼쪽 묶음이 넓어 알약이 오른쪽으로
                          밀린다. */}
                      <div
                        className="flex flex-1 items-center"
                        style={{ gap: "16px" }}
                      >
                        {btn({ key: "ai", label: "AI 검색", src: `${BASE}/ai_Icon.svg`, onClick: () => setAiOpen(true) })}
                        {/* 메뉴 — 오른쪽 패널을 '카메라 목록' 탭으로 연다.
                            열려 있는 쪽을 다시 누르면 닫힌다(사용자 지정 2026-08-18).
                            단일에서만 — 다채널은 화면에 이미 카메라가 다 깔려 있고
                            타일을 누르면 그 카메라 단일로 가므로, 목록을 또 띄우는
                            건 같은 일을 두 번 하는 것이다(사용자 지적 2026-08-27:
                            "가로 녹화 다채널에서 왜 카메라 목록 버튼이 있니?").
                            아래 '움직임 감지'를 다채널에서 뺀 것과 같은 이유다.
                            실시간·녹화 둘 다 뺀다 — 다채널이면 모드와 무관하다.
                            AI 검색은 남긴다(사용자 지정: "목록 버튼만").

                            패널이 열려 있어도 이 버튼은 그대로 둔다 — 하루 감췄다가
                            되돌렸다(사용자 지정 2026-08-27: "메뉴 버튼 눌렀을 때
                            사라지는 거 없어도 될 것 같다"). 눌러서 열고 다시 눌러
                            닫는 토글이라, 버튼이 사라지면 닫는 길이 X 하나로 줄고
                            방금 누른 자리가 비어 손이 갈 데를 잃는다. */}
                        {expandedIndex !== null &&
                          btn({
                            key: "menu",
                            label: "메뉴",
                            src: `${BASE}/nav/menu.svg`,
                            onClick: () =>
                              setLsPanel((v) => (v === "list" ? null : "list")),
                          })}
                        {/* 달력 · 화면 캡처 — 세로 날짜 줄 양 끝에 있던 둘을
                            가로에서는 이 줄로 가져온다(사용자 지정 2026-08-27).
                            가로엔 그 줄이 없어서 날짜를 고르거나 화면을 캡처할
                            길이 아예 없었다.
                            달력은 녹화에만 — 실시간엔 고를 날짜가 없다(세로와
                            같은 규칙). 캡처는 두 모드 다 있지만 단일에만 둔다
                            (사용자 지정 2026-08-27) — 다채널은 화면에 카메라가
                            여럿이라 무엇을 캡처한 것인지가 안 정해진다. 메뉴를
                            단일에만 둔 것과 같은 자리다. */}
                        {mode === "recording" &&
                          btn({
                            key: "date",
                            label: "날짜, 시간 선택",
                            src: `${BASE}/time.svg`,
                            onClick: () => setDateTimeOpen(true),
                          })}
                        {expandedIndex !== null &&
                          btn({
                            key: "capture",
                            label: "화면 캡처",
                            src: `${BASE}/camera.svg`,
                            onClick: showCaptureToast,
                          })}
                        {/* 움직임 감지 버튼은 없앴다(사용자 지정 2026-08-27).
                            메뉴로 연 패널이 '카메라 목록 | 움직임 감지' 두 탭을
                            이미 갖고 있어, 감지로 가는 길은 그 탭이다 — 딤에
                            버튼을 따로 두면 같은 자리로 가는 문이 두 개가 된다. */}
                      </div>
                      {/* 현재 시각 알약은 여기 없다 — 딤 아래 왼쪽 공통 표시로
                          올라갔다(LandscapeVideo, 사용자 지정 2026-08-25: 세 안이
                          같은 자리에 같은 모양으로 둔다). */}
                      {/* 크게 보기 ↔ 원래 크기로. 가로에서만 뜨는 줄이라 늘
                          '원래 크기로'다. 딤 오른쪽 아래에 있던 그 버튼이다. */}
                      <div className="flex flex-1 items-center justify-end">
                        {btn({ key: "zoom", label: "원래 크기로", src: `${BASE}/zoom_out.svg`, onClick: () => toggleImmersive(zoomScope) })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          }
          auxHidden={playerFocus}
          // 화면 캡처 토스트 — 세로와 같은 문구를 가로 정중앙에 띄운다.
          overlayToast={captureToast ? "현재 화면이 캡처 되었어요" : null}
          overlayToastKey={captureToastKey}
          centerControls={
            mode === "recording" ? (
              <RecordingControls
                overlay
                playerOnly
                onPlayerAction={notePlayerAction}
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
        </div>
        {/* 딤 왼쪽 아래 '메뉴'·'움직임 감지'가 여는 오른쪽 패널(사용자 지정
            2026-08-18). 다채널에서도 목록은 뜬다 — 거기서 카메라를 고르면 그
            카메라 단일 화면으로 넘어간다. */}
        {(lsPanel || lsPanelOpen) && (
          <LandscapeSidePanel
            position={panelBottom ? "bottom" : "right"}
            contentWidth={panelContentW}
            open={lsPanelOpen && lsPanel !== null}
            tab={lsPanelTab}
            onTab={setLsPanel}
            mode={mode}
            selectedIndex={expandedIndex}
            onSelect={(i) => {
              handleExpand(i);
              setLsPanel("list");
            }}
            playbackMs={playbackMs}
            setPlaybackMs={setPlaybackMs}
            onScrubbingChange={setIsScrubbing}
            // 패널 바깥 여백은 안 준다 — A-4 만(사용자 지정 2026-08-26:
            // "그 여백 IOS만 해당되고 웹은 안드로이드랑 동일하니 안 줘도 될 것
            // 같아"). 예전엔 아이폰 + 눕힌 화면에서만 dimEdge(60)에서 패널 제
            // 여백(16)을 뺀 44 를 바깥에 더 붙였다. 이제 어느 기기든 패널이
            // 기기 오른쪽 끝에 붙고, 안쪽 여백 16 만 남는다.
            edge={0}
            onClose={() => setLsPanel(null)}
          />
        )}
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
              : "a4m01"
          }
          onSelect={
            inCompare ? (v) => requestCompareTarget(v, compareSlot) : undefined
          }
          platform={platform}
          onClose={() => setVariantPickerOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-safe-frame relative h-full w-full flex flex-col items-center bg-white">
    {/* 펀치홀 카메라 점 — Android 환경에서 시스템 바가 보일 때만. 누르면 토글.
        iOS 환경에선 실제 상태바를 쓰므로 가짜 상단 바를 그리지 않는다.
        프레임 직속이다 — 안쪽 컬럼에 두면 그 컬럼이 z-auto 라, 뒤에 오는
        형제 층(z-30·z-40 딤 등)에 덮인다. 구멍은 늘 맨 위여야 한다
        (사용자 지정 2026-08-26). A-4 만. */}
    {platform === "android" && chromeVisible && (
      <button
        type="button"
        aria-label="시스템 바 토글"
        onClick={toggleChrome}
        className="punch-hole"
        style={{ zIndex: 100 }}
      />
    )}
    <div className="relative flex min-h-0 flex-1 w-full flex-col overflow-hidden bg-white">
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

      {/* 클라우드에서 녹화로 들어가면 영상 자리를 이벤트 목록이 대신한다.
          시트가 아니라 화면이라 여기서 갈린다 — 아래 하단 탭바는 이 블록
          바깥의 형제라 그대로 남는다(사용자 결정). */}
      {/* 영상 화면 전체(클라우드 목록 · 다채널 · 단일)를 홈과 같은 폭 규격으로
          묶는다 — 콘텐츠 700(좌우 패딩 20 포함, 실제 내용 660) 상한에 가운데
          정렬이고, 남는 폭은 좌우 여백이다(사용자 지정 2026-09-03: "그 사이즈만큼,
          영상쪽도 그렇게" · "왜 단일만 반영해놨어?"). 오른쪽 세로 패널을 뺀 뒤
          (sidePanel=false) 864·1080 에서 화면이 프레임 폭을 끝까지 다 써서, 같은
          기기의 홈 탭과 좌우 끝선이 어긋났다.

          묶는 건 M01_CLAMP_BP(800) 이상에서만이다 — 750 은 그대로 둔다(사용자
          지정: "750은 냅둬"). 그 아래는 예전처럼 프레임 폭을 다 쓴다.
          하단 탭바·안드로이드 네비·상태바는 이 컬럼 밖이라 전체 폭 그대로다
          (홈과 같다). */}
      <div
        className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden"
        style={{
          maxWidth: deviceW >= M01_CLAMP_BP ? `${M01_CONTENT_W}px` : undefined,
        }}
      >
      {cloudEventScreen ? (
        <CloudEventScreen
          // 660 컬럼이 이미 좌우 여백을 갖고 있다 — 화면 자기 여백은 0 으로
          // 돌려야 검색창·칩·검색 버튼이 상단 바와 같은 끝선에 선다.
          edgeInset={deviceW >= M01_CLAMP_BP ? 0 : undefined}
          initialMs={playbackMs ?? now?.getTime() ?? Date.now()}
          cameras={CAMERAS}
          // 이 안의 상단 바를 통째로 얹는다(사용자 지정 2026-09-01: "상단에
          // 그 바는 유지해야지", "그 부분은 그대로 넣으라고"). 클라우드로 녹화에
          // 들어오면 안의 헤더가 통째로 빠지는 자리라, 장소명도 모드 토글도
          // 사라져 있었다. 제목을 누르면 다채널 헤더와 같이 안 고르기가 열린다.
          header={
            <AppHeader
              onTitleClick={() => setVariantPickerOpen(true)}
              mode="recording"
              setMode={(m) => {
                if (m === "live") {
                  setDateTimeOpen(false);
                  handleSetMode("live");
                }
              }}
              chromeVisible={chromeVisible}
            />
          }
          onLive={() => setDateTimeOpen(false)}
          onPick={(ms, cam) => {
            setPlaybackMs(ms);
            setIsPlaying(true);
            setMode("recording");
            setDateTimeOpen(false);
            // 고른 이벤트의 카메라를 단일 화면으로 연다(사용자 지정 2026-09-02:
            // "그 목록을 누르면 단일화면처럼 보여야해"). 예전엔 들어온 자리로
            // 돌아가서, 다채널에서 들어왔으면 다채널이 나왔다.
            // 스켈레톤은 handleExpand 가 켠다 — triggerTransitionSkeleton 은
            // 이 렌더의 expandedIndex(아직 옛값)를 봐서 다채널 것을 켠다.
            if (cam >= 0) handleExpand(cam);
            else triggerTransitionSkeleton();
          }}
        />
      ) : expandedIndex === null ? (
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
          fitState={fitState}
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
          fitState={fitState}
        />
      )}
      </div>

      <DateTimePickerSheet
        open={dateTimeOpen && !cloudEventScreen}
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
              : "a4m01"
          }
          onSelect={
            inCompare ? (v) => requestCompareTarget(v, compareSlot) : undefined
          }
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
  // 비교하기 — 옆 기기 딤과 같이 켜고 끈다(components/dimSync.ts).
  useDimSync(gridSelected, setGridSelected);
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

  // 콘텐츠를 700 컬럼으로 묶은 폭인가(M01_CLAMP_BP) — 단일 화면(ExpandedView)과
  // 같은 판정이다. 그리드 좌우 여백을 그 폭에서만 준다.
  const clampContent = useDeviceWidth() >= M01_CLAMP_BP;

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
      {/* 상단 바 — 확대뷰·클라우드 화면과 같은 것을 쓴다(AppHeader). */}
      <AppHeader
        onTitleClick={onOpenVariantPicker}
        mode={mode}
        setMode={setMode}
        chromeVisible={chromeVisible}
      />

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
          // 세로 다채널 딤에도 같은 알약(사용자 지적 2026-08-31: "세로 다채널은
          // 왜 안해줘?"). 가로는 modePillHeader 가 단일·다채널 둘 다에 걸려
          // 있었고, 세로만 단일에서 끝나 있었다. GridSelectionOverlay 는 네 안
          // 공용이라 값을 넘길 때만 그린다 — 다른 안은 그대로다.
          topLeft={<ModePill mode={mode} />}
          onGallery={onOpenSheet}
          onMore={onOpenMore}
          onAi={onOpenAi}
          onFit={cycleGridFit}
          fit={gridFit}
          auto={gridAuto}
          // A-3: AI 는 우상단 아이콘 줄로, 크게 보기는 우하단 원 버튼으로 맞바꾼다.
          swapAiZoom
          dimStyle="a3"
          dimBlur={false}
          dimTint={DIM_TINT}
        />
        <VideoFitToast text={gridFitToast} toastKey={gridFitToastKey} />
        <SectionSkeleton visible={gridLoading} cols={cols} rows={rows} />
      </section>

      {mode === "live" ? (
        <div
          className="relative flex flex-none items-center px-5"
          style={{ height: "48px", gap: "8px" }}
        >
          {/* 실시간 배지는 뺐다 — A-4 만(사용자 지정 2026-08-26). 날짜·시각은
              줄 한가운데다(단일 화면 날짜 줄과 같은 규칙). */}
          <span
            suppressHydrationWarning
            className="absolute left-1/2 inline-flex -translate-x-1/2 items-center text-[14px] font-medium leading-none"
            style={{
              // 검정 50% 알약 — 흰 줄 위에서도 시각이 한 덩어리로 읽힌다
              // (사용자 지정 2026-08-26: "알약 형태로 블랙 50%로 둘러줘").
              height: "26px",
              padding: "0 10px",
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#FFFFFF",
              // 가운데(left:50%) 절대배치라 남는 폭이 절반뿐이다 — 안 막으면
              // 날짜와 시각이 두 줄로 접힌다.
              whiteSpace: "nowrap" as const,
            }}
          >
            {dateLabel}
          </span>
          <RowSkeleton visible={gridLoading} />
        </div>
      ) : (
        <RecordingControls
          now={now}
          onToggleChrome={onToggleChrome}
          // 다채널 녹화에는 시간바를 안 둔다(사용자 지정 2026-08-19). 어느 카메라
          // 기준인지 모호한 데다, 세로 다채널은 이미 감지 표시도 뺀 상태다.
          // 플레이어 버튼 5개와 날짜 줄은 그대로 남는다.
          noTimeline
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
      {/* 단일 화면에선 영상 위에 카메라 이름을 안 띄운다 — 딤 왼쪽 위로 옮겼다
          (사용자 지정 2026-08-14). 영상만 볼 땐 화면이 깨끗하고, 어느 카메라인지는
          딤을 켜면 바로 보인다. 다채널 타일은 그대로 이름을 단다. */}
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
  // 확대(크게 보기)를 눌렀을 때 '어느 기기에서 눌렀나' — 비교하기에서 자리마다
  // 해상도가 다를 수 있어, 눕힐지 말지를 그 기기 크기로 판단한다(immersive.ts).
  const zoomScope = useDeviceScope();

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
  // 비교하기 — 옆 기기 딤과 같이 켜고 끈다(components/dimSync.ts).
  useDimSync(showControls, setShowControls);
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
  // 콘텐츠를 700 컬럼으로 묶은 폭인가(M01_CLAMP_BP). 부모가 바깥 컬럼에 거는
  // 것과 같은 판정이다 — 영상 좌우 여백을 그 폭에서만 준다.
  const clampContent = useDeviceWidth() >= M01_CLAMP_BP;
  // A-4(수정01)에는 오른쪽 세로 패널이 없다 — 어떤 비율이든 405 처럼 아래
  // 가로 스트립(영상 → 날짜 → 5버튼 → 시간바 → 탭 → 목록)으로 쌓는다
  // (사용자 지정 2026-09-03: "오른쪽 패널이 나오잖아. 그 사양 말고, 그냥 405처럼").
  //
  // 다른 안(A-1·A-2·A-3·A-4)은 가로로 넓적한 화면(가로/세로 >= SIDE_PANEL_RATIO)
  // 에서 카메라 목록·움직임 감지를 오른쪽 끝 세로 패널로 보낸다 — 그런 화면은
  // 영상이 세로에 갇혀 있어 하단 스트립이 영상 폭을 크게 깎기 때문이다
  // (layoutRules.ts 의 SIDE_PANEL_RATIO 주석). 이 안은 그 값을 안 본다.
  //
  // 상수(false)로 두고 아래 sidePanel 분기를 남겨 둔다 — 지우면 되돌리기가
  // 통째로 다시 쓰는 일이 되고, 이 안은 아직 A-4 에서 막 갈라져 나온 참이다.
  const sidePanel = false as boolean;
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
  // 세 번째 인자(타일 바닥 72) 가 A-4 만의 값이다 — 공유 기본값은 88 이다.
  // 750 처럼 넓은 화면에서 88 은 스트립이 두꺼워 감지 카드가 커 보였다(사용자
  // 지적 2026-08-26). 카메라 목록·움직임 감지가 같은 영역을 나눠 쓰므로 둘 다
  // 같이 낮아진다 — 한쪽만 줄이면 탭을 옮길 때 크기가 어긋난다.
  const [listAreaRef, listRowRef, listWide, videoAreaRef] = useListLayout(
    sidePanel ? undefined : MOTION_MIN_H,
    true,
  );
  // 카메라 목록 — 선택 카메라 타일을 가운데로 맞출 때 쓴다(가로면 좌우, 세로면 위아래).
  const listScrollRef = useRef<HTMLDivElement>(null);
  // 마우스로 목록을 끌어서 굴린다(데스크톱 미리보기 전용) — 실기기 터치는
  // 브라우저 기본 스크롤 그대로다. useDragScroll.ts 참고.
  const dragScroll = useDragScroll();
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
          // 감지 카드의 유형 칩·시각 라벨과 같은 4px(사용자 지정 2026-08-26).
          borderRadius: "4px",
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
      // 딤(영상 위 컨트롤)은 끈다(사용자 지정 2026-08-18: "단일 확대할때는 딤이
      // 꺼져야지"). 확대는 영상을 자세히 보려는 동작이라 UI 가 가리면 안 된다 —
      // 다시 보려면 한 번 탭하면 된다.
      setShowControls(false);
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
      {/* 확대뷰 상단 바 — 다채널과 같은 것. 제목을 누르면 다채널로 돌아간다. */}
      <AppHeader
        onTitleClick={onBack}
        mode={mode}
        setMode={setMode}
        chromeVisible={chromeVisible}
      />
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
          {/* 카메라 이름 배지 — 영상 영역 왼쪽 위(사용자 지정 2026-08-31:
              "그 영상 영역에 카메라 이름 넣어주고"). 줌 껍데기 '밖'이라 두 손가락
              확대에 글자가 같이 커지지 않는다(가로에서 같은 지적으로 이미 밖에
              뺐다 — LandscapeVideo 의 CameraBadge 주석). 딤과 무관하게 늘 보인다. */}
          <CameraBadge text={cam.label} />
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
            {/* '● 실시간/녹화영상' 알약 — 딤 왼쪽 위. 카메라 이름이 있던
                자리다(사용자 지정 2026-08-31: "딤에서 카메라 이름은 빼줘,
                그 위치에 알약 넣어주고"). 이름은 딤이 아니라 영상 영역에
                배지로 나간다(아래 CameraBadge) — 가로와 같은 구성이다. */}
            <div className="absolute" style={{ top: "20px", left: "16px" }}>
              <ModePill mode={mode} />
            </div>
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
                  style={{
                    filter:
                      "brightness(0) invert(1) drop-shadow(0 0 4px rgba(0,0,0,0.6))",
                  }}
                />
              </button>
            </div>
            {/* 크게 보기 — 딤 오른쪽 아래. 원 스타일은 왼쪽 아래 줄·가로 딤과
                같다(회색 75% · 테두리 없음 · 아이콘 흰색 + 퍼지는 그림자,
                사용자 지정 2026-08-14). 아이콘만 24 인 건 zoom_in.svg 가 박스를
                덜 채우는 그림이라 28 로 키우면 다른 아이콘보다 커 보여서다. */}
            <button
              type="button"
              aria-label="크게 보기"
              onClick={() => toggleImmersive(zoomScope)}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                bottom: "12px",
                right: "16px",
                width: "40px",
                height: "40px",
                backgroundColor: DIM_TINT,
                pointerEvents: showControls ? "auto" : "none",
              }}
            >
              <img
                src={`${BASE}/zoom_in.svg`}
                alt=""
                className="h-6 w-6"
                style={{
                  filter:
                    "brightness(0) invert(1) drop-shadow(0 0 4px rgba(0,0,0,0.6))",
                }}
              />
            </button>
            {/* 딤 왼쪽 아래 — AI 하나. 오른쪽 아래 크게 보기와 같은 높이(bottom 12).
                예전엔 가로 딤과 구성을 맞추려고 메뉴·움직임 감지도 같이 뒀는데
                (2026-08-14), 세로는 영상 바로 아래에 카메라 목록/움직임 감지 탭이
                이미 있어서 같은 입구가 두 벌이었다 — 게다가 그 둘은 동작도 없었다.
                뺀다(사용자 지정 2026-08-18). 가로 딤에는 탭이 없어 거긴 그대로 둔다. */}
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
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  aria-label={b.label}
                  onClick={b.onClick}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: DIM_TINT,
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
  // 다채널 화면의 같은 줄과 거의 같은데, 녹화일 때 이 줄 맨 왼쪽에 달력 버튼이
  // 하나 더 있다 — 시간바 왼쪽에 있던 걸 여기로 옮겼다(사용자 지정 2026-08-20).
  // 그래서 이 줄만으로 날짜를 고를 수 있다: 달력 버튼도, 날짜 글자도 같은 시트를
  // 연다.
  const dateBarBlock = (
    <>
      <div
        className={`relative flex flex-none items-center ${clampContent ? "px-0" : "px-5"}`}
        style={{ height: "44px" }}
      >
        {/* 날짜·시간 선택 — 이 줄 맨 왼쪽, REC 칩보다 앞이다(사용자 지정
            2026-08-20: "시간바 왼쪽에 달력 아이콘 그거 캡쳐 아이콘 있는 영역에
            왼쪽으로 넣어줘"). 원래는 시간바 왼쪽에 34 원으로 있었는데, 이 줄로
            오면서 규격은 같은 줄 오른쪽 끝 캡처 버튼에 맞춘다 — 28 원 + 아이콘 24.
            한 줄에 원 두 개가 크기가 다르면 어긋나 보인다. 시간바 쪽 버튼은
            없앴다(두 곳에 두지 않는다). 녹화 모드에만 그린다 — 실시간엔 고를
            날짜가 없다. 오른쪽 여백 8 은 REC↔날짜 사이 간격(ml-2)과 같은 값. */}
        {mode === "recording" && (
          <button
            type="button"
            aria-label="날짜, 시간 선택"
            onClick={onOpenDateTime}
            className="mr-2 flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full border border-neutral-300"
          >
            <img src={`${BASE}/time.svg`} alt="" className="h-6 w-6" />
          </button>
        )}
        {/* 실시간/녹화영상 배지는 뺐다 — A-4 만(사용자 지정 2026-08-26).
            지금 무엇을 보고 있는지는 위 헤더의 실시간/녹화영상 탭이 이미
            말해 준다. 남은 건 날짜·시각과 양 끝 버튼뿐이다. */}
        {/* 날짜·시각은 줄 한가운데다(사용자 지정 2026-08-26). 양 끝 버튼(달력·캡처)
            개수가 모드마다 달라서 흐름에 두면 가운데가 아니라 그 사이 가운데로
            간다 — 줄 기준 정가운데로 못 박으려고 절대배치한다. */}
        {mode === "recording" ? (
          // 시각 옆 아래 화살표는 뺐다(사용자 지정 2026-08-14). 날짜·시간 선택으로
          // 들어가는 길은 바로 왼쪽 달력 버튼과 '녹화영상' 탭이 이미 있어서,
          // 여기 화살표는 같은 말을 세 번 하는 셈이었다. 글자는 그대로 누를 수 있다.
          <button
            type="button"
            onClick={onOpenDateTime}
            className="absolute left-1/2 flex -translate-x-1/2 items-center text-[14px] font-medium leading-none"
            style={{
              // 검정 50% 알약 — 흰 줄 위에서도 시각이 한 덩어리로 읽힌다
              // (사용자 지정 2026-08-26: "알약 형태로 블랙 50%로 둘러줘").
              height: "26px",
              padding: "0 10px",
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#FFFFFF",
              // 가운데(left:50%) 절대배치라 남는 폭이 절반뿐이다 — 안 막으면
              // 날짜와 시각이 두 줄로 접힌다.
              whiteSpace: "nowrap" as const,
            }}
          >
            <span suppressHydrationWarning>{recordingDateLabel}</span>
          </button>
        ) : (
          <span
            suppressHydrationWarning
            className="absolute left-1/2 inline-flex -translate-x-1/2 items-center text-[14px] font-medium leading-none"
            style={{
              // 검정 50% 알약 — 흰 줄 위에서도 시각이 한 덩어리로 읽힌다
              // (사용자 지정 2026-08-26: "알약 형태로 블랙 50%로 둘러줘").
              height: "26px",
              padding: "0 10px",
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#FFFFFF",
              // 가운데(left:50%) 절대배치라 남는 폭이 절반뿐이다 — 안 막으면
              // 날짜와 시각이 두 줄로 접힌다.
              whiteSpace: "nowrap" as const,
            }}
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
  // 어느 탭을 보든 쓸 수 있어야 한다. 왼쪽에 얹혀 있던 달력 버튼은 위 날짜 줄로
  // 옮겨서(2026-08-20) 지금은 눈금만 왼쪽 끝까지 흐른다.
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
        part="bar"
        playbackMs={playbackMs}
        setPlaybackMs={setPlaybackMs}
        cameraSrc={cam.src}
        onScrubbingChange={onScrubbingChange}
      />
    </div>
  );
  const bottomStrip = (
    <>
      {/* 시간바는 여기 없다 — 5버튼 위로 올라갔다(위 return 참고). */}
      {/* 탭 줄 — 녹화면 '카메라 목록 | 움직임 감지' 두 탭(사용자 결정 2026-08-14),
          실시간이면 감지가 없으니 '카메라 목록' 제목 하나만.
          위아래 14 로 같다 — 사이드 패널 탭(tabsBlock)의 padding 14px 0 과 같은 값.

          영역 '밖'이다 — A-2 와 같은 구조다(사용자 지정 2026-08-25: "녹화쪽
          카메라목록이랑 움직임감지 그 영역은 세 안 다 동일하게, A-2안에 맞게").
          안에 두면 useListLayout 이 이 줄까지 영역으로 재서(chrome) 같은 기기에서
          A-2 보다 스트립이 두꺼워졌다(405×648 기준 138 vs 116). 밖으로 빼면 영역이
          곧 목록/감지 자리라 세 안이 같은 높이가 된다. */}
      {mode === "recording" ? (
        // 여백을 줄이 아니라 버튼에 준다 — A-2 와 완전히 같은 마크업이라 줄 높이
        // (14+15+14=43)도, 손이 닿는 넓이도 같다.
        <div
          className={`flex items-center ${clampContent ? "px-0" : "px-5"}`}
          style={{ gap: "20px" }}
        >
          {([
            { key: "list", label: "카메라 목록" },
            { key: "motion", label: "움직임 감지" },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRecTab(t.key)}
              className="relative text-[15px] font-bold leading-none"
              style={{
                // 위 STRIP_PAD · 아래 0 — 아래쪽 여백은 레일이 자기 몫으로 갖고
                // 있어서(영역 padding), 글자 기준 위아래가 같은 값이 된다.
                padding: `${STRIP_PAD}px 0 0`,
                color: recTab === t.key ? "#1D6CEB" : "#A6A6A6",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`relative flex flex-none items-center ${clampContent ? "px-0" : "px-5"}`}
          // (좌우는 px-5 가 잡는다 — 인라인 padding 축약형을 쓰면 그걸 덮어쓴다.)
          // 위 STRIP_PAD · 아래 0 — 녹화 탭 줄과 같은 규칙(글자 위아래가 같다).
          style={{ paddingTop: `${STRIP_PAD}px`, paddingBottom: "0px" }}
        >
          <span
            className="text-[15px] font-bold leading-none"
            style={{ color: "#262626" }}
          >
            카메라 목록
          </span>
        </div>
      )}
      {/* 카메라 목록 / 움직임 감지 — 남는 공간을 채우는 영역(flex-1). 최소 높이는
          useListLayout 이 배치에 따라 잡는다 — 가로 한 줄이면 타일 세로 기준
          (TILE_MIN_H), 세로 2열이면 영역 기준(LIST_MIN_H). layoutRules.ts 참고. */}
      {/* 위아래 여백(STRIP_PAD)은 이 영역이 갖는다 — 스크롤되는 안쪽에 두면
          목록을 굴리는 순간 사라져 타일이 탭 글자에 붙는다(사용자 지적
          2026-08-26: "세로 스크롤하면 마진 준 게 사라진다"). 밖에 두면 그 띠는
          안 굴러가고, 타일은 그 아래에서 잘린다. */}
      <div
        ref={listAreaRef}
        className="relative flex min-h-0 flex-col flex-1"
        // 아래 여백은 '가로 한 줄'일 때만 준다(사용자 지정 2026-08-31).
        // 세로 2열은 세로 스크롤이라, 스크롤러 밖에 있는 이 여백이 목록을 끝까지
        // 내려도 하단 탭 위에 흰 띠로 남았다("12px 흰띠 없애"). 가로 한 줄은
        // 세로로 굴릴 게 없어 그 문제가 없고, 없애 두면 스트립이 하단 탭에 딱
        // 붙어 답답하다("하단 마진 어디갔어").
        // 못 박는 스트립 높이(MOTION_MIN_H)가 이 여백을 포함한
        // 값이고 그 값도 가로 한 줄에서만 쓰이므로, 둘의 조건이 서로 맞는다 —
        // 타일 크기는 예전 그대로다.
        style={{
          paddingTop: `${STRIP_PAD}px`,
          paddingBottom: listWide ? `${STRIP_PAD}px` : "0px",
        }}
      >
      {motionTab ? (
        // 감지 탭은 리스트다 — 시간축에 얹힌 썸네일 레일도, 세로 타임라인도 아니다
        // (사용자 지정 2026-08-26: "시간바랑 같이 움직이지 말고 가로 리스트 형태로").
        // 방향만 카메라 목록을 따라간다(listWide) — 같은 영역을 두 탭이 나눠 쓴다.
        // 다른 안(A-1·A-2·A-3)은 레일·세로 타임라인 그대로다.
        <MotionEventList
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          cameraSrc={cam.src}
          wide={listWide}
          // 영역이 이미 좌우 20 을 갖고 있다(insetX) — 안에서 또 주면 40 이 된다.
          inset={clampContent ? 0 : undefined}
        />
      ) : (
      <div
        ref={listWide ? undefined : listScrollRef}
        className={
          listWide
            ? "flex min-h-0 flex-1 flex-col"
            : "flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              ? `flex min-h-0 flex-1 gap-2 ${clampContent ? "px-0" : "px-5"} overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
              : `grid grid-cols-2 gap-2 ${clampContent ? "px-0" : "px-5"}`
          }
          {...(listWide ? dragScroll : {})}
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
  // 감지는 세로 타임라인. 패널이 좁아 가로 시간바가 안 맞는다.
  const sidePanelBody = (
    <div ref={listAreaRef} className="relative flex min-h-0 flex-1 flex-col">
      {mode === "recording" && recTab === "motion" ? (
        // 리스트 — 아래 스트립 감지 탭과 같은 컴포넌트다(사용자 지정 2026-08-26).
        // 패널은 좁고 기니 위아래로 쌓는다.
        <MotionEventList
          playbackMs={playbackMs}
          setPlaybackMs={setPlaybackMs}
          cameraSrc={cam.src}
          // 이 패널의 카메라 목록은 좌우 16(px-4)이다.
          inset={16}
        />
      ) : (
        <div
          ref={listScrollRef}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          {...dragScroll}
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
            {/* 세로 화면과 같은 순서 — 영상 → 5버튼 → 날짜 → 시간바.
                패널이 나와도 재생 위치를 잡을 게 있어야 하는 건 그대로. */}
            {playerBlock}
            {dateBarBlock}
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
          {/* A-4 순서: 영상 → 5버튼 → 날짜(현재시각 알약) → 시간바 → 탭
              (사용자 지정 2026-08-26: "5버튼을 현재시간 알약 위쪽으로"). */}
          {playerBlock}
          {dateBarBlock}
          {motionBlock}
          {bottomStrip}
        </>
      )}
    </>
  );
}


// ── 가로 움직임-감지 타임라인 ────────────────────────────────────────────
// 오른쪽 = 최신, 왼쪽 = 과거. 시간 축을 X 로 잡고, 움직임 이벤트 썸네일 카드는
// 트랙(회색 가로선) '아래쪽'에 가로로 나열한다. 카드가 겹치면 묶어 개수 배지로
// 표시하고, 탭하면 오른쪽(최신 방향)으로 부채처럼 펼친다(아코디언). 파란 세로선이
// 화면 가운데(현재 시각)에 고정되고, 콘텐츠가 translateX 로 흐른다.
// ── 움직임 감지 리스트 (A-4 전용) ───────────────────────────────────────────
// A-4 의 '움직임 감지' 탭은 시간바를 따라가지 않는다(사용자 지정 2026-08-26:
// "그 움직임감지는 시간바랑 같이 움직이지 말고, 가로 리스트 형태로"). 시간축에
// 얹힌 썸네일 레일(RecordingEventTimeline part="thumbs")은 시간바를 굴리면 같이
// 흐르고 빈 시간대엔 아무것도 없는데, 이건 '언제 무슨 일이 있었나'를 훑는 목록이라
// 이벤트만 순서대로 나열하고 자기 스크롤로만 움직인다. 다른 안(A-1·A-2·A-3)은
// 예전 레일 그대로다.
//
// 한 줄에 넣는 건 셋뿐 — 유형(칩) · 카메라 명 · 날짜 시간(사용자 지정). 유형을
// 칩으로 세운 건 훑을 때 이상 상황(넘어짐·폭행)만 눈에 걸리게 하려는 것으로,
// 썸네일 위 EventKindChip 과 같은 규칙(움직임=무채색, 그 외=빨강)이다.
//
// 방향은 카메라 목록을 따른다(wide) — 같은 영역을 두 탭이 나눠 쓰므로 기준이
// 갈리면 안 된다. 가로 한 줄이면 카드가 옆으로, 세로 2열이면 위아래로 쌓인다.
const MOTION_LIST_MAX = 200;

function MotionEventList({
  playbackMs,
  setPlaybackMs,
  cameraSrc,
  wide = false,
  inset = 20,
}: {
  playbackMs: number | null;
  setPlaybackMs: (v: number | null) => void;
  cameraSrc: string;
  /** 카메라 목록이 가로 한 줄인가(useListLayout 판정). 켜면 카드를 옆으로 나열하고
   *  가로 스크롤, 끄면 위아래로 쌓고 세로 스크롤한다. */
  wide?: boolean;
  /** 세로 목록에서 줄 안쪽 좌우 여백(px). 그 자리 '카메라 목록' 타일의 왼쪽과
   *  같은 값을 넘긴다(사용자 지정 2026-08-26) — 하단 스트립은 20(px-5), 오른쪽
   *  패널들은 16(px-4). 두 탭이 같은 자리에서 번갈아 보이므로 그림이 시작하는
   *  선이 어긋나면 탭을 옮길 때 눈에 걸린다. */
  inset?: number;
}) {
  const eventThumbs = useEventThumbs();
  const dragScroll = useDragScroll();
  // 그 날 0시(로컬). 이벤트의 at 은 자정으로부터의 초라 여기에 더하면 실제 시각이 된다.
  const dayStart = (() => {
    const d = new Date(playbackMs ?? Date.now());
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  // 목록을 어디까지 담을지 — '그 날을 열어 본 시점'에 한 번만 정하고 붙잡는다.
  // playbackMs 를 기준으로 삼으면 항목을 고르는 순간 그 시각이 새 기준이 되어
  // 뒤 이벤트가 통째로 잘리고, 재생 중에도 매 틱 목록이 밀린다. 날짜가 바뀔 때만
  // 다시 잡는다.
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
  // 지금 재생 중인 이벤트 하나. 구간(ms ~ ms+dur)이 서로 겹치므로 각 줄이 따로
  // 판정하면 둘이 같이 켜진다 — 여기서 하나만 골라 한 줄만 켠다.
  const activeMs = useMemo(() => {
    if (playbackMs === null) return null;
    const hit = rows.find(
      (r) => playbackMs >= r.ms && playbackMs < r.ms + r.dur * 1000,
    );
    return hit ? hit.ms : null;
  }, [rows, playbackMs]);

  // 고른 항목을 스크롤 가운데로 — 카메라 목록과 같은 규칙. 컨테이너의 scroll 만
  // 직접 움직인다(scrollIntoView 는 조상까지 굴려 바텀시트 층이 딸려 온다).
  // 좌표는 offsetLeft/offsetTop 으로 잡는다 — 데스크톱 목업은 프레임을 CSS
  // transform 으로 축소해 두는데 rect 는 축소된 값을, scrollLeft 는 축소 전 값을
  // 준다. 둘을 섞으면 엉뚱한 데로 간다.
  const scrollRef = useRef<HTMLDivElement>(null);
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
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!smooth || reduce) {
      write(to);
      return;
    }
    // 320ms · easeOutCubic — 위 큰 영상 전환(300ms)과 결이 같다. 브라우저 기본
    // behavior:"smooth" 는 여기서 안 먹는다(녹화 틱 150ms 리렌더가 매번 취소한다).
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
    // 안 보이는 탭에선 rAF 가 아예 안 돈다 — 그때도 자리는 맞아야 하니 스냅.
    window.setTimeout(() => {
      if (!done) write(to);
    }, DUR + 80);
  };
  // 재생이 감지 지점에 닿으면 그 항목을 가운데로 끌어온다(사용자 지정 2026-08-26:
  // "시간바에서 해당 움직임 감지 지점 오면 가운데로 오게"). 시간바의 현재 시각과
  // 목록이 같은 것을 가리켜야 하니 목록이 따라간다.
  //
  // 탭에 처음 들어온 순간만 즉시 이동이다 — 그때는 이미 가운데 있어야 하는
  // 상태라 미끄러질 이유가 없다. 그 뒤 재생이 다음 이벤트로 넘어갈 때는
  // 부드럽게(320ms) 움직여, 화면이 왜 움직였는지 눈으로 따라갈 수 있게 한다.
  // 항목을 직접 눌렀을 때도 여기로 들어온다(onClick 의 centerOn 과 목적지가
  // 같아 두 번 불러도 결과는 하나다).
  const openedRef = useRef(false);
  useEffect(() => {
    openedRef.current = false;
  }, [wide]);
  useEffect(() => {
    if (activeMs === null) return;
    const first = !openedRef.current;
    openedRef.current = true;
    // 그림이 그려진 뒤에 재야 해서 한 프레임 미룬다. 타이머를 같이 거는 건
    // 화면이 안 보이는 상태(백그라운드 탭·데스크톱 목업 미리보기)에서는 rAF 가
    // 아예 안 돌아서다 — 그때도 자리는 맞아야 한다. 둘 중 먼저 온 하나만 쓴다.
    let ran = false;
    const run = () => {
      if (ran) return;
      ran = true;
      centerOn(activeMs, !first);
    };
    const raf = requestAnimationFrame(run);
    const timer = window.setTimeout(run, 80);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMs, wide]);

  // 유형 칩 — 세로 줄과 가로 카드(썸네일 없는 흰 면)가 같은 걸 쓴다. 예전엔
  // 가로 쪽이 공용 EventCardFace 라 유형이 아예 안 보였다(사용자 지적 2026-08-27:
  // "세로는 칩이 있는데 가로는 칩도 없고 시간만 뜬다").
  // 크기는 카메라 목록 타일 안 이름 라벨과 같은 높이 17 · 글자 10 이고, 라운드도
  // 이 화면 공통 4 다. 이상 상황(넘어짐·폭행)만 빨강 — 썸네일 위 EventKindChip 과
  // 같은 규칙이라 훑을 때 눈이 같은 것에 걸린다. 그림 위가 아니라 흰 바탕에
  // 얹히므로 색만 다르다(회색 바탕 + 진회색).
  const kindChip = (kind: EventKind) => {
    const alert = kind !== "움직임";
    return (
      <span
        className="inline-flex flex-none items-center self-start leading-none"
        style={{
          height: "17px",
          padding: "0 6px",
          // 유형 칩만 완전한 알약이다(사용자 지정 2026-08-31) — 타일·썸네일·시각
          // 라벨의 4px 규칙에서 일부러 빼낸 것으로, 훑을 때 이상 상황(넘어짐·폭행)이
          // 모서리 모양으로도 구분되게 한다.
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 600,
          color: alert ? "#FFFFFF" : "#595959",
          backgroundColor: alert ? "#E2202D" : "#F1F1F1",
        }}
      >
        {kind}
      </span>
    );
  };

  return (
    <div
      ref={scrollRef}
      className={
        wide
          ? // 가로 한 줄 — 카드를 옆으로 나열하고 가로 스크롤. 좌우 여백(px-5)은
            // 스크롤 안쪽 패딩이라 첫/마지막만 20px 띄운다(카메라 목록과 같은 규칙).
            // 위아래 여백은 영역이 갖고 있다(스크롤해도 안 사라지게).
            // 카드 사이 간격은 카메라 목록 타일과 같은 8(gap-2)이다(사용자 지적
            // 2026-08-31: "카메라 목록 썸네일 띄워진거랑 간격이 같은가?"). 12
            // 였는데, 두 탭이 같은 자리에서 번갈아 보이므로 간격이 다르면 탭을
            // 옮길 때 눈에 걸리고, useListLayout 의 폭 계산도 GAP 8 기준이다.
            "relative flex min-h-0 flex-1 items-stretch gap-2 px-5 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : // 세로로 쌓을 자리가 넉넉한 배치(오른쪽 패널 · 세로 2열 스트립)는
            // 카드가 아니라 '구분선으로 나눈 목록'이다(사용자 지정 2026-08-26).
            // 줄끼리 붙여 놓고(gap 없음) 줄마다 아래 선을 그린다.
            // 좌우 여백은 없다(사용자 지정 2026-08-26) — 구분선이 영역 끝에서
            // 끝까지 가야 '목록'으로 읽힌다. 여백은 카드였을 때만 필요했다.
            "relative flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
      {...dragScroll}
    >
      {rows.map((r) => {
        const active = r.ms === activeMs;
        // 가로 카드는 '카메라 목록 타일 한 장' 그 자체다(사용자 지정 2026-08-26:
        // "사이즈를 카메라 목록 썸네일이랑 맞추자"). 글자 칸을 옆에 달았더니 카드
        // 폭이 타일의 두 배(204 vs 114)라 두 탭이 다른 규격으로 보였다. 유형·시각은
        // 그림 위에 얹어 카드 크기가 타일과 정확히 같게 만든다.
        // 세로 목록은 그대로 '썸네일 + 글자' 줄이다 — 폭이 남아 얹을 이유가 없다.
        if (wide) {
          return (
            <button
              key={r.ms}
              data-ms={r.ms}
              type="button"
              onClick={() => {
                setPlaybackMs(r.ms);
                // 이미 활성인 항목을 다시 눌러도 가운데로 와야 한다.
                centerOn(r.ms);
              }}
              className={`relative h-full aspect-video flex-none overflow-hidden text-left${
                // 검정 바탕은 썸네일이 있을 때만 깐다. 썸네일을 못 뽑는 저장
                // 방식(NVR)에선 그 자리에 흰 면이 들어차므로 뒤에 깔 것이 없고,
                // 남겨 두면 라운드 모서리 틈으로 검정이 비친다(사용자 지적
                // 2026-08-26: "카드 뒤에 검정색이 비쳐").
                eventThumbs ? " bg-neutral-900" : ""
              }`}
              // 카메라 목록 타일과 같은 4px — 타일과 나란히 놓고 봐도 같은 규격이다.
              // minWidth 는 날짜·시각이 잘리지 않는 바닥(A4_CARD_MIN_W) — 좁은
              // 화면에서만 걸리고, 그때는 카드가 타일보다 조금 넓어진다.
              style={{ borderRadius: "4px", minWidth: `${A4_CARD_MIN_W}px` }}
            >
              {eventThumbs ? (
                <>
                  {/* 움직이는 GIF 를 그대로 쓰면 한 화면에 수십 장이 동시에
                      디코딩되니 첫 프레임만 그리는 FrozenImage 를 쓴다(목록 타일과
                      같은 이유). */}
                  <FrozenImage
                    src={cameraSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full"
                    style={{ objectFit: "cover" }}
                  />
                  {/* 유형 — 세로 줄·흰 면과 같은 칩이다(사용자 지정 2026-08-27:
                      "세로랑 가로 스타일이 왜 다르냐"). 예전엔 그림 위에서만
                      공용 EventKindChip(9px · 검정 반투명)을 썼는데, 같은 목록의
                      두 배치가 다른 칩을 쓰고 있었다. 왼쪽 위는 카메라 목록 타일의
                      이름 라벨과 같은 자리라 눈이 같은 데를 본다. */}
                  <span
                    className="pointer-events-none absolute"
                    style={{ left: "3px", top: "3px" }}
                  >
                    {kindChip(r.kind)}
                  </span>
                </>
              ) : (
                // 썸네일을 못 뽑는 저장 방식(NVR) — 그림 자리에 흰 면. 담는 건
                // 세로 줄과 똑같이 유형 칩 + 날짜 시간이다(사용자 지정 2026-08-27).
                // 예전엔 공용 EventCardFace 였는데, 그건 제목이 늘 '움직임 감지'라
                // 넘어짐·폭행이 묻히고 날짜도 없었다. 크기는 그대로라 목록 타일과
                // 여전히 같다.
                <div
                  className="flex h-full w-full flex-col justify-center gap-[8px]"
                  style={{
                    backgroundColor: active ? "#F2F7FF" : "#FFFFFF",
                    border: active ? "2px solid #1D6CEB" : "1px solid #D9D9D9",
                    borderRadius: "4px",
                    paddingLeft: "6px",
                    paddingRight: "4px",
                  }}
                >
                  {kindChip(r.kind)}
                  <span
                    suppressHydrationWarning
                    className="whitespace-nowrap leading-none"
                    style={{ fontSize: "12px", color: "#8C8C8C" }}
                  >
                    {formatEventStamp(r.ms)}
                  </span>
                </div>
              )}
              {/* 시각 — 그림 아래쪽 왼쪽. 라벨 서식은 카메라 목록 타일의 이름
                  라벨과 같다(높이 17 · 글자 10 · 검정 55%). 썸네일이 없을 땐 흰
                  카드가 이미 시각을 적고 있어 얹지 않는다. */}
              {eventThumbs && (
                <div
                  suppressHydrationWarning
                  className="absolute inline-flex items-center bg-black/55 text-[12px] font-medium leading-none text-white"
                  style={{
                    left: "3px",
                    bottom: "3px",
                    // 글자 10 → 14 → 12(사용자 지정 2026-08-31) — 64 높이 카드에
                    // 14 는 칩과 합쳐 그림을 너무 덮었다. 높이는 17 그대로다:
                    // 같은 카드 반대쪽 모서리의 유형 칩과 글자·높이가 똑같아진다.
                    // (세로 줄의 날짜·시각은 14 그대로 — 줄이 74 라 여유가 있다.)
                    height: "17px",
                    padding: "0 4px",
                    // 라운드는 이 안에서 하나로 맞춘다(사용자 지정 2026-08-26) —
                    // 타일·썸네일·유형 칩(EventKindChip)이 모두 4px 다.
                    borderRadius: "4px",
                  }}
                >
                  {formatEventStamp(r.ms)}
                </div>
              )}
              {active && eventThumbs && (
                // 고른 카드 — 카메라 목록 타일의 선택 표시와 같은 안쪽 파란 테두리.
                // 바깥에 그리면 카드가 커져 타일과 크기가 어긋난다.
                // 흰 면(NVR)은 자기 테두리가 파래지므로 여기선 안 그린다.
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    boxShadow: "inset 0 0 0 2px #1D6CEB",
                    borderRadius: "4px",
                  }}
                />
              )}
            </button>
          );
        }
        return (
          <button
            key={r.ms}
            data-ms={r.ms}
            type="button"
            onClick={() => {
              setPlaybackMs(r.ms);
              centerOn(r.ms);
            }}
            className="flex flex-none items-center gap-3 text-left"
            style={{
              // 세로는 카드가 아니라 구분선으로 나눈 줄이다. 마지막 줄에도 선을
              // 남긴다 — 목록이 스크롤 중이면 아래가 더 있다는 표시가 되고, 끝까지
              // 왔을 땐 영역 바닥에 붙어 안 보인다.
              //
              // 좌우 여백은 줄이 갖는다(컨테이너가 아니라) — 그래야 썸네일이 카메라
              // 목록 타일과 같은 선에서 시작하고(사용자 지정 2026-08-26), 구분선은
              // 테두리라 그 여백 밖까지 끝에서 끝까지 간다.
              // 줄 높이는 74 로 못 박는다(사용자 지정 2026-08-31). 예전엔 안쪽
              // 여백(8+8)과 썸네일(96×54)이 더해진 값이라 썸네일을 빼는 저장
              // 방식(NVR)에선 줄이 얇아졌다 — 두 경우가 같은 높이여야 한다.
              height: "74px",
              paddingTop: "8px",
              paddingBottom: "8px",
              paddingLeft: `${inset}px`,
              paddingRight: `${inset}px`,
              borderBottom: "1px solid #EBEBEB",
              backgroundColor: active ? "rgba(29,108,235,0.06)" : undefined,
            }}
          >
            {/* 썸네일 — 카메라 목록 타일과 같은 16:9 · 같은 4px 라운드.
                썸네일을 못 뽑는 기기 설정(eventThumbs)에선 아예 빼고 글자만 남긴다 —
                유형·카메라·시각이 이미 다 적혀 있어 빈 회색 박스가 필요 없다. */}
            {eventThumbs && (
              <div
                className="relative flex-none overflow-hidden bg-neutral-900"
                style={{ width: "96px", aspectRatio: "16 / 9", borderRadius: "4px" }}
              >
                <FrozenImage
                  src={cameraSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            {/* 유형(칩) · 날짜 시간 — 카메라 명은 뺐다(사용자 지정 2026-08-26).
                단일 화면이라 어차피 지금 보고 있는 카메라 하나뿐이다. */}
            <div className="flex min-w-0 flex-col justify-center gap-[8px]">
              {kindChip(r.kind)}
              <span
                suppressHydrationWarning
                // 날짜 시간 — 11 → 12 → 14(사용자 지정 2026-08-31). 위 유형 칩(10)보다
                // 커서, 줄에서 먼저 읽히는 건 언제 찍힌 것인가가 된다.
                // 칩과의 간격도 3 → 8(같은 날) — 글자가 커진 만큼 붙어 보였다.
                className="whitespace-nowrap text-[14px] leading-none"
                style={{ color: "#8C8C8C" }}
              >
                {formatEventStamp(r.ms)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// 카드에 찍는 날짜+시각 — 'MM.DD HH:MM:SS'. 위 날짜 줄(연도까지)과 달리 한 줄에
// 들어가야 해서 연도를 뺐다. 목록은 하루치라 연도가 겹칠 일도 없다.
function formatEventStamp(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${formatEventTime(ms)}`;
}

// 시간바 블록 치수(px) — 다채널 RecordingControls 시간바와 같은 값이다.
// 컴포넌트 안에 있던 걸 밖으로 뺐다: 썸네일을 접으면 감지 영역 높이가 딱 BAR_H 가
// 되는데, 그 높이를 부모(motionBlock)가 알아야 해서다.
// 하단 스트립(탭 줄 · 카메라 목록 · 움직임 감지)의 위아래 여백.
// 8 까지 조였다가 12 로 되돌렸다(사용자 지정 2026-08-26: "위아래 8에서 12로").
// 탭 글자 위 여백도 같은 값이라, 글자를 기준으로 위(구분선까지)와 아래(레일까지)가
// 똑같이 이만큼이다.
const STRIP_PAD = 12;

const PAD_TOP = 12; // 시간바 위 여백
const PAD_BOTTOM = 4; // 시간바 아래 여백. 삼각형 제거로 줄여 썸네일을 위로 붙인다.
// 라벨+눈금 영역 높이. 눈금 줄을 17 로 올리면서 아래 빈 공간만큼 같이 줄였다
// (28 → 22, 사용자 지정 2026-08-26) — 그만큼 시간바 띠가 얇아지고 영상이 커진다.
const RAIL_H = 22;
const BAR_H = PAD_TOP + RAIL_H + PAD_BOTTOM; // 시간바 블록 전체 높이(=44)
// 시간바만 놓는 띠(5버튼 아래)의 위아래 여백 — 같은 8 이다(사용자 지정
// 2026-08-26: "위 12 아래 4 말고 둘 다 8"). 아래 스트립 여백(STRIP_PAD)과는
// 따로 둔다 — 스트립은 그 뒤 12 로 올렸고(사용자 지정), 시간바는 8 그대로다.
const BAR_PAD = 8;
// 썸네일이 아래 붙는 경우(both)만 위 12 · 아래 4 인 BAR_H 를 쓴다 — 거긴 바로
// 밑에 썸네일이 이어진다.
const BAR_H_CLOSED = BAR_PAD + RAIL_H + BAR_PAD; // =44


function RecordingEventTimeline({
  playbackMs,
  setPlaybackMs,
  cameraSrc,
  onScrubbingChange,
  part = "both",
}: {
  playbackMs: number | null;
  setPlaybackMs: (
    v: number | null | ((prev: number | null) => number | null),
  ) => void;
  cameraSrc: string;
  onScrubbingChange?: (s: boolean) => void;
  /** 어느 부분을 그릴지 — A-1·A-2 와 같은 규칙이다.
   *   · "bar"    — 시간바만. 5버튼 아래 고정 띠(motionBlock)가 쓴다.
   *   · "thumbs" — 썸네일 레일만. '움직임 감지' 탭 내용이다.
   *   · "both"   — 둘 다(기본). 가로 확대 딤 패널이 한 덩어리로 쓴다.
   *  둘로 갈라도 어긋나지 않는다 — 레일 위치가 양쪽 다 playbackMs 에서 나온다. */
  part?: "both" | "bar" | "thumbs";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 썸네일을 못 뽑는 기기 사양이면 카드에 시각+타이틀만 남긴다(eventThumbs.ts).
  const eventThumbs = useEventThumbs();
  // 썸네일 영역(시간바 아래 남는 공간). 이 높이에 맞춰 썸네일 세로 크기를 유동
  // 조절한다(화면이 짧아지면 잘리지 않게 줄인다). 최대 72(원본), 폭은 16:9 로 연동.
  const thumbAreaRef = useRef<HTMLDivElement>(null);
  // 썸네일 레일 위 여백. '움직임 감지' 탭으로 단독으로 설 때는 카메라 목록 탭의
  // 타일과 같은 자리(위 12 · 아래 12)에서 시작해야 한다 — A-1·A-2 와 같은 규칙.
  // 감지 탭으로 단독으로 설 때는 위아래 여백을 영역(bottomStrip)이 갖고 있으므로
  // 레일 자신은 0 이다 — 두 번 주면 카메라 목록 타일보다 8 씩 더 들어간다.
  const cardTop = part === "thumbs" ? 0 : 4;
  // 시간바 블록 위 여백. 시간바만 놓을 때는 레일과 같은 8, 썸네일이 아래 붙는
  // 경우(both)는 예전대로 12 다. 이 값이 바뀌면 아래 절대배치(현재시각 알약 ·
  // 중앙선)도 같이 따라가야 눈금과 안 어긋난다 — 그래서 좌표를 이 값에서 뽑는다.
  const barPad = part === "bar" ? BAR_PAD : PAD_TOP;
  // 레일 아래 여백도 같은 값 — 카메라 목록 타일(위아래 STRIP_PAD)과 자리를 맞춘다.
  const cardBottom = part === "thumbs" ? 0 : PAD_TOP;
  const [thumbH, setThumbH] = useState(THUMB_MAX_H);
  const updateThumbH = () => {
    const el = thumbAreaRef.current;
    if (!el || el.clientHeight <= 0) return;
    // 남는 영역 높이에서 상하 여백(위 cardTop + 아래 PAD_TOP)을 뺀 값. 일반 48 로 캡.
    const avail = el.clientHeight - (cardTop + cardBottom);
    // '움직임 감지' 탭으로 단독으로 설 때는 상한을 두지 않는다 — 그 영역은
    // 카메라 목록 스트립과 같은 높이로 못 박혀 있으므로(useListLayout), 남는
    // 세로를 그대로 쓰면 썸네일이 목록 타일과 같은 크기가 된다.
    // 예전엔 48(THUMB_MAX_H)로 막혀 있어서, 타일이 그보다 커지는 넓은 기기
    // (750×832 에서 타일 88)에서 감지 쪽만 훨씬 작아 보였다(사용자 지적
    // 2026-08-26: "카메라 목록이랑 사이즈 맞추라고 했잖아").
    // 시간바와 한 덩어리인 경우(both, 가로 딤 패널)는 남는 세로가 그 화면 사정에
    // 달렸으니 예전처럼 상한을 지킨다.
    const capped =
      part === "thumbs" ? avail : Math.min(THUMB_MAX_H, avail);
    setThumbH(Math.max(THUMB_MIN_H, Math.round(capped)));
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
  // 줌 레벨: 픽셀/초 — 기본 8px/sec. 핀치/휠로 조정.
  // 5 → 8(사용자 지정 2026-08-14: "점들 디폴트 간격이 좀 좁은 거 같아").
  // 눈금은 1초마다라 이 값이 곧 점 간격이다 — 점이 4px 이 되면서 5 로는 사이가
  // 1px 밖에 안 남아 선처럼 붙어 보였다. 8 이면 점 4 + 여백 4 로 떨어져 읽힌다.
  // 라벨 간격은 그대로 10초다(niceSeconds 규칙에서 10×8=80 ≥ 50).
  const [pxPerSec, setPxPerSec] = useState(8);
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
      style={{ backgroundColor: TIMEBAR_BG, cursor: "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── 시간바(다채널 RecordingControls 와 동일한 마크업·치수) ── */}
      {part !== "thumbs" && (
      <div
        className="relative flex-none overflow-hidden"
        style={{
          // 아래에 썸네일이 붙는 경우(both)만 아래 여백을 줄인 BAR_H 를 쓴다.
          height: `${part === "both" ? BAR_H : BAR_H_CLOSED}px`,
          paddingTop: `${barPad}px`,
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
          {/* 라벨 — 화면에 보이는 범위만 렌더.
              중앙(현재 시각) 근처에서 작아지며 사라지던 연출은 뺐다 — A-4 만
              (사용자 지정 2026-08-26: "그 동작 없어도 돼"). 가운데 라벨을 가리려던
              것이었는데, 그 자리의 현재시각 표시 자체를 없앤 뒤로는 가릴 게 없다.
              그래서 모든 라벨이 같은 크기·같은 진하기로 흐른다. */}
          {labels.filter(({ secOffset }) => inView(secOffset)).map(({ text, secOffset }) => (
            <span
              key={`L${secOffset}`}
              suppressHydrationWarning
              className="pointer-events-none absolute whitespace-nowrap"
              style={{
                left: `calc(50% + ${xOf(secOffset)}px)`,
                top: "0",
                color: "#A4A4A4",
                transform: "translateX(-50%)",
                fontSize: "10px",
                fontWeight: 500,
                lineHeight: "10px",
              }}
            >
              {text}
            </span>
          ))}
          {/* 눈금 (대/소) — A-2 와 같은 세로 막대다(사용자 지정 2026-08-18:
              "그냥 눈금으로 바꾸자. A-2처럼"). 점 → 이어진 선을 거쳐 여기로 왔다.
              대/소는 색과 '높이'로 가른다: 큰 눈금 8, 작은 눈금 5 (사용자 지정:
              "좀 연한 눈금은 높이 좀 줄이고"). 아래를 맞춰 세우면 짧은 쪽이
              라벨에서 더 떨어져 보이는데, 그게 대/소가 한눈에 갈리는 그림이다.
              화면에 보이는 범위만 렌더한다(수천 개 방지). */}
          {/* 작은 눈금은 막대가 아니라 이어진 선이다(사용자 지정 2026-08-18:
              "눈금말고 선으로 바꾸자"). 눈금이 1초마다라 개수가 수천이고, 이어
              붙이면 어차피 같은 그림이라 보이는 범위를 한 줄로 깐다.
              큰 눈금 막대(18~26)의 아래쪽에 얹혀 바닥선처럼 읽힌다. */}
          {(() => {
            const vis = ticks.filter(({ secOffset }) => inView(secOffset));
            const first = vis[0];
            const last = vis[vis.length - 1];
            if (!first || !last) return null;
            const x0 = xOf(first.secOffset);
            const x1 = xOf(last.secOffset);
            return (
              <div
                className="pointer-events-none absolute rounded-[1px]"
                style={{
                  left: `calc(50% + ${x0}px)`,
                  // 선을 조금 두껍게(2 → 3). 자리는 23 → 17 로 올렸다 — 라벨과
                  // 눈금 사이가 13 이나 비어 보였다(사용자 지정 2026-08-26:
                  // "시간이랑 바랑 간격 좀 줄여도 되지 않을까?"). 이제 7 이다.
                  top: "17px",
                  width: `${x1 - x0 + 2}px`,
                  height: "3px",
                  backgroundColor: "rgba(173,173,173,0.7)",
                }}
              />
            );
          })()}
          {/* 큰 눈금 — 선과 같은 굵기(3px)의 점. 솟지 않고 선 안에서 색만
              달라진다(사용자 지정 2026-08-18). 보이는 범위만 렌더. */}
          {ticks
            .filter(({ secOffset, isMajor }) => isMajor && inView(secOffset))
            .map(({ secOffset }) => (
              <div
                key={`T${secOffset}`}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: `calc(50% + ${xOf(secOffset)}px)`,
                  // 점 지름 = 선 두께(사용자 지정 2026-08-18: "원은 선 두께랑
                  // 맞춰야지"). 선과 같은 띠(17~20) 안에 들어가 색만 달라진다.
                  top: "17px",
                  width: "3px",
                  height: "3px",
                  backgroundColor: "#353535",
                }}
              />
            ))}
          {/* 움직임이 감지된 시각 — 빨간 세로선(사용자 요청 2026-08-14).
              눈금과 같은 레일에 있어 같이 흐른다. 크기는 작은 눈금과 똑같이
              4×4 점 · top 20 이다(사용자 지정 2026-08-14) — 모양·크기로
              구분하지 않고 색으로만 구분한다.
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
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `calc(50% + ${xOf(c.secOffset)}px)`,
                // 큰 눈금과 같은 규격(3px 점)에 색만 #F59E0B.
                top: "17px",
                width: "3px",
                height: "3px",
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
            // 좌우 페이드 폭 — 39% 는 너무 넓어 눈금이 가운데만 또렷했다.
            // 20% 로 줄인다(사용자 지정 2026-08-14).
            width: "20%",
            background:
              `linear-gradient(to left, rgba(255,255,255,0) 0%, ${TIMEBAR_BG} 89.9%)`,
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            right: 0,
            top: 0,
            bottom: 0,
            // 좌우 페이드 폭 — 39% 는 너무 넓어 눈금이 가운데만 또렷했다.
            // 20% 로 줄인다(사용자 지정 2026-08-14).
            width: "20%",
            background:
              `linear-gradient(to right, rgba(255,255,255,0) 0%, ${TIMEBAR_BG} 89.9%)`,
          }}
        />
        {/* 중앙 현재시각 라벨은 없앴다 — A-4 만(사용자 지정 2026-08-26: "시간바에
            현재시간 표시하는 거 빼도 될 것 같다"). 같은 값이 바로 위 날짜 줄
            한가운데(검정 알약)에 이미 떠 있다. */}
        {/* 중앙 고정 현재 시각 선 — 라벨이 빠진 만큼 위로 늘려 작은 시각 글자
            윗변(레일 top = barPad)에서 시작한다(사용자 지정 2026-08-26).
            아래 끝은 그대로 barPad+29 — 눈금(barPad+18~26)보다 조금 더 내려온다. */}
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-[1px]"
          style={{
            top: `${barPad}px`,
            width: "2px",
            // 눈금 줄(17~20)보다 3 더 내려오는 길이 — 라벨 윗변에서 시작한다.
            height: "23px",
            backgroundColor: "#111111",
          }}
        />
        {/* 날짜·시간 선택 버튼은 여기 없다 — 위 '녹화 + 날짜 + 캡처' 줄 맨 왼쪽으로
            옮겼다(사용자 지정 2026-08-20: "시간바 왼쪽에 달력 아이콘 그거 캡쳐
            아이콘 있는 영역에 왼쪽으로 넣어줘"). 시간을 고르는 입구가 날짜 글자
            바로 옆에 모이고, 시간바는 눈금만 남아 왼쪽 끝까지 흐른다.
            다채널 시간바(RecordingControls)는 그대로다 — 거긴 그 줄이 없다. */}
      </div>
      )}

      {/* ── 썸네일 레일 — '움직임 감지' 탭 내용(A-2 와 같은 사양, 사용자 지정
          2026-08-25). 예전엔 여기 대신 세로 리스트(MotionEventList)를 썼는데,
          세 안의 감지 탭을 A-2 기준으로 통일하면서 레일로 되돌렸다.
          카드 높이는 영역에서 나오고(thumbH) 위·아래 여백은 카메라 목록 타일과
          같은 12·12 라, 탭을 바꿔도 그림이 같은 자리에 있다. ── */}
      {part !== "bar" && (
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
          {/* 움직임 이벤트 썸네일 — 위치마다 대표 카드 하나(겹침·묶음 배지 없음).
              탭하면 그 시각으로 이동한다. */}
          {clusters.filter((c) => inView(c.secOffset)).map((cluster) => (
            <div
              key={`E${cluster.key}`}
              data-event-ms={cluster.ms}
              className="absolute flex items-start"
              style={{
                left: `calc(50% + ${xOf(cluster.secOffset)}px)`,
                top: `${cardTop}px`,
                bottom: `${cardBottom}px`,
                // 카드의 '왼쪽 끝'이 자기 시각에 온다(가운데 정렬 아님) — 탭하면
                // 그 시각이 중앙선으로 오므로 결과적으로 왼쪽 끝이 선에 맞는다.
                pointerEvents: "auto",
                cursor: "pointer",
              }}
            >
              <div
                className={`relative overflow-hidden rounded-md ${eventThumbs ? "bg-neutral-900" : ""}`}
                style={{
                  height: `${thumbH}px`,
                  aspectRatio: "16 / 9",
                  // 지금 재생 중인 이벤트면 파란 테두리(썸네일 끈 사양과 같은 규칙).
                  ...(eventThumbs && isActiveEvent(cluster.ms, cluster.durSec)
                    ? { border: "2px solid #1D6CEB" }
                    : null),
                }}
              >
                {eventThumbs && <EventKindChip kind={cluster.kind} />}
                {eventThumbs ? (
                  <FrozenImage
                    src={cameraSrc}
                    alt=""
                    className="h-full w-full"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <EventCardFace
                    ms={cluster.ms}
                    active={isActiveEvent(cluster.ms, cluster.durSec)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

// 움직임 감지 '리스트'(MotionEventList)는 없앴다 — 감지 표현을 A-2 에 맞추면서
// 가로 썸네일 레일(RecordingEventTimeline part="thumbs") · 세로 타임라인
// (SideEventTimeline) 둘로 정리됐다(사용자 지정 2026-08-25). 리스트가 필요하면
// 커밋 이력에서 되살릴 것.

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

// '● 실시간/녹화영상' 알약 — 딤 좌측 상단에 놓는다(단일·다채널·가로 공통).
// 규격은 가로 딤이 쓰는 것과 같다(LandscapeVideo 의 modePill): 높이 26 ·
// 글자 14 · 회색 40%, 점은 실시간 빨강 / 녹화 흰색.
// 블러는 뺐다(사용자 지정 2026-09-03: "블러를 빼") — A-4 세로 딤에 얹히는 것은
// 알약도 원 버튼도 다 안 쓴다. 가로 딤(LandscapeVideo)은 아직 그대로라
// 세로/가로가 이 한 가지만 다르다.
// 세로에도 넣은 건 사용자 지정 2026-08-31("딤에다가 좌측 상단에 동일하게").
function ModePill({ mode }: { mode: "live" | "recording" }) {
  return (
    <span
      className="rounded-full"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "26px",
        padding: "0 10px",
        fontSize: "14px",
        fontWeight: 700,
        lineHeight: "14px",
        color: "#FFFFFF",
        backgroundColor: DIM_TINT,
        textShadow: "0 0 4px rgba(0,0,0,0.6)",
      }}
    >
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
      {mode === "recording" ? "녹화영상" : "실시간"}
    </span>
  );
}

// 상단 바(장소명 + 실시간/녹화영상) — 다채널·확대뷰·클라우드 이벤트 화면이
// 같은 것을 쓴다. 예전엔 화면마다 같은 마크업을 따로 갖고 있었는데, 클라우드
// 화면에도 이 바를 넣게 되면서(사용자 지정 2026-09-01) 사본이 셋이 될 참이라
// 하나로 합쳤다. 제목을 누르면 하는 일만 화면마다 다르다(안 고르기 / 뒤로).
function AppHeader({
  onTitleClick,
  mode,
  setMode,
  chromeVisible,
}: {
  onTitleClick: () => void;
  mode: "live" | "recording";
  setMode: (m: "live" | "recording") => void;
  chromeVisible: boolean;
}) {
  // 660 컬럼(M01_CLAMP_BP 이상)에서는 컬럼이 이미 좌우 여백을 갖고 있다 —
  // 여기서 px-5 를 또 주면 글자 줄만 20 씩 들어가 영상·시간바와 어긋난다.
  const flush = useDeviceWidth() >= M01_CLAMP_BP;
  return (
    // 시스템 바를 끄는 몰입 모드에선 헤더 위 16px 여백도 함께 제거해 위로 붙인다.
    <header
      className={`flex flex-none items-center ${flush ? "px-0" : "px-5"}`}
      style={{ height: "56px", marginTop: chromeVisible ? "16px" : "0px" }}
    >
      <div className="flex w-full items-center justify-between">
        {/* 장소명 + 지점명을 한 버튼으로 묶는다 — 첫 줄만 버튼이면 아래
            지점명이나 화살표 옆 빈 곳을 눌러도 안 먹는다(사용자 지적). */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onTitleClick}
            className="flex flex-col items-start gap-[2px] pb-1 pr-3 text-left"
          >
            <span className="flex items-center gap-1.5 text-[18px] font-bold leading-none text-neutral-900">
              {VARIANT_LABEL["a4m01"]}
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
  noTimeline = false,
  onPlayerAction,
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
  /** 시간바만 뺀다(플레이어 버튼·날짜 줄은 그대로). 다채널 녹화에서 쓴다
   *  — 사용자 지정 2026-08-19: "다채널 녹화에서는 시간바를 좀 빼야겠어".
   *  playerOnly 와 다르다: 그쪽은 날짜 줄까지 걷어 화면 한가운데에 버튼만
   *  얹는 가로 배치용이다. */
  noTimeline?: boolean;
  /** 5버튼 중 아무거나 눌렀을 때. 가로 딤에서 '5버튼 + 시간바'만 남기려고
   *  안이 쓴다(사용자 지정 2026-08-14). */
  onPlayerAction?: () => void;
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
  // 줌 레벨: 픽셀/초 — 핀치 너비 비율로 연속적으로 조정.
  // 6 → 8(사용자 지정 2026-08-14). 눈금은 1초마다라 이 값이 곧 점 간격이다.
  // 라벨은 그대로 10초 간격(10×8=80 ≥ 60).
  const [pxPerSec, setPxPerSec] = useState(8);
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

  // 중앙 고정 현재 시각 알약. 딤 위(overlay)에서는 이 알약을 시간바 바깥에
  // 형제로 내보낸다 — 시간바에 좌우 페이드용 mask 가 걸려 있어서, 그 안에
  // 있으면 backdrop-filter 가 마스크 안쪽만 배경으로 삼아 블러가 사실상
  // 안 걸린다(사용자 지적 2026-08-14: "그 배경도 블러된 거 맞아?").
  // 마스크·필터·opacity 가 걸린 조상은 backdrop-root 가 되기 때문이다.
  // overlay 에선 시간바가 이 컴포넌트의 첫 자식이라 top 6 이 그대로 맞는다.
  // 흰 바탕(세로)은 블러를 안 쓰므로 원래 자리에 그대로 둔다 — 밖으로
  // 빼면 위에 있는 날짜 줄·플레이어 버튼 높이만큼 어긋난다.
  const centerPill = (
    <>
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
          height: "22px",
          // 딤 위(가로)는 가로 딤 버튼들과 같은 값 하나를 그대로 쓴다 —
          // #666666 40% + blur(20) + 테두리 없음 + 흰 글자 + 같은 그림자.
          // (세로 딤은 블러를 뺐다 — ModePill 주석 참고. 가로는 안 건드렸다.)
          // 흰 바탕(세로·사이드 패널)은 흰색 70% + 어두운 글자로 되돌렸다
          // (사용자 지정 2026-08-14) — 거긴 달력·캡처 버튼도 흰 원이라
          // 어두운 알약만 튀었다.
          color: overlay ? "#FFFFFF" : "#353535",
          // 흰 바탕(세로)에서는 배경을 안 깐다(사용자 지정 2026-08-18) — 단일
          // 시간바와 같은 규칙이다. 딤 위(가로)는 영상이 뒤에 있어 그대로 둔다.
          backgroundColor: overlay ? DIM_TINT : "transparent",
          ...(overlay
            ? {
                // 버튼 규격을 따라간다면 끝까지 따라간다(사용자 지정
                // 2026-08-14: "버튼이랑 같은 스타일할 꺼면 똑같이 가").
                // 원 버튼 아이콘이 쓰는 그 그림자 — 가운데에서 퍼지는
                // 0 0 4px 검정 60%. 글자라 drop-shadow 대신 textShadow 다.
                textShadow: "0 0 4px rgba(0,0,0,0.6)",
              }
            : null),
          fontSize: "13px",
          fontWeight: 700,
          lineHeight: "13px",
          padding: "0 10px",
          verticalAlign: "top",
        }}
      >
        {centerLabel}
      </span>
    </div>
    </>
  );
  return (
    <div className="relative flex flex-col">
      {/* 녹화 + 날짜 — 가로 딤(overlay)에선 안 그린다. LandscapeVideo 가 같은
          정보를 딤에 맞춘 색으로 이미 얹고 있어서 칩 줄이 두 번 겹친다. */}
      {!overlay && !playerOnly && (
      <div
        className="relative flex items-center px-5"
        style={{ height: "48px", gap: "8px" }}
      >
        {/* 녹화영상 배지는 뺐다 — A-4 만(사용자 지정 2026-08-26).
            날짜·시각은 줄 한가운데고, 날짜를 고르는 입구는 단일 화면과 같은
            왼쪽 달력 버튼이다(사용자 지정 2026-08-26: "화살표 빼고 왼쪽에 달력
            버튼 넣어줘, 단일처럼"). 규격도 단일과 같은 28 원 + 아이콘 24. */}
        <button
          type="button"
          aria-label="날짜, 시간 선택"
          onClick={onOpenDateTime}
          className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full border border-neutral-300"
        >
          <img src={`${BASE}/time.svg`} alt="" className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onOpenDateTime}
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0 text-[14px] font-medium leading-none"
          style={{
            // 검정 50% 알약 — 흰 줄 위에서도 시각이 한 덩어리로 읽힌다
            // (사용자 지정 2026-08-26: "알약 형태로 블랙 50%로 둘러줘").
            height: "26px",
            padding: "0 10px",
            borderRadius: "9999px",
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "#FFFFFF",
            whiteSpace: "nowrap" as const,
          }}
        >
          {/* 화살표는 뺐다 — A-4 만(사용자 지정 2026-08-26). 날짜를 고르는
              입구가 왼쪽 달력 버튼으로 돌아와서 같은 말을 두 번 하게 됐다.
              글자는 그대로 눌러도 시트가 열린다. */}
          <span suppressHydrationWarning>{labelDate}</span>
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
          // 플레이어 버튼 줄은 흰색 그대로 — 회색으로 바꾼 건 시간바 영역뿐이다.
          backgroundColor: overlay ? "transparent" : "#FFFFFF",
          opacity: overlay && scrubbing ? 0 : 1,
          pointerEvents: overlay && scrubbing ? "none" : undefined,
        }}
        // 다섯 개 중 뭘 눌렀든 한 곳에서 받는다 — 버튼마다 붙이면 하나
        // 빠뜨리기 쉽다. capture 라 각 버튼의 onClick 보다 먼저 온다.
        onClickCapture={onPlayerAction}
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
      {!playerOnly && !noTimeline && (
      <>
      {/* 타임라인 */}
      <div
        ref={timelineRef}
        className="relative flex flex-col overflow-hidden touch-pan-y select-none"
        style={{
          backgroundColor: overlay ? "transparent" : TIMEBAR_BG,
          // 좌우 페이드 — 흰 배경일 땐 흰 그라데이션 두 장으로 덮지만, 배경이
          // 없는 딤 위에선 덮을 색이 없다. 대신 영역을 마스크로 깎는다(A-1 동일).
          ...(overlay
            ? {
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 2%, #000 20%, #000 80%, transparent 98%)",
                maskImage:
                  "linear-gradient(to right, transparent 2%, #000 20%, #000 80%, transparent 98%)",
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
          {/* 눈금 (대/소) — 세로 시간바와 같은 세로 막대(사용자 지정 2026-08-18:
              "A-2처럼", "연한 눈금은 높이 좀 줄이고"). 큰 8 · 작은 5, 아래 끝을
              맞추고 위로 자란다. 딤 위(가로)는 큰 눈금이 흰색, 작은 눈금은 뒤
              영상에 묻히도록 살짝 투명한 회색이다. */}
          {/* 작은 눈금 → 이어진 선(세로 시간바와 같은 규칙, 사용자 지정 2026-08-18). */}
          {ticks.length > 0 && (
            <div
              className="pointer-events-none absolute rounded-[1px]"
              style={{
                left: `calc(50% + ${ticks[0]!.secOffset * pxPerSec}px)`,
                top: "23px",
                width: `${(ticks[ticks.length - 1]!.secOffset - ticks[0]!.secOffset) * pxPerSec + 2}px`,
                height: "3px",
                backgroundColor: overlay
                  ? "rgba(153,153,153,0.7)"
                  : "rgba(173,173,173,0.7)",
              }}
            />
          )}
          {/* 큰 눈금 — 선과 같은 굵기(3px)의 점 */}
          {ticks.filter(({ isMajor }) => isMajor).map(({ secOffset }) => (
            <div
              key={`T${secOffset}`}
              className="absolute rounded-full"
              style={{
                left: `calc(50% + ${secOffset * pxPerSec}px)`,
                top: "23px",
                width: "3px",
                height: "3px",
                backgroundColor: overlay ? "#FFFFFF" : "#353535",
              }}
            />
          ))}
          {/* 감지 표시 — 작은 눈금과 같은 규격(4×4 점, top 20)에 색만 #F59E0B.
              세로 다채널에서는 안 그린다(사용자 지정 2026-08-18: "A-3안 세로 녹화
              다채널에 시간바에 노란색빼줘"). 다채널은 어느 카메라의 감지인지
              가릴 수 없어 점만 늘어놓는 셈이었다. 가로 딤에서는 그대로 둔다. */}
          {overlay && motionMarks.map((secOffset, i) => (
            <div
              key={`M${i}`}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `calc(50% + ${secOffset * pxPerSec}px)`,
                // 큰 눈금과 같은 규격(3px 점)에 색만 #F59E0B.
                top: "23px",
                width: "3px",
                height: "3px",
                backgroundColor: "#F59E0B",
              }}
            />
          ))}
        </div>
        {/* 날짜·시간 선택 — 원래 단일 채널 시간바에서 그대로 가져온 것이다
            (사용자 지정 2026-08-18: "A-3세로 다채널에서, 단일채널과 동일하게
            시간바 왼쪽에 달력 아이콘 넣어주고, 구분선이랑 똑같이"). 지금은 단일
            쪽이 이 버튼을 위 날짜 줄로 옮겨서(2026-08-20) 둘이 갈렸다 — 그때
            지정은 단일 화면만이었다. 여긴 그대로 시간바에 남긴다.
            규격은 옮기기 전 단일과 같다: 34 원 + 흰 배경 +
            neutral-300 테두리, 아이콘 24, 왼쪽 20, 오른쪽에 1×16 #EBEBEB 구분선.
            감싼 층 배경은 시간바와 같은 색이라 아래로 흐르는 눈금을 가려 준다.
            딤 위(가로)에선 안 그린다 — 거긴 딤 아이콘 줄이 같은 일을 한다. */}
        {!overlay && onOpenDateTime && (
          <div
            className="absolute z-20 flex items-center"
            style={{
              left: "20px",
              top: `${PAD_TOP + (RAIL_H - 34) / 2}px`,
              height: "34px",
              gap: "12px",
              backgroundColor: TIMEBAR_BG,
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
              style={{ width: "1px", height: "16px", backgroundColor: "#EBEBEB" }}
            />
          </div>
        )}
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
            // 좌우 페이드 폭 — 39% 는 너무 넓어 눈금이 가운데만 또렷했다.
            // 20% 로 줄인다(사용자 지정 2026-08-14).
            width: "20%",
            background:
              `linear-gradient(to left, rgba(255,255,255,0) 0%, ${TIMEBAR_BG} 89.9%)`,
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{
            right: 0,
            top: 0,
            bottom: 0,
            // 좌우 페이드 폭 — 39% 는 너무 넓어 눈금이 가운데만 또렷했다.
            // 20% 로 줄인다(사용자 지정 2026-08-14).
            width: "20%",
            background:
              `linear-gradient(to right, rgba(255,255,255,0) 0%, ${TIMEBAR_BG} 89.9%)`,
          }}
        />
        </>
        )}
        {!overlay && centerPill}
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
      {overlay && centerPill}
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
        // 가로 딤 위 버튼은 테두리 없이 #666666 50% + 흰 아이콘(사용자 지정 2026-08-14).
        // #2B2B2B → #4A4A4A → #666666 으로 색을 올려 왔다(투명도가 아니라 색).
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
            ? DIM_TINT_ACTIVE
            : DIM_TINT
          : active
            ? "#F2F2F2"
            : "#FFFFFF",
        // 뒤 영상을 흐리던 blur(20) 은 A-4 에서 뺐다(사용자 지정 2026-09-03:
        // "블러를 빼"). 원래는 반투명 회색만으론 영상 무늬가 비쳐 아이콘이
        // 어수선하다고 넣었던 값이다(2026-08-14) — 아이콘 그림자와 딤 60% 가
        // 대비를 받쳐 준다. 다른 안(LandscapeVideo 기본값)은 그대로 흐린다.
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

// ── 가로 확대 화면의 오른쪽 세로 패널 ──────────────────────────────────────
// 딤 왼쪽 아래 아이콘 두 개가 연다(사용자 지정 2026-08-18: "메뉴는 누르면 카메라
// 목록이 오른쪽 패널로 나오고, 움직임감지 버튼 누르면 움직임감지 목록이 오른쪽
// 패널에서 나오게"). A-1 의 같은 패널과 결이 같다 — 다만 거긴 버튼 하나로 열고
// 패널 안 탭으로 갈아타는데, A-3 은 버튼 두 개가 각자 자기 탭으로 바로 연다.
//
// 열면 영상을 밀고 옆에 선다(덮지 않는다). 닫기는 패널 안 X 버튼, 또는 열려 있는
// 쪽 아이콘을 한 번 더 누르기.
//
// 내용은 세로 화면과 같은 규칙이다: 목록은 1열(오른쪽) 또는 가로 한 줄(아래),
// 감지는 아래 판이면 가로 시간바 + 썸네일, 오른쪽 패널이면 세로 타임라인
// (A-1·A-2 와 같다 — 사용자 지정 2026-08-25).
/** 패널 내용이 기기 오른쪽 모서리에서 떨어지는 거리 — 딤 아이콘과 같은 값. */
const LS_PANEL_PAD = 16;
function LandscapeSidePanel({
  position = "right",
  contentWidth = SIDE_PANEL_W,
  open,
  tab,
  onTab,
  mode,
  selectedIndex,
  onSelect,
  playbackMs,
  setPlaybackMs,
  onScrubbingChange,
  edge,
  onClose,
}: {
  /** 패널 전체 폭(px) — 화면 폭의 1/3 을 부모가 재서 넘긴다. 바깥 여백(extra)도
   *  이 안에 포함된다: 흰 판이 화면에서 차지하는 몫이 곧 이 값이다. */
  contentWidth?: number;
  /** 어느 변에서 나오는가. 세로로 긴 화면은 "bottom" — 오른쪽에서 내면 영상
   *  폭이 크게 깎인다(사용자 지정 2026-08-18). 판정은 부모(PANEL_BOTTOM_RATIO). */
  position?: "right" | "bottom";
  /** 열림/닫힘 — 폭(오른쪽) 또는 높이(아래)를 0 ↔ 제 크기로 애니메이션한다
   *  (사용자 지적 2026-08-18:
   *  "오른쪽 패널 나올때 너무 띡 띡 나오는거 아니야?"). 붙였다 뗐다 하면
   *  영상이 튀듯 밀린다. 폭을 굴리면 영상도 같이 부드럽게 밀린다. */
  open: boolean;
  tab: "list" | "motion";
  onTab: (t: "list" | "motion") => void;
  mode: "live" | "recording";
  /** 지금 보고 있는 카메라(단일). 다채널이면 null — 감지 탭은 그때 안 뜬다. */
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  playbackMs: number | null;
  /** 감지 타임라인이 스크럽으로 값을 굴리므로 갱신 함수 형태도 받는다. */
  setPlaybackMs: (
    v: number | null | ((prev: number | null) => number | null),
  ) => void;
  /** 타임라인을 끌고 있는 동안 딤 UI 를 걷기 위한 신호(세로와 같은 사양). */
  onScrubbingChange?: (s: boolean) => void;
  /** 오른쪽 모서리까지의 총 거리(딤 아이콘과 같은 값). 패널 안 여백을 뺀 만큼만
   *  바깥에 더 붙인다 — 안 빼면 여백이 두 번 들어간다. */
  edge: number;
  onClose: () => void;
}) {
  const extra = Math.max(0, edge - LS_PANEL_PAD);
  // 감지 탭은 녹화 + 단일에서만. 실시간엔 지나간 이벤트가 없고, 다채널은 어느
  // 카메라 기준인지 모호하다(예전에 썸네일이 0번 카메라로 나오던 그 문제).
  const canMotion = mode === "recording" && selectedIndex !== null;
  const showMotion = tab === "motion" && canMotion;
  const cam = CAMERAS[selectedIndex ?? 0];
  // 전체 폭은 부모가 준 값 그대로다. 바깥 여백(extra)은 이 안에서 빠지므로
  // 타일이 쓰는 폭은 full − extra 다.
  const full = contentWidth;
  const bottom = position === "bottom";
  return (
    <div
      className="flex min-h-0 flex-none flex-col overflow-hidden bg-white"
      style={
        bottom
          ? {
              // 아래에서 나오는 판 — 바텀시트와 같은 결: 윗변만 둥글게, 높이 고정.
              width: "100%",
              height: open ? `${PANEL_BOTTOM_H}px` : "0px",
              transition: "height 240ms cubic-bezier(0.22, 1, 0.36, 1)",
              borderTop: open ? "1px solid #EBEBEB" : "none",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
            }
          : {
              // 바깥은 폭만 굴린다 — 안쪽은 제 폭 그대로라 글자가 눌리지 않는다.
              width: open ? `${full}px` : "0px",
              transition: "width 240ms cubic-bezier(0.22, 1, 0.36, 1)",
              borderLeft: open ? "1px solid #EBEBEB" : "none",
              // 왼쪽만 둥글게 — 영상 쪽에서 흰 판이 밀고 들어오는 모양(A-1 동일).
              borderTopLeftRadius: "10px",
              borderBottomLeftRadius: "10px",
            }
      }
    >
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={
        bottom
          ? { width: "100%", height: `${PANEL_BOTTOM_H}px` }
          : { width: `${full}px`, paddingRight: `${extra}px` }
      }
    >
      {/* 탭 + 닫기 — 1080+ 패널과 같은 생김새(활성 검정 + 밑줄). */}
      <div
        className="flex flex-none items-center justify-between"
        style={{ height: "48px", padding: "0 16px" }}
      >
        <div className="flex items-center" style={{ gap: "20px" }}>
          {(
            [
              { key: "list", label: "카메라 목록" },
              ...(canMotion
                ? [{ key: "motion", label: "움직임 감지" } as const]
                : []),
            ] as { key: "list" | "motion"; label: string }[]
          ).map((t) => {
            const active = (showMotion ? "motion" : "list") === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onTab(t.key)}
                className="relative text-[15px] font-bold leading-none"
                style={{ color: active ? "#262626" : "#A4A4A4" }}
              >
                {t.label}
                {active && (
                  <span
                    className="absolute left-0 right-0"
                    style={{
                      bottom: "-10px",
                      height: "2px",
                      backgroundColor: "#262626",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex h-6 w-6 flex-none items-center justify-center"
        >
          <img src={`${BASE}/close.svg`} alt="" className="h-6 w-6" />
        </button>
      </div>
      {showMotion ? (
        // 아래 판(낮고 넓다)은 가로 스크롤 카드, 오른쪽 패널(좁고 길다)은 세로
        // 구분선 목록 — 세로 화면의 감지 탭과 같은 규칙이다(사용자 지정
        // 2026-08-26: 아래 판도 타임라인 말고 가로 스크롤로). 시간바는 딤의
        // 재생 줄에 이미 있어서 판에는 안 넣는다.
        bottom ? (
          // 위아래 여백은 세로 화면 스트립과 같은 12 — 판 높이에서 이만큼 빼면
          // 카드가 세로 화면과 같은 크기(TILE_MIN_H)가 된다.
          <div
            className="flex min-h-0 flex-1 flex-col"
            style={{ paddingTop: "12px", paddingBottom: "12px" }}
          >
            <MotionEventList
              playbackMs={playbackMs}
              setPlaybackMs={setPlaybackMs}
              cameraSrc={cam.src}
                  wide
            />
          </div>
        ) : (
          <MotionEventList
            playbackMs={playbackMs}
            setPlaybackMs={setPlaybackMs}
            cameraSrc={cam.src}
              // 이 패널의 카메라 목록은 좌우 16(px-4)이다.
            inset={16}
          />
        )
      ) : bottom ? (
        // 아래 판의 카메라 목록 — 세로 화면 하단 스트립과 같은 가로 한 줄이다.
        // 타일은 행 높이를 채우고(h-full) 16:9, 좌우 여백은 스크롤 안쪽 패딩.
        // 위아래 12 — 감지 탭 카드와 같은 여백이라 두 탭 타일 높이가 같다.
        <div
          className="flex min-h-0 flex-1 items-stretch gap-2 overflow-x-auto overflow-y-hidden px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: "12px", paddingBottom: "12px" }}
        >
          {CAMERAS.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onSelect(i)}
              className="relative h-full aspect-video flex-none overflow-hidden bg-neutral-900"
              style={{ borderRadius: "4px" }}
            >
              <CameraFeed label={c.label} src={c.src} />
              {/* 고른 카메라 표시 — 세로 목록과 같은 그림(사용자 지정 2026-08-19:
                  "목록 누르면 세로처럼, 파란색 테두리랑 그 움직이는 아이콘").
                  어둡게 깔고 파란 테두리 + 재생 중 아이콘. */}
              {i === selectedIndex && (
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
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
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
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CAMERAS.map((c, i) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onSelect(i)}
              className="relative aspect-video w-full flex-none overflow-hidden bg-neutral-900"
              style={{ borderRadius: "4px" }}
            >
              <CameraFeed label={c.label} src={c.src} />
              {/* 고른 카메라 표시 — 세로 목록과 같은 그림(사용자 지정 2026-08-19:
                  "목록 누르면 세로처럼, 파란색 테두리랑 그 움직이는 아이콘").
                  어둡게 깔고 파란 테두리 + 재생 중 아이콘. */}
              {i === selectedIndex && (
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
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
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
      )}
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
