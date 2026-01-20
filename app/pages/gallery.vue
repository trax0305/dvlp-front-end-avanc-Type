<!-- app/pages/gallery.vue -->
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePwaStorage } from '~/composables/usePwaStorage'
import type { PwaPhoto } from '~/types/pwa'

const router = useRouter()
const { getPhotosCache, savePhotosCache } = usePwaStorage()

const selectedRoom = ref<string>('all')
const photosCache = ref(getPhotosCache())

function refresh() {
  photosCache.value = getPhotosCache()
}

onMounted(() => {
  refresh()
})

function goHome() {
  router.push('/')
}

function roomLabel(roomName?: string) {
  const v = (roomName ?? '').trim()
  return v ? v : 'unknown'
}

function createdAtTs(createdAt: string | undefined) {
  if (!createdAt) return 0
  const t = Date.parse(createdAt) // ISO string -> timestamp
  return Number.isNaN(t) ? 0 : t
}

const rooms = computed(() => {
  const set = new Set<string>()
  for (const p of photosCache.value.items) {
    set.add(roomLabel(p.roomName))
  }
  return Array.from(set).sort()
})

const filteredPhotos = computed(() => {
  const all = [...photosCache.value.items].sort(
    (a, b) => createdAtTs(b.createdAt) - createdAtTs(a.createdAt)
  )
  if (selectedRoom.value === 'all') return all
  return all.filter((p) => roomLabel(p.roomName) === selectedRoom.value)
})

function formatDate(createdAt: string | undefined) {
  const ts = createdAtTs(createdAt)
  return ts ? new Date(ts).toLocaleString() : 'Date inconnue'
}

function onDelete(id: string) {
  if (!confirm('Supprimer cette photo ?')) return

  const next = {
    ...photosCache.value,
    items: photosCache.value.items.filter((p: PwaPhoto) => p.id !== id),
  }

  savePhotosCache(next)
  photosCache.value = next
}
</script>

<template>
  <main style="max-width:1000px;margin:20px auto;padding:16px">
    <header
      style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"
    >
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <h1 style="margin:0">Gallery</h1>
        <button type="button" @click="goHome" style="opacity:.9">
          ← Retour accueil
        </button>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label style="display:flex;gap:8px;align-items:center">
          <span style="opacity:.7">Filtre room</span>
          <select v-model="selectedRoom" style="padding:8px">
            <option value="all">Toutes</option>
            <option v-for="r in rooms" :key="r" :value="r">
              {{ r }}
            </option>
          </select>
        </label>

        <button type="button" @click="refresh">Rafraîchir</button>
      </div>
    </header>

    <p style="opacity:.7;margin-top:8px">
      Photos en local : <b>{{ photosCache.items.length }}</b>
    </p>

    <div v-if="filteredPhotos.length === 0" style="opacity:.7;margin-top:18px">
      Aucune photo pour le moment.
    </div>

    <div
      v-else
      style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px"
    >
      <article
        v-for="p in filteredPhotos"
        :key="p.id"
        style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fff"
      >
        <img
          :src="p.base64"
          alt="photo"
          style="width:100%;height:200px;object-fit:cover;display:block"
        />

        <div style="padding:10px">
          <div
            style="display:flex;justify-content:space-between;gap:10px;align-items:center"
          >
            <div
              style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
            >
              {{ roomLabel(p.roomName) }}
            </div>

            <button type="button" @click="onDelete(p.id)" style="opacity:.8">
              Supprimer
            </button>
          </div>

          <div style="opacity:.65;font-size:12px;margin-top:6px">
            {{ formatDate(p.createdAt) }}
            <span v-if="p.synced === false" style="margin-left:8px">• offline</span>
          </div>
        </div>
      </article>
    </div>
  </main>
</template>
