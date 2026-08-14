import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 깃허브 페이지 등 정적 호스팅용 HTML 내보내기 (out/ 폴더 생성)
  output: "export",
  // 깃허브 페이지 프로젝트 사이트는 /video 하위 경로에서 서빙된다.
  // 배포 워크플로에서 NEXT_PUBLIC_BASE_PATH=/video 로 주입하고,
  // 로컬 dev 에서는 비워 두어 기존과 동일하게 동작한다.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  // dev 서버를 localhost 외 출처(클라우드플레어 터널, 같은 Wi-Fi의 폰 등)에서
  // 열 때, Next 가 cross-origin 자원을 막아 하이드레이션이 실패한다(=터치 안 됨).
  // 모바일 미리보기용 출처를 허용한다.
  // IP 는 공유기가 다시 나눠 주면 바뀐다 — 하나만 박아 두면 그 다음 날 폰에서
  // 하이드레이션이 조용히 실패한다(화면은 뜨는데 아무 것도 안 눌린다).
  // 사설망 대역을 통째로 열어 둔다. dev 서버에만 쓰이는 설정이다.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "localhost",
  ],
};

export default nextConfig;
