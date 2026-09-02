"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { BASE } from "../basePath";
import DateTimePickerSheet from "./DateTimePickerSheet";
import EventKindChip from "./EventKindChip";
import ModeChipToggle from "./ModeChipToggle";
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
// 필터는 셋 — 카메라 · 날짜·시간 · 감지유형 (사용자 지정 2026-09-02: "필터가
// 일단 카메라 선택이 있어야하고, 날짜 시간, 감지유형 이렇게야"). 예전의
// 시간대(새벽·오전·오후·저녁) 칩은 '날짜·시간'이 대신해 뺐다.
// 카메라·감지유형은 한 번에 하나만 고른다 — 다중 선택은 칩이 좁은 폭(360px)에서
// '지금 뭐가 켜졌는지'를 읽기 어렵다.
// ============================================================================

const pad = (n: number) => String(n).padStart(2, "0");

// 한 번에 그리는 줄 수. 하루가 ~3400건이라 다 그리면 화면에 들어서는 순간 멈춘다.
// 아래 '이전 이벤트 더 보기'로 이만큼씩 늘린다.
const PAGE = 60;

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

// 필터 한 줄 — 라벨은 위에 작게, 값 줄은 폭을 다 쓴다. 라벨을 왼쪽에 붙이면
// 360px 에서 칩이 잘린다.
function FilterRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: "10px" }}>
      <p
        className="leading-none text-neutral-400"
        style={{ fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A4A4A4"
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

  // 오늘 자정부터 기준 시각까지, 최신이 위로. 아직 안 일어난 이벤트는 뺀다.
  const events = useMemo(() => {
    if (!mounted) return [];
    const maxSec = Math.floor((baseMs - dayStart) / 1000);
    return TIMELINE_EVENTS.filter((e) => {
      if (e.at > maxSec) return false;
      if (kind !== "all" && e.kind !== kind) return false;
      if (camIdx !== "all" && camCount && e.at % camCount !== camIdx) return false;
      return true;
    }).reverse();
  }, [mounted, baseMs, dayStart, kind, camIdx, camCount]);

  const shown = events.slice(0, limit);
  // '날짜·시간' 필터에 적히는 값 — 곧 목록의 끝점이다(그 날 자정 ~ 이 시각).
  const b = new Date(baseMs);
  const dateLabel = `${b.getFullYear()}.${pad(b.getMonth() + 1)}.${pad(b.getDate())}. ${pad(b.getHours())}:${pad(b.getMinutes())}`;

  const chip = (active: boolean) =>
    ({
      flex: "none",
      padding: "7px 12px",
      borderRadius: "16px",
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: 1,
      border: active ? "1px solid #1D6CEB" : "1px solid #E0E0E0",
      backgroundColor: active ? "#1D6CEB" : "#FFFFFF",
      color: active ? "#FFFFFF" : "#595959",
    }) as const;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-white">
      {/* 안의 상단 바 — 그대로 얹는다. 안 넘긴 안(A-1)은 아무것도 안 그린다. */}
      {header}

      {/* 상단 바를 안 받은 안(A-1)만 그 자리에 모드 토글 한 줄. 상단 바를 받은
          안은 거기 이미 실시간/녹화영상이 있어 이 줄 자체가 없다. */}
      {!header && (
        <div
          className="relative flex flex-none items-center px-5"
          style={{ height: "48px", gap: "8px" }}
        >
          <ModeChipToggle
            mode="recording"
            setMode={(m) => m === "live" && onLive()}
          />
        </div>
      )}
      <div className="h-px flex-none" style={{ backgroundColor: "#EBEBEB" }} />

      {/* 검색창 — 필터 위, 화면 맨 위 줄. 진짜 input 이라 누르면 키패드가 올라온다
          (사용자 지정 2026-09-02: "입력창 누르면 키패드 올라와야지"). AI 검색
          시트 입력창은 모양만인데 여기는 다르다.
          키패드가 올라오면 브라우저가 이 고정 화면을 통째로 밀어 올리고 내려도
          그대로 있는 문제가 있어(그래서 예전엔 글자로만 그렸다), 포커스가 빠질
          때 스크롤을 0 으로 되돌린다. 엔터는 아래 '검색' 버튼과 같은 동작이다. */}
      <form
        className="flex-none"
        style={{ padding: "12px 20px 0" }}
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div
          className="flex items-center"
          style={{
            height: "40px",
            padding: "0 14px",
            gap: "8px",
            borderRadius: "20px",
            backgroundColor: "#F4F5F7",
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
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-none text-neutral-900 outline-none placeholder:text-[#A4A4A4]"
          />
        </div>
      </form>

      {/* 필터 셋 — 카메라 · 날짜·시간 · 감지유형. */}
      <div className="flex-none" style={{ padding: "2px 20px 12px" }}>
        <FilterRow title="카메라">
          <div
            className="flex gap-[6px] overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <button
              type="button"
              onClick={() => {
                setCamIdx("all");
                setLimit(PAGE);
              }}
              style={chip(camIdx === "all")}
            >
              전체
            </button>
            {(cameras ?? []).map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setCamIdx(i);
                  setLimit(PAGE);
                }}
                style={chip(camIdx === i)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </FilterRow>

        {/* 날짜·시간 — 칩이 아니라 값 하나다. 누르면 NVR 의 녹화 진입에 쓰는
            그 '날짜, 시간 선택' 시트가 그대로 뜬다. 고른 시각이 목록의 끝점. */}
        <FilterRow title="날짜·시간">
          <button
            type="button"
            onClick={() => setPickOpen(true)}
            style={{ ...chip(false), display: "flex", alignItems: "center" }}
          >
            <span suppressHydrationWarning>{dateLabel}</span>
            <ChevronDownIcon
              className="h-5 w-5 text-[#262626]"
              style={{ marginLeft: "2px", marginRight: "-4px" }}
            />
          </button>
        </FilterRow>

        <FilterRow title="감지유형">
          <div
            className="flex gap-[6px] overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {[
              { key: "all", label: "전체" },
              ...EVENT_KINDS.map((k) => ({ key: k, label: k })),
            ].map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => {
                  setKind(it.key as EventKind | "all");
                  setLimit(PAGE);
                }}
                style={chip(kind === it.key)}
              >
                {it.label}
              </button>
            ))}
          </div>
        </FilterRow>
      </div>

      {/* 건수 — 검색 전에는 안 적는다(아직 찾은 게 없다). */}
      {searched && (
        <div
          className="flex-none border-t border-neutral-200"
          style={{ padding: "10px 20px 6px" }}
        >
          <span
            suppressHydrationWarning
            className="text-[12px] font-semibold text-neutral-500"
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
            className="text-center text-[13px] text-neutral-400"
            style={{ padding: "40px 0" }}
          >
            조건을 고르고 검색해 주세요.
          </p>
        )}
        {searched && shown.length === 0 && mounted && (
          <p
            className="text-center text-[13px] text-neutral-400"
            style={{ padding: "40px 0" }}
          >
            해당하는 이벤트가 없습니다.
          </p>
        )}
        {searched && shown.length > 0 && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_MIN_W}px, 1fr))`,
              columnGap: "8px",
              rowGap: "14px",
              padding: "12px 20px",
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
                    className="relative w-full overflow-hidden rounded-md bg-neutral-900"
                    style={{ aspectRatio: "16 / 9" }}
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
                    className="truncate text-[15px] font-bold leading-none text-neutral-900"
                    style={{ marginTop: "8px" }}
                  >
                    {pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())}
                  </p>
                  <p
                    className="truncate text-[12px] leading-none text-neutral-500"
                    style={{ marginTop: "5px" }}
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
            className="w-full text-[13px] font-semibold text-[#1D6CEB]"
            style={{ padding: "14px 0" }}
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
        style={{ padding: "12px 20px", borderColor: "#EBEBEB" }}
      >
        <button
          type="button"
          onClick={runSearch}
          className="w-full text-[14px] font-semibold text-white"
          style={{
            height: "44px",
            borderRadius: "8px",
            backgroundColor: "#1D6CEB",
          }}
        >
          검색
        </button>
      </div>

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
