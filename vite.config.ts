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
          // Strip browser-identifying headers so Anthropic treats this as a server request
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
    },
  },
})
