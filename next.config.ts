import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  // Ignore TypeScript errors during build
  typescript: {
    // !! WARN !!
    // Ignoring TypeScript errors can lead to runtime errors
    // Only use this as a temporary solution
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
