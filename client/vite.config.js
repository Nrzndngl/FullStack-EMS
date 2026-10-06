import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Local dev: forward /api to the Express server so the same-origin
      // default in src/api/axios.js works without a VITE_BASE_URL.
      '/api': 'http://localhost:4000',
    },
  },
})