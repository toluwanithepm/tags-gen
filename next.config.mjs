/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'standalone' as it's not needed for Vercel
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Configure for deployment
  poweredByHeader: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: [],
    unoptimized: false,
  },
}

export default nextConfig
