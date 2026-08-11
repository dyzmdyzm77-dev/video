"use client";

import { useEffect, useRef, useState } from "react";
import { BASE } from "../basePath";

// 딤 오른쪽 아래 AI 버튼을 누르면 뜨는 바텀시트.
// 겉모습·동작(배경 딤, 아래에서 올라오기, 닫기)은 더보기(MoreSheet)·시안 목록
// (VariantPicker) 시트와 같은 규칙 — 같은 화면의 시트들이 서로 달라 보이면 안 된다.
//
// 내용은 사용자가 지정한 셋: 작은 제목 'AI 검색 기능', 큰 제목 '무엇을
// 도와드릴까요?', 그 아래 입력창 하나.
// 보낸 뒤 무엇을 보여줄지는 아직 정해지지 않아, 지금은 입력을 비우고 닫기만 한다.

const PLACEHOLDER = "예) 어제 오후에 사람이 지나간 장면 찾아줘";

export default function AiSearchSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 열릴 때마다 빈 입력으로 시작하고 커서를 넣어 준다 — 열자마자 바로 칠 수 있게.
  // 시트가 다 올라온 뒤(300ms) 포커스한다: 올라오는 중에 포커스하면 모바일에서
  // 키보드가 시트를 밀어 올려 애니메이션이 튄다.
  useEffect(() => {
    if (!open) return;
    setText("");
    const id = setTimeout(() => inputRef.current?.focus(), 320);
    return () => clearTimeout(id);
  }, [open]);

  const submit = () => {
    if (!text.trim()) return;
    setText("");
    onClose();
  };

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
          boxShadow: open ? undefined : "none",
        }}
      >
        {/* 헤더 — 작은 제목 위, 큰 제목 아래. 닫기는 오른쪽 위. */}
        <div
          className="flex items-start justify-between"
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

        {/* 입력창 — 오른쪽 끝에 보내기 버튼. 폼으로 감싸 모바일 키보드의
            '이동/완료' 키로도 보낼 수 있게 한다. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center"
          style={{
            margin: "20px 20px 24px",
            height: "48px",
            padding: "0 6px 0 16px",
            borderRadius: "24px",
            backgroundColor: "#F4F5F7",
          }}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            aria-label="AI 검색어"
            className="min-w-0 flex-1 bg-transparent text-[15px] leading-none text-neutral-900 outline-none placeholder:text-[#A4A4A4]"
          />
          <button
            type="submit"
            aria-label="보내기"
            className="flex flex-none items-center justify-center rounded-full"
            style={{
              width: "36px",
              height: "36px",
              // 빈 입력이면 눌러도 하는 일이 없으므로 흐리게 — disabled 를 안 쓰는
              // 이유는 다른 시트들과 같다(누를 수는 있고 결과만 없다).
              backgroundColor: text.trim() ? "#1D6CEB" : "#D2D5DA",
              transition: "background-color 150ms ease-out",
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
          </button>
        </form>
      </div>
    </div>
  );
}
