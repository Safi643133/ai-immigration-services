import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Ensure proper handling of environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Configure external packages for server components
  serverExternalPackages: ['@aws-sdk/client-textract'],
  // Configure image domains to allow external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ceac.state.gov',
        port: '',
        pathname: '/GenNIV/**',
      },
    ],
    // Allow unoptimized images for external sources
    unoptimized: true,
  },
};

export default nextConfig;
