import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env file from the parent directory
  const env = loadEnv(mode, '../', '');

  // If the port isn't defined, we throw an error immediately to enforce it
  if (!env.VITE_FRONTEND_PORT) {
    throw new Error("VITE_FRONTEND_PORT is missing in the root .env file!");
  }

  return {
    envDir: '../', 
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: true,         // bind 0.0.0.0 — required inside Docker
      port: parseInt(env.VITE_FRONTEND_PORT),
      watch: {
        usePolling: true, // HMR polling — required for Docker volume mounts on Windows/Mac
      },
    },
  }
})
