"use client";

import { useEffect, useRef, useState } from "react";
import { BASE } from "../basePath";

// ============================================================================
// '날짜, 시간 선택' 바텀시트 — 네 안이 같이 쓴다
// ============================================================================
// 안(VariantA/A1/A3/B)마다 글자까지 똑같은 사본이 하나씩 있었다. NVR 의 녹화
// 진입에도 쓰고, 클라우드 이벤트 화면의 '언제 것을 볼지' 고르는 데도 쓰게 되면서
// (CloudEventScreen) 다섯 번째 사본이 생길 참이라 여기로 합쳤다.
//
// 아래 ScrollPickerColumn 은 이 시트에서만 쓴다 — 같이 옮겼다.
// ============================================================================

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const DATE_PICK_RANGE = 30; // 오늘 기준 과거 30일 (오늘 포함 31일)

export default function DateTimePickerSheet({
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
