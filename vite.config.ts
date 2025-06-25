import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Handle API routes in development
            if (req.url?.startsWith('/api/chat')) {
              // Import and handle the chat API
              import('./src/api/chat.js').then(module => {
                if (module.POST) {
                  module.POST(req).then(response => {
                    response.body?.pipeTo(res);
                  });
                }
              });
            }
          });
        }
      }
    }
  }
});