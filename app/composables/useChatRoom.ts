// app/composables/useChatRoom.ts
import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import { useSocket } from '~/composables/useSocket'

export interface SocketMessage {
  pseudo: string
  content: string
  dateEmis: string
  categorie: 'MESSAGE' | 'INFO'
}

function loadLocal(room: string): SocketMessage[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`pwa_history_${room}`) || '[]') } catch { return [] }
}
function saveLocal(room: string, msgs: SocketMessage[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(`pwa_history_${room}`, JSON.stringify(msgs.slice(-300))) } catch {}
}

/**
 * roomIdRef  : Ref('xxx')
 * pseudoRef  : Ref('tonPseudo')
 */
export function useChatRoom(roomIdRef: Ref<string>, pseudoRef: Ref<string>) {
  const { socket } = useSocket()
  const messages = ref<SocketMessage[]>(loadLocal(roomIdRef.value))
  const hasJoined = ref(false)

  const handleNewMessage = (m: SocketMessage) => {
    messages.value.push(m)
    saveLocal(roomIdRef.value, messages.value)
  }

  const handleHistory = (payload: any) => {
    // certains serveurs envoient un backlog: Array<SocketMessage>
    const arr: SocketMessage[] = Array.isArray(payload?.history)
      ? payload.history
      : Array.isArray(payload)
        ? payload
        : []
    if (!arr.length) return
    // concat + dédoublonnage simple
    const merged = [...arr, ...messages.value]
    const seen = new Set<string>()
    messages.value = merged.filter(m => {
      const key = `${m.dateEmis}|${m.pseudo}|${m.content}`
      if (seen.has(key)) return false
      seen.add(key); return true
    })
    saveLocal(roomIdRef.value, messages.value)
  }

  function tryJoin() {
    if (!socket.value || hasJoined.value) return
    const roomName = roomIdRef.value?.trim()
    const pseudo = pseudoRef.value?.trim()
    if (!roomName || !pseudo) return
    socket.value.emit('chat-join-room', { pseudo, roomName })
    hasJoined.value = true

    // demande d'historique (au cas où le serveur le supporte)
    socket.value.emit('chat-get-history', { roomName })
  }

  function sendMessage(content: string) {
    if (!socket.value) return
    const c = content.trim()
    if (!c) return
    socket.value.emit('chat-msg', { content: c, roomName: roomIdRef.value })
    // Optimistic UI (optionnel): on peut pousser localement
    // messages.value.push({ pseudo: pseudoRef.value, content: c, dateEmis: new Date().toISOString(), categorie: 'MESSAGE' })
    // saveLocal(roomIdRef.value, messages.value)
  }

  onMounted(() => {
    socket.value?.on('chat-msg', handleNewMessage)
    socket.value?.on('chat-history', handleHistory) // si le serveur envoie un backlog
    tryJoin()
  })

  // si socket/room/pseudo changent, on retente le join (une fois)
  watch([socket, roomIdRef, pseudoRef], () => tryJoin())

  onBeforeUnmount(() => {
    socket.value?.off('chat-msg', handleNewMessage)
    socket.value?.off('chat-history', handleHistory)
  })

  return { messages, sendMessage }
}
