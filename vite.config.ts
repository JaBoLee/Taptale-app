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
      workbox: { navigateFallbackDenylist: [/^\/privacy/] },
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'Tap&Tale',
        short_name: 'Tap&Tale',
        description: 'ระบบหลังร้าน Tap&Tale',
        lang: 'th',
        start_url: '/',
        display: 'standalone',
        background_color: '#F7F7F5',
        id: '/',
        scope: '/',
        orientation: 'portrait',
        theme_color: '#1C1B19',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
