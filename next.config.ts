import { deploymentEnvironment } from './scripts/deployment-environment.mjs';
import type { NextConfig } from "next";

const deployment = deploymentEnvironment();

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  experimental: { ...(process.env.CI ? { cpus: 2 } : {}) },
  async headers() {
    return deployment.isStaging ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] : [];
  },
  async rewrites() {
    if (!apiBaseUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
