/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper build output
  distDir: '.next',
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
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

export default nextConfig
