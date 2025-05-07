"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { Room } from "@/lib/types"

interface RoomSelectorProps {
  rooms: Room[]
  currentRoom: string
  onRoomChange: (roomId: string) => void
}

export function RoomSelector({ rooms, currentRoom, onRoomChange }: RoomSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleRoomChange = (roomId: string) => {
    onRoomChange(roomId)
    setIsOpen(false)
  }

  const currentRoomData = rooms.find((room) => room.id === currentRoom) || rooms[0]

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-indigo-500 flex items-center justify-center text-white font-medium mr-2">
            {currentRoomData.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="font-medium">{currentRoomData.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {currentRoomData.description}
            </div>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -10 }}
        transition={{ duration: 0.2 }}
        className={`absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="p-2">
          {rooms.map((room) => (
            <motion.button
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoomChange(room.id)}
              className={`w-full flex items-center p-2 rounded-md text-left ${
                room.id === currentRoom
                  ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-indigo-500 flex items-center justify-center text-white font-medium mr-2">
                {room.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{room.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                  {room.description}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
