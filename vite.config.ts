import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Vite dev server proxies /api/messages → https://api.anthropic.com/v1/messages
// This avoids CORS issues so the API key can be passed from the browser safely.
// When you add a real backend later, just change the proxy target to your backend URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api/messages': {
        target: 'https://api.anthropic.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/messages/, '/messages'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Strip browser-identifying headers
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
            // Inject API key from .env.local for local development
            const devKey = process.env.ANTHROPIC_API_KEY
            if (devKey) proxyReq.setHeader('x-api-key', devKey)
          })
        },
      },
    },
  },
})
