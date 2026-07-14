/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'res.cloudinary.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com'
    ],
  },
  // Transpile firebase packages for compatibility
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/app'],
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  webpack: (config, { isServer }) => {
    // Fix for firebase with Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    // Exclude undici from client bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
