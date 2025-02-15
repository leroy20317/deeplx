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
      {
        source: '/:token/underline/translate',
        destination: '/underline/translate',
      },
    ];
  },
};

export default nextConfig;
