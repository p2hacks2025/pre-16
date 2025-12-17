import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Next/Turbopack to treat the project root correctly (avoid parent lockfile resolution)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
