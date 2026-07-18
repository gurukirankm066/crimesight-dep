import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [],
  transpilePackages: ['@/lib/ksp-data'],
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;