import { $fetch } from 'ofetch'
import { defineEventHandler, getRouterParam } from 'h3'
import { useRuntimeConfig } from '#imports'

type AnyHistory =
  | { success?: boolean; data?: any; history?: any; messages?: any }
  | any[]

export default defineEventHandler(async (event) => {
  const { public: { apiBase } } = useRuntimeConfig(event)
  const room = getRouterParam(event, 'room')!

  const candidates = [
    `${apiBase}/socketio/api/messages/${encodeURIComponent(room)}`,
    `${apiBase}/socketio/api/history/${encodeURIComponent(room)}`
  ]

  let raw: AnyHistory | null = null
  for (const url of candidates) {
    try {
      raw = await $fetch<AnyHistory>(url, { method: 'GET' })
      if (raw) break
    } catch {
      /* on tente le suivant */
    }
  }

  const normalize = (x: any): { user: string; text: string; ts: number }[] => {
    if (!x) return []
    const data = Array.isArray(x) ? x
      : Array.isArray(x?.messages) ? x.messages
      : Array.isArray(x?.history) ? x.history
      : Array.isArray(x?.data) ? x.data
      : []
    return data.map((m: any) => ({
      user: String(m?.user?.pseudo ?? m?.user ?? m?.pseudo ?? 'inconnu'),
      text: String(m?.text ?? ''),
      ts: Number(m?.ts ?? Date.now())
    }))
  }

  return { room, history: normalize(raw) }
})
