/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@warri-vibe/engine', '@warri-vibe/content'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
