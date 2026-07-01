"use client";

import { useRouter } from "next/navigation";
import PlatformSelect from "./components/PlatformSelect";

// 루트(/): 미리보기 환경(iOS/Android) 선택 화면.
// 고르면 /a?platform=... 로 이동해 A안으로 진입한다. 이후 변형 전환(A↔B↔C)·
// 홈 버튼에서도 이 platform 쿼리가 유지된다.
export default function Page() {
  const router = useRouter();
  return (
    <PlatformSelect onSelect={(p) => router.push(`/a?platform=${p}`)} />
  );
}
