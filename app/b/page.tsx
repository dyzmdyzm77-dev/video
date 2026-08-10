"use client";

import { Suspense } from "react";
import AppShell from "../_variants/AppShell";

// B안. 화면 전환(안 바꾸기·홈 가기)은 전부 AppShell 이 상태로 처리한다 —
// URL 을 안 건드려야 iOS 사파리 툴바가 다시 펼쳐지지 않는다(variantRoute.ts).
export default function PageB() {
  return (
    <Suspense>
      <AppShell initialVariant="b" />
    </Suspense>
  );
}
