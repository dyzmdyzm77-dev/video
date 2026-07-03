"use client";

import { usePathname, useRouter } from "next/navigation";

// 데스크톱 전용: 폰 목업 오른쪽의 A/B/C 안 이동 버튼.
// 모바일/터치에선 CSS(.desktop-variant-nav)로 숨긴다.
const VARIANTS = [
  { href: "/a", label: "A안" },
  { href: "/b", label: "B안" },
  { href: "/c", label: "C안" },
];

export default function DesktopVariantNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="desktop-variant-nav" aria-label="화면안 이동">
      {VARIANTS.map((v) => (
        <button
          key={v.href}
          type="button"
          data-active={pathname === v.href}
          onClick={() => {
            // 현재 platform·chrome 쿼리를 유지한 채 해당 안으로 이동.
            const sp = new URLSearchParams(window.location.search);
            const platform = sp.get("platform") === "ios" ? "ios" : "android";
            const chrome = sp.get("chrome") === "1";
            router.push(
              `${v.href}?platform=${platform}${chrome ? "&chrome=1" : ""}`,
            );
          }}
        >
          {v.label}
        </button>
      ))}
    </nav>
  );
}
