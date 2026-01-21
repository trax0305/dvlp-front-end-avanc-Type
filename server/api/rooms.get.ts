import { $fetch } from 'ofetch'
import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

type RoomsDoc = {
  success?: boolean
  metadata?: unknown
  data?: Record<string, { clients?: Record<string, any> }>
}

export default defineEventHandler(async (event) => {
  const { public: { apiBase } } = useRuntimeConfig(event)

  const base = (apiBase || '').replace(/\/+$/, '')
  const res = await $fetch<RoomsDoc>(`${base}/socketio/api/rooms`, { method: 'GET' })

  const data = res?.data ?? {}
  const rooms = Object.keys(data)

  const details = Object.fromEntries(
    Object.entries(data).map(([name, info]) => [
      name,
      { clientsCount: Object.keys(info?.clients ?? {}).length }
    ])
  )

  return { rooms, details }
})
