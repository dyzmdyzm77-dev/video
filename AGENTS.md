<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 레이아웃 기준

크기·배치가 화면 크기에 따라 바뀌는 규칙은 **`app/components/layoutRules.ts` 가 유일한 출처**다.
컴포넌트 안에서 폭 숫자를 직접 비교하거나 규칙을 새로 만들지 말고, 먼저 그 파일을 읽을 것.
(예전에 480/620 두 기준선이 안마다 따로 굴러다녀서 같은 폭에서 안끼리 다르게 보였다.)

요약 — 자세한 근거와 예외는 `layoutRules.ts` 주석에 있다:

- **단일 영상은 기본이 정확히 16:9.** `globals.css` 의 `.single-video-area` / `.single-video-box`.
  넓고 낮은 화면에선 비율을 깨는 대신 영상이 작아지고 좌우 여백이 생긴다.
  **예외 하나 — 카메라 목록이 가로 스크롤일 때는 16:9 를 넘겨 세로로 늘어난다.**
  목록 스트립을 108 로 못 박고 남는 세로를 영상이 다 가져가기 때문(620×780 에서
  1.52:1 까지). 상한을 푸는 건 CSS 가 아니라 `useListLayout` 이 인라인으로 한다 —
  CSS 에 `flex-grow` 를 켜면 어느 배치에서든 영상이 먼저 다 먹어 목록이 붕괴한다.
  세로 2열일 땐 목록이 남는 세로를 쓰므로 영상은 16:9 그대로.
- **카메라 목록 방향(가로 1줄 ↔ 세로 2열)은 폭으로 정하지 않는다.** 세로 2열로
  "완전히 보이는 2개 + 반쯤 보이는 2개"(=1.5줄)에 못 미치면 가로로 넘어간다.
  `app/components/useListLayout.ts` 훅 하나를 안들이 공유한다.
- **가로 1줄일 때 목록 영역 높이 = 움직임 감지 탭 높이(`MOTION_MIN_H` 108).**
  최소가 아니라 **정확히 그 값**으로 못 박는다(실시간·녹화 공통) — 두 탭(카메라
  목록 · 움직임 감지) 스트립이 1px 도 안 어긋나야 한다. 목록만 늘려 타일을 키우면
  감지 탭보다 두꺼워 보인다. 못 박고 남는 세로는 위 영상이 가져간다.
  A안 얘기다 — A-1·B의 감지 탭은 세로 타임라인이라 영역을 채우는 게 맞다.
- **목록 최소 크기는 배치별로 기준이 다르다.** 가로 한 줄이면 타일 세로 `TILE_MIN_H`(48),
  세로 2열이면 영역 높이 `LIST_MIN_H`(138). 가로 한 줄 쪽은 타일에 거는 값이라
  실시간/녹화 어느 모드든 최소값이 같다 — 영역의 min-height 는 훅이 제목·여백을 실측해
  더하므로 모드별 상수를 새로 만들지 말 것.
- **폭만 보는 분기는 `WIDE_BP`(620) 하나.** 현재는 홈 1단↔2단이 유일.
- **기기 폭은 `useDeviceWidth()` / `readDeviceWidth()` 로만 읽는다.** 인라인으로 다시 만들지 말 것.
- **적용 범위는 개선안 3개(A · A-1 · B) + 홈.** `AsIsPanel`(현행 앱 재현)과
  `AndroidNav`(OS 태스크바 경계)는 값이 같아도 일부러 안 엮는다.

변경하면 3개 안이 **모두** 같이 바뀌어야 한다 — 하나만 고치지 말 것.
