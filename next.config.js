const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/app-landing/:path*',
        destination: '/:path*',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/app-landing',
      },
      {
        source: '/:path((?!api|note-app|_next|app-landing|login|favicon.ico|robots.txt|sitemap.xml).*)',
        destination: '/app-landing/:path',
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
