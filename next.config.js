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
        source: '/:token/deepl/translate',
        destination: '/deepl/translate',
      },
    ];
  },
};

export default nextConfig;
