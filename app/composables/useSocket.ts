// app/composables/useSocket.ts
import { shallowRef } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'
import { io, type Socket } from 'socket.io-client'

const socketRef = shallowRef<Socket | null>(null)

export function useSocket() {
  const { public: { socketUrl } } = useRuntimeConfig()

  if (!socketRef.value) {
    // ✅ PROD : same-origin pour éviter CORS (Nginx proxy /socket.io)
    // ✅ DEV  : socketUrl (ex: '/' avec proxy Vite)
    const url =
      process.env.NODE_ENV === 'production'
        ? '/'
        : (socketUrl || '/')

    socketRef.value = io(url, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: false,
    })

    socketRef.value.on('connect', () =>
      console.log('✅ socket connected', socketRef.value?.id)
    )

    socketRef.value.on('disconnect', (reason) =>
      console.log('❌ socket disconnected', reason)
    )

    socketRef.value.on('connect_error', (err) =>
      console.log('🔥 connect_error', err.message, err)
    )

    socketRef.value.onAny((event, ...args) =>
      console.log('⬇️ event', event, args)
    )
  }

  return { socket: socketRef }
}

