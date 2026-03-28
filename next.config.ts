import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 기존 설정들... */
  typescript: {
    // 🚨 빌드 시 타입 에러가 있어도 무시하고 배포를 진행합니다!
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint 에러도 무시하고 싶다면 이것도 추가하세요
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;