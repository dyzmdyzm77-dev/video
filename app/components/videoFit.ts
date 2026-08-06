// ============================================================================
// 영상 맞춤 모드 (단일 출처)
// ============================================================================
// '화면 맞춤' 버튼이 도는 세 가지 상태다. 단일 영상 화면과 다채널(그리드)이 같은
// 순서·같은 아이콘·같은 문구를 쓴다 — 예전엔 안마다 순서 문자열이 흩어져 있었고
// 아이콘은 자리만 잡아 둔 임시(expand.svg)였다.
//
// 원본 GIF 가 320×214(≈3:2)라 16:9 화면에서는 세 모드가 눈에 띄게 다르다:
//   · fill    영역을 가득 채운다. 비율을 무시하므로 늘어난다. 기본값.
//   · contain 원본 비율 그대로. 남는 자리는 검정(레터박스/필러박스).
//   · cover   원본 비율을 지킨 채 넘치는 쪽만 잘라 가득 채운다.
//
// 기본이 fill 인 건 현행 앱(As Is)이 그렇게 그리고 있어서다 — 개선안이 기본 상태에서
// 다르게 보이면 비교 기준이 흔들린다. 원본이 320×214(≈3:2)라 16:9 뷰에서는 가로로
// 19% 늘어나는데(1.778/1.495), 그건 원래 그런 화면이고 사용자가 버튼으로 바꿀 수 있다.
//
// 아이콘 파일명은 ASCII 로 둔다. 처음엔 한글 파일명("영상_화면 늘리기.svg")을 그대로
// 썼는데 배포에서 전부 404 가 났다 — macOS 파일시스템은 한글을 NFD(자모 분리)로
// 저장하는데 소스 코드의 문자열은 NFC(완성형)라, encodeURIComponent 결과가 서버에
// 있는 실제 경로와 안 맞았다. 눈에는 같은 글자로 보여 찾기 어려운 종류의 버그다.
// 화면에 보이는 이름(VIDEO_FIT_LABEL)은 한글 그대로다.
// ============================================================================

export type VideoFit = "fill" | "contain" | "cover";

/** 버튼을 누를 때 도는 순서 — 원본 비율 유지 → 화면 늘리기 → 화면 채우기. */
export const VIDEO_FIT_ORDER: VideoFit[] = ["contain", "fill", "cover"];

/** 토스트에 띄우는 문구. 아이콘 파일명과 같은 표현을 쓴다. */
export const VIDEO_FIT_LABEL: Record<VideoFit, string> = {
  fill: "화면 늘리기",
  contain: "원본 비율 유지",
  cover: "화면 채우기",
};

const ICON_FILE: Record<VideoFit, string> = {
  fill: "video-fit-fill.svg",
  contain: "video-fit-contain.svg",
  cover: "video-fit-cover.svg",
};

/** 다음 상태. */
export function nextVideoFit(f: VideoFit): VideoFit {
  const i = VIDEO_FIT_ORDER.indexOf(f);
  return VIDEO_FIT_ORDER[(i + 1) % VIDEO_FIT_ORDER.length];
}

/**
 * 그 상태의 아이콘 경로.
 *
 * 버튼에는 '지금 상태'가 아니라 '누르면 될 상태'를 띄운다 — 버튼은 현재를 알려주는
 * 표시가 아니라 실행하는 것이라, 그려진 모양이 곧 누르면 벌어질 일이어야 한다.
 * 그래서 호출부는 videoFitIcon(BASE, nextVideoFit(fit)) 로 쓴다. 누른 뒤 뜨는
 * 토스트는 방금 적용된 모드를 말하므로, 직전에 보고 누른 아이콘과 같은 뜻이 된다.
 */
export function videoFitIcon(base: string, f: VideoFit): string {
  return `${base}/${ICON_FILE[f]}`;
}
