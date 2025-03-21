/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // ✅ Static Export 방식
  images: {
    unoptimized: true, // ✅ Electron에서 이미지 깨짐 방지
  },
  // 폰트 로딩 문제 해결을 위한 설정
  experimental: {
    optimizeFonts: false,
  },
  // 빈 basePath 유지
  basePath: "",
};

module.exports = nextConfig;
