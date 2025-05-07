export type Message = {
  id: string
  content: string
  sender: string
  timestamp: string
  reactions: { emoji: string; user: string }[]
  room: string
  type: MessageType
  fileSize?: number
  duration?: number
  readBy?: { username: string; timestamp: string }[]
  deleted?: boolean
  edited?: {
    timestamp: string
    original?: string
    frozen?: boolean // If true, message can no longer be edited
  }
}

export type SearchResult = {
  message: Message
  roomId: string
  roomName: string
}

export type Room = {
  id: string
  name: string
  description: string
}

export type Status = "online" | "away" | "offline"

export type User = {
  username: string
  status: Status
  room: string
}

export type MessageType = "text" | "emoji" | "image" | "file" | "audio" | "status"
