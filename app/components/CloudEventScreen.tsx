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
// 맨 윗줄은 실시간 화면과 같은 구조다(사용자 결정) — 같은 ModeChipToggle 에
// 같은 자리 날짜·시각. 다른 점은 그 날짜·시각이 눌린다는 것 하나뿐이다:
// 누르면 '날짜, 시간 선택' 시트가 떠서 어느 날 것을 볼지 고른다. 실시간엔
// 고를 게 없어 라벨로 두지만, 여기선 그게 곧 목록의 범위다.
// 돌아가는 길은 그 줄의 LIVE 하나다 — 뒤로가기 화살표는 따로 두지 않는다.
//
// 네 안(A-1·A-2·A-3·B)이 이 하나를 같이 쓴다. 진입 화면이 안마다 다르게 보이면
// 안끼리 비교가 안 되므로, 안에 두지 않고 여기 공유 컴포넌트로 뒀다.
//
// 상단에 필터 둘 — 시간대와 알고리즘(감지 유형). 둘 다 한 번에 하나만 고른다.
// 다중 선택은 칩이 좁은 폭(360px)에서 '지금 뭐가 켜졌는지'를 읽기 어렵다.
// ============================================================================

const pad = (n: number) => String(n).padStart(2, "0");

// 시간대 필터. from ≤ 시 < to (24시간). '전체'만 범위가 없다.
const TIME_BUCKETS: { key: string; label: string; from?: number; to?: number }[] =
  [
    { key: "all", label: "전체" },
    { key: "dawn", label: "새벽", from: 0, to: 6 },
    { key: "am", label: "오전", from: 6, to: 12 },
    { key: "pm", label: "오후", from: 12, to: 18 },
    { key: "eve", label: "저녁", from: 18, to: 24 },
  ];

// 한 번에 그리는 줄 수. 하루가 ~3400건이라 다 그리면 화면에 들어서는 순간 멈춘다.
// 아래 '이전 이벤트 더 보기'로 이만큼씩 늘린다.
const PAGE = 60;

// 썸네일 — 카드 하나가 96×54(16:9).
const THUMB_W = 96;
const THUMB_H = 54;

