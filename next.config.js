/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/socket.io/:path*',
                destination: 'http://localhost:3001/socket.io/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
