const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const path = require("path")
const fs = require("fs")
const crypto = require("crypto")

// Create Express app
const app = express()
const server = createServer(app)

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

// Get port from environment variable or use default
const PORT = process.env.SOCKET_PORT || process.env.PORT || 3001
console.log(`Using Socket.IO port: ${PORT}`)

// Serve static files from public directory if it exists
const publicDir = path.join(__dirname, "public")
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
}

// In-memory message storage
const messageHistory = []
const MAX_HISTORY_LENGTH = 300

// Default rooms
const defaultRooms = [
  {
    id: "general",
    name: "General",
    description: "General chat for everyone",
  },
  {
    id: "tech",
    name: "Tech",
    description: "Discuss technology, programming, and gadgets",
  },
  {
    id: "gossips",
    name: "Gossips",
    description: "Share the latest news and gossip",
  },
]

// Custom rooms storage
const customRooms = []

// Invites storage
const invites = new Map()

// Track pending disconnects for grace period
const pendingDisconnects = new Map()
const DISCONNECT_GRACE_PERIOD = 3000 // 3 seconds grace period for refresh

// Track connected users
const connectedUsers = new Map()
// Track username to socket mapping for duplicate detection
const usernameToSocketId = new Map()

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
})

// Helper function to update user list for a room
function updateUserList(room) {
  try {
    const roomUsers = Array.from(connectedUsers.values())
      .filter((user) => user.room === room)
      .map((user) => ({
        username: user.username,
        status: user.status,
        room: user.room,
        avatar: user.avatar,
      }))

    console.log(`Emitting users list for room ${room}:`, roomUsers.map(u => u.username))
    io.in(room).emit("users", roomUsers)
    return roomUsers
  } catch (error) {
    console.error("Error updating user list:", error)
    return []
  }
}

