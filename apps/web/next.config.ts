import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo: standalone çıktısı workspace paketlerini de izleyebilsin
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
