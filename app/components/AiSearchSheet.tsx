"use client";

import { BASE } from "../basePath";

// 딤 오른쪽 아래 AI 버튼을 누르면 뜨는 바텀시트.
// 겉모습·동작(배경 딤, 아래에서 올라오기, 닫기)은 더보기(MoreSheet)·시안 목록
// (VariantPicker) 시트와 같은 규칙 — 같은 화면의 시트들이 서로 달라 보이면 안 된다.
//
// 높이만 다르다: 화면 세로의 80% 를 차지한다(사용자 요청). 목록 몇 줄이 아니라
// '대화창'이라 오갈 말이 쌓일 자리가 필요하고, 열자마자 그 자리가 보여야 무엇을
// 하는 화면인지 읽힌다. 그래서 제목은 위, 입력창은 아래에 붙이고 그 사이를 비운다.
//
// 입력창은 '모양만'이다 — 실제로 칠 수 없고 키보드도 안 뜬다(사용자 결정).
// UT 에서 보여 주려는 건 'AI 로 찾을 수 있다'는 화면이지 대화 자체가 아니고,
// 이 앱은 스크롤 없는 고정 화면이라 키보드가 뜨면 화면이 밀려 올라간 채
// 돌아오지 않는 문제도 있었다. 그래서 input 이 아니라 그냥 글자로 그린다 —
// readOnly input 은 포커스가 잡혀 커서가 깜빡이고 기기에 따라 키보드도 뜬다.

const PLACEHOLDER = "예) 어제 오후에 사람이 지나간 장면 찾아줘";

export default function AiSearchSheet({
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
      {/* 시트 — 화면 세로의 80%. */}
      <div
        className={`absolute inset-x-0 mx-auto w-full max-w-[480px] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          bottom: 0,
          height: "80%",
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          transform: open ? "translateY(0%)" : "translateY(100%)",
          boxShadow: open ? undefined : "none",
        }}
      >
        {/* 헤더 — 작은 제목 위, 큰 제목 아래. 닫기는 오른쪽 위. */}
        <div
          className="flex flex-none items-start justify-between"
          style={{ padding: "24px 20px 0" }}
        >
          <div className="flex flex-col">
            <span
              className="text-[13px] font-semibold leading-none"
              style={{ color: "#1D6CEB", marginBottom: "8px" }}
            >
              AI 검색 기능
            </span>
            <h2 className="text-[20px] font-bold leading-none text-neutral-900">
              무엇을 도와드릴까요?
            </h2>
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

        {/* 대화 영역 — 주고받은 말이 쌓일 자리. 아직 비어 있다. */}
        <div className="min-h-0 flex-1" />

        {/* 입력창 모양 — 누를 수 없다(위 주석 참고). */}
        <div
          aria-hidden
          className="flex flex-none items-center"
          style={{
            margin: "0 20px 24px",
            height: "48px",
            padding: "0 6px 0 16px",
            borderRadius: "24px",
            backgroundColor: "#F4F5F7",
          }}
        >
          <span
            className="min-w-0 flex-1 truncate text-[15px] leading-none"
            style={{ color: "#A4A4A4" }}
          >
            {PLACEHOLDER}
          </span>
          <span
            className="flex flex-none items-center justify-center rounded-full"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "#D2D5DA",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 19V5" />
              <path d="M6 11l6-6 6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
