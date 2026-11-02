import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /api -> the .NET backend (verified on http://localhost:5289)
    proxy: {
      '/api': {
        target: 'http://localhost:5289',
        changeOrigin: true,
        // Forward the original host header so Identity cookie auth works
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Forwarded-Host', 'localhost:5173')
          })
        },
      },
    },
  },
})
