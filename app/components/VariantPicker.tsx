"use client";

import { BASE } from "../basePath";
import { requestVariant, type VariantKey } from "./variantRoute";

// 상단 위치명("8층 사무실 A/B")을 누르면 뜨는 바텀시트.
// A안·B안 사이를 전환한다. 현재 보고 있는 안에는 체크 표시.

// 순서·라벨은 사용자가 정한다(2026-08-11: A안 → 'A-2안', 자리는 두 번째).
// 라우트(/a)는 그대로다 — 공유해 둔 링크가 깨지지 않게 이름만 바꿨다.
const OPTIONS: { key: VariantKey; label: string }[] = [
  { key: "a1", label: "A-1안" },
  { key: "a", label: "A-2안" },
  { key: "b", label: "B안" },
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
  /** 지금은 안 쓴다 — 안 전환이 URL 을 안 건드리므로 쿼리를 다시 붙일 일이 없다.
   *  호출부(세 안)가 전부 넘기고 있어 시그니처만 남겨 둔다. */
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
                  // URL 을 안 건드리고 같은 화면 안에서 안만 갈아끼운다(AppShell).
                  // 예전엔 router.push 로 라우트를 옮겼는데, iOS 사파리가 URL 이
                  // 바뀔 때마다 접혀 있던 툴바를 다시 펼치고 이 앱은 스크롤이
                  // 없어 그게 다시 안 접혔다(variantRoute.ts).
                  else requestVariant(o.key);
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
