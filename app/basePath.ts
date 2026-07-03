// 깃허브 페이지처럼 하위 경로(/video)에 배포될 때 public 자산·수동 네비게이션에
// 붙이는 접두사. next/link, router.push 는 next.config 의 basePath 로 자동 처리되지만
// <img src="/...">, window.location 은 직접 붙여야 한다.
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
