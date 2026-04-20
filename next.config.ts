import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standard production config
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    unoptimized: true,
  },
  
  // Ensure proper static file handling
  trailingSlash: false,
  
  // Experimental features for better static serving
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // // Remove console logs in production for security and performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Let nginx handle all proxying in production
  // But for local development, we add rewrites here:
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
    return [
      {
        source: '/api/proxy/:path*',
        // Jika backendUrl sudah punya /api/v1, jangan tambahkan lagi
        destination: backendUrl.includes('/api/v1') 
          ? `${backendUrl}/:path*` 
          : `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;