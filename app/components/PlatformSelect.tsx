"use client";

// A안 진입 전 미리보기 환경 선택 화면.
// iOS  → 하단 safe-area(≈34px) + 상단 가짜 바 없음(실제 iOS 상태바 사용)
// Android → 하단 안드로이드 네비 + 상단 가짜 안드로이드 바
export default function PlatformSelect({
  onSelect,
}: {
  onSelect: (platform: "android" | "ios") => void;
}) {
  return (
    <div className="app-safe-frame flex h-full w-full flex-col items-center justify-center gap-10 bg-white px-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[22px] font-bold leading-tight text-neutral-900">
          에스원 CCTV
        </h1>
        <p className="text-[14px] leading-snug text-neutral-500">
          어떤 환경으로 미리볼까요?
        </p>
      </div>

      <div className="flex w-full max-w-[320px] flex-col gap-3">
        <button
          type="button"
          onClick={() => onSelect("ios")}
          className="flex flex-col items-start gap-1 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left transition active:scale-[0.98] active:bg-neutral-50"
        >
          <span className="text-[17px] font-bold text-neutral-900">iOS</span>
          <span className="text-[13px] text-neutral-500">
            하단 홈 인디케이터 여백 · 상단 바 없음
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect("android")}
          className="flex flex-col items-start gap-1 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left transition active:scale-[0.98] active:bg-neutral-50"
        >
          <span className="text-[17px] font-bold text-neutral-900">
            Android
          </span>
          <span className="text-[13px] text-neutral-500">
            하단 네비게이션 바 · 상단 상태바
          </span>
        </button>
      </div>
    </div>
  );
}
