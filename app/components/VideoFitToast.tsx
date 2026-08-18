"use client";

import { useEffect, useRef, useState } from "react";
import { VIDEO_FIT_LABEL, nextVideoFit, type VideoFit } from "./videoFit";

// '화면 맞춤' 버튼의 상태 + 토스트를 한 덩어리로 묶는다.
// 쓰는 곳이 여섯이라(안 3개 × 단일·다채널) 각자 useState/타이머를 들고 있으면
// 순서나 문구가 금방 갈린다 — 실제로 아이콘이 임시(expand.svg)로 남아 있던 것도
// 그렇게 흩어져 있었기 때문이다.

export function useVideoFit(initial: VideoFit = "cover") {
  const [fit, setFit] = useState<VideoFit>(initial);
  const [toast, setToast] = useState<string | null>(null);
  // key 는 같은 문구를 연속으로 띄울 때도 등장 애니메이션을 다시 태우기 위한 것.
  const [toastKey, setToastKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const cycle = () => {
    const next = nextVideoFit(fit);
    setFit(next);
    setToast(VIDEO_FIT_LABEL[next]);
    setToastKey((k) => k + 1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2000);
  };

  return { fit, cycle, toast, toastKey };
}

/** 알약 모양 — 두 배치가 공유한다(다른 토스트: 탐색·화면 캡처와 같은 규칙). */
const PILL: React.CSSProperties = {
  height: "32px",
  padding: "0 16px",
  borderRadius: "32px",
  backgroundColor: "rgba(34, 34, 34, 0.9)",
  whiteSpace: "nowrap",
};

/**
 * 토스트. 기본은 영역 하단에서 20px 위, 가운데 — 부모가 position:relative 여야 한다.
 *
 * inline 이면 자리를 차지하며 흐름 안에 앉는다(가로 화면용). 가로는 아래가
 * 시간바·아이콘 줄로 꽉 차 있어서, 절대 위치로 20px 을 띄우면 그 위에 겹친다 —
 * 그 줄들과 같은 층에 넣고 위로 쌓는다.
 */
export function VideoFitToast({
  text,
  toastKey,
  inline,
}: {
  text: string | null;
  toastKey?: number;
  inline?: boolean;
}) {
  if (!text) return null;
  const label = (
    <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500 }}>
      {text}
    </span>
  );
  if (inline) {
    return (
      <div
        key={toastKey}
        className="toast-slide-up pointer-events-none mx-auto mb-2 flex w-fit items-center justify-center"
        style={PILL}
      >
        {label}
      </div>
    );
  }
  return (
    <div
      key={toastKey}
      className="toast-slide-up pointer-events-none absolute left-1/2 z-20 flex items-center justify-center"
      style={{ ...PILL, bottom: "20px", transform: "translateX(-50%)" }}
    >
      {label}
    </div>
  );
}
