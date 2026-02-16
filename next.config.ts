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
  
  // Let nginx handle all proxying - no Next.js rewrites needed
};

export default nextConfig;