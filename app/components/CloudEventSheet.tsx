"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BASE } from "../basePath";
import EventKindChip from "./EventKindChip";
import { EVENT_KINDS, TIMELINE_EVENTS, type EventKind } from "./timelineEvents";

// ============================================================================
// 클라우드 — 녹화로 들어갈 때 뜨는 '오늘 이벤트 내역'
// ============================================================================
// NVR 은 예전 그대로 '날짜, 시간 선택' 바텀시트(날짜·시·분 휠)로 들어간다.
// 클라우드는 영상이 서버에 있어 이벤트 목록을 먼저 뽑아 줄 수 있으므로, 시각을
// 찍어 들어가는 대신 오늘 발생한 이벤트를 쭉 보여 주고 고르게 한다(사용자 사양
// 2026-08-21). 고른 이벤트의 시각으로 재생을 시작하는 건 두 경로가 같다 —
// onApply(ms) 하나로 끝나서, 호출부는 시트를 갈아끼우기만 하면 된다.
//
// 네 안(A-1·A-2·A-3·B)이 이 하나를 같이 쓴다. 진입 화면이 안마다 다르게 보이면
// 안끼리 비교가 안 되므로, 안에 두지 않고 여기 공유 컴포넌트로 뒀다.
//
// 상단에 필터 둘 — 시간대와 알고리즘(감지 유형). 둘 다 한 번에 하나만 고른다.
// 다중 선택은 칩이 좁은 폭(360px)에서 '지금 뭐가 켜졌는지'를 읽기 어렵다.
// ============================================================================

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
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

// 한 번에 그리는 줄 수. 하루가 ~4900건이라 다 그리면 시트를 여는 순간 멈춘다.
// 아래 '이전 이벤트 더 보기'로 이만큼씩 늘린다.
const PAGE = 60;

// 썸네일 — 카드 하나가 96×54(16:9).
const THUMB_W = 96;
const THUMB_H = 54;

// 카메라 이미지는 움직이는 GIF 다. 목록엔 한 화면에 열 몇 개가 깔리므로 그대로
// 넣으면 전부 각자 돌아가 버벅인다 — 안들이 타임라인 썸네일에 쓰는 것과 같은
// 수법으로 첫 프레임만 캔버스에 떠서 정지화면으로 만든다.
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

export default function CloudEventSheet({
  open,
  initialMs,
  cameraSrc,
  onClose,
  onApply,
}: {
  open: boolean;
  /** 기준 시각. 이 시각이 속한 '오늘'의 이벤트를, 이 시각까지만 보여 준다. */
  initialMs: number;
  /** 목록 썸네일에 쓸 카메라 이미지. 없으면 첫 카메라. */
  cameraSrc?: string;
  onClose: () => void;
  onApply: (ms: number) => void;
}) {
  const [timeKey, setTimeKey] = useState("all");
  const [kind, setKind] = useState<EventKind | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  const listRef = useRef<HTMLDivElement>(null);

  // 목록은 마운트 뒤에만 그린다. 오늘이 언제인지가 시각에 달려 있어 서버에서
  // 그리면 하이드레이션이 어긋난다(안들이 now 를 null 로 시작하는 것과 같은 이유).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 열 때마다 필터와 스크롤을 처음으로 되돌린다 — 지난번에 걸어 둔 필터가 남아
  // 있으면 '오늘 뭐가 있었나' 보러 연 사람이 빈 목록을 보게 된다.
  useEffect(() => {
    if (!open) return;
    setTimeKey("all");
    setKind("all");
    setLimit(PAGE);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [open]);

  const dayStart = useMemo(() => {
    const d = new Date(initialMs);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [initialMs]);

  // 오늘 자정부터 기준 시각까지, 최신이 위로. 아직 안 일어난 이벤트는 뺀다.
  const events = useMemo(() => {
    if (!mounted) return [];
    const bucket = TIME_BUCKETS.find((b) => b.key === timeKey);
    const maxSec = Math.floor((initialMs - dayStart) / 1000);
    return TIMELINE_EVENTS.filter((e) => {
      if (e.at > maxSec) return false;
      if (kind !== "all" && e.kind !== kind) return false;
      if (bucket?.from != null) {
        const h = Math.floor(e.at / 3600);
        if (h < bucket.from || h >= (bucket.to ?? 24)) return false;
      }
      return true;
    }).reverse();
  }, [mounted, initialMs, dayStart, timeKey, kind]);

  const shown = events.slice(0, limit);
  const day = new Date(dayStart);
  const dayLabel = `${day.getMonth() + 1}.${day.getDate()}. (${WEEKDAYS[day.getDay()]})`;

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
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: open ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 mx-auto flex w-full max-w-[480px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          // 날짜 시트와 같은 규칙 — 기준 컨테이너가 시스템 네비 위에서 끝난다.
          bottom: 0,
          // 목록이라 날짜 시트보다 높다. 위를 조금 남겨 두는 건 '뒤에 영상이
          // 있다'는 걸 보이게 하려는 것 — 꽉 채우면 화면이 바뀐 것처럼 읽힌다.
          height: "82%",
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          transform: open ? "translateY(0%)" : "translateY(100%)",
          boxShadow: open ? undefined : "none",
        }}
      >
        {/* 헤더 */}
        <div
          className="flex flex-none items-center justify-between"
          style={{ height: "62px", padding: "0 20px" }}
        >
          <div className="flex items-baseline gap-2">
            <h2 className="text-[20px] font-bold leading-none text-neutral-900">
              이벤트 내역
            </h2>
            <span
              suppressHydrationWarning
              className="text-[13px] font-medium leading-none text-neutral-500"
            >
              {dayLabel}
            </span>
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={`${BASE}/close.svg`} alt="" className="h-6 w-6" />
          </button>
        </div>

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
        <div ref={listRef} className="flex-1 overflow-y-auto">
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
                onClick={() => onApply(ms)}
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
                    {pad(d.getHours())}:{pad(d.getMinutes())}:
                    {pad(d.getSeconds())}
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
      </div>
    </div>
  );
}
