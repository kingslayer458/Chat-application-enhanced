"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
  position?: "top" | "bottom" | "auto"
  align?: "left" | "right" | "center"
}

export function EmojiPicker({ onEmojiSelect, onClose, position = "auto", align = "center" }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("smileys")
  const [searchTerm, setSearchTerm] = useState("")
  const [pickerPosition, setPickerPosition] = useState<"top" | "bottom">("bottom")
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Emoji categories
  const categories = [
    { id: "recent", icon: "🕒", label: "Recently Used" },
    { id: "smileys", icon: "😊", label: "Smileys & Emotion" },
    { id: "people", icon: "👋", label: "People & Body" },
    { id: "nature", icon: "🐶", label: "Animals & Nature" },
    { id: "food", icon: "🍔", label: "Food & Drink" },
    { id: "activities", icon: "⚽", label: "Activities" },
    { id: "travel", icon: "🚗", label: "Travel & Places" },
    { id: "objects", icon: "💡", label: "Objects" },
    { id: "symbols", icon: "💯", label: "Symbols" },
    { id: "flags", icon: "🏁", label: "Flags" },
  ]

  // Emoji data by category
  const emojisByCategory = {
    recent: ["👍", "❤️", "😂", "🎉", "🙏", "👏"],
    smileys: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
    ],
    people: [
      "👋",
      "🤚",
      "✋",
      "🖖",
      "👌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "👍",
      "👎",
      "✊",
      "👊",
    ],
    nature: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🦆",
    ],
    food: [
      "🍏",
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
    ],
    activities: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🥅",
      "⛳",
      "🏹",
      "🎣",
    ],
    travel: [
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "🚓",
      "🚑",
      "🚒",
      "🚐",
      "🚚",
      "🚛",
      "🚜",
      "🛴",
      "🚲",
      "🛵",
      "🏍️",
      "🚨",
      "🚔",
      "🚍",
    ],
    objects: [
      "⌚",
      "📱",
      "💻",
      "⌨️",
      "🖥️",
      "🖨️",
      "🖱️",
      "🖲️",
      "🕹️",
      "🗜️",
      "💽",
      "💾",
      "💿",
      "📀",
      "📼",
      "📷",
      "📸",
      "📹",
      "🎥",
      "📽️",
    ],
    symbols: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "☮️",
    ],
    flags: [
      "🏁",
      "🚩",
      "🎌",
      "🏴",
      "🏳️",
      "🏳️‍🌈",
      "🏳️‍⚧️",
      "🏴‍☠️",
      "🇦🇨",
      "🇦🇩",
      "🇦🇪",
      "🇦🇫",
      "🇦🇬",
      "🇦🇮",
      "🇦🇱",
      "🇦🇲",
      "🇦🇴",
      "🇦🇶",
      "🇦🇷",
      "🇦🇸",
    ],
  }

  // Determine if we should show the picker above or below based on viewport
  useEffect(() => {
    if (position === "auto" && pickerRef.current) {
      const updatePosition = () => {
        if (!pickerRef.current) return

        const rect = pickerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top

        // If there's not enough space below and more space above, show above
        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
          setPickerPosition("top")
        } else {
          setPickerPosition("bottom")
        }
      }

      updatePosition()
      window.addEventListener("resize", updatePosition)
      return () => window.removeEventListener("resize", updatePosition)
    } else {
      setPickerPosition(position === "top" ? "top" : "bottom")
    }
  }, [position])

  // Filter emojis based on search term
  const getFilteredEmojis = () => {
    if (!searchTerm.trim()) {
      return emojisByCategory[activeCategory as keyof typeof emojisByCategory]
    }

    // Flatten all emojis and filter by search term
    const allEmojis = Object.values(emojisByCategory).flat()
    return allEmojis.filter(
      (emoji) => emoji.includes(searchTerm) || getEmojiDescription(emoji).includes(searchTerm.toLowerCase()),
    )
  }

  // Simple emoji description mapping for search
  const getEmojiDescription = (emoji: string) => {
    const descriptions: Record<string, string> = {
      "😀": "smile grin happy face",
      "👍": "thumbs up good like",
      "❤️": "heart love red",
      "🎉": "party celebration tada",
      // Add more as needed
    }
    return descriptions[emoji] || ""
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Determine alignment class
  const getAlignmentClass = () => {
    switch (align) {
      case "left":
        return "left-0"
      case "right":
        return "right-0"
      case "center":
        return "left-1/2 -translate-x-1/2"
      default:
        return "left-1/2 -translate-x-1/2"
    }
  }

  // Determine position class
  const getPositionClass = () => {
    return pickerPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
  }

  const filteredEmojis = getFilteredEmojis()

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`absolute ${getPositionClass()} ${getAlignmentClass()} bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 w-full max-w-[320px] xs:max-w-[280px] overflow-hidden`}
      style={{ maxHeight: "min(400px, 80vh)" }}
    >
      {/* Category tabs */}
      <div className="flex overflow-x-auto p-1 border-b border-gray-200 dark:border-gray-700 hide-scrollbar">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setActiveCategory(category.id)
              setSearchTerm("")
              searchInputRef.current?.focus()
            }}
            className={`flex-shrink-0 p-2 rounded-md mx-0.5 ${
              activeCategory === category.id && !searchTerm
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            aria-label={category.label}
          >
            <span className="text-lg">{category.icon}</span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search emojis..."
            className="w-full px-3 py-1.5 pl-8 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            ref={searchInputRef}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Emoji grid */}
      <div className="p-2 overflow-y-auto" style={{ maxHeight: "200px" }}>
        {filteredEmojis.length > 0 ? (
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <motion.button
                key={`${emoji}-${index}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">No emojis found</div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span className="hidden sm:inline">Emoji Picker</span>
        <button
          onClick={onClose}
          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 w-full sm:w-auto text-center"
        >
          Close
        </button>
      </div>
    </motion.div>
  )
}
