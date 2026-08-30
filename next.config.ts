import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Background images are optimized in the browser before being sent to a Server Action.
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
