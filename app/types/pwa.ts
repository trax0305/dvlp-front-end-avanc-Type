export type ISODate = string

export type PwaUser = {
  pseudo: string
  photoBase64?: string // data:image/jpeg;base64,...
  updatedAt: ISODate
}

export type PwaRoomInfo = {
  name: string
  clientsCount?: number
}

export type PwaRoomsCache = {
  rooms: PwaRoomInfo[]
  updatedAt: ISODate
}

export type PwaMessageStatus = 'sent' | 'pending'

export type PwaMessage = {
  id: string
  roomName: string
  pseudo: string
  text?: string
  photoId?: string
  createdAt: ISODate
  status: PwaMessageStatus
}

export type PwaRoomHistory = {
  roomName: string
  messages: PwaMessage[]
  updatedAt: ISODate
}

export type PwaPhoto = {
  id: string
  roomName?: string
  base64: string // data:image/jpeg;base64,...
  createdAt: ISODate
  synced?: boolean
}

export type PwaPhotosCache = {
  items: PwaPhoto[]
  updatedAt: ISODate
}

export type PwaLastPosition = {
  lat: number
  lng: number
  accuracy?: number
  capturedAt: ISODate
}
