import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
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