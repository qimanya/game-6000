/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || '/api/socket'
    },
    async rewrites() {
        return [
            {
                source: '/api/socket',
                destination: '/api/socket'
            },
            {
                source: '/api/socket/:path*',
                destination: '/api/socket/:path*'
            }
        ];
    },
};

module.exports = nextConfig;
