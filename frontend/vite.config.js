import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Spring Boot backend runs on :8080. Proxying /api through the dev server
// avoids CORS, so the backend needs no extra configuration.
// Override the target with the API_TARGET environment variable if needed.
const apiTarget = process.env.API_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
