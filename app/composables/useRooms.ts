// app/composables/useRooms.ts
import { ref } from 'vue'
import { $fetch } from 'ofetch'

export function useRooms() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const rooms = ref<string[]>([])
  const details = ref<Record<string, { clientsCount: number }>>({})

  async function fetchRooms() {
    loading.value = true; error.value = null
    try {
      const res = await $fetch<{ rooms: string[]; details: Record<string, { clientsCount: number }> }>('/api/rooms')
      rooms.value = res.rooms ?? []
      details.value = res.details ?? {}
    } catch (e: any) {
      error.value = e?.message ?? 'Erreur chargement rooms'
    } finally {
      loading.value = false
    }
  }

  // Création/join: d’après ce que tu avais reçu, on ping /socketio/chat/:name
  async function ensureRoom(name: string) {
    await $fetch(`/api/ensure-room/${encodeURIComponent(name)}`, { method: 'POST' })
    await fetchRooms()
    return name
  }

  return { rooms, details, loading, error, fetchRooms, ensureRoom }
}
