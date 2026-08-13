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
    // 세로 잠금. 확대 중 폰을 눕히면 iOS 가 화면을 돌리는 모션이 보였는데
    // (사용자 지정: "그땐 돌아가면 안 된다"), 웹에는 상태별 잠금 API 가 없어
    // OS 수준에서 통째로 잠그는 게 유일한 차단 수단이다. 이게 먹히면 회전은
    // 전부 앱이 CSS 로 그리는 것뿐이라 우리가 완전히 통제한다.
    // ※ 이 값은 홈 화면에 '추가하는 순간' 박힌다 — 아이콘을 지우고 다시
    //   추가해야 적용된다. 지난번 시도는 재추가 전에 테스트돼 검증이 안 됐다.
    // ※ 먹히면 '눕혀서 가로'(영상 화면)는 뷰포트 회전이 안 오므로 죽는다 —
    //   가속도 센서로 다시 살리는 게 다음 단계다. 안 먹히면(iOS 가 이 필드를
    //   무시하면) 아이폰 웹에서 회전 차단은 불가능하다는 결론이 된다.
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
