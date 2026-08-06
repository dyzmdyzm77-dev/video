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
// 아이콘은 public/ 의 한글 파일명이라 경로에 공백·한글이 들어간다. 그대로 src 에
// 넣으면 브라우저마다 인코딩이 갈리므로 videoFitIcon() 이 encodeURIComponent 를
// 거쳐 만든다.
// ============================================================================

export type VideoFit = "fill" | "contain" | "cover";

/** 버튼을 누를 때 도는 순서. */
export const VIDEO_FIT_ORDER: VideoFit[] = ["fill", "contain", "cover"];

/** 토스트에 띄우는 문구. 아이콘 파일명과 같은 표현을 쓴다. */
export const VIDEO_FIT_LABEL: Record<VideoFit, string> = {
  fill: "화면 늘리기",
  contain: "원본 비율 유지",
  cover: "화면 채우기",
};

const ICON_FILE: Record<VideoFit, string> = {
  fill: "영상_화면 늘리기.svg",
  contain: "영상_원본 비율 유지.svg",
  cover: "영상_화면 채우기.svg",
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
  return `${base}/${encodeURIComponent(ICON_FILE[f])}`;
}
