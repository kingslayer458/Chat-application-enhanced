"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { UserList } from "@/components/user-list"
import { ChatWindow } from "@/components/chat-window"
import { MessageInput } from "@/components/message-input"
import { StatusSelector } from "@/components/status-selector"
import { RoomSelector } from "@/components/room-selector"
import { Modal } from "@/components/modal"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/contexts/theme-context"
import type { User, Message, Status, Room, MessageType, SearchResult } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectionError } from "@/components/connection-error"

export default function ChatPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [allMessages, setAllMessages] = useState<Message[]>([]) // For search
  const [username, setUsername] = useState<string>("")
  const [status, setStatus] = useState<Status>("online")
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [connecting, setConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [socketPort, setSocketPort] = useState<string>("3001") // Socket.IO server port
  const [rooms, setRooms] = useState<Room[]>([
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
    {
      id: "random",
      name: "Random",
      description: "Random discussions about anything",
    },
    {
      id: "music",
      name: "Music",
      description: "Share and discuss your favorite music",
    },
    {
      id: "gaming",
      name: "Gaming",
      description: "Gaming discussions and team-ups",
    },
  ])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [inviteCopied, setInviteCopied] = useState(false)
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const lastMessageRef = useRef<string | null>(null)
  const visibleMessagesRef = useRef<Set<string>>(new Set())
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const socketRef = useRef<Socket | null>(null)

  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch socket port from API
  const fetchSocketPort = async () => {
    try {
      // Try to get the socket port from the API
      const response = await fetch("/api/socket-port")
      if (response.ok) {
        const data = await response.json()
        if (data.port) {
          console.log("Socket port from API:", data.port)
          setSocketPort(data.port)
          return data.port
        }
      }
      // If API fails, use fixed Socket.IO port
      return "3001"
    } catch (error) {
      console.error("Error fetching socket port:", error)
      // Default to Socket.IO server port
      return "3001"
    }
  }

  const connectToServer = useCallback(async () => {
    setConnecting(true)
    setConnectionError(false)
    setErrorMessage("")

    try {
      console.log("Attempting to connect to Socket.IO server")

      // Determine the Socket.IO URL
      // For production without nginx: use the same hostname but port 3001
      // The NEXT_PUBLIC_SOCKET_URL is baked in at build time
      let socketUrl: string
      
      if (typeof window !== 'undefined') {
        // Always use the current hostname with port 3001 for Socket.IO
        // This works for both:
        // - Local dev: localhost:3001
        // - Production: kingcloud.live:3001
        socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`
      } else {
        socketUrl = 'http://localhost:3001'
      }

      // Close existing socket if it exists
      if (socketRef.current) {
        console.log("Closing existing socket connection")
        socketRef.current.disconnect()
      }

      console.log(`Connecting to Socket.IO server at ${socketUrl}`)

      const newSocket = io(socketUrl, {
        path: "/socket.io/",
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        transports: ["websocket", "polling"], // Try websocket first, fallback to polling
        autoConnect: true,
      })

      socketRef.current = newSocket

      // Add connection event handlers
      newSocket.on("connect", () => {
        console.log("Connected to Socket.IO server with ID:", newSocket.id)
        setConnecting(false)
        setConnectionError(false)
        setErrorMessage("")
        reconnectAttempts.current = 0

        // Get username from localStorage since state might not be updated yet
        const storedUsername = localStorage.getItem("chat-username")
        
        // Join the room once connected
        if (storedUsername) {
          console.log("Joining room:", roomId, "as", storedUsername)
          newSocket.emit("join", {
            username: storedUsername,
            status,
            room: roomId,
            avatar: storedUsername.charAt(0).toUpperCase(),
          })
        }
      })

      newSocket.on("connect_error", (err) => {
        console.error("Socket.IO connection error:", err)
        reconnectAttempts.current += 1

        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError(true)
          setConnecting(false)
          setErrorMessage(`Connection error: ${err.message}. Make sure the Socket.IO server is running on port 3001.`)
        }
      })

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from Socket.IO server:", reason)
        if (reason === "io server disconnect" || reason === "transport close") {
          setConnectionError(true)
          setErrorMessage(`Disconnected: ${reason}`)
        }
      })

      newSocket.on("error", (error) => {
        console.error("Socket error:", error)
        setErrorMessage(`Socket error: ${error.message || "Unknown error"}`)
      })

      // Handle duplicate login
      newSocket.on("duplicate-login", () => {
        console.log("Duplicate login detected. This session will be disconnected.")
        alert("You have logged in from another device or browser. This session will be disconnected.")
        router.push("/")
      })

      // Listen for custom rooms
      newSocket.on("rooms", (customRooms: Room[]) => {
        if (customRooms && customRooms.length > 0) {
          console.log("Received custom rooms:", customRooms.length)
          setRooms((prev) => {
            // Filter out any custom rooms that might already exist in our state
            const existingRoomIds = prev.map((r) => r.id)
            const newRooms = customRooms.filter((room) => !existingRoomIds.includes(room.id))
            return [...prev, ...newRooms]
          })
        }
      })

      // Listen for users list updates - must be set up before join event
      newSocket.on("users", (updatedUsers: User[]) => {
        console.log("Received users update:", updatedUsers.length, "users", updatedUsers)
        setUsers(updatedUsers)
      })

      setSocket(newSocket)
    } catch (error) {
      console.error("Socket connection error:", error)
      setConnectionError(true)
      setConnecting(false)
      setErrorMessage(`Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [roomId, status, username, router])

  useEffect(() => {
    if (!isMounted) return

    const storedUsername = localStorage.getItem("chat-username")
    if (!storedUsername) {
      router.push("/")
      return
    }
    setUsername(storedUsername)

    // Connect to the Socket.IO server
    connectToServer()

    // Set up visibility change listener for read receipts
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Close sidebar when resizing to desktop
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(false)
      }
    }
    window.addEventListener("resize", handleResize)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("resize", handleResize)
    }
  }, [isMounted, router, connectToServer])

  // Add an event listener for the custom leave room event
  const leaveRoom = useCallback(() => {
    if (socket) {
      try {
        console.log("Leaving room:", roomId)

        // Emit leave-room event to the server
        socket.emit("leave-room", { username, room: roomId })

        // Clear the username from localStorage to end the session
        localStorage.removeItem("chat-username")

        // Clear the cookie as well
        document.cookie = "chat-username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

        // Disconnect the socket
        socket.disconnect()

        // Redirect to the home page
        router.push("/")
      } catch (error) {
        console.error("Error leaving room:", error)
        // Still clear storage and redirect even if there's an error
        localStorage.removeItem("chat-username")
        document.cookie = "chat-username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/")
      }
    } else {
      // If no socket, just clear storage and redirect
      localStorage.removeItem("chat-username")
      document.cookie = "chat-username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      router.push("/")
    }
  }, [socket, username, roomId, router])

  // Clear chat for all users in the room
  const clearChat = useCallback(() => {
    if (socket && roomId) {
      const confirmed = window.confirm("Are you sure you want to clear the chat for everyone in this room? This action cannot be undone.")
      if (confirmed) {
        socket.emit("clear-chat", { room: roomId })
      }
    }
  }, [socket, roomId])

  useEffect(() => {
    const handleLeaveRoomEvent = () => {
      console.log("Leave room event received")
      leaveRoom()
    }

    document.addEventListener("leave-room-event", handleLeaveRoomEvent)

    return () => {
      document.removeEventListener("leave-room-event", handleLeaveRoomEvent)
    }
  }, [leaveRoom])

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && socket) {
      // Mark visible messages as read when tab becomes visible
      markVisibleMessagesAsRead()
    }
  }

  const markVisibleMessagesAsRead = () => {
    if (!socket || !username) return

    const messagesToMark = Array.from(visibleMessagesRef.current)
    if (messagesToMark.length > 0) {
      // Note: The standalone server doesn't have a mark-as-read event
      // We'll implement this in the future
    }
  }

  const handleMessageVisible = (messageId: string, isVisible: boolean) => {
    if (isVisible) {
      visibleMessagesRef.current.add(messageId)
    } else {
      visibleMessagesRef.current.delete(messageId)
    }

    // If the tab is visible, mark messages as read immediately
    if (document.visibilityState === "visible") {
      markVisibleMessagesAsRead()
    }
  }

  useEffect(() => {
    if (!socket || !username || !roomId) return

    // Note: Initial join is handled in the connect handler
    // This effect is for setting up other event listeners

    socket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message])
      setAllMessages((prev) => [...prev, message])

      // Update last message ref for auto-scrolling
      lastMessageRef.current = message.id
    })

    socket.on("typing", ({ user, room }: { user: string; room: string }) => {
      if (room === roomId && user !== username) {
        setTypingUsers((prev) => {
          if (!prev.includes(user)) {
            return [...prev, user]
          }
          return prev
        })
      }
    })

    socket.on("stop-typing", ({ user, room }: { user: string; room: string }) => {
      if (room === roomId) {
        setTypingUsers((prev) => prev.filter((u) => u !== user))
      }
    })

    socket.on(
      "reaction",
      ({ messageId, reaction, user, room }: { messageId: string; reaction: string; user: string; room: string }) => {
        if (room === roomId) {
          setMessages((prev) =>
            prev.map((message) => {
              if (message.id === messageId) {
                // Check if this user already reacted with this emoji
                const existingReactionIndex = message.reactions.findIndex(
                  (r) => r.emoji === reaction && r.user === user,
                )

                if (existingReactionIndex >= 0) {
                  // Remove the reaction if it already exists (toggle behavior)
                  const newReactions = [...message.reactions]
                  newReactions.splice(existingReactionIndex, 1)
                  return { ...message, reactions: newReactions }
                } else {
                  // Add the new reaction
                  const newReactions = [...message.reactions, { emoji: reaction, user }]
                  return { ...message, reactions: newReactions }
                }
              }
              return message
            }),
          )

          // Update all messages for search
          setAllMessages((prev) =>
            prev.map((message) => {
              if (message.id === messageId) {
                // Check if this user already reacted with this emoji
                const existingReactionIndex = message.reactions.findIndex(
                  (r) => r.emoji === reaction && r.user === user,
                )

                if (existingReactionIndex >= 0) {
                  // Remove the reaction if it already exists (toggle behavior)
                  const newReactions = [...message.reactions]
                  newReactions.splice(existingReactionIndex, 1)
                  return { ...message, reactions: newReactions }
                } else {
                  // Add the new reaction
                  const newReactions = [...message.reactions, { emoji: reaction, user }]
                  return { ...message, reactions: newReactions }
                }
              }
              return message
            }),
          )
        }
      },
    )

    socket.on("history", (history: Message[]) => {
      // Set messages from history
      setMessages(history)

      // Store all messages for search
      setAllMessages((prev) => {
        const newMessages = history.filter((msg) => !prev.some((existing) => existing.id === msg.id))
        return [...prev, ...newMessages]
      })
    })

    socket.on("status-change", ({ username, status, room }: { username: string; status: Status; room: string }) => {
      if (room === roomId) {
        setUsers((prev) =>
          prev.map((user) => {
            if (user.username === username) {
              return { ...user, status }
            }
            return user
          }),
        )
      }
    })

    socket.on("user-joined", ({ username, room }: { username: string; room: string }) => {
      if (room === roomId) {
        // User joined notification (removed sound)
      }
    })

    socket.on("user-left", ({ username, room }: { username: string; room: string }) => {
      if (room === roomId) {
        // User left notification (removed sound)
      }
    })

    const socketket = socket // Fix: Assign socket to socketket

    socketket.on(
      "message-edited",
      ({
        messageId,
        newContent,
        room,
        timestamp,
      }: {
        messageId: string
        newContent: string
        room: string
        timestamp: string
      }) => {
        if (room === roomId) {
          setMessages((prev) =>
            prev.map((message) => {
              if (message.id === messageId) {
                return {
                  ...message,
                  content: newContent,
                  edited: {
                    timestamp,
                    original: message.content,
                  },
                }
              }
              return message
            }),
          )

          // Also update all messages for search
          setAllMessages((prev) =>
            prev.map((message) => {
              if (message.id === messageId) {
                return {
                  ...message,
                  content: newContent,
                  edited: {
                    timestamp,
                    original: message.content,
                  },
                }
              }
              return message
            }),
          )
        }
      },
    )

    // Handle invite created response
    socket.on(
      "invite-created",
      ({ inviteId, roomId, roomName }: { inviteId: string; roomId: string; roomName: string }) => {
        // Use window.location.origin instead of env variable
        const baseUrl = window.location.origin
        const generatedLink = `${baseUrl}/join/${inviteId}`
        setInviteLink(generatedLink)
        setIsInviteModalOpen(true)
        setIsGeneratingInvite(false)
      },
    )

    // Handle chat cleared event
    socket.on("chat-cleared", ({ room }: { room: string }) => {
      if (room === roomId) {
        setMessages([])
        setAllMessages((prev) => prev.filter((msg) => msg.room !== roomId))
      }
    })

    // Clear messages when changing rooms
    setMessages([])
    setTypingUsers([])

    return () => {
      // Leave the current room before cleanup
      socket.emit("leave-room", { username, room: roomId })

      // Remove all listeners
      socket.off("users")
      socket.off("users")
      socket.off("message")
      socket.off("typing")
      socket.off("stop-typing")
      socket.off("reaction")
      socket.off("history")
      socket.off("status-change")
      socket.off("user-joined")
      socket.off("user-left")
      socket.off("message-edited")
      socket.off("invite-created")
      socket.off("chat-cleared")
      socket.off("duplicate-login")
      socket.off("rooms")
      socket.off("error")
    }
  }, [socket, username, roomId, status])

  // Don't render anything until after hydration to avoid mismatch
  if (!isMounted) {
    return null
  }

  // Update the sendMessage function to handle all message types
  const sendMessage = (content: string, type: MessageType, fileSize?: number, duration?: number, fileName?: string) => {
    if (socket && content.trim() && username) {
      try {
        const message: Omit<Message, "id"> = {
          content,
          sender: username,
          timestamp: new Date().toISOString(),
          reactions: [],
          room: roomId,
          type,
          fileSize,
          duration,
          fileName,
        }
        socket.emit("message", message)
      } catch (error) {
        console.error("Error sending message:", error)
        alert("Failed to send message. Please try again.")
      }
    }
  }

  // Send a quick status message
  const sendQuickStatus = (statusMessage: string) => {
    if (socket && username) {
      try {
        const message: Omit<Message, "id"> = {
          content: statusMessage,
          sender: username,
          timestamp: new Date().toISOString(),
          reactions: [],
          room: roomId,
          type: "status",
        }
        socket.emit("message", message)
      } catch (error) {
        console.error("Error sending status message:", error)
      }
    }
  }

  // Add this function to the component
  const editLastMessage = () => {
    // Find the last text message sent by the current user
    const lastOwnMessage = [...messages]
      .reverse()
      .find((msg) => msg.sender === username && msg.type === "text" && !msg.edited)

    if (lastOwnMessage) {
      // Find the message element and scroll to it
      const messageElement = document.getElementById(`message-${lastOwnMessage.id}`)
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" })

        // Trigger edit mode (we need to find a way to do this)
        // For now, we can use a custom event
        const editEvent = new CustomEvent("edit-message", { detail: { messageId: lastOwnMessage.id } })
        document.dispatchEvent(editEvent)
      }
    }
  }

  // Add this function to the component
  const editMessage = (messageId: string, newContent: string) => {
    if (socket && username) {
      try {
        socket.emit("edit-message", {
          messageId,
          newContent,
          room: roomId,
        })
      } catch (error) {
        console.error("Error editing message:", error)
        alert("Failed to edit message. Please try again.")
      }
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (socket && username) {
      try {
        if (isTyping) {
          socket.emit("typing", { user: username, room: roomId })
        } else {
          socket.emit("stop-typing", { user: username, room: roomId })
        }
      } catch (error) {
        console.error("Error with typing indicator:", error)
      }
    }
  }

  const addReaction = (messageId: string, emoji: string) => {
    if (socket && username) {
      try {
        socket.emit("reaction", { messageId, reaction: emoji, user: username, room: roomId })
      } catch (error) {
        console.error("Error adding reaction:", error)
      }
    }
  }

  const updateStatus = (newStatus: Status) => {
    if (socket && username) {
      try {
        setStatus(newStatus)
        socket.emit("status-change", { username, status: newStatus, room: roomId })
      } catch (error) {
        console.error("Error updating status:", error)
      }
    }
  }

  const changeRoom = (newRoomId: string) => {
    if (newRoomId !== roomId) {
      router.push(`/chat/${newRoomId}`)
      // Close sidebar on mobile when changing rooms
      setShowSidebar(false)
    }
  }

  // Update the leaveRoom function to properly disconnect and redirect

  const generateInviteLink = async () => {
    if (!socket || !username) return

    setIsGeneratingInvite(true)
    setInviteError(null)

    try {
      // Find the current room details
      const currentRoom = rooms.find((r) => r.id === roomId) || {
        id: roomId,
        name: roomId,
        description: "Chat room",
      }

      // Use the Socket.IO server's invite system
      socket.emit("create-invite", {
        roomId: currentRoom.id,
        roomName: currentRoom.name,
        roomDescription: currentRoom.description,
        creator: username,
      })

      // The response will be handled by the "invite-created" event listener
    } catch (err) {
      console.error("Error generating invite:", err)
      setInviteError(err instanceof Error ? err.message : "Failed to generate invite link")
      setIsGeneratingInvite(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      // Try modern clipboard API first (requires HTTPS on mobile)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink)
        setInviteCopied(true)
        setTimeout(() => setInviteCopied(false), 2000)
      } else {
        // Fallback for HTTP or older browsers
        const textArea = document.createElement('textarea')
        textArea.value = inviteLink
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          setInviteCopied(true)
          setTimeout(() => setInviteCopied(false), 2000)
        } else {
          // If copy fails, show the link for manual copy
          alert(`Please copy this link manually:\n${inviteLink}`)
        }
      }
    } catch (err) {
      console.error("Error copying invite link:", err)
      // Fallback: show alert with link for manual copy
      alert(`Please copy this link manually:\n${inviteLink}`)
    }
  }

  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    // Search through all messages in memory
    if (!query.trim()) return []

    try {
      console.log("Searching for:", query)
      console.log("All messages:", allMessages.length)

      const results = allMessages
        .filter((msg) => {
          if (msg.deleted) return false

          // For text and emoji messages, search in content
          if (msg.type === "text" || msg.type === "emoji" || msg.type === "status") {
            return msg.content.toLowerCase().includes(query.toLowerCase())
          }

          // For other types, search in sender
          return msg.sender.toLowerCase().includes(query.toLowerCase())
        })
        .map((msg) => {
          const room = rooms.find((r) => r.id === msg.room) || { id: msg.room, name: msg.room, description: "" }
          return {
            message: msg,
            roomId: msg.room,
            roomName: room.name,
          }
        })
        .slice(0, 10) // Limit results

      console.log("Search results:", results.length)
      return results
    } catch (error) {
      console.error("Error searching messages:", error)
      return []
    }
  }

  const handleSearchResultClick = (result: SearchResult) => {
    try {
      console.log("Search result clicked:", result)

      // If the message is in a different room, navigate there
      if (result.roomId !== roomId) {
        router.push(`/chat/${result.roomId}`)
      } else {
        // Scroll to the message
        const messageElement = document.getElementById(`message-${result.message.id}`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth", block: "center" })
          messageElement.classList.add("bg-yellow-100", "dark:bg-yellow-800")
          setTimeout(() => {
            messageElement.classList.remove("bg-yellow-100", "dark:bg-yellow-800")
          }, 2000)
        } else {
          console.warn("Message element not found:", result.message.id)
        }
      }
      // Close sidebar on mobile when clicking a search result
      setShowSidebar(false)
    } catch (error) {
      console.error("Error handling search result click:", error)
    }
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  if (connectionError) {
    return (
      <ThemeProvider>
        <ConnectionError onRetry={connectToServer} errorMessage={errorMessage} />
      </ThemeProvider>
    )
  }

  if (connecting) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
          <div className="text-center p-8 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl max-w-md">
            <div className="flex space-x-2 justify-center mb-6">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-3 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              <div className="w-3 h-3 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Connecting to ChatWave</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Setting up your secure connection...</p>

            <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
              <p className="mb-2">If this takes too long, please check:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The Socket.IO server is running on port {socketPort}</li>
                <li>Your network connection is stable</li>
                <li>No firewall is blocking the connection</li>
              </ul>
              <p className="mt-2">
                <button
                  onClick={() => window.location.reload()}
                  className="text-rose-500 dark:text-rose-400 hover:underline"
                >
                  Refresh the page
                </button>{" "}
                to try again.
              </p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  const currentRoom = rooms.find((room) => room.id === roomId) || rooms[0]

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-lg">{currentRoom.name}</h1>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar for Mobile */}
          {showSidebar && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={toggleSidebar} />
              <div className="absolute inset-y-0 left-0 w-3/4 max-w-xs bg-white dark:bg-gray-800 shadow-xl flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold">Users in {currentRoom.name}</h2>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <StatusSelector
                    currentStatus={status}
                    onStatusChange={updateStatus}
                    onQuickStatus={sendQuickStatus}
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <UserList users={users} currentUser={username} />
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button
                      onClick={() => {
                        generateInviteLink()
                        setShowSidebar(false)
                      }}
                      className="px-3 py-1 text-sm text-rose-500 dark:text-rose-400 border border-rose-500 dark:border-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                      disabled={isGeneratingInvite}
                    >
                      {isGeneratingInvite ? "Generating..." : "Invite Others"}
                    </button>
                    <button
                      onClick={() => {
                        clearChat()
                        setShowSidebar(false)
                      }}
                      className="px-3 py-1 text-sm text-red-500 dark:text-red-400 border border-red-500 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Clear Chat
                    </button>
                    <button
                      onClick={leaveRoom}
                      className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 border border-gray-500 dark:border-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Leave Room
                    </button>
                  </div>
                  <RoomSelector rooms={rooms} currentRoom={roomId} onRoomChange={changeRoom} />
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden md:flex md:w-1/4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Users in {currentRoom.name}</h2>
                <StatusSelector currentStatus={status} onStatusChange={updateStatus} onQuickStatus={sendQuickStatus} />
              </div>
            </div>
            <UserList users={users} currentUser={username} />
            <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button
                  onClick={generateInviteLink}
                  className="px-3 py-1 text-sm text-rose-500 dark:text-rose-400 border border-rose-500 dark:border-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                  disabled={isGeneratingInvite}
                >
                  {isGeneratingInvite ? "Generating..." : "Invite Others"}
                </button>
                <button
                  onClick={clearChat}
                  className="px-3 py-1 text-sm text-red-500 dark:text-red-400 border border-red-500 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  Clear Chat
                </button>
                <button
                  onClick={leaveRoom}
                  className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 border border-gray-500 dark:border-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Leave Room
                </button>
              </div>
              <RoomSelector rooms={rooms} currentRoom={roomId} onRoomChange={changeRoom} />
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex flex-col flex-1 w-full md:w-3/4 h-full">
            <div className="hidden md:block">
              <Header
                roomName={currentRoom.name}
                roomDescription={currentRoom.description}
                onSearch={handleSearch}
                onResultClick={handleSearchResultClick}
                onLeaveRoom={leaveRoom}
              />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <ChatWindow
                messages={messages}
                currentUser={username}
                typingUsers={typingUsers}
                onReaction={addReaction}
                onEditMessage={editMessage}
                onMessageVisible={handleMessageVisible}
              />
              <MessageInput onSendMessage={sendMessage} onTyping={handleTyping} onEditLastMessage={editLastMessage} />
            </div>
          </div>
        </div>

        {/* Invite Modal */}
        <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite to Chat Room">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Share this link with others to invite them to join this chat room:
            </p>
            <div className="flex items-center">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 focus:outline-none"
              />
              <button
                onClick={copyInviteLink}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-r-md hover:from-rose-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50 transition-colors"
              >
                {inviteCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Anyone with this link can join this chat room. They will be prompted to enter their name before joining.
            </p>
          </div>
        </Modal>

        {/* Error Modal */}
        {inviteError && (
          <Modal isOpen={!!inviteError} onClose={() => setInviteError(null)} title="Error Generating Invite">
            <div className="space-y-4">
              <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Please try again later or contact support if the problem persists.
              </p>
              <button
                onClick={() => setInviteError(null)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
              >
                Close
              </button>
            </div>
          </Modal>
        )}
      </div>
    </ThemeProvider>
  )
}
