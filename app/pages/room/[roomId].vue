<!-- app/pages/room/[roomId].vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChatRoom, type SocketMessage } from '~/composables/useChatRoom'
import { usePwaStorage } from '~/composables/usePwaStorage'
import { fileToResizedBase64 } from '~/utils/image'

const route = useRoute()
const roomId = computed(() => String(route.params.roomId || 'general'))

const pseudo = ref('Anonyme')

// storage
const { getUser, saveUser, addPhoto, getPhotosCache } = usePwaStorage()

// cache photos (pour afficher dans la room)
const photosCache = ref(getPhotosCache())
function refreshPhotos() {
  photosCache.value = getPhotosCache()
}
const photoById = computed(() => {
  const map = new Map<string, string>()
  for (const p of photosCache.value.items) {
    map.set(p.id, p.base64)
  }
  return map
})

// --- caméra state
const cameraOpen = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)
let mediaStream: MediaStream | null = null

// input file ref
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  const u = getUser()
  if (u?.pseudo) {
    pseudo.value = u.pseudo
  } else {
    const ask = (prompt('Choisis un pseudo :') || 'Anonyme').trim()
    pseudo.value = ask || 'Anonyme'
    saveUser(pseudo.value)
  }
})

const { messages, sendMessage } = useChatRoom(roomId, pseudo)

const text = ref('')
function send() {
  const t = text.value.trim()
  if (!t) return
  sendMessage(t)
  text.value = ''
}

function formatTime(m: SocketMessage) {
  const d = new Date(m.dateEmis || Date.now())
  return d.toLocaleTimeString()
}

// ---- Détecter si un message est une photo
function extractPhotoId(content: string | undefined): string | null {
  if (!content) return null
  const m = content.match(/^\[photo:(.+?)\]$/)
  return m ? m[1] : null
}

// ---- Upload photo
function openFilePicker() {
  fileInput.value?.click()
}

async function onPickPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Fichier image requis')
    input.value = ''
    return
  }

  try {
    const base64 = await fileToResizedBase64(file, { maxWidth: 900, quality: 0.75 })

    const photo = addPhoto({
      roomName: roomId.value,
      base64,
      synced: false,
    })
    refreshPhotos()

    sendMessage(`[photo:${photo.id}]`)
  } catch (err) {
    console.error(err)
    alert('Impossible de traiter cette image')
  } finally {
    input.value = ''
  }
}

// ---- Caméra
async function openCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
    cameraOpen.value = true
    await new Promise((r) => setTimeout(r, 0))

    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream
      await videoEl.value.play()
    }
  } catch (err) {
    console.error(err)
    alert("Impossible d'accéder à la caméra")
    closeCamera()
  }
}

function closeCamera() {
  cameraOpen.value = false
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.srcObject = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
}

function capturePhoto() {
  if (!videoEl.value) return
  const video = videoEl.value
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return alert('Caméra pas prête')

  const maxWidth = 900
  const scale = w > maxWidth ? maxWidth / w : 1
  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return alert('Canvas indisponible')

  ctx.drawImage(video, 0, 0, cw, ch)

  const base64 = canvas.toDataURL('image/jpeg', 0.78)

  const photo = addPhoto({
    roomName: roomId.value,
    base64,
    synced: false,
  })
  refreshPhotos()

  sendMessage(`[photo:${photo.id}]`)
  closeCamera()
}
</script>

<template>
  <main style="max-width:900px;margin:20px auto;padding:16px">
    <h1>Room: {{ roomId }}</h1>
    <p style="opacity:.7">Connecté en tant que <b>{{ pseudo || '...' }}</b></p>

    <div
      style="border:1px solid #ddd;border-radius:8px;padding:8px;height:55vh;overflow:auto;margin:8px 0;background:#fff"
    >
      <div v-for="(m,i) in messages" :key="i" style="margin:10px 0">
        <div>
          <b>{{ m.categorie === 'INFO' ? '•' : m.pseudo }}</b>
          <small style="opacity:.6"> · {{ formatTime(m) }}</small>
        </div>

        <template v-if="m.categorie === 'MESSAGE'">
          <!-- Photo message -->
          <template v-if="extractPhotoId(m.content)">
            <div style="margin-top:6px">
              <img
                v-if="photoById.get(extractPhotoId(m.content)!)"
                :src="photoById.get(extractPhotoId(m.content)!)"
                alt="photo"
                style="max-width:100%;border-radius:10px;border:1px solid #e5e7eb"
              />
              <div v-else style="opacity:.7;font-style:italic">
                Photo introuvable en local (pas encore synchronisée ?)
              </div>
            </div>
          </template>

          <!-- Normal text -->
          <div v-else>
            {{ m.content }}
          </div>
        </template>

        <div v-else style="opacity:.7"><i>{{ m.content }}</i></div>
      </div>
    </div>

    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <!-- Photo buttons -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        capture="environment"
        @change="onPickPhoto"
        style="display:none"
      />
      <button type="button" @click="openFilePicker">Choisir photo</button>
      <button type="button" @click="openCamera">Prendre photo</button>

      <!-- Message input -->
      <input
        v-model="text"
        @keyup.enter="send"
        placeholder="Votre message…"
        style="flex:1;min-width:240px;padding:10px;border:1px solid #ddd;border-radius:8px"
      />
      <button @click="send">Envoyer</button>
    </div>

    <!-- Overlay caméra -->
    <div
      v-if="cameraOpen"
      style="position:fixed;inset:0;background:rgba(0,0,0,.65);
             display:flex;align-items:center;justify-content:center;
             padding:16px;z-index:9999"
    >
      <div style="background:white;border-radius:12px;max-width:520px;width:100%;padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <strong>Photo (room)</strong>
          <button type="button" @click="closeCamera">Fermer</button>
        </div>

        <div style="margin-top:10px;background:#111;border-radius:12px;overflow:hidden">
          <video ref="videoEl" playsinline style="width:100%;display:block"></video>
        </div>

        <div style="margin-top:10px;display:flex;gap:10px;justify-content:flex-end">
          <button type="button" @click="capturePhoto">Capturer</button>
        </div>
      </div>
    </div>
  </main>
</template>
