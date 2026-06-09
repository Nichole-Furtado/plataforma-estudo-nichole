/** @type {import('next').NextConfig} */

// Em desenvolvimento, faz proxy de /api para o backend local.
// Em produção (Vercel), o frontend chama o backend direto via NEXT_PUBLIC_API_URL,
// então nenhum rewrite é necessário.
const backendProxy = process.env.BACKEND_PROXY_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Só ativa o proxy quando rodando localmente (sem NEXT_PUBLIC_API_URL definido).
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendProxy}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
