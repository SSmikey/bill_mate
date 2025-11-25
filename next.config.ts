import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable SWR caching for better performance
  swcMinify: true,

  // Production optimizations
  compress: true,
  productionBrowserSourceMaps: false,

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
    };
    return config;
  },
};

export default nextConfig;