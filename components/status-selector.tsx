"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Status } from "@/lib/types"

interface StatusSelectorProps {
  currentStatus: Status
  onStatusChange: (status: Status) => void
  onQuickStatus?: (message: string) => void
}

export function StatusSelector({ currentStatus, onStatusChange, onQuickStatus }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isQuickStatusOpen, setIsQuickStatusOpen] = useState(false)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    setIsQuickStatusOpen(false)
  }

  const toggleQuickStatus = () => {
    setIsQuickStatusOpen(!isQuickStatusOpen)
    setIsOpen(false)
  }

  const handleStatusChange = (status: Status) => {
    onStatusChange(status)
    setIsOpen(false)
  }

  const handleQuickStatus = (message: string) => {
    if (onQuickStatus) {
      onQuickStatus(message)
      setIsQuickStatusOpen(false)
    }
  }

  const statusOptions: { value: Status; label: string; color: string }[] = [
    { value: "online", label: "Online", color: "bg-green-500" },
    { value: "away", label: "Away", color: "bg-yellow-500" },
    { value: "offline", label: "Offline", color: "bg-gray-500" },
  ]

  const quickStatusOptions = [
    { message: "brb", label: "Be right back" },
    { message: "busy", label: "Busy" },
    { message: "lunch", label: "At lunch" },
    { message: "meeting", label: "In a meeting" },
    { message: "working", label: "Working" },
  ]

  const currentStatusOption = statusOptions.find((option) => option.value === currentStatus) || statusOptions[0]

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDropdown}
          className="flex items-center space-x-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={`Status: ${currentStatus}`}
        >
          <div className={`w-3 h-3 rounded-full ${currentStatusOption.color}`}></div>
          <span className="text-sm capitalize hidden sm:inline">{currentStatus}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </motion.button>

        {onQuickStatus && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleQuickStatus}
            className="flex items-center space-x-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Quick status"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-sm hidden sm:inline">Status</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]"
          >
            <div className="p-1">
              {statusOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStatusChange(option.value)}
                  className={`w-full flex items-center space-x-2 p-2 rounded-md text-left ${
                    option.value === currentStatus ? "bg-gray-100 dark:bg-gray-700" : ""
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                  <span className="text-sm">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {isQuickStatusOpen && onQuickStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[150px]"
          >
            <div className="p-1">
              {quickStatusOptions.map((option) => (
                <motion.button
                  key={option.message}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickStatus(option.message)}
                  className="w-full flex items-center space-x-2 p-2 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="text-sm">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
