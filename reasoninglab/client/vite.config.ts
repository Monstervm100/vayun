import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // cast avoids a type-identity clash between vite 8 and the plugin's bundled vite types
  plugins: [react(), tailwindcss() as unknown as PluginOption],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
    },
  },
})
