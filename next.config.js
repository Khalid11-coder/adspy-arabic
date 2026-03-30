/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // هذا السطر اللي بيشغل الـ 54 إعلان الحقيقية
      },
    ],
  },
};

module.exports = nextConfig;