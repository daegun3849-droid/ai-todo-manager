// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 기존 설정들... */
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint 부분은 완전히 삭제하세요!
};

export default nextConfig;