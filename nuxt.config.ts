// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    devOptions: { enabled: true },
    manifest: {
      name: 'Dvlp FE Avancé - Cam PWA',
      short_name: 'CamPWA',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#111827',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: { navigateFallback: '/offline.html' }
  }
})
