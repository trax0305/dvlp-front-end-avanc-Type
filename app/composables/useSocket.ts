// app/composables/useSocket.ts
import { shallowRef } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'
import { io, type Socket } from 'socket.io-client'

const socketRef = shallowRef<Socket | null>(null)

export function useSocket() {
  const { public: { socketUrl } } = useRuntimeConfig()

  if (!socketRef.value) {
    socketRef.value = io(socketUrl, {
      path: "/socket.io",
      transports: ['polling', 'websocket'],
      // ne mets pas path tant que tu n’es pas sûr
    })

    socketRef.value.on("connect", () =>
      console.log("✅ socket connected", socketRef.value?.id)
    )
    socketRef.value.on("disconnect", (reason) =>
      console.log("❌ socket disconnected", reason)
    )
    socketRef.value.on("connect_error", (err) =>
      console.log("🔥 connect_error", err.message, err)
    )
    socketRef.value.onAny((event, ...args) =>
      console.log("⬇️ event", event, args)
    )
  }

  return { socket: socketRef }
}
