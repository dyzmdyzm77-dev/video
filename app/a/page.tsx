"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VariantA from "../_variants/VariantA";

// A안. ?platform= 으로 환경(iOS/Android)을, ?chrome=1 이면 가짜 시스템 바를
// 기본 표시(데스크톱 진입 시). 홈 버튼은 선택 화면(/)으로 보낸다.
function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const platform = params.get("platform") === "ios" ? "ios" : "android";
  const initialChrome = params.get("chrome") === "1";
  return (
    <VariantA
      platform={platform}
      initialChrome={initialChrome}
      onHome={() => router.push("/")}
    />
  );
}

export default function PageA() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