// 카메라 이미지는 움직이는 GIF 다. 목록엔 한 화면에 열 몇 개가 깔리므로 그대로
// 넣으면 전부 각자 돌아가 버벅인다 — 안들이 타임라인 썸네일에 쓰는 것과 같은
// 수법으로 첫 프레임만 캔버스에 떠서 정지화면으로 만든다.
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
  onLive,
  onPick,
  modeToggle,
}: {
  /** 기준 시각. 이 시각이 속한 '오늘'의 이벤트를, 이 시각까지만 보여 준다. */
  initialMs: number;
  /** 목록 썸네일에 쓸 카메라 이미지. 없으면 첫 카메라. */
  cameraSrc?: string;
  /** 위쪽 '실시간' 을 눌렀을 때 — 실시간 화면으로 돌아간다. */
  onLive: () => void;
  /** 이벤트를 골랐을 때 — 그 시각으로 녹화 재생을 시작한다. */
  onPick: (ms: number) => void;
  /** 맨 윗줄에 놓을 실시간↔녹화 토글. 안마다 상단 바가 달라서 그 안이 쓰는 걸
   *  그대로 받는다(사용자 지정 2026-09-01: "상단에 그 바는 유지해야지 —
   *  실시간이랑 녹화영상"). 여긴 클라우드 전용 화면이라 안의 헤더가 통째로
   *  빠지는데, 모드 토글까지 다른 물건(LIVE/녹화)으로 바뀌어 있었다.
   *  안 넘기면 예전 그대로 ModeChipToggle 이다(A-1 은 그게 자기 것이다). */
  modeToggle?: React.ReactNode;
}) {
  // 어느 날 것을 볼지. null 이면 호출부가 준 기준 시각(=지금)을 그대로 쓴다.
  // 날짜를 고르면 그 시각이 새 기준이 된다 — 목록은 그 날 자정부터 그 시각까지.
  const [viewMs, setViewMs] = useState<number | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [timeKey, setTimeKey] = useState("all");
  const [kind, setKind] = useState<EventKind | "all">("all");
  const [limit, setLimit] = useState(PAGE);

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

  // 오늘 자정부터 기준 시각까지, 최신이 위로. 아직 안 일어난 이벤트는 뺀다.
  const events = useMemo(() => {
    if (!mounted) return [];
    const bucket = TIME_BUCKETS.find((b) => b.key === timeKey);
    const maxSec = Math.floor((baseMs - dayStart) / 1000);
    return TIMELINE_EVENTS.filter((e) => {
      if (e.at > maxSec) return false;
      if (kind !== "all" && e.kind !== kind) return false;
      if (bucket?.from != null) {
        const h = Math.floor(e.at / 3600);
        if (h < bucket.from || h >= (bucket.to ?? 24)) return false;
      }
      return true;
    }).reverse();
  }, [mounted, baseMs, dayStart, timeKey, kind]);

  const shown = events.slice(0, limit);
  // 안들의 녹화 줄과 같은 형식. 목록 위에 적히는 이 시각이 곧 목록의 끝점이다.
  const b = new Date(baseMs);
  const headerLabel = `${b.getFullYear()}.${pad(b.getMonth() + 1)}.${pad(b.getDate())}. ${pad(b.getHours())}:${pad(b.getMinutes())}:${pad(b.getSeconds())}`;

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
      {/* 맨 윗줄 — 실시간 화면과 같은 구조(토글 + 날짜·시각). 다만 여기선
          날짜·시각이 버튼이라, 누르면 다른 날을 고를 수 있다. */}
      <div
        className="relative flex flex-none items-center px-5"
        style={{ height: "48px", gap: "8px" }}
      >
        {modeToggle ?? (
          <ModeChipToggle
            mode="recording"
            setMode={(m) => m === "live" && onLive()}
          />
        )}
        <button
          type="button"
          onClick={() => setPickOpen(true)}
          className="flex items-center gap-0 text-[14px] font-medium leading-none text-[#353535]"
        >
          <span suppressHydrationWarning>{headerLabel}</span>
          <ChevronDownIcon className="h-6 w-6 text-[#262626]" />
        </button>
      </div>
      <div className="h-px flex-none" style={{ backgroundColor: "#EBEBEB" }} />

      {/* 필터 두 줄 — 시간대 / 알고리즘. 라벨을 왼쪽에 붙이면 360px 에서 칩이
          잘려서, 라벨은 위에 작게 두고 칩 줄은 폭을 다 쓴다. */}
      <div className="flex-none" style={{ padding: "0 20px 12px" }}>
        {(
          [
            {
              title: "시간",
              items: TIME_BUCKETS.map((b) => ({ key: b.key, label: b.label })),
              active: timeKey,
              pick: (k: string) => {
                setTimeKey(k);
                setLimit(PAGE);
              },
            },
            {
              title: "알고리즘",
              items: [
                { key: "all", label: "전체" },
                ...EVENT_KINDS.map((k) => ({ key: k, label: k })),
              ],
              active: kind,
              pick: (k: string) => {
                setKind(k as EventKind | "all");
                setLimit(PAGE);
              },
            },
          ] as const
        ).map((row) => (
          <div key={row.title} style={{ marginTop: "4px" }}>
            <p
              className="leading-none text-neutral-400"
              style={{ fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}
            >
              {row.title}
            </p>
            <div
              className="flex gap-[6px] overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {row.items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => row.pick(it.key)}
                  style={chip(row.active === it.key)}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 건수 */}
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

      {/* 목록 — 최신이 위. 탭하면 그 시각으로 재생을 시작한다. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 && mounted && (
          <p
            className="text-center text-[13px] text-neutral-400"
            style={{ padding: "40px 0" }}
          >
            해당하는 이벤트가 없습니다.
          </p>
        )}
        {shown.map((e) => {
          const ms = dayStart + e.at * 1000;
          const d = new Date(ms);
          return (
            <button
              key={e.at}
              type="button"
              className="flex w-full items-center border-b border-neutral-100 text-left"
              style={{ gap: "12px", padding: "10px 20px" }}
              onClick={() => onPick(ms)}
            >
              <div
                className="relative flex-none overflow-hidden rounded-md bg-neutral-900"
                style={{ width: `${THUMB_W}px`, height: `${THUMB_H}px` }}
              >
                <EventKindChip kind={e.kind} />
                <FrozenThumb src={cameraSrc ?? `${BASE}/cameras/cam1.gif`} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  suppressHydrationWarning
                  className="text-[16px] font-bold leading-none text-neutral-900"
                >
                  {pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())}
                </p>
                <p
                  className="text-[12px] leading-none text-neutral-500"
                  style={{ marginTop: "6px" }}
                >
                  {e.kind} · {e.dur}초
                </p>
              </div>
            </button>
          );
        })}
        {shown.length < events.length && (
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
