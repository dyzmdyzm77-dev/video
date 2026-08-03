<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 레이아웃 기준

크기·배치가 화면 크기에 따라 바뀌는 규칙은 **`app/components/layoutRules.ts` 가 유일한 출처**다.
컴포넌트 안에서 폭 숫자를 직접 비교하거나 규칙을 새로 만들지 말고, 먼저 그 파일을 읽을 것.
(예전에 480/620 두 기준선이 안마다 따로 굴러다녀서 같은 폭에서 안끼리 다르게 보였다.)

요약 — 자세한 근거와 예외는 `layoutRules.ts` 주석에 있다:

- **단일 영상은 언제나 정확히 16:9.** `globals.css` 의 `.single-video-area` / `.single-video-box`.
  넓고 낮은 화면에선 비율을 깨는 대신 영상이 작아지고 좌우 여백이 생긴다.
  "넓은 화면에서 영상을 늘려 남는 공간을 채우는" 규칙은 쓰지 않는다(여러 번 시도했다가 되돌린 길).
- **카메라 목록 방향(가로 1줄 ↔ 세로 2열)은 폭으로 정하지 않는다.** 남은 세로에 달려 있어서
  폭 기준선으로는 못 가른다. `app/components/useListLayout.ts` 훅 하나를 4개 안이 공유한다.
- **목록 타일의 최소 세로는 `TILE_MIN_H`(48) 하나.** 영역이 아니라 타일에 거는 값이라
  실시간/녹화 어느 모드든 최소값이 같다. 영역의 min-height 는 훅이 제목·여백을 실측해
  더한다 — 모드별 상수를 새로 만들지 말 것.
- **폭만 보는 분기는 `WIDE_BP`(620) 하나.** 현재는 홈 1단↔2단이 유일.
- **기기 폭은 `useDeviceWidth()` / `readDeviceWidth()` 로만 읽는다.** 인라인으로 다시 만들지 말 것.
- **적용 범위는 개선안 4개(A · A-1 · A-2 · B) + 홈.** `AsIsPanel`(현행 앱 재현)과
  `AndroidNav`(OS 태스크바 경계)는 값이 같아도 일부러 안 엮는다.

변경하면 4개 안이 **모두** 같이 바뀌어야 한다 — 하나만 고치지 말 것.
