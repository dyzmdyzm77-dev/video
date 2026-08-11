"use client";

import { Suspense } from "react";
import AppShell from "../_variants/AppShell";

// 옛 주소. 한때 A안(지금의 A-2안)이었지만 지금은 기본인 A-1안으로 연다 —
// 이 링크를 저장해 둔 사람이 A-2안으로 떨어지던 걸 막는다.
// A-2안의 주소는 /a2 다.
export default function PageA() {
  return (
    <Suspense>
      <AppShell initialVariant="a1" />
    </Suspense>
  );
}
