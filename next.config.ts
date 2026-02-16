import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove rewrites since nginx handles the proxy
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/proxy/:path*',
  //       destination: `https://juki-service.rurustudio.cloud/api/v1/:path*`,
  //     },
  //   ];
  // },
  
  // Keep headers for CORS (though nginx should handle this too)
  async headers() {
    return [
      {
        source: '/api/proxy/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, ngrok-skip-browser-warning',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;