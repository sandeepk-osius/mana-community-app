import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      // Forward all /api/* requests to the Spring Boot backend
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        // Do NOT rewrite the path — Spring listens on /api/...
      },
    },
  },
})
