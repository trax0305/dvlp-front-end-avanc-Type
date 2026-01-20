type StoredEnvelope<T> = {
  v: 1
  savedAt: string // ISO
  data: T
}

function nowIso() {
  return new Date().toISOString()
}

function isClient() {
  return typeof window !== 'undefined'
}

export function useLocalStore() {
  function setJSON<T>(key: string, value: T) {
    if (!isClient()) return
    const envelope: StoredEnvelope<T> = { v: 1, savedAt: nowIso(), data: value }
    localStorage.setItem(key, JSON.stringify(envelope))
  }

  function getJSON<T>(key: string): T | null {
    if (!isClient()) return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as StoredEnvelope<T> | T

      // compat si tu avais stocké sans envelope avant
      if (typeof parsed === 'object' && parsed && 'data' in parsed) {
        return (parsed as StoredEnvelope<T>).data
      }
      return parsed as T
    } catch {
      return null
    }
  }

  function remove(key: string) {
    if (!isClient()) return
    localStorage.removeItem(key)
  }

  function has(key: string) {
    if (!isClient()) return false
    return localStorage.getItem(key) !== null
  }

  function clearPrefix(prefix: string) {
    if (!isClient()) return
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  }

  return { setJSON, getJSON, remove, has, clearPrefix }
}
