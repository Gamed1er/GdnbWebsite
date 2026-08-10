import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'i.ytimg.com' },                   // YouTube 縮圖
      { hostname: '*.googleusercontent.com' },        // Google 頭貼
    ],
  },
};

export default nextConfig;
