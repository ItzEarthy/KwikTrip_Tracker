import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allows LAN access (e.g., 192.168.x.x)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Backend container or local API
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
