import { useLocalStore } from './useLocalStore'
import { LS_KEYS, roomKey } from '../constants/storageKeys'
import type {
  PwaUser,
  PwaRoomsCache,
  PwaRoomHistory,
  PwaMessage,
  PwaPhotosCache,
  PwaPhoto,
  PwaLastPosition,
} from '../types/pwa'

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

export function usePwaStorage() {
  const { getJSON, setJSON } = useLocalStore()

  // ---- USER
  function getUser(): PwaUser | null {
    return getJSON<PwaUser>(LS_KEYS.user)
  }

  function saveUser(pseudo: string, photoBase64?: string) {
    const user: PwaUser = { pseudo, photoBase64, updatedAt: nowIso() }
    setJSON(LS_KEYS.user, user)
    return user
  }

  // ---- ROOMS
  function getRoomsCache(): PwaRoomsCache | null {
    return getJSON<PwaRoomsCache>(LS_KEYS.rooms)
  }

  function saveRoomsCache(cache: PwaRoomsCache) {
    setJSON(LS_KEYS.rooms, { ...cache, updatedAt: nowIso() })
  }

  // ---- ROOM HISTORY
  function getRoomHistory(roomName: string): PwaRoomHistory {
    return (
      getJSON<PwaRoomHistory>(roomKey(roomName)) ?? {
        roomName,
        messages: [],
        updatedAt: nowIso(),
      }
    )
  }

  function saveRoomHistory(history: PwaRoomHistory) {
    setJSON(roomKey(history.roomName), { ...history, updatedAt: nowIso() })
  }

  function addMessage(roomName: string, msg: Omit<PwaMessage, 'id' | 'roomName' | 'createdAt'>) {
    const history = getRoomHistory(roomName)
    const newMsg: PwaMessage = {
      id: uid('msg'),
      roomName,
      createdAt: nowIso(),
      ...msg,
    }
    history.messages.push(newMsg)
    history.updatedAt = nowIso()
    saveRoomHistory(history)
    return newMsg
  }

  // ---- PHOTOS
  function getPhotosCache(): PwaPhotosCache {
    return (
      getJSON<PwaPhotosCache>(LS_KEYS.photos) ?? {
        items: [],
        updatedAt: nowIso(),
      }
    )
  }

  function savePhotosCache(cache: PwaPhotosCache) {
    setJSON(LS_KEYS.photos, { ...cache, updatedAt: nowIso() })
  }

  function addPhoto(photo: Omit<PwaPhoto, 'id' | 'createdAt'>) {
    const cache = getPhotosCache()
    const item: PwaPhoto = { id: uid('photo'), createdAt: nowIso(), ...photo }
    cache.items.unshift(item)
    cache.updatedAt = nowIso()
    savePhotosCache(cache)
    return item
  }

  // ---- GEO (si besoin)
  function getLastPosition(): PwaLastPosition | null {
    return getJSON<PwaLastPosition>(LS_KEYS.lastPosition)
  }

  function saveLastPosition(pos: PwaLastPosition) {
    setJSON(LS_KEYS.lastPosition, pos)
  }

  return {
    // user
    getUser,
    saveUser,

    // rooms
    getRoomsCache,
    saveRoomsCache,

    // room history
    getRoomHistory,
    saveRoomHistory,
    addMessage,

    // photos
    getPhotosCache,
    savePhotosCache,
    addPhoto,

    // geo
    getLastPosition,
    saveLastPosition,
  }
}