"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { areNotificationsEnabled, toggleNotifications } from "@/lib/notification-manager"

export function NotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== "undefined" && !("Notification" in window)) {
      setIsSupported(false)
      return
    }

    // Check if notifications are already enabled
    setIsEnabled(areNotificationsEnabled())
  }, [])

  const handleToggle = async () => {
    const result = await toggleNotifications()
    setIsEnabled(result)
  }

  if (!isSupported) {
    return null
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className="flex items-center space-x-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={isEnabled ? "Disable notifications" : "Enable notifications"}
    >
      {isEnabled ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      )}
      <span className="hidden sm:inline text-sm">{isEnabled ? "Notifications On" : "Notifications Off"}</span>
    </motion.button>
  )
}
