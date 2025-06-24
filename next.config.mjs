/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  // Ensure CSS is properly processed
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Configure for deployment
  poweredByHeader: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
