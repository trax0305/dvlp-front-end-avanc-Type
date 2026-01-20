// server/api/ensure-room/[name].post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useStorage } from 'nitropack/runtime'

type RoomsCache = {
  items: string[]
  updatedAt: string
}

function sanitizeRoomName(raw: string) {
  const name = raw.trim()
  // tu peux ajuster la règle si tu veux autoriser plus
  if (!name) return null
  if (name.length > 32) return null
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) return null
  return name
}

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'name') || ''
  const name = sanitizeRoomName(raw)

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom de room invalide',
    })
  }

  // Stockage serveur (Nitro) : pratique pour "mémoriser" un minimum en dev
  // MAIS ton offline côté client reste dans localStorage via usePwaStorage.
  const storage = useStorage('data')
  const key = 'rooms-cache'

  const current = (await storage.getItem<RoomsCache>(key)) ?? {
    items: [],
    updatedAt: new Date().toISOString(),
  }

  if (!current.items.includes(name)) {
    current.items.push(name)
    current.items.sort()
    current.updatedAt = new Date().toISOString()
    await storage.setItem(key, current)
  }

  return { ok: true, name }
})
