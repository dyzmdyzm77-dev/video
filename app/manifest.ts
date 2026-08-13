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
    // standalone — 상태바를 남긴다(사용자 확정: "확대든 가로모드든 상태바
    // 제외하고 영상뷰 표시해"). fullscreen 으로 설치하면 안드로이드가 상태바를
    // 아예 없애는데, 노치(컷아웃) 자리를 OS 가 검은 레터박스로 막아 확대에서
    // 노치 쪽에 앱이 못 칠하는 검은 띠가 남았다. standalone 은 상태바가 항상
    // 떠 있고(색은 theme-color 를 따라 세로 흰색/확대 검정 — setBarColor),
    // 영상은 그 아래만 쓴다. 아이폰(투명 상태바)과 같은 그림이다.
    // ※ 설치 순간 박히는 값 — 아이콘을 지우고 다시 추가해야 적용된다.
    display: "standalone",
    display_override: ["standalone"],
    // any — 회전은 OS 에 맡긴다(사용자 확정: "그냥 가로로 돌게 해. 막지 말고").
    // portrait 잠금·CSS 되돌림·센서 가리개로 막아 봤던 이력이 있는데 전부
    // 걷어냈다. 아이폰은 애초에 잠금이 안 먹혔고(실측), 막는 장치들이 자꾸
    // 다른 화면을 깨뜨렸다.
    orientation: "any",
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
