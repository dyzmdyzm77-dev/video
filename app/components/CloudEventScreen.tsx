"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { BASE } from "../basePath";
import DateTimePickerSheet from "./DateTimePickerSheet";
import {
  BUTTON,
  COLOR,
  FILTER_CHIP,
  PRIMITIVE,
  RADIUS,
  SEARCH_INPUT,
  SPACE,
  TYPE,
} from "./designTokens";
import EventKindChip from "./EventKindChip";
import ModeChipToggle from "./ModeChipToggle";
import OptionSheet from "./OptionSheet";
import { EVENT_KINDS, TIMELINE_EVENTS, type EventKind } from "./timelineEvents";

// ============================================================================
// 클라우드 — 녹화로 들어가면 나오는 '오늘 이벤트 내역' 화면
// ============================================================================
// NVR 은 예전 그대로 '날짜, 시간 선택' 바텀시트(날짜·시·분 휠)로 들어간다.
// 클라우드는 영상이 서버에 있어 이벤트 목록을 먼저 뽑아 줄 수 있으므로, 시각을
// 찍어 들어가는 대신 오늘 발생한 이벤트를 쭉 보여 주고 고르게 한다(사용자 사양
// 2026-08-21).
//
// 시트가 아니라 '화면'이다 — 영상 위에 덮이는 게 아니라 영상 자리를 대신한다.
// 그래서 딤도 슬라이드 애니메이션도 없고, 안의 콘텐츠 컬럼 안에서 세로를 다
// 차지한다. 하단 탭바(홈·경비·영상·전체)는 이 화면 바깥의 형제라 그대로 남는다.
//
// 상단 바 아래에 날짜·시각 줄은 두지 않는다(사용자 지정 2026-09-02: "그 상단바
// 아래쪽에 그 날짜 시간좀 빼"). 날짜를 고르는 자리는 아래 필터로 내려갔다 —
// '날짜·시간'을 누르면 예전 그 '날짜, 시간 선택' 시트가 그대로 뜬다. 상단 바를
// 안 넘기는 안(A-1)만 그 자리에 LIVE/녹화 토글이 남는다. 돌아가는 길은 그
// 토글(또는 상단 바의 '실시간') 하나다 — 뒤로가기 화살표는 따로 두지 않는다.
//
// 네 안(A-1·A-2·A-3·B)이 이 하나를 같이 쓴다. 진입 화면이 안마다 다르게 보이면
// 안끼리 비교가 안 되므로, 안에 두지 않고 여기 공유 컴포넌트로 뒀다.
//
// 필터는 넷 — 계약처 · 카메라 · 날짜·시간 · 감지유형 (셋으로 시작했고 —
// 사용자 지정 2026-09-02: "필터가 일단 카메라 선택이 있어야하고, 날짜 시간,
// 감지유형 이렇게야" — 계약처를 카메라 앞에 더했다, 2026-09-03: "카메라 앞에
// 계약처 필터도 넣어줘"). 예전의 시간대(새벽·오전·오후·저녁) 칩은
// '날짜·시간'이 대신해 뺐다.
// 계약처가 맨 앞인 건 실제 관계가 계약처 > 카메라라서다 — 넓은 것에서 좁은
// 것으로 내려가는 순서로 읽힌다.
// 셋 다 한 줄에 칩으로 서고, 누르면 시트가 떠서 고른다(사용자 지정 2026-09-02:
// "필터 한줄로 하는거 어때? 칩 형태에 그 화살표 붙은거 ... 그걸로 선택하게").
// 고를 값을 칩으로 다 늘어놓던 예전 방식은 카메라가 넷만 돼도 두 줄을 먹었고,
// 제목 줄까지 합쳐 세로로 세 뭉치를 썼다. 한 번에 하나만 고르는 필터라
// 라디오 시트가 맞다 — 다중 선택은 좁은 폭(360px)에서 '지금 뭐가 켜졌는지'를
// 읽기 어렵다.
//
// 색·크기·타이포는 눈대중이 아니라 `designTokens.ts` 에서 온다 — Figma
// 디자인시스템 페이지의 값을 그대로 옮긴 파일이다. 여기에 hex 나 px 를 직접
// 적지 말 것(2026-09-02 에 #F4F5F7·#EBEBEB·#E0E0E0 처럼 토큰에서 한두 칸씩
// 어긋난 값들을 걷어냈다). 쓰는 컴포넌트는 넷 —
//   검색창=Search Input(MD) · 필터 셋=Filter Chip(MD/Mobile/Line/Title=On) ·
//   고르는 시트=Bottom Sheet(Footer=None)+Bottom Sheet Option(Radio) ·
//   검색 버튼=Button(LG/Mobile/Primary)
// ============================================================================

