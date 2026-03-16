/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14 默认启用 App Router，不需要 experimental.appDir
  images: {
    // domains 已废弃，使用 remotePatterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.notiontheme.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'file.notion.so',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  }
}

module.exports = nextConfig
