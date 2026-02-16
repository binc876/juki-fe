import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  output: 'standalone',
  
  // Ensure proper asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  
  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    unoptimized: true,
  },
  
  // Let nginx handle all proxying - no Next.js rewrites needed
};

export default nextConfig;