const pad = (n: number) => String(n).padStart(2, "0");

// 한 번에 그리는 줄 수. 하루가 ~3400건이라 다 그리면 화면에 들어서는 순간 멈춘다.
// 아래 '이전 이벤트 더 보기'로 이만큼씩 늘린다.
const PAGE = 60;

// 계약처 — 한 계정이 여러 사업장을 보는 경우다. 첫 칸은 안들의 상단 바에 적힌
// 그 이름이다(AppHeader 의 "에스원 본사 · N1234567") — 지금 보고 있는 곳이
// 목록에 없으면 필터가 남의 것처럼 보인다.
// 카메라는 안이 prop 으로 넘기는데(안마다 CAMERAS 가 다를 수 있어서) 계약처는
// 네 안이 같은 값을 쓰므로 여기 둔다.
const CONTRACT_SITES = ["에스원 본사", "에스원 판교R&D센터", "에스원 부산지사"];

// 목록은 격자다(사용자 지정 2026-09-02: "그거 목록 2줄로 바꿔. 지금 한줄인데").
// 한 줄에 하나씩 가로로 눕히던 카드를, 썸네일 위 · 글자 아래인 세로 카드로 바꿨다.
// 썸네일 크기는 칸 폭에 맡기고 비율(16:9)만 못 박는다.
//
// 열 수를 2로 못 박지는 않는다 — 폰(360)에서 2 가 되는 칸 최소폭만 주고 나머지는
// CSS(auto-fill)에 맡긴다. 못 박으면 1080 태블릿에서 카드 하나가 470px 짜리
// 영상만 해진다. 폭을 재서 갈라지는 게 아니라 CSS 가 채우는 것이라
// layoutRules 의 기준선(WIDE_BP·SIDE_PANEL_BP)과는 상관없다.
//   360 → 2열 · 620 → 3열 · 780 → 4열 · 1080 → 6열 (칸은 늘 150~200px)
const TILE_MIN_W = 150;

