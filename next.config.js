const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'pwa.js',
  buildExcludes: [/manifest\.json$/]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable Turbopack for PWA compatibility
  turbopack: {},
  webpack: (config, { dev }) => {
    if (!dev) {
      // PWA specific webpack config for production
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  }
};

module.exports = withPWA(nextConfig);
