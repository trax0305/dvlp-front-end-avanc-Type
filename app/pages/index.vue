<!-- app/pages/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRooms } from '~/composables/useRooms'
import { usePwaStorage } from '~/composables/usePwaStorage'
import { fileToResizedBase64 } from '~/utils/image'

const router = useRouter()

const pseudo = ref('')
const profilePhoto = ref<string | undefined>(undefined)
const quickRoom = ref('xxx')

// input file ref
const fileInput = ref<HTMLInputElement | null>(null)

// camera refs/state
const cameraOpen = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)
let mediaStream: MediaStream | null = null

const { rooms, details, loading, error, fetchRooms, ensureRoom } = useRooms()
const { getUser, saveUser } = usePwaStorage()

onMounted(() => {
  const u = getUser()
  pseudo.value = u?.pseudo ?? ''
  profilePhoto.value = u?.photoBase64
  fetchRooms()
})

function savePseudo() {
  const p = pseudo.value.trim()
  if (!p) return alert('Entre un pseudo')
  saveUser(p, profilePhoto.value)
}

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
    const base64 = await fileToResizedBase64(file, {
      maxWidth: 720,
      quality: 0.7,
    })

    profilePhoto.value = base64

    const p = pseudo.value.trim() || 'SansPseudo'
    saveUser(p, profilePhoto.value)
  } catch (err) {
    console.error(err)
    alert('Impossible de traiter cette image')
  } finally {
    input.value = ''
  }
}

function notifyPhotoSaved() {
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    new Notification('Photo enregistrée', {
      body: 'Ta photo de profil a été mise à jour.',
    })
    return
  }

  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification('Photo enregistrée', {
          body: 'Ta photo de profil a été mise à jour.',
        })
      }
    })
  }
}

async function openCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
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

  const maxWidth = 720
  const scale = w > maxWidth ? maxWidth / w : 1
  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch

  const ctx = canvas.getContext('2d')
  if (!ctx) return alert('Canvas indisponible')

  ctx.drawImage(video, 0, 0, cw, ch)

  const base64 = canvas.toDataURL('image/jpeg', 0.75)
  profilePhoto.value = base64

  const p = pseudo.value.trim() || 'SansPseudo'
  saveUser(p, profilePhoto.value)

  notifyPhotoSaved()
  closeCamera()
}

async function goQuick() {
  const p = pseudo.value.trim()
  if (!p) return alert('Entre un pseudo')

  saveUser(p, profilePhoto.value)

  const name = quickRoom.value.trim()
  if (!name) return alert('Nom de room requis')

  await ensureRoom(name)
  router.push(`/room/${encodeURIComponent(name)}`)
}

function goGallery() {
  router.push('/gallery')
}
</script>

<template>
  <main style="max-width:900px;margin:24px auto;padding:16px">
    <header
      style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"
    >
      <h1 style="margin:0">Chat — Rooms</h1>

      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <!-- Photo de profil -->
        <div style="display:flex;align-items:center;gap:10px">
          <div
            style="width:44px;height:44px;border-radius:999px;overflow:hidden;
                   background:#e5e7eb;display:flex;align-items:center;justify-content:center"
          >
            <img
              v-if="profilePhoto"
              :src="profilePhoto"
              alt="avatar"
              style="width:100%;height:100%;object-fit:cover"
            />
            <span v-else style="opacity:.7;font-size:12px">Photo</span>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            capture="user"
            @change="onPickPhoto"
            style="display:none"
          />

          <button @click="openFilePicker">Choisir photo</button>
          <button @click="openCamera">Prendre une photo</button>
        </div>

        <!-- Pseudo -->
        <div style="display:flex;gap:8px;align-items:center">
          <input v-model="pseudo" placeholder="Ton pseudo" style="padding:8px" />
          <button @click="savePseudo">Enregistrer</button>
        </div>

        <!-- Galerie -->
        <button @click="goGallery">
          📸 Galerie
        </button>
      </div>
    </header>

    <section style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      <input
        v-model="quickRoom"
        placeholder="Nom de room"
        style="padding:8px;min-width:220px"
      />
      <button @click="goQuick">Créer / Rejoindre</button>
      <button @click="fetchRooms" :disabled="loading">
        {{ loading ? '...' : 'Rafraîchir' }}
      </button>
    </section>

    <section style="margin-top:20px">
      <div v-if="loading">Chargement…</div>
      <div v-else-if="error" style="color:#b91c1c">
        {{ error }}
      </div>

      <template v-else>
        <p v-if="rooms.length === 0" style="opacity:.7">
          Aucune room pour l’instant.
        </p>

        <ul v-else>
          <li v-for="r in rooms" :key="r">
            <a href="#" @click.prevent="quickRoom = r; goQuick()">
              {{ r }}
              <span style="opacity:.6">
                — {{ details[r]?.clientsCount ?? 0 }} connecté(s)
              </span>
            </a>
          </li>
        </ul>
      </template>
    </section>

    <!-- Overlay caméra -->
    <div
      v-if="cameraOpen"
      style="position:fixed;inset:0;background:rgba(0,0,0,.65);
             display:flex;align-items:center;justify-content:center;z-index:9999"
    >
      <div style="background:white;border-radius:12px;padding:12px;width:100%;max-width:520px">
        <div style="display:flex;justify-content:space-between">
          <strong>Prendre une photo</strong>
          <button @click="closeCamera">Fermer</button>
        </div>

        <video ref="videoEl" playsinline style="width:100%;margin-top:8px"></video>

        <div style="margin-top:10px;text-align:right">
          <button @click="capturePhoto">Capturer</button>
        </div>
      </div>
    </div>
  </main>
</template>
