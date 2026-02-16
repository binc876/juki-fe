import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `https://juki-service.rurustudio.cloud/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;