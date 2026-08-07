"use client";

// 움직임 감지 이벤트 카드에서 썸네일 자리에 들어가는 '썸네일 없음' 대체 면.
// 카메라·NVR 사양상 정지 프레임을 못 뽑는 경우를 위한 것 — 자세한 배경과 켜고
// 끄는 방법은 eventThumbs.ts 참고.
//
// 크기는 호출부(썸네일 박스)가 정한다. 이 컴포넌트는 그 안을 100% 채우기만 한다 —
// 카드가 커지거나 줄면 레일 높이가 흔들려 시간바·목록 스트립 높이 규칙
// (layoutRules.ts)까지 같이 어긋난다. 그래서 폭·높이를 여기서 만들지 않는다.
//
// 들어가는 건 두 줄뿐: 타이틀("움직임 감지") + 이벤트 시각. 85×48 에 두 줄이라
// 글자가 작다 — 더 넣지 말 것. 가로/세로 타임라인, A안·A-1안이 모두 이 하나를
// 쓴다(안끼리 달라 보이면 안 되는 부분이라 VideoFitToast 처럼 공유한다).
//
// 썸네일(어두운 영상)과 달리 흰 배경 + 회색 테두리다 — 이미지가 아니라 정보
// 카드라는 걸 한눈에 구분하려는 것. 텍스트는 좌측 정렬, 타이틀만 파랑.

const pad = (n: number) => String(n).padStart(2, "0");

export function formatEventTime(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function EventCardFace({ ms }: { ms: number }) {
  return (
    // 흰 배경 + 회색 테두리. 감싸는 박스와 같은 rounded-md 라 모서리가 겹친다.
    // 호출부는 이때 박스의 bg-neutral-900 을 아예 빼야 한다 — 덮는 게 아니라
    // 없애는 것. 남겨 두면 라운드 모서리에서 검정이 비친다.
    <div
      className="flex h-full w-full flex-col justify-center gap-[3px] rounded-md"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #D9D9D9",
        paddingLeft: "6px",
        paddingRight: "4px",
      }}
    >
      <span
        className="leading-none"
        style={{ fontSize: "9px", fontWeight: 600, color: "#1D6CEB" }}
      >
        움직임 감지
      </span>
      <span
        suppressHydrationWarning
        className="leading-none"
        style={{ fontSize: "13px", fontWeight: 500, color: "#353535" }}
      >
        {formatEventTime(ms)}
      </span>
    </div>
  );
}
