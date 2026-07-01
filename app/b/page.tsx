"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VariantB from "../_variants/VariantB";

// B안. ?platform= 으로 환경(iOS/Android)을 받고, 홈 버튼은 선택 화면(/)으로 보낸다.
function Inner() {
  const router = useRouter();
  const platform =
    useSearchParams().get("platform") === "ios" ? "ios" : "android";
  return <VariantB platform={platform} onHome={() => router.push("/")} />;
}

export default function PageB() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
