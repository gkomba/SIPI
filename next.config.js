/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desabilitar completamente o SWC
  swcMinify: false,
  compiler: {
    // Forçar uso do Babel
    removeConsole: false,
  },
  experimental: {
    // Desabilitar transformações SWC
    forceSwcTransforms: false,
    esmExternals: false,
    serverComponentsExternalPackages: ['@ai-sdk/google']
  },
  // Configuração webpack para compatibilidade
  webpack: (config, { dev, isServer }) => {
    // Fallbacks para Node.js APIs
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    // Configurações específicas para desenvolvimento
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: false,
      }
    }
    
    return config
  },
  // Configurações de transpilação
  transpilePackages: [],
  // Desabilitar otimizações que usam SWC
  optimizeFonts: false,
}

module.exports = nextConfig