import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/overlay/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/api/state',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=1, stale-while-revalidate=2' },
        ],
      },
      {
        source: '/api/state/sse',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-transform' },
          { key: 'X-Accel-Buffering', value: 'no' },
        ],
      },
    ];
  },
};

export default nextConfig;

