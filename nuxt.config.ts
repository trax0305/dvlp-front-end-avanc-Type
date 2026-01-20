// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
const isProd = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  compatibilityDate: '2025-10-23',
  pages: true,
  modules: ['@vite-pwa/nuxt'],

  runtimeConfig: {
    public: {
      // ✅ en dev: mets "/" pour passer par le proxy vite (same-origin => pas de CORS)
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || '/',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      // ✅ idem pour fetch API : on passera par "/socketio/api" qui sera proxifié
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/socketio/api',
    }
  },

  // ✅ PROXY DEV (vite)
  vite: {
    server: {
      proxy: {
        // Socket.IO endpoint
        '/socket.io': {
          target: 'https://api.tools.gavago.fr',
          changeOrigin: true,
          ws: true,
          secure: true,
        },

        // API REST du prof
        '/socketio/api': {
          target: 'https://api.tools.gavago.fr',
          changeOrigin: true,
          secure: true,
        },
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    devOptions: { enabled: false },
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
    workbox: isProd ? { navigateFallback: '/offline.html' } : {}
  }
})
