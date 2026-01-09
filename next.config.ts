import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.BACKEND_URL || 'https://1376b1a89b60.ngrok-free.app/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;