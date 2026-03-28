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
  
  // Let nginx handle all proxying in production
  // But for local development, we add rewrites here:
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;