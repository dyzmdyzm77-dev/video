"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VariantA from "../_variants/VariantA";

// A안. ?platform= 으로 환경(iOS/Android)을 받고, 홈 버튼은 선택 화면(/)으로 보낸다.
function Inner() {
  const router = useRouter();
  const platform =
    useSearchParams().get("platform") === "ios" ? "ios" : "android";
  return <VariantA platform={platform} onHome={() => router.push("/")} />;
}

export default function PageA() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
