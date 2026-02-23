/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/n8n/unified',
                destination: '/api/integrations/n8n/unified',
            },
            {
                source: '/api/n8n/updates',
                destination: '/api/integrations/n8n/updates',
            },
            {
                source: '/api/n8n/metadata',
                destination: '/api/integrations/n8n/metadata',
            },
        ];
    },
};

export default nextConfig;
