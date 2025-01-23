/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build',
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/:token/translate',
        destination: '/translate',
      },
      {
        source: '/:token/deepl',
        destination: '/deepl',
      },
    ];
  },
};

export default nextConfig;
