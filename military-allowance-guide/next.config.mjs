/** @type {import('next').NextConfig} */
const preview = process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 정적 미리보기(npm run build:preview): 서버 없이 열리는 HTML 묶음으로 내보냅니다.
  ...(preview ? { output: "export", trailingSlash: true, images: { unoptimized: true } } : {}),
};
export default nextConfig;
