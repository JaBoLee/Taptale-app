import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Tap&Tale',
        short_name: 'Tap&Tale',
        description: 'ระบบหลังร้าน Tap&Tale',
        lang: 'th',
        start_url: '/',
        display: 'standalone',
        background_color: '#F7F7F5',
        theme_color: '#1C1B19',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
})
