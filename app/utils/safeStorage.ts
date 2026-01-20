// app/utils/safeStorage.ts
export const safeStorage = {
  get(key: string) {
    if (typeof window === 'undefined') return null
    try { return localStorage.getItem(key) } catch { return null }
  },
  set(key: string, val: string) {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(key, val) } catch {}
  }
}
