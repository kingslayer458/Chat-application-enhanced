"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Message as MessageType } from "@/lib/types"
import { EmojiPicker } from "./emoji-picker"

interface MessageProps {
  message: MessageType
  isOwnMessage: boolean
  onReaction: (messageId: string, emoji: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  isGrouped?: boolean
}

export function Message({ message, isOwnMessage, onReaction, onEdit, isGrouped = false }: MessageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const reactionsRef = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  // Common emojis for quick reactions
  const commonReactions = ["👍", "❤️", "😂", "😮", "😢", "👏", "🎉", "🙏"]

  // Group reactions by emoji
  const reactionCounts =
    message.reactions?.reduce(
      (acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  // Determine if message is editable (only text messages that are your own and not too old)
  const isEditable = isOwnMessage && message.type === "text" && !message.edited?.frozen

  // Update editContent when message content changes (for example, when editing from another device)
  useEffect(() => {
    setEditContent(message.content)
  }, [message.content])

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      // Place cursor at the end of the text
      const length = editInputRef.current.value.length
      editInputRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  // Listen for edit events
  useEffect(() => {
    const handleEditEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.messageId === message.id && isEditable) {
        handleEditStart()
      }
    }

    document.addEventListener("edit-message", handleEditEvent)

    return () => {
      document.removeEventListener("edit-message", handleEditEvent)
    }
  }, [message.id, isEditable])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      return ""
    }
  }

  const handleReaction = (emoji: string) => {
    try {
      onReaction(message.id, emoji)
      setShowReactions(false)
      setShowEmojiPicker(false)
    } catch (error) {
      console.error("Error handling reaction:", error)
    }
  }

  const handleEmojiPickerOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEmojiPicker(true)
    setShowReactions(false)
  }

  // Add a double-click handler to open the emoji picker
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (messageRef.current && messageRef.current.contains(e.target as Node)) {
      handleEmojiPickerOpen(e)
    }
  }

  const handleEditStart = () => {
    if (isOwnMessage && message.type === "text") {
      setEditContent(message.content)
      setIsEditing(true)
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditContent(message.content)
  }

  const handleEditSave = () => {
    if (editContent.trim() && onEdit && editContent !== message.content) {
      onEdit(message.id, editContent)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleEditCancel()
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
  }

  // Close reactions panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(event.target as Node)) {
        setShowReactions(false)
      }
    }

    if (showReactions) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showReactions])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker])

  // Check if message was edited
  const wasEdited = message.edited?.timestamp

  return (
    <motion.div
      id={`message-${message.id}`}
      ref={messageRef}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group ${isGrouped ? "mt-0.5" : "mt-2"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onDoubleClick={handleDoubleClick}
    >
      <div className={`max-w-[80%] md:max-w-[70%] relative`}>
        {!isOwnMessage && !isGrouped && (
          <div className="flex items-center mb-0.5 space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
              {message.sender.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{message.sender}</span>
          </div>
        )}
        <div
          className={`rounded-2xl shadow-sm ${
            isOwnMessage
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          } ${message.type === "image" ? "p-1 overflow-hidden" : "py-2 px-3"}`}
        >
          {message.type === "text" && !isEditing && (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}

          {message.type === "text" && isEditing && (
            <div className="edit-message-container">
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/20 dark:bg-black/20 rounded p-2 text-white dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-white/50"
                rows={Math.min(5, editContent.split("\n").length)}
              />
              <div className="flex justify-end space-x-2 mt-1">
                <button onClick={handleEditCancel} className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded">
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="px-2 py-1 text-xs bg-white/30 hover:bg-white/40 rounded"
                  disabled={!editContent.trim() || editContent === message.content}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {message.type === "emoji" && <span className="text-4xl block py-1">{message.content}</span>}

          {message.type === "image" && (
            <div className="relative rounded-xl overflow-hidden">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={message.content || "/placeholder.svg"}
                alt="Shared image"
                className={`w-full rounded-xl ${imageLoaded ? "block" : "opacity-0"}`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            </div>
          )}

          {message.type === "file" && (
            <div className="flex items-center space-x-2 p-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <a
                  href={message.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium ${isOwnMessage ? "text-white" : "text-blue-500 dark:text-blue-400"} hover:underline`}
                >
                  Download file
                </a>
                {message.fileSize && (
                  <div className={`text-xs ${isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                    {(message.fileSize / 1024).toFixed(1)} KB
                  </div>
                )}
              </div>
            </div>
          )}

          {message.type === "audio" && (
            <div className="audio-message">
              <div className={`text-xs mb-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                Voice message {message.duration && `(${formatDuration(message.duration)})`}
              </div>
              <audio controls className="max-w-full rounded-lg">
                <source src={message.content} type="audio/webm;codecs=opus" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {message.type === "status" && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="font-medium italic">{message.content}</span>
            </div>
          )}
        </div>

        {/* Message footer with time and reactions */}
        <div className="flex items-center justify-end mt-0.5 space-x-2">
          {/* Edit button (only for own text messages) */}
          {isEditable && !isEditing && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEditStart}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Edit message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </motion.button>
          )}

          {/* Reaction buttons */}
          <div className="flex items-center space-x-1">
            {/* Emoji reactions button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowReactions(!showReactions)}
              onContextMenu={(e) => {
                e.preventDefault()
                handleEmojiPickerOpen(e)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Reactions"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.button>
          </div>

          <div className="flex items-center space-x-1">
            {wasEdited && <span className="text-xs text-gray-500 dark:text-gray-400 italic">(edited)</span>}
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(message.timestamp)}</span>
          </div>

          {isOwnMessage && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Quick reaction selector */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              ref={reactionsRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`absolute ${
                isOwnMessage ? "right-0" : "left-0"
              } bottom-full mb-1 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 z-10`}
            >
              <div className="flex space-x-1">
                {commonReactions.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full emoji picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <div
              className={`absolute ${isMobile ? "left-1/2 -translate-x-1/2" : isOwnMessage ? "right-0" : "left-0"} z-20`}
            >
              <EmojiPicker
                onEmojiSelect={(emoji) => handleReaction(emoji)}
                onClose={() => setShowEmojiPicker(false)}
                position={isMobile ? "bottom" : "auto"}
                align={isMobile ? "center" : isOwnMessage ? "right" : "left"}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Display reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <div
                key={emoji}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs ${
                  isOwnMessage
                    ? "bg-blue-600/30 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span>{emoji}</span>
                {count > 1 && <span>{count}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
