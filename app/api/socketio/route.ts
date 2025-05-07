import type { Server as NetServer } from "http"
import { type NextRequest, NextResponse } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { v4 as uuidv4 } from "uuid"

// Store users and messages (in memory for now)
const users: any[] = []
const messages: any[] = []

// Global variable to track the Socket.IO server instance
let io: SocketIOServer | null = null

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest, res: any) {
  if (res.socket.server.io) {
    console.log("Socket.IO server already running")
  } else {
    console.log("Initializing Socket.IO server...")
    const httpServer: NetServer = res.socket.server

    io = new SocketIOServer(httpServer, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["polling", "websocket"],
      allowEIO3: true,
    })

    // Set up Socket.IO event handlers
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      // Join a room
      socket.on("join", ({ username, status, room }) => {
        // Remove user from previous room if exists
        const existingUserIndex = users.findIndex((u) => u.socketId === socket.id)
        if (existingUserIndex !== -1) {
          const oldRoom = users[existingUserIndex].room
          if (oldRoom !== room) {
            socket.leave(oldRoom)
            console.log(`${username} left room: ${oldRoom}`)
            io?.to(oldRoom).emit("user-left", { username, room: oldRoom })
          }
          users.splice(existingUserIndex, 1)
        }

        // Add user to new room
        const user = {
          socketId: socket.id,
          username,
          status,
          room,
        }
        users.push(user)
        socket.join(room)

        // Send updated user list to all clients in the room
        io?.to(room).emit(
          "users",
          users.filter((u) => u.room === room),
        )

        // Send message history to the new user
        socket.emit("history", messages)

        // Notify others that user joined
        socket.to(room).emit("user-joined", { username, room })

        console.log(`${username} joined room: ${room}`)
      })

      // Leave a room
      socket.on("leave-room", ({ username, room }) => {
        socket.leave(room)
        const userIndex = users.findIndex((u) => u.socketId === socket.id)
        if (userIndex !== -1) {
          users.splice(userIndex, 1)
        }
        io?.to(room).emit(
          "users",
          users.filter((u) => u.room === room),
        )
        io?.to(room).emit("user-left", { username, room })
        console.log(`${username} left room: ${room}`)
      })

      // Handle new message
      socket.on("message", (message) => {
        const messageWithId = {
          ...message,
          id: uuidv4(),
        }
        messages.push(messageWithId)
        io?.to(message.room).emit("message", messageWithId)
      })

      // Handle typing indicator
      socket.on("typing", ({ user, room }) => {
        socket.to(room).emit("typing", { user, room })
      })

      socket.on("stop-typing", ({ user, room }) => {
        socket.to(room).emit("stop-typing", { user, room })
      })

      // Handle reactions
      socket.on("reaction", ({ messageId, reaction, user, room }) => {
        io?.to(room).emit("reaction", { messageId, reaction, user, room })
      })

      // Handle read receipts
      socket.on("mark-as-read", ({ messageIds, username, room }) => {
        const timestamp = new Date().toISOString()
        messageIds.forEach((messageId) => {
          io?.to(room).emit("read-receipt", { messageId, username, timestamp, room })
        })
      })

      // Handle status changes
      socket.on("status-change", ({ username, status, room }) => {
        const userIndex = users.findIndex((u) => u.socketId === socket.id)
        if (userIndex !== -1) {
          users[userIndex].status = status
        }
        io?.to(room).emit("status-change", { username, status, room })
      })

      // Handle message editing
      socket.on("edit-message", ({ messageId, newContent, username, room, timestamp }) => {
        // Find and update the message in our storage
        const messageIndex = messages.findIndex((m) => m.id === messageId)
        if (messageIndex !== -1) {
          const message = messages[messageIndex]
          if (message.sender === username) {
            message.content = newContent
            if (!message.edited) {
              message.edited = { timestamp }
            } else {
              message.edited.timestamp = timestamp
            }
          }
        }

        // Broadcast the edit to all clients in the room
        io?.to(room).emit("message-edited", { messageId, newContent, timestamp, room })
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        const userIndex = users.findIndex((u) => u.socketId === socket.id)
        if (userIndex !== -1) {
          const { username, room } = users[userIndex]
          users.splice(userIndex, 1)
          io?.to(room).emit(
            "users",
            users.filter((u) => u.room === room),
          )
          io?.to(room).emit("user-left", { username, room })
          console.log(`${username} disconnected from room: ${room}`)
        }
        console.log("User disconnected:", socket.id)
      })
    })

    res.socket.server.io = io
  }

  return new NextResponse("Socket.IO server is running", {
    status: 200,
  })
}
