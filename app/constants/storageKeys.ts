export const LS_KEYS = {
  user: 'pwa_user',
  rooms: 'pwa_rooms',
  photos: 'pwa_photos',
  lastPosition: 'pwa_last_position',
  roomPrefix: 'pwa_room_' as const, // + roomName
} as const

export const roomKey = (roomName: string) => `${LS_KEYS.roomPrefix}${roomName}`
