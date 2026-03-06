import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@aether-deck/types', '@aether-deck/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cards.scryfall.io' },
      { protocol: 'https', hostname: 'api.scryfall.com' },
    ],
  },
};

export default nextConfig;