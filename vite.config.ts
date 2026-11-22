import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages เสิร์ฟที่ /<repo>/ — workflow ส่ง BASE_PATH มาให้; ที่อื่นใช้ '/'
const base = process.env.BASE_PATH ? process.env.BASE_PATH.replace(/\/?$/, '/') : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { navigateFallbackDenylist: [/\/privacy/] },
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'Tap&Tale',
        short_name: 'Tap&Tale',
        description: 'ระบบหลังร้าน Tap&Tale',
        lang: 'th',
        start_url: base,
        display: 'standalone',
        background_color: '#F7F7F5',
        id: base,
        scope: base,
        orientation: 'portrait',
        theme_color: '#1E1B16',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
