import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: false, // use our own public/manifest.json
    }),
  ],
  server: {
    host: '0.0.0.0', // expose to local network — phone access via laptop IP
    port: 5173,
  },
})
