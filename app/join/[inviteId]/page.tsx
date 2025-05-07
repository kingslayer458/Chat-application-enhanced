"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { io } from "socket.io-client"

export default function JoinPage() {
  const [username, setUsername] = useState("")
  const [roomDetails, setRoomDetails] = useState<{ roomId: string; roomName: string; inviter: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [socketPort, setSocketPort] = useState<string>("3000") // Default port

  const router = useRouter()
  const params = useParams()
  const inviteId = params.inviteId as string

  // Fetch socket port from API
  const fetchSocketPort = async () => {
    try {
      // Try to get the socket port from the API
      const response = await fetch("/api/socket-port")
      if (response.ok) {
        const data = await response.json()
        if (data.port) {
          console.log("Socket port from API:", data.port)
          return data.port
        }
      }
      // If API fails, try to get from window.location
      return window.location.port || "3000"
    } catch (error) {
      console.error("Error fetching socket port:", error)
      // Default to same port as the app in case of error
      return window.location.port || "3000"
    }
  }

  useEffect(() => {
    // Check if username is already stored
    const storedUsername = localStorage.getItem("chat-username")
    if (storedUsername) {
      setUsername(storedUsername)
    }

    // Connect to the Socket.IO server to get invite details
    const connectToServer = async () => {
      try {
        // Get the Socket.IO port
        const port = await fetchSocketPort()
        setSocketPort(port)

        // Get the Socket.IO server URL
        const protocol = window.location.protocol
        const hostname = window.location.hostname
        const baseUrl = `${protocol}//${hostname}:${port}`

        console.log("Connecting to Socket.IO server at:", baseUrl)

        const socket = io(baseUrl, {
          reconnectionAttempts: 3,
          timeout: 10000,
          transports: ["websocket", "polling"],
        })

        socket.on("connect", () => {
          console.log("Connected to Socket.IO server to check invite")

          // Request invite details
          socket.emit("check-invite", { inviteId })
        })

        socket.on("invite-details", (details) => {
          if (details) {
            setRoomDetails({
              roomId: details.roomId,
              roomName: details.roomName,
              inviter: details.creator,
            })
            setLoading(false)
          } else {
            setError("Invalid invite link")
            setLoading(false)
          }
          socket.disconnect()
        })

        socket.on("connect_error", (err) => {
          console.error("Socket.IO connection error:", err)

          // Try connecting to the same port as the app
          if (port !== window.location.port) {
            console.log("Trying to connect to same port as app:", window.location.port)
            const appPort = window.location.port || "3000"
            const appBaseUrl = `${protocol}//${hostname}:${appPort}`

            console.log("Connecting to Socket.IO server at:", appBaseUrl)

            const appSocket = io(appBaseUrl, {
              reconnectionAttempts: 3,
              timeout: 10000,
              transports: ["websocket", "polling"],
            })

            appSocket.on("connect", () => {
              console.log("Connected to Socket.IO server on app port to check invite")
              appSocket.emit("check-invite", { inviteId })
            })

            appSocket.on("invite-details", (details) => {
              if (details) {
                setRoomDetails({
                  roomId: details.roomId,
                  roomName: details.roomName,
                  inviter: details.creator,
                })
                setLoading(false)
              } else {
                setError("Invalid invite link")
                setLoading(false)
              }
              appSocket.disconnect()
            })

            appSocket.on("connect_error", () => {
              setError("Could not connect to the chat server")
              setLoading(false)
            })

            return
          }

          setError(`Could not connect to the chat server: ${err.message}`)
          setLoading(false)
          socket.disconnect()
        })

        socket.on("error", (err) => {
          console.error("Socket error:", err)
          setError(`Server error: ${err.message || "Unknown error"}`)
          setLoading(false)
          socket.disconnect()
        })

        // Fallback in case the server doesn't respond
        const timeout = setTimeout(() => {
          if (loading) {
            setError("Server did not respond in time")
            setLoading(false)
            socket.disconnect()
          }
        }, 10000)

        return () => {
          clearTimeout(timeout)
          socket.disconnect()
        }
      } catch (error) {
        console.error("Error connecting to server:", error)
        setError(`Connection error: ${error instanceof Error ? error.message : "Unknown error"}`)
        setLoading(false)
      }
    }

    connectToServer()
  }, [inviteId, loading])

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() && roomDetails) {
      try {
        // Store in localStorage
        localStorage.setItem("chat-username", username.trim())

        // Also set a cookie for middleware authentication
        document.cookie = `chat-username=${username.trim()}; path=/; max-age=86400`

        router.push(`/chat/${roomDetails.roomId}`)
      } catch (error) {
        console.error("Error joining room:", error)
        setError(`Failed to join room: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl"
        >
          <div className="flex space-x-2 justify-center mb-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0 }}
              className="w-3 h-3 bg-rose-500 rounded-full"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.2 }}
              className="w-3 h-3 bg-rose-400 rounded-full"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, delay: 0.4 }}
              className="w-3 h-3 bg-rose-300 rounded-full"
            />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Loading Invite</h2>
          <p className="text-gray-600 dark:text-gray-300">Please wait while we verify the invite...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-4 text-rose-500 dark:text-rose-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Invalid Invite</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-lg hover:from-rose-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-8 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl max-w-md w-full"
      >
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Join Chat Room</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          You've been invited to join <span className="font-semibold">{roomDetails?.roomName}</span>
        </p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50 transition-all"
          >
            Join Chat
          </motion.button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </motion.div>
    </div>
  )
}
