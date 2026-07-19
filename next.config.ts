import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
  transpilePackages: ['@/lib/ksp-data'],
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
