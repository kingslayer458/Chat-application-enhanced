"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import type { MessageType } from "@/lib/types"

interface MessageInputProps {
  onSendMessage: (content: string, type: MessageType, fileSize?: number, duration?: number) => void
  onTyping: (isTyping: boolean) => void
  onEditLastMessage?: () => void
}

export function MessageInput({ onSendMessage, onTyping, onEditLastMessage }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [audioURL, imagePreview])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)

    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true)
      onTyping(true)
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTyping(false)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Handle image upload
      if (selectedImage && imagePreview) {
        onSendMessage(imagePreview, "image", selectedImage.size)
        setSelectedImage(null)
        setImagePreview(null)
        return
      }

      // Handle voice message
      if (audioBlob && audioURL) {
        // Convert blob to base64
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = reader.result as string
          onSendMessage(base64data, "audio", audioBlob.size, recordingTime / 1000)
          setAudioBlob(null)
          setAudioURL(null)
          setRecordingTime(0)
        }
        reader.readAsDataURL(audioBlob)
        return
      }

      // Handle text message
      if (message.trim()) {
        // Check if it's just an emoji
        const emojiRegex = /^\p{Emoji}+$/u
        const messageType = emojiRegex.test(message.trim()) ? "emoji" : "text"

        onSendMessage(message, messageType)
        setMessage("")

        // Reset typing indicator
        if (isTyping) {
          setIsTyping(false)
          onTyping(false)
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
        }

        // Focus the input after sending
        inputRef.current?.focus()
      }
    } catch (error) {
      console.error("Error submitting message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === "ArrowUp" && !message.trim() && onEditLastMessage) {
      // When pressing up arrow in an empty input, edit the last message
      onEditLastMessage()
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const cancelImage = () => {
    setSelectedImage(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioBlob(audioBlob)
        setAudioURL(audioUrl)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 100)
      }, 100)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Could not access microphone. Please check your browser permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }

    // Clear audio data
    setAudioBlob(null)
    if (audioURL) {
      URL.revokeObjectURL(audioURL)
      setAudioURL(null)
    }
    setRecordingTime(0)
  }

  const formatRecordingTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-2 relative">
          <div className="relative w-32 h-32 max-w-full overflow-hidden rounded-lg shadow-md">
            <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={cancelImage}
              className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white rounded-full p-1"
              aria-label="Cancel image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          >
            Send Image
          </motion.button>
        </div>
      )}

      {/* Audio Recording UI */}
      {(isRecording || audioURL) && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {isRecording ? (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm hover:shadow-md transition-all duration-200"
              >
                Stop
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancelRecording}
                className="px-4 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
              >
                Cancel
              </motion.button>
            </div>
          ) : audioURL ? (
            <div className="flex items-center space-x-3">
              <audio
                src={audioURL}
                controls
                className="h-10 w-48 rounded [&::-webkit-media-controls-panel]:bg-gray-100 dark:[&::-webkit-media-controls-panel]:bg-gray-700 [&::-webkit-media-controls-current-time-display]:text-gray-900 dark:[&::-webkit-media-controls-current-time-display]:text-gray-100 [&::-webkit-media-controls-time-remaining-display]:text-gray-900 dark:[&::-webkit-media-controls-time-remaining-display]:text-gray-100"
              ></audio>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm hover:shadow-md transition-all duration-200"
              >
                Send
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancelRecording}
                className="px-4 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
              >
                Cancel
              </motion.button>
            </div>
          ) : null}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isRecording || !!audioURL || !!imagePreview}
            className="w-full p-2.5 pl-4 pr-10 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-all"
          />
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

        {/* Image button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={handleImageClick}
          disabled={isRecording || !!audioURL}
          className="p-2.5 bg-gray-100 dark:bg-gray-700 text-blue-500 dark:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
          aria-label="Upload image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </motion.button>

        {/* Voice button */}
        {!isRecording && !audioURL ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={startRecording}
            disabled={!!imagePreview}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-blue-500 dark:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
            aria-label="Record voice message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </motion.button>
        ) : null}

        {/* Send button */}
        {!isRecording && !audioURL && !imagePreview && (
          <motion.button
            whileHover={message.trim() ? { scale: 1.05 } : {}}
            whileTap={message.trim() ? { scale: 0.95 } : {}}
            type="submit"
            disabled={!message.trim()}
            className={`p-2.5 rounded-full shadow-md transition-all duration-200 ${
              message.trim()
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </motion.button>
        )}
      </form>
    </div>
  )
}
