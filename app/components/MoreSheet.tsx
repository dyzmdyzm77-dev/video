"use client";

import { BASE } from "../basePath";

// 딤의 '더보기'(⋮)를 누르면 뜨는 바텀시트.
// 겉모습·동작(배경 딤, 아래에서 올라오기, 닫기)은 시안 목록 시트(VariantPicker)와
// 같은 규칙을 쓴다 — 같은 화면에서 두 시트가 서로 달라 보이면 안 된다.
//
// 항목은 사용자가 지정한 다섯: 상세 설정 · 알고리즘 설정 · 안심모드 ·
// 원격 지원 요청 · 방문 지원 요청.
// 눌렀을 때 어디로 갈지는 아직 정해지지 않아, 지금은 시트를 닫기만 한다.
// 목적지가 정해지면 onSelect 를 받아 호출부에서 처리하면 된다.

const ITEMS = [
  "상세 설정",
  "알고리즘 설정",
  "안심모드",
  "원격 지원 요청",
  "방문 지원 요청",
] as const;

export default function MoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-40"
      aria-hidden={!open}
    >
      {/* 배경 딤 */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: open ? 1 : 0 }}
        onClick={onClose}
      />
      {/* 시트 */}
      <div
        className={`absolute inset-x-0 mx-auto w-full max-w-[480px] flex max-h-[90%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          bottom: 0,
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          transform: open ? "translateY(0%)" : "translateY(100%)",
          // 닫혔을 땐 그림자를 끈다: 시트 윗변이 화면 하단에 걸쳐 shadow-2xl 이
          // 화면 안쪽 하단 가장자리로 새어 올라오는 걸 막는다(VariantPicker 와 동일).
          boxShadow: open ? undefined : "none",
        }}
      >
        {/* 헤더 — 세로가 모자라도 이 줄은 안 줄인다(사용자 지정 2026-08-14:
            "괜히 타이틀 부분 마진 줄이지말고"). 모자라는 건 아래 항목이 스크롤로 먹는다. */}
        <div
          className="flex flex-none items-center justify-between"
          style={{ height: "74px", padding: "0 20px" }}
        >
          <h2 className="text-[20px] font-bold leading-none text-neutral-900">
            더보기
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

        {/* 항목 — 시트가 화면에 다 안 들어가면(가로 모드처럼 세로가 짧을 때)
            여기만 스크롤한다. 스크롤바는 감춘다(앱 다른 목록과 같은 규칙). */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ padding: "0 20px 24px" }}
        >
          {ITEMS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={onClose}
              className="flex items-center text-left"
              style={{ height: "56px" }}
            >
              <span className="text-[16px] font-medium leading-none text-[#262626]">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
