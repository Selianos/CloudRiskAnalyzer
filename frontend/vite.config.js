import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,         // bind 0.0.0.0 — required inside Docker
    port: 5173,
    watch: {
      usePolling: true, // HMR polling — required for Docker volume mounts on Windows/Mac
    },
  },
})

