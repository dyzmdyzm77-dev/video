"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import VariantA from "./VariantA";
import VariantA1 from "./VariantA1";
import VariantB from "./VariantB";
import { Inner as HomeScreen } from "../home/page";
import { useVariant, type VariantKey } from "../components/variantRoute";
import { LANDSCAPE_EVENT } from "../components/deviceRotate";
import { syncImmersiveWithLandscape } from "../components/immersive";

// 세 화면안(A · A-1 · B)과 홈 화면을 한 자리에서 갈아끼우는 껍데기.
// /a1 · /a2 · /b (와 옛 /a) 라우트가 전부 이걸 렌더하고, 다른 건 initialVariant 뿐이다.
//
// 왜 라우터 이동을 안 쓰나 — iOS 사파리는 URL 이 바뀌면 접혀 있던 주소창/툴바를
// 다시 펼치는데 이 앱은 스크롤이 없어 그게 다시 안 접힌다. 홈 탭도 같은 이유로
// /home 대신 여기서 홈 화면을 렌더한다. 자세한 배경은 components/variantRoute.ts.
//
// ?platform= 으로 환경(iOS/Android)을, ?chrome=1 이면 가짜 시스템 바를 기본
// 표시(데스크톱 진입 시). 안을 바꿔도 이 값들은 그대로 이어진다 — URL 이 안
// 바뀌니 쿼리를 다시 붙일 일도 없다.
export default function AppShell({
  initialVariant,
}: {
  initialVariant: VariantKey;
}) {
  const params = useSearchParams();
  const platform = params.get("platform") === "ios" ? "ios" : "android";
  const initialChrome = params.get("chrome") === "1";
  const variant = useVariant(initialVariant);
  const [home, setHome] = useState(false);

  // 방향이 바뀌면 확대 상태를 맞춘다 — 눕히면 영상만 보이는 화면으로 들어가고,
  // 세우면 돌아온다(immersive.ts 의 syncImmersiveWithLandscape). 안이 아니라
  // 여기서 거는 이유는, 안이 갈아끼워져도 구독이 끊기지 않아야 해서다.
  useEffect(() => {
    syncImmersiveWithLandscape();
    window.addEventListener(LANDSCAPE_EVENT, syncImmersiveWithLandscape);
    return () =>
      window.removeEventListener(LANDSCAPE_EVENT, syncImmersiveWithLandscape);
  }, []);

  if (home) return <HomeScreen onVideo={() => setHome(false)} />;

  const shared = {
    platform,
    initialChrome,
    onHome: () => setHome(true),
  } as const;

  if (variant === "a2") return <VariantA {...shared} />;
  if (variant === "b") return <VariantB {...shared} />;
  return <VariantA1 {...shared} />;
}
