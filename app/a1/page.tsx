"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VariantA1 from "../_variants/VariantA1";

// A-1안(A안 복사본). ?platform= 으로 환경(iOS/Android)을, ?chrome=1 이면 가짜
// 시스템 바를 기본 표시(데스크톱 진입 시). 홈 버튼은 홈 화면(/home)으로 보낸다.
function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const platform = params.get("platform") === "ios" ? "ios" : "android";
  const initialChrome = params.get("chrome") === "1";
  return (
    <VariantA1
      platform={platform}
      initialChrome={initialChrome}
      onHome={() =>
        router.push(
          `/home?platform=${platform}${initialChrome ? "&chrome=1" : ""}&from=a1`,
        )
      }
    />
  );
}

export default function PageA1() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
