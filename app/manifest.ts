import type { MetadataRoute } from "next";

// 이 프로젝트는 정적 내보내기(output: "export")라 라우트도 정적으로 굳혀야 한다.
export const dynamic = "force-static";

// 홈 화면에 추가해서 '앱처럼' 열기 위한 매니페스트.
//
// 왜 필요한가 — 브라우저 탭에서 전체화면 API 를 쓰면 안드로이드 크롬이
// "전체 화면 보기에서 나가려면…" 안내를 반드시 띄운다. 사용자가 빠져나올
// 방법을 모르면 갇히니 브라우저가 강제하는 것이라 웹에서 끌 수 없다.
// 설치된 앱(홈 화면에 추가)으로 열면 그 안내 없이도 시스템 바가 안 뜬다.
//
//   display: "fullscreen" — 안드로이드에서 상태바·내비게이션 바까지 숨긴다.
//                           (설치해서 연 경우에만 적용된다. 탭에선 무시.)
//   아이폰 사파리는 이 필드를 안 본다 — 대신 layout.tsx 의 appleWebApp
//   (apple-mobile-web-app-capable)이 사파리 UI 를 걷는다. 상태바는 남는다.
//
// UT 안내: 크롬/사파리 메뉴 → '홈 화면에 추가' 로 열면 안내 문구 없이 꽉 찬다.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "에스원 CCTV",
    short_name: "에스원 CCTV",
    description: "8층 사무실 실시간 영상",
    start_url: `${BASE}/a1`,
    display: "fullscreen",
    // 설치 환경이 fullscreen 을 못 쓰면 순서대로 물러난다.
    display_override: ["fullscreen", "standalone"],
    // 세로 잠금. 사양이 "눕혀도 전환 없음, 가로는 확대 버튼으로만"으로
    // 확정되면서(2026-08-13) 잠그는 게 맞아졌다 — 확대의 가로는 OS 회전이
    // 아니라 앱의 CSS 회전이라 잠금과 무관하다.
    // 아이폰은 이 필드를 무시한다(아이콘 재추가까지 확인한 실측). 거기는
    // globals.css 의 강제 세로 규칙 + StatusInset 의 치수 맞바꿈이 대신 세운다.
    // 안드로이드는 진짜로 잠겨 회전 모션 자체가 없다.
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: `${BASE}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${BASE}/icon-512.png`, sizes: "512x512", type: "image/png" },
      {
        src: `${BASE}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
