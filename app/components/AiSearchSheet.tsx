"use client";

import { useEffect, useRef, useState } from "react";
import { BASE } from "../basePath";

// 딤 오른쪽 아래 AI 버튼을 누르면 뜨는 바텀시트.
// 겉모습·동작(배경 딤, 아래에서 올라오기, 닫기)은 더보기(MoreSheet)·시안 목록
// (VariantPicker) 시트와 같은 규칙 — 같은 화면의 시트들이 서로 달라 보이면 안 된다.
//
// 다만 높이는 다르다: 화면 세로의 80% 를 차지한다(사용자 요청). 목록 몇 줄이
// 아니라 '대화창'이라 위쪽에 오갈 말이 쌓일 자리가 필요하고, 열자마자 그 자리가
// 보여야 무엇을 하는 화면인지 읽힌다. 그래서 제목은 위, 입력창은 아래에 붙이고
// 그 사이를 대화 영역으로 비워 둔다.
//
// 내용은 사용자가 지정한 셋: 작은 제목 'AI 검색 기능', 큰 제목 '무엇을
// 도와드릴까요?', 입력창 하나.
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
  // 키보드가 가린 높이(px). 시트를 그만큼 띄워 입력창이 안 가리게 한다.
  const [keyboard, setKeyboard] = useState(0);

  // 열릴 때마다 빈 입력으로 시작한다. 자동 포커스는 안 한다 — 이 앱은 스크롤이
  // 없는 고정 화면(100svh)이라, 열자마자 키보드가 올라오면 브라우저가 입력창을
  // 보이게 하려고 화면을 통째로 밀어 올려 버린다(사용자 지적). 사용자가 입력창을
  // 직접 눌렀을 때만 키보드가 뜨고, 그때는 아래 visualViewport 처리가 받는다.
  useEffect(() => {
    if (open) setText("");
  }, [open]);

  // 키보드 대응 — 움직이는 건 입력창뿐이다.
  // 모바일 브라우저는 입력창에 포커스가 가면 (1) 뷰포트를 키보드 높이만큼 줄이고
  // (2) 입력창이 보이도록 페이지를 스크롤한다. 이 앱은 스크롤이 없는 화면이라
  // (2)가 앱 전체를 위로 밀어 올린 채 돌아오지 않는다. 그래서 스크롤은 즉시
  // 되돌린다(scrollTo 0).
  //
  // 시트 자체는 자리도 크기도 그대로 둔다 — 키보드가 떴다고 바텀시트가 통째로
  // 떠오르면 안 된다(사용자 지적). 대신 시트 안쪽에 키보드 높이만큼 아래 여백을
  // 줘서 입력창만 키보드 위로 올라오고, 그만큼 대화 영역이 줄어든다.
  useEffect(() => {
    if (!open) {
      setKeyboard(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboard(Math.max(0, Math.round(hidden)));
      // 브라우저가 밀어 올린 만큼 되돌린다.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, [open]);

  const submit = () => {
    if (!text.trim()) return;
    setText("");
    inputRef.current?.blur();
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
      {/* 시트 — 화면 세로의 80%. */}
      <div
        className={`absolute inset-x-0 mx-auto w-full max-w-[480px] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          bottom: 0,
          height: "80%",
          // 키보드에 가린 만큼은 시트 안쪽에서 비운다 — 시트는 안 움직이고
          // 입력창만 키보드 위로 올라온다.
          paddingBottom: `${keyboard}px`,
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
        <div className="min-h-0 flex-1 overflow-y-auto" />

        {/* 입력창 — 시트 아래에 붙는다. 폼으로 감싸 모바일 키보드의 '이동/완료'
            키로도 보낼 수 있게 한다. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-none items-center"
          style={{
            margin: "0 20px 24px",
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
