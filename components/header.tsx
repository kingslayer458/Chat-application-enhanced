"use client"

import { useRouter } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { MessageSearch } from "./message-search"
import { motion } from "framer-motion"
import type { SearchResult } from "@/lib/types"

interface HeaderProps {
  roomName: string
  roomDescription: string
  onSearch: (query: string) => Promise<SearchResult[]>
  onResultClick: (result: SearchResult) => void
  onLeaveRoom: () => void
}

export function Header({ roomName, roomDescription, onSearch, onResultClick, onLeaveRoom }: HeaderProps) {
  const router = useRouter()

  const handleLeaveRoom = () => {
    // This function is not used directly anymore
    // The leave functionality is handled in the parent component
    router.push("/")
  }

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">{roomName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{roomDescription}</p>
      </div>
      <div className="flex items-center space-x-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaveRoom}
          className="px-3 py-1 text-sm text-rose-500 dark:text-rose-400 border border-rose-500 dark:border-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
          aria-label="Leave room"
        >
          Leave Room
        </motion.button>
        <MessageSearch onSearch={onSearch} onResultClick={onResultClick} />
        <ThemeToggle />
      </div>
    </div>
  )
}
