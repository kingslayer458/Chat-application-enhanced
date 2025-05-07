"use client"

import { useRef, useEffect, useState } from "react"
import { Message } from "./message"
import type { Message as MessageType } from "@/lib/types"

interface ChatWindowProps {
  messages: MessageType[]
  currentUser: string
  typingUsers: string[]
  onReaction: (messageId: string, emoji: string) => void
  onEditMessage: (messageId: string, newContent: string) => void
  onMessageVisible: (messageId: string, isVisible: boolean) => void
}

export function ChatWindow({
  messages,
  currentUser,
  typingUsers,
  onReaction,
  onEditMessage,
  onMessageVisible,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const observedMessages = useRef<Set<string>>(new Set())
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollPositionRef = useRef(0)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const visibleMessagesRef = useRef<Set<string>>(new Set())

  // Detect if user has scrolled up (to disable auto-scroll)
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50

      setAutoScroll(isScrolledToBottom)
      scrollPositionRef.current = scrollTop
    }

    const container = chatContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      // Use a small timeout to ensure DOM has updated
      const scrollTimeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 50)

      return () => clearTimeout(scrollTimeout)
    } else if (chatContainerRef.current) {
      // Maintain scroll position when new messages arrive but user has scrolled up
      const container = chatContainerRef.current
      const scrollTimeout = setTimeout(() => {
        container.scrollTop = scrollPositionRef.current
      }, 50)

      return () => clearTimeout(scrollTimeout)
    }
  }, [messages, autoScroll])

  // Set up intersection observer for read receipts
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = entry.target.id.replace("message-", "")
          if (messageId) {
            handleMessageVisible(messageId, entry.isIntersecting)
          }
        })
      },
      { threshold: 0.5 },
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onMessageVisible])

  // Observe new messages
  useEffect(() => {
    if (observerRef.current) {
      messages.forEach((message) => {
        if (message.sender !== currentUser && !observedMessages.current.has(message.id)) {
          const element = document.getElementById(`message-${message.id}`)
          if (element) {
            observerRef.current?.observe(element)
            observedMessages.current.add(message.id)
          }
        }
      })
    }
  }, [messages, currentUser])

  // Group messages by sender for better visual grouping
  const groupedMessages = messages.reduce((groups: MessageType[][], message, index) => {
    // Start a new group if:
    // 1. This is the first message
    // 2. The sender is different from the previous message
    // 3. More than 5 minutes have passed since the previous message
    const shouldStartNewGroup = () => {
      if (index === 0) return true

      const prevMessage = messages[index - 1]
      if (prevMessage.sender !== message.sender) return true

      const prevTime = new Date(prevMessage.timestamp).getTime()
      const currTime = new Date(message.timestamp).getTime()
      return currTime - prevTime > 5 * 60 * 1000 // 5 minutes
    }

    if (shouldStartNewGroup()) {
      groups.push([message])
    } else {
      groups[groups.length - 1].push(message)
    }

    return groups
  }, [])

  const handleMessageVisible = (messageId: string, isVisible: boolean) => {
    try {
      if (isVisible) {
        visibleMessagesRef.current.add(messageId)
      } else {
        visibleMessagesRef.current.delete(messageId)
      }

      // If the tab is visible, mark messages as read immediately
      if (document.visibilityState === "visible") {
        markVisibleMessagesAsRead()
      }
    } catch (error) {
      console.error("Error handling message visibility:", error)
    }
  }

  const markVisibleMessagesAsRead = () => {
    visibleMessagesRef.current.forEach((messageId) => {
      onMessageVisible(messageId, true)
    })
    visibleMessagesRef.current.clear()
  }

  return (
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900">
      <div className="space-y-3">
        {groupedMessages.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`}>
            {group.map((message, messageIndex) => (
              <Message
                key={message.id}
                message={message}
                isOwnMessage={message.sender === currentUser}
                onReaction={onReaction}
                onEdit={onEditMessage}
                isGrouped={messageIndex > 0}
              />
            ))}
          </div>
        ))}
      </div>

      {typingUsers.length > 0 && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
          <div className="flex space-x-1 mr-2">
            <span
              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: "0ms", animationDuration: "1s" }}
            />
            <span
              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: "200ms", animationDuration: "1s" }}
            />
            <span
              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: "400ms", animationDuration: "1s" }}
            />
          </div>
          <span>
            {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