// 카메라 이미지는 움직이는 GIF 다. 목록엔 한 화면에 열 몇 개가 깔리므로 그대로
// 넣으면 전부 각자 돌아가 버벅인다 — 안들이 타임라인 썸네일에 쓰는 것과 같은
// 수법으로 첫 프레임만 캔버스에 떠서 정지화면으로 만든다.
function ChevronDownIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block bg-current ${className ?? ""}`}
      style={{
        ...style,
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

// 필터 칩 하나 — 디자인시스템 Filter Chip(Size=MD, Break=Mobile, Variant=Line,
// Title=On). 왼쪽에 제목이 회색으로, 그 옆에 지금 걸린 값이 파랗게, 끝에
// 화살표가 온다. 값이 파래서 칩만 보고도 '이 필터에 뭐가 걸렸는지'가 읽힌다.
function FilterChipButton({
  title,
  value,
  onClick,
}: {
  title: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-none items-center"
      style={{
        height: `${FILTER_CHIP.height}px`,
        padding: `0 ${FILTER_CHIP.paddingRight}px 0 ${FILTER_CHIP.paddingLeft}px`,
        gap: `${FILTER_CHIP.gap}px`,
        borderRadius: `${FILTER_CHIP.radiusToken}px`,
        fontSize: `${FILTER_CHIP.fontSize}px`,
        fontWeight: FILTER_CHIP.fontWeight,
        lineHeight: TYPE.leading,
        border: `1px solid ${FILTER_CHIP.border}`,
        backgroundColor: FILTER_CHIP.bg,
      }}
    >
      <span style={{ color: FILTER_CHIP.title }}>{title}</span>
      <span suppressHydrationWarning style={{ color: FILTER_CHIP.value }}>
        {value}
      </span>
      <ChevronDownIcon
        className="flex-none"
        style={{
          width: `${FILTER_CHIP.chevron}px`,
          height: `${FILTER_CHIP.chevron}px`,
          color: FILTER_CHIP.label,
        }}
      />
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={SEARCH_INPUT.icon}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-none"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  );
}

function FrozenThumb({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src]);
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="h-full w-full"
      style={{ objectFit: "cover" }}
    />
  );
}

export default function CloudEventScreen({
  initialMs,
  cameraSrc,
  cameras,
  onLive,
  onPick,
  header,
}: {
  /** 기준 시각. 이 시각이 속한 '오늘'의 이벤트를, 이 시각까지만 보여 준다. */
  initialMs: number;
  /** 목록 썸네일에 쓸 카메라 이미지. 없으면 첫 카메라. */
  cameraSrc?: string;
  /** '카메라' 필터에 늘어놓을 목록. 안마다 CAMERAS 상수를 그대로 넘긴다. */
  cameras?: { label: string; src: string }[];
  /** 위쪽 '실시간' 을 눌렀을 때 — 실시간 화면으로 돌아간다. */
  onLive: () => void;
  /** 이벤트를 골랐을 때 — 그 시각으로 녹화 재생을 시작한다. 두 번째 인자는 그
   *  이벤트가 찍힌 카메라 번호로, 안은 그 카메라를 단일 화면으로 연다(사용자
   *  지정 2026-09-02: "그 목록을 누르면 단일화면처럼 보여야해"). 카메라 목록을
   *  안 넘겨 배정이 없으면 -1 이다. */
  onPick: (ms: number, camIndex: number) => void;
  /** 맨 위에 그대로 얹을 그 안의 상단 바(장소명 + 실시간/녹화영상). 클라우드로
   *  녹화에 들어오면 안의 헤더가 통째로 빠지는 자리라, 여기 다시 넣어 준다
   *  (사용자 지정 2026-09-01: "상단에 그 바는 유지해야지 — 실시간이랑
   *  녹화영상", "그 부분은 그대로 넣으라고"). 안마다 헤더가 달라서 안이 자기
   *  것을 통째로 넘긴다. 넘기면 그 아래 줄은 통째로 안 그린다 — 모드 바꾸는
   *  물건이 한 화면에 둘이 되면 안 된다.
   *  안 넘기면 예전 그대로다(A-1 은 자기 상단 바가 LIVE/녹화라 안 넘긴다). */
  header?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  // 어느 날 것을 볼지. null 이면 호출부가 준 기준 시각(=지금)을 그대로 쓴다.
  // 날짜를 고르면 그 시각이 새 기준이 된다 — 목록은 그 날 자정부터 그 시각까지.
  const [viewMs, setViewMs] = useState<number | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [kindOpen, setKindOpen] = useState(false);
  const [siteIdx, setSiteIdx] = useState<number | "all">("all");
  const [camIdx, setCamIdx] = useState<number | "all">("all");
  const [kind, setKind] = useState<EventKind | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  // 목록은 '검색'을 누른 뒤에 나온다(사용자 지정 2026-09-01: "처음부터 목록이
  // 안 나온대. 검색 이후에 나온데"). 들어오자마자 오늘 것을 다 뿌리는 게 아니라,
  // 날짜·시간대·알고리즘을 고르고 찾는 화면이라는 뜻이다. 한 번 찾은 뒤에는
  // 칩을 바꾸면 목록이 바로 따라간다 — 조건마다 다시 누르게 하면 번거롭다.
  const [searched, setSearched] = useState(false);

  // 찾기 — 검색창 엔터와 아래 '검색' 버튼이 같이 쓴다.
  const runSearch = () => {
    setLimit(PAGE);
    setSearched(true);
  };

  // 목록은 마운트 뒤에만 그린다. 오늘이 언제인지가 시각에 달려 있어 서버에서
  // 그리면 하이드레이션이 어긋난다(안들이 now 를 null 로 시작하는 것과 같은 이유).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const baseMs = viewMs ?? initialMs;

  const dayStart = useMemo(() => {
    const d = new Date(baseMs);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [baseMs]);

  // 어느 이벤트가 어느 카메라 것인지. 가상 이벤트(TIMELINE_EVENTS)엔 카메라가
  // 없어서 여기서 시각으로 고르게 배정한다 — 시드처럼 늘 같은 답이 나와야
  // 카메라를 골랐다 풀었다 해도 목록이 흔들리지 않는다. 이 배정은 이 화면
  // 안에서만 쓴다(안들의 타임라인은 지금 보는 카메라 것을 그리는 자리라
  // 건드리지 않는다).
  const camCount = cameras?.length ?? 0;
  const camOf = (at: number) => (camCount ? at % camCount : -1);

  // 계약처도 같은 수법으로 배정한다 — 가상 이벤트에 계약처가 없어서다.
  // 카메라와 같은 식(at % n)을 쓰면 둘이 붙어 돌아(카메라 03 은 늘 같은
  // 계약처) 두 필터를 같이 걸었을 때 목록이 통째로 비는 조합이 생긴다.
  // +7 을 섞어 어긋나게 둔다. 시드처럼 늘 같은 답이라 필터를 껐다 켜도
  // 목록이 흔들리지 않는 건 카메라와 같다.
  //
  // 실제로는 카메라가 계약처에 속하지만(계약처를 바꾸면 카메라 목록도 바뀐다),
  // 프로토타입의 카메라 목록은 한 벌뿐이라 둘을 나란한 필터로 둔다.
  const siteOf = (at: number) => (at + 7) % CONTRACT_SITES.length;

  // 오늘 자정부터 기준 시각까지, 최신이 위로. 아직 안 일어난 이벤트는 뺀다.
  const events = useMemo(() => {
    if (!mounted) return [];
    const maxSec = Math.floor((baseMs - dayStart) / 1000);
    return TIMELINE_EVENTS.filter((e) => {
      if (e.at > maxSec) return false;
      if (kind !== "all" && e.kind !== kind) return false;
      if (siteIdx !== "all" && siteOf(e.at) !== siteIdx) return false;
      if (camIdx !== "all" && camCount && e.at % camCount !== camIdx) return false;
      return true;
    }).reverse();
    // siteOf 는 상수만 보는 순수 함수라 의존성에 넣지 않는다(넣으면 매 렌더
    // 새 함수라 useMemo 가 매번 다시 돈다) — 대신 siteIdx 를 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, baseMs, dayStart, kind, siteIdx, camIdx, camCount]);

  const shown = events.slice(0, limit);

  // 칩에 적히는 지금 값 셋. 칩이 한 줄에 늘어서므로 짧아야 한다 —
  // 날짜는 연도를 뺀다(고를 수 있는 범위가 최근 30일이라 연도가 헷갈릴 일이
  // 없고, 시트를 열면 연도까지 다 보인다).
  const b = new Date(baseMs);
  const dateLabel = `${pad(b.getMonth() + 1)}.${pad(b.getDate())} ${pad(b.getHours())}:${pad(b.getMinutes())}`;
  // 칩 제목이 이미 '카메라'라, 값에서 그 말을 뺀다 — 안 그러면 칩이
  // '카메라 카메라 03' 이 된다. 시트 안 목록은 제목이 따로 없으니 원래
  // 이름('카메라 03')을 그대로 쓴다.
  const camLabel =
    camIdx === "all"
      ? "전체"
      : ((cameras?.[camIdx]?.label ?? "전체").replace(/^카메라\s*/, "") ||
        "전체");
  const kindLabel = kind === "all" ? "전체" : kind;
  // 계약처 이름은 그대로 쓴다 — 칩 제목('계약처')과 겹치는 말이 없어서
  // 카메라처럼 앞을 떼어낼 게 없다.
  const siteLabel = siteIdx === "all" ? "전체" : CONTRACT_SITES[siteIdx];

  const siteOptions = [
    { key: "all", label: "전체" },
    ...CONTRACT_SITES.map((name, i) => ({ key: String(i), label: name })),
  ];
  const camOptions = [
    { key: "all", label: "전체" },
    ...(cameras ?? []).map((c, i) => ({ key: String(i), label: c.label })),
  ];
  const kindOptions = [
    { key: "all", label: "전체" },
    ...EVENT_KINDS.map((k) => ({ key: k, label: k })),
  ];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-white">
      {/* 안의 상단 바 — 그대로 얹는다. 안 넘긴 안(A-1)은 아무것도 안 그린다. */}
      {header}

      {/* 상단 바를 안 받은 안(A-1)만 그 자리에 모드 토글 한 줄. 상단 바를 받은
          안은 거기 이미 실시간/녹화영상이 있어 이 줄 자체가 없다. */}
      {!header && (
        <div
          className="relative flex flex-none items-center px-5"
          style={{ height: "48px", gap: `${SPACE.s8}px` }}
        >
          <ModeChipToggle
            mode="recording"
            setMode={(m) => m === "live" && onLive()}
          />
        </div>
      )}
      <div
        className="h-px flex-none"
        style={{ backgroundColor: COLOR.lineSubtle }}
      />

      {/* 검색창 — 필터 위, 화면 맨 위 줄. 진짜 input 이라 누르면 키패드가 올라온다
          (사용자 지정 2026-09-02: "입력창 누르면 키패드 올라와야지"). AI 검색
          시트 입력창은 모양만인데 여기는 다르다.
          키패드가 올라오면 브라우저가 이 고정 화면을 통째로 밀어 올리고 내려도
          그대로 있는 문제가 있어(그래서 예전엔 글자로만 그렸다), 포커스가 빠질
          때 스크롤을 0 으로 되돌린다. 엔터는 아래 '검색' 버튼과 같은 동작이다. */}
      <form
        className="flex-none"
        style={{ padding: `${SPACE.s12}px ${SPACE.s20}px 0` }}
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div
          className="flex items-center"
          style={{
            height: `${SEARCH_INPUT.height}px`,
            padding: `0 ${SEARCH_INPUT.paddingRight}px 0 ${SEARCH_INPUT.paddingLeft}px`,
            gap: `${SPACE.s8}px`,
            borderRadius: `${SEARCH_INPUT.radiusToken}px`,
            backgroundColor: SEARCH_INPUT.bg,
            border: `1px solid ${SEARCH_INPUT.border}`,
          }}
        >
          <SearchIcon />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.currentTarget.blur();
              runSearch();
            }}
            onBlur={() => document.scrollingElement?.scrollTo(0, 0)}
            placeholder="검색어를 입력하세요"
            inputMode="search"
            enterKeyHint="search"
            aria-label="검색어"
            // placeholder 색은 Tailwind 임의값이 문자열이라 토큰을 못 넣는다 —
            // CSS 변수로 건네 단일 출처를 지킨다.
            className="min-w-0 flex-1 bg-transparent leading-none outline-none placeholder:text-[var(--ph)]"
            style={
              {
                fontSize: `${SEARCH_INPUT.fontSize}px`,
                fontWeight: SEARCH_INPUT.fontWeight,
                color: SEARCH_INPUT.text,
                "--ph": SEARCH_INPUT.placeholder,
              } as React.CSSProperties
            }
          />
        </div>
      </form>

      {/* 필터 셋 — 한 줄. 셋 다 디자인시스템 Filter Chip(Title=On)이라
          제목·값·화살표가 칩 하나에 들어간다(사용자 지정 2026-09-02: "필터
          한줄로 하는거 어때? 칩 형태에 그 화살표 붙은거 ... 그걸로 선택하게").
          예전엔 제목 줄 + 칩 줄이 셋이라 세로로 세 뭉치를 먹었다 — 한 줄로
          줄면서 그만큼 목록이 위로 올라온다.
          360 폭에서는 셋이 다 안 들어가 가로로 구른다. 줄바꿈(wrap)으로 두 줄이
          되면 한 줄로 만든 뜻이 없으므로 안쪽을 max-content 로 못 박는다. */}
      <div
        className="flex-none overflow-x-auto"
        style={{
          padding: `${SPACE.s2}px ${SPACE.s20}px ${SPACE.s12}px`,
          scrollbarWidth: "none",
        }}
      >
        <div
          className="flex"
          style={{ gap: `${SPACE.s6}px`, width: "max-content" }}
        >
          <FilterChipButton
            title="계약처"
            value={siteLabel}
            onClick={() => setSiteOpen(true)}
          />
          <FilterChipButton
            title="카메라"
            value={camLabel}
            onClick={() => setCamOpen(true)}
          />
          {/* 날짜·시간만 시트가 다르다 — NVR 의 녹화 진입에 쓰는 그 '날짜, 시간
              선택' 휠 시트가 그대로 뜬다. 고른 시각이 목록의 끝점이 된다. */}
          <FilterChipButton
            title="날짜·시간"
            value={dateLabel}
            onClick={() => setPickOpen(true)}
          />
          <FilterChipButton
            title="감지유형"
            value={kindLabel}
            onClick={() => setKindOpen(true)}
          />
        </div>
      </div>

      {/* 건수 — 검색 전에는 안 적는다(아직 찾은 게 없다). */}
      {searched && (
        <div
          className="flex-none border-t"
          style={{
            padding: `${SPACE.s10}px ${SPACE.s20}px ${SPACE.s6}px`,
            borderColor: COLOR.lineSubtle,
          }}
        >
          <span
            suppressHydrationWarning
            style={{
              fontSize: `${TYPE.size.sm}px`,
              fontWeight: TYPE.weight.medium,
              color: COLOR.textTertiary,
            }}
          >
            총 {events.length.toLocaleString()}건
          </span>
        </div>
      )}

      {/* 목록 — 최신이 위. 탭하면 그 시각으로 재생을 시작한다.
          검색 전에는 목록 대신 안내 한 줄만 둔다. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!searched && (
          <p
            className="text-center"
            style={{
              padding: `${SPACE.s40}px 0`,
              fontSize: `${TYPE.size.md}px`,
              color: COLOR.textTertiary,
            }}
          >
            조건을 고르고 검색해 주세요.
          </p>
        )}
        {searched && shown.length === 0 && mounted && (
          <p
            className="text-center"
            style={{
              padding: `${SPACE.s40}px 0`,
              fontSize: `${TYPE.size.md}px`,
              color: COLOR.textTertiary,
            }}
          >
            해당하는 이벤트가 없습니다.
          </p>
        )}
        {searched && shown.length > 0 && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_MIN_W}px, 1fr))`,
              columnGap: `${SPACE.s8}px`,
              rowGap: `${SPACE.s14}px`,
              padding: `${SPACE.s12}px ${SPACE.s20}px`,
            }}
          >
            {shown.map((e) => {
              const ms = dayStart + e.at * 1000;
              const d = new Date(ms);
              return (
                <button
                  key={e.at}
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => onPick(ms, camOf(e.at))}
                >
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      aspectRatio: "16 / 9",
                      borderRadius: `${RADIUS.card}px`,
                      // 썸네일이 뜨기 전 바탕. 의미 토큰에 '영상 자리' 색이
                      // 없어 원시값 중 가장 어두운 회색을 쓴다.
                      backgroundColor: PRIMITIVE.gray900,
                    }}
                  >
                    <EventKindChip kind={e.kind} />
                    <FrozenThumb
                      src={
                        cameras?.[camOf(e.at)]?.src ??
                        cameraSrc ??
                        `${BASE}/cameras/cam1.gif`
                      }
                    />
                  </div>
                  <p
                    suppressHydrationWarning
                    className="truncate leading-none"
                    style={{
                      marginTop: `${SPACE.s8}px`,
                      fontSize: `${TYPE.size.md}px`,
                      fontWeight: TYPE.weight.bold,
                      color: COLOR.textPrimary,
                    }}
                  >
                    {pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())}
                  </p>
                  <p
                    className="truncate leading-none"
                    style={{
                      marginTop: `${SPACE.s4}px`,
                      fontSize: `${TYPE.size.sm}px`,
                      color: COLOR.textTertiary,
                    }}
                  >
                    {e.kind} · {e.dur}초
                  </p>
                </button>
              );
            })}
          </div>
        )}
        {searched && shown.length < events.length && (
          <button
            type="button"
            className="w-full"
            style={{
              padding: `${SPACE.s14}px 0`,
              fontSize: `${TYPE.size.md}px`,
              fontWeight: TYPE.weight.medium,
              color: COLOR.textAccent,
            }}
            onClick={() => setLimit((v) => v + PAGE)}
          >
            이전 이벤트 더 보기
          </button>
        )}
      </div>

      {/* 검색 — 이걸 눌러야 목록이 나온다. 화면 맨 아래에 붙는다(사용자 지정
          2026-09-02: "검색버튼은 하단으로"). 목록이 길어져도 자리가 안 밀리게
          스크롤 영역 밖 형제로 두고, 목록이 밑으로 지나가 보이지 않게 윗줄을
          하나 긋는다. 아래 하단 탭바는 이 화면 바깥이라 그 바로 위에 앉는다. */}
      <div
        className="flex-none border-t"
        style={{
          padding: `${SPACE.s12}px ${SPACE.s20}px`,
          borderColor: COLOR.lineSubtle,
        }}
      >
        <button
          type="button"
          onClick={runSearch}
          className="w-full"
          style={{
            height: `${BUTTON.height}px`,
            padding: `0 ${BUTTON.paddingX}px`,
            borderRadius: `${BUTTON.radiusToken}px`,
            fontSize: `${BUTTON.fontSize}px`,
            fontWeight: BUTTON.fontWeight,
            backgroundColor: BUTTON.primary.bg,
            color: BUTTON.primary.label,
          }}
        >
          검색
        </button>
      </div>

      {/* 계약처·카메라·감지유형 고르기 — 칩을 누르면 뜬다. 고르는 즉시 닫히고
          목록이 따라간다(검색을 다시 누를 필요 없다). */}
      <OptionSheet
        open={siteOpen}
        title="계약처"
        options={siteOptions}
        value={siteIdx === "all" ? "all" : String(siteIdx)}
        onClose={() => setSiteOpen(false)}
        onPick={(k) => {
          setSiteIdx(k === "all" ? "all" : Number(k));
          setLimit(PAGE);
          setSiteOpen(false);
        }}
      />
      <OptionSheet
        open={camOpen}
        title="카메라"
        options={camOptions}
        value={camIdx === "all" ? "all" : String(camIdx)}
        onClose={() => setCamOpen(false)}
        onPick={(k) => {
          setCamIdx(k === "all" ? "all" : Number(k));
          setLimit(PAGE);
          setCamOpen(false);
        }}
      />
      <OptionSheet
        open={kindOpen}
        title="감지유형"
        options={kindOptions}
        value={kind}
        onClose={() => setKindOpen(false)}
        onPick={(k) => {
          setKind(k as EventKind | "all");
          setLimit(PAGE);
          setKindOpen(false);
        }}
      />

      {/* 날짜·시각 고르기 — NVR 의 녹화 진입에 쓰는 그 시트 그대로다. */}
      <DateTimePickerSheet
        open={pickOpen}
        initialMs={baseMs}
        onClose={() => setPickOpen(false)}
        onApply={(ms) => {
          setViewMs(ms);
          setLimit(PAGE);
          setPickOpen(false);
        }}
      />
    </div>
  );
}
