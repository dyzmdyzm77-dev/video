"use client";

// 움직임 감지 썸네일 위에 얹는 '유형' 칩.
//
// 썸네일이 85×48 로 아주 작아서 글자 9px·좌우 여백 4px 로 못 박았다 — 더 키우면
// 썸네일 절반을 덮는다. 왼쪽 위 모서리에 붙이는 건 카메라 라벨(다채널 타일)과
// 같은 규칙이라 눈이 같은 자리를 본다.
//
// 색은 두 단계뿐이다. '움직임'은 대부분이라 검정 반투명으로 배경처럼 두고,
// 이상 상황(넘어짐·폭행)만 빨강으로 띄운다 — 화면을 훑을 때 빨간 것만 눈에
// 걸리게 하려는 것. 세 색으로 나누면 작은 칩에서 구분이 안 된다.
//
// 세로 타임라인·가로 시간바, A안·A-1안이 모두 이 하나를 쓴다(안끼리 달라
// 보이면 안 되는 부분이라 VideoFitToast·EventCardFace 처럼 공유한다).

export default function EventKindChip({ kind }: { kind: string }) {
  const alert = kind !== "움직임";
  return (
    <span
      className="pointer-events-none absolute z-10 leading-none"
      style={{
        left: "3px",
        top: "3px",
        padding: "3px 4px",
        borderRadius: "4px",
        fontSize: "9px",
        fontWeight: 600,
        color: "#FFFFFF",
        backgroundColor: alert ? "rgba(226,32,45,0.9)" : "rgba(0,0,0,0.55)",
      }}
    >
      {kind}
    </span>
  );
}