// Helper function to handle user joining a room
function handleUserJoin(socket, username, status, room, avatar, notifyOthers = true) {
  try {
    // Cancel any pending disconnect for this user (handles page refresh)
    if (pendingDisconnects.has(username)) {
      console.log(`Cancelling pending disconnect for ${username} (reconnected)`)
      clearTimeout(pendingDisconnects.get(username))
      pendingDisconnects.delete(username)
    }

    // Check if user with this username already exists
    const existingSocketId = usernameToSocketId.get(username)
    if (existingSocketId && existingSocketId !== socket.id) {
      // If the username is already connected from another socket, disconnect the old one
      console.log(`Duplicate login detected for ${username}. Disconnecting old session.`)

      const oldSocket = io.sockets.sockets.get(existingSocketId)
      if (oldSocket) {
        // Notify the old session that they've been disconnected due to login elsewhere
        oldSocket.emit("duplicate-login")
        oldSocket.disconnect(true)
      }

      // Remove the old user entry
      connectedUsers.delete(existingSocketId)
    }

    // Store user info
    connectedUsers.set(socket.id, { username, status, room, avatar })

    // Update username to socket mapping
    usernameToSocketId.set(username, socket.id)

    // Join the room
    socket.join(room)

    // Notify others in the room
    if (notifyOthers) {
      socket.to(room).emit("user-joined", { username, room })
    }

    // Update user list for room
    return updateUserList(room)
  } catch (error) {
    console.error("Error handling user join:", error)
    return []
  }
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  // Send initial rooms list to all clients
  socket.emit("rooms", [...defaultRooms, ...customRooms])

  socket.on("join", ({ username, status, room, avatar }) => {
    try {
      console.log(`${username} joined room ${room}`)

      // Use helper function to handle joining
      const roomUsers = handleUserJoin(socket, username, status, room, avatar)

      // Also send users list directly to the joining socket (in case they haven't fully joined the room yet)
      socket.emit("users", roomUsers)

      // Send message history for this room
      const roomMessages = messageHistory.filter((msg) => msg.room === room)
      socket.emit("history", roomMessages)
    } catch (error) {
      console.error("Error handling join event:", error)
      socket.emit("error", { message: "Failed to join room" })
    }
  })

  socket.on("message", (messageData) => {
    try {
      console.log(
        "Received message:",
        typeof messageData.content === "string" ? messageData.content.substring(0, 50) : "Non-text content",
      )

      // Generate a unique ID for the message
      const message = {
        ...messageData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      }

      // Store in history
      messageHistory.push(message)

      // Trim history if it gets too long
      if (messageHistory.length > MAX_HISTORY_LENGTH) {
        messageHistory.shift()
      }

      // Broadcast to everyone in the room
      io.in(message.room).emit("message", message)
    } catch (error) {
      console.error("Error handling message event:", error)
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  socket.on("typing", ({ user, room }) => {
    try {
      socket.to(room).emit("typing", { user, room })
    } catch (error) {
      console.error("Error handling typing event:", error)
    }
  })

  socket.on("stop-typing", ({ user, room }) => {
    try {
      socket.to(room).emit("stop-typing", { user, room })
    } catch (error) {
      console.error("Error handling stop-typing event:", error)
    }
  })

  socket.on("reaction", ({ messageId, reaction, user, room }) => {
    try {
      io.in(room).emit("reaction", { messageId, reaction, user, room })
    } catch (error) {
      console.error("Error handling reaction event:", error)
      socket.emit("error", { message: "Failed to add reaction" })
    }
  })

  socket.on("edit-message", ({ messageId, newContent, room }) => {
    try {
      // Update message in history
      const messageIndex = messageHistory.findIndex((msg) => msg.id === messageId)
      if (messageIndex !== -1) {
        const timestamp = new Date().toISOString()
        messageHistory[messageIndex].content = newContent
        messageHistory[messageIndex].edited = {
          timestamp,
          original: messageHistory[messageIndex].content
        }
      }

      io.in(room).emit("message-edited", { 
        messageId, 
        newContent, 
        room,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error("Error handling edit-message event:", error)
      socket.emit("error", { message: "Failed to edit message" })
    }
  })

  socket.on("delete-message", ({ messageId, room }) => {
    try {
      // Mark as deleted in history
      const messageIndex = messageHistory.findIndex((msg) => msg.id === messageId)
      if (messageIndex !== -1) {
        messageHistory[messageIndex].deleted = true
      }

      io.in(room).emit("message-deleted", { messageId, room })
    } catch (error) {
      console.error("Error handling delete-message event:", error)
      socket.emit("error", { message: "Failed to delete message" })
    }
  })

  socket.on("status-change", ({ username, status, room }) => {
    try {
      // Update user status
      const userData = connectedUsers.get(socket.id)
      if (userData) {
        userData.status = status
        connectedUsers.set(socket.id, userData)
      }

      io.in(room).emit("status-change", { username, status, room })
    } catch (error) {
      console.error("Error handling status-change event:", error)
      socket.emit("error", { message: "Failed to change status" })
    }
  })

  socket.on("create-room", ({ id, name, description, creator }) => {
    try {
      // Check if room already exists
      const existingRoom = customRooms.find((room) => room.id === id)
      if (!existingRoom) {
        const newRoom = { id, name, description, creator, createdAt: new Date().toISOString() }
        customRooms.push(newRoom)

        // Notify all clients about new room
        io.emit("rooms", [...defaultRooms, ...customRooms])
      }
    } catch (error) {
      console.error("Error handling create-room event:", error)
      socket.emit("error", { message: "Failed to create room" })
    }
  })

  socket.on("create-invite", ({ roomId, roomName, roomDescription, creator }) => {
    try {
      // Generate a unique invite ID
      const inviteId = crypto.randomBytes(8).toString("hex")

      // Add to invites list
      invites.set(inviteId, {
        id: inviteId,
        roomId,
        roomName,
        roomDescription,
        creator,
        createdAt: new Date().toISOString(),
      })

      // Send invite link back to creator
      socket.emit("invite-created", { inviteId, roomId, roomName })
    } catch (error) {
      console.error("Error handling create-invite event:", error)
      socket.emit("error", { message: "Failed to create invite" })
    }
  })

  socket.on("check-invite", ({ inviteId }) => {
    try {
      // Find invite
      const invite = invites.get(inviteId)

      // Send invite details back to client
      socket.emit("invite-details", invite || null)
    } catch (error) {
      console.error("Error handling check-invite event:", error)
      socket.emit("error", { message: "Failed to check invite" })
    }
  })

  socket.on("join-via-invite", ({ inviteId, username, status, avatar }) => {
    try {
      // Find invite
      const invite = invites.get(inviteId)

      if (invite) {
        const { roomId, roomName, roomDescription } = invite

        // Use helper function to handle joining with the notification flag set to false
        // We'll handle the notification differently for invite joins
        const roomUsers = handleUserJoin(socket, username, status, roomId, avatar, false)

        // Notify room about new user via invite
        io.in(roomId).emit("invite-joined", {
          username,
          roomId,
          roomName,
          roomDescription,
        })

        // Send message history
        const roomMessages = messageHistory.filter((msg) => msg.room === roomId)
        socket.emit("history", roomMessages)
      } else {
        socket.emit("error", { message: "Invalid invite" })
      }
    } catch (error) {
      console.error("Error handling join-via-invite event:", error)
      socket.emit("error", { message: "Failed to join via invite" })
    }
  })

  socket.on("join-room", ({ username, status, room, avatar }) => {
    try {
      const userData = connectedUsers.get(socket.id)
      if (userData) {
        // Update user's room
        userData.room = room
        connectedUsers.set(socket.id, userData)

        // Join the new room
        socket.join(room)

        // Notify others
        socket.to(room).emit("user-joined", { username, room })

        // Update user list
        updateUserList(room)

        // Send message history
        const roomMessages = messageHistory.filter((msg) => msg.room === room)
        socket.emit("history", roomMessages)
      }
    } catch (error) {
      console.error("Error handling join-room event:", error)
      socket.emit("error", { message: "Failed to join room" })
    }
  })

  socket.on("leave-room", ({ username, room }) => {
    try {
      console.log(`${username} left room ${room}`)

      // Leave the room
      socket.leave(room)

      // Update user's room
      const userData = connectedUsers.get(socket.id)
      if (userData) {
        userData.room = null
        connectedUsers.set(socket.id, userData)
      }

      // Notify others
      socket.to(room).emit("user-left", { username, room })

      // Update user list
      updateUserList(room)
    } catch (error) {
      console.error("Error handling leave-room event:", error)
      socket.emit("error", { message: "Failed to leave room" })
    }
  })

  socket.on("disconnect", () => {
    try {
      const userData = connectedUsers.get(socket.id)
      if (userData) {
        const { username, room } = userData

        // Use grace period before removing user (allows for page refresh)
        console.log(`${username} disconnected from room ${room}, starting grace period...`)

        // Clear any existing pending disconnect for this user
        if (pendingDisconnects.has(username)) {
          clearTimeout(pendingDisconnects.get(username))
        }

        // Set a timeout to remove the user after grace period
        const timeoutId = setTimeout(() => {
          // Check if user reconnected with a different socket
          const currentSocketId = usernameToSocketId.get(username)
          if (currentSocketId === socket.id || !currentSocketId) {
            console.log(`Grace period expired for ${username}, removing from room ${room}`)

            // Remove username to socket mapping
            if (usernameToSocketId.get(username) === socket.id) {
              usernameToSocketId.delete(username)
            }

            // Remove user from tracking
            connectedUsers.delete(socket.id)

            // Notify room
            if (room) {
              io.to(room).emit("user-left", { username, room })

              // Update user list
              updateUserList(room)
            }
          } else {
            console.log(`${username} reconnected with new socket, skipping removal`)
          }

          pendingDisconnects.delete(username)
        }, DISCONNECT_GRACE_PERIOD)

        pendingDisconnects.set(username, timeoutId)
      }
    } catch (error) {
      console.error("Error handling disconnect event:", error)
    }
  })

  // Handle forced disconnection due to duplicate login
  socket.on("rejoin", ({ username, status, room, avatar }) => {
    try {
      // Check if this is a valid rejoin attempt
      const existingSocketId = usernameToSocketId.get(username)
      if (!existingSocketId || existingSocketId === socket.id) {
        // Handle rejoining after disconnection
        handleUserJoin(socket, username, status, room, avatar)

        // Send message history
        const roomMessages = messageHistory.filter((msg) => msg.room === room)
        socket.emit("history", roomMessages)
      } else {
        // This is a duplicate login attempt
        socket.emit("duplicate-login")
        socket.disconnect(true)
      }
    } catch (error) {
      console.error("Error handling rejoin event:", error)
      socket.emit("error", { message: "Failed to rejoin" })
    }
  })

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error)
  })
})

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    port: PORT,
  })
})

// Handle invite routes
app.get("/join/:inviteId", (req, res) => {
  try {
    const { inviteId } = req.params

    // Find invite
    const invite = invites.get(inviteId)

    if (invite) {
      // Redirect to the main app with the invite ID
      res.redirect(`/?invite=${inviteId}`)
    } else {
      res.status(404).send("Invite not found or expired")
    }
  } catch (error) {
    console.error("Error handling invite route:", error)
    res.status(500).send("Server error")
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Express error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Start the server
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`)
})

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled promise rejection:", reason)
})
