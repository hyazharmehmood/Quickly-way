/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
    ],
  },
  turbopack: {
    // Path aliases are handled by jsconfig.json
  },
  // Exclude problematic routes from static generation
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Skip static generation for specific routes
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

module.exports = nextConfig;

