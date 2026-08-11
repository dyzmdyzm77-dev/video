"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import VariantA from "./VariantA";
import VariantA1 from "./VariantA1";
import VariantB from "./VariantB";
import { Inner as HomeScreen } from "../home/page";
import { useVariant, type VariantKey } from "../components/variantRoute";
import { LANDSCAPE_EVENT } from "../components/deviceRotate";
import {
  noteDeviceOrientation,
  syncImmersiveWithLandscape,
} from "../components/immersive";

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
  //
  // 듣는 신호가 둘이다: 앱 안의 회전(LANDSCAPE_EVENT)과 실기기를 손으로 눕힌
  // 것(resize·orientationchange). 후자는 앱이 아무 플래그도 안 남기고 뷰포트만
  // 바뀌므로 크기 이벤트로 알아채야 한다.
  //
  // 크기 이벤트는 데스크톱 미리보기에선 안 듣는다 — 거기서 뷰포트가 바뀌는 건
  // 프리셋을 고르거나 기기 테두리를 드래그한 것이지 '눕힌' 게 아니다. 가로로
  // 긴 프리셋(864×648 등)을 골랐다고 확대로 들어가면 곤란하다.
  //
  // 홈 화면에선 하지 않는다 — 영상이 없는 화면이라 눕혔다고 확대할 게 없다.
  useEffect(() => {
    if (home) return;
    // 기준값(지금 방향)은 한 틱 뒤에 잡는다. 이 effect 는 좌측 패널
    // (DesktopVariantNav)의 effect 보다 먼저 도는데, --device-w/h 를 심는 건
    // 그쪽이다. 지금 바로 읽으면 데스크톱 미리보기에서 브라우저 창 크기
    // (1280×720 = 가로)를 기준으로 잡아 버려, 정작 회전했을 때 '이미 가로였다'로
    // 보고 아무 일도 안 한다.
    const baseline = setTimeout(syncImmersiveWithLandscape, 0);
    const desktopPreview =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const evts = desktopPreview
      ? [LANDSCAPE_EVENT]
      : [LANDSCAPE_EVENT, "resize", "orientationchange"];
    evts.forEach((e) => window.addEventListener(e, syncImmersiveWithLandscape));
    // 프리셋·크기 변경은 '눕힌' 게 아니라 다른 기기를 고른 것 — 확대는 건드리지
    // 않고 기준 방향만 새로 기록한다. 이걸 안 하면 1080(가로) 을 보다가 360 으로
    // 바꿨을 때 '이미 가로였다'로 남아, 360 에서 눕혀도 확대가 안 켜졌다.
    const noteEvts = ["devicechange", "devicerange", "deviceresize"];
    noteEvts.forEach((e) => window.addEventListener(e, noteDeviceOrientation));
    return () => {
      clearTimeout(baseline);
      evts.forEach((e) =>
        window.removeEventListener(e, syncImmersiveWithLandscape),
      );
      noteEvts.forEach((e) =>
        window.removeEventListener(e, noteDeviceOrientation),
      );
    };
  }, [home]);

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
