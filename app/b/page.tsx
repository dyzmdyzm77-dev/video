"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import VariantB from "../_variants/VariantB";
import { Inner as HomeScreen } from "../home/page";

// B안. ?platform= 으로 환경(iOS/Android)을, ?chrome=1 이면 가짜 시스템 바를
// 기본 표시(데스크톱 진입 시).
//
// 홈 버튼은 /home 으로 라우터 이동하지 않고 여기서 홈 화면을 대신 렌더한다 —
// iOS 사파리가 URL 이 바뀔 때마다(전체 새로고침이든 router.push 의 pushState 든)
// 접혀 있던 주소창을 다시 펼치기 때문이다. 화면 자체는 /home 과 같은 컴포넌트라
// 시안은 그대로고, 바뀌는 건 "URL 을 안 건드린다"는 것뿐이다. (A-1 과 동일한 방식.)
function Inner() {
  const params = useSearchParams();
  const platform = params.get("platform") === "ios" ? "ios" : "android";
  const initialChrome = params.get("chrome") === "1";
  const [home, setHome] = useState(false);

  if (home) return <HomeScreen onVideo={() => setHome(false)} />;

  return (
    <VariantB
      platform={platform}
      initialChrome={initialChrome}
      onHome={() => setHome(true)}
    />
  );
}

export default function PageB() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
