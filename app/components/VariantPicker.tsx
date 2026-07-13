"use client";

import { BASE } from "../basePath";

// 상단 위치명("8층 사무실 A/B")을 누르면 뜨는 바텀시트.
// A안·B안 사이를 전환한다. 현재 보고 있는 안에는 체크 표시.
type VariantKey = "a" | "a1" | "b";

const OPTIONS: { key: VariantKey; label: string; href: string }[] = [
  { key: "a", label: "A안", href: "/a" },
  { key: "a1", label: "A-1안", href: "/a1" },
  { key: "b", label: "B안", href: "/b" },
];

export default function VariantPicker({
  open,
  current,
  onClose,
  platform,
}: {
  open: boolean;
  current: VariantKey;
  onClose: () => void;
  // 변형 전환 시에도 선택한 환경(iOS/Android)을 URL 쿼리로 이어준다.
  platform?: "android" | "ios";
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
            화면안 선택
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

        {/* 옵션 목록 */}
        <div className="flex flex-col" style={{ padding: "0 20px 24px" }}>
          {OPTIONS.map((o) => {
            const selected = o.key === current;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  if (selected) onClose();
                  else {
                    // window.location 은 next 라우터가 아니라 basePath 가 자동으로 안 붙는다.
                    // 현재 URL 의 chrome(데스크톱 가짜 시스템 바) 플래그는 이어준다.
                    const chrome =
                      new URLSearchParams(window.location.search).get(
                        "chrome",
                      ) === "1";
                    const qs = [
                      platform ? `platform=${platform}` : "",
                      chrome ? "chrome=1" : "",
                    ]
                      .filter(Boolean)
                      .join("&");
                    window.location.assign(
                      `${BASE}${o.href}${qs ? `?${qs}` : ""}`,
                    );
                  }
                }}
                className="flex items-center justify-between border-b border-neutral-100 text-left"
                style={{ height: "56px" }}
              >
                <span
                  className="text-[16px] leading-none"
                  style={{
                    color: selected ? "#1D6CEB" : "#262626",
                    fontWeight: selected ? 700 : 500,
                  }}
                >
                  {o.label}
                </span>
                {selected && (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1D6CEB"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
