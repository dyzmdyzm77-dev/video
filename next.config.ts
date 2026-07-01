import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev 서버를 localhost 외 출처(클라우드플레어 터널, 같은 Wi-Fi의 폰 등)에서
  // 열 때, Next 가 cross-origin 자원을 막아 하이드레이션이 실패한다(=터치 안 됨).
  // 모바일 미리보기용 출처를 허용한다.
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.68.122"],
};

export default nextConfig;
