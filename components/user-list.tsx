"use client"

import { motion } from "framer-motion"
import type { User } from "@/lib/types"

interface UserListProps {
  users: User[]
  currentUser: string
}

export function UserList({ users, currentUser }: UserListProps) {
  // Debug log
  console.log("UserList render - users:", users, "currentUser:", currentUser)
  
  // Sort users: current user first, then online users, then away, then offline
  const sortedUsers = [...users].sort((a, b) => {
    if (a.username === currentUser) return -1
    if (b.username === currentUser) return 1

    const statusOrder = { online: 0, away: 1, offline: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        {users.length} {users.length === 1 ? "user" : "users"} online
      </h3>
      <motion.ul variants={container} initial="hidden" animate="show" className="space-y-2">
        {sortedUsers.map((user, index) => (
          <motion.li
            key={`${user.username}-${index}`}
            variants={item}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                  user.status === "online" ? "bg-green-500" : user.status === "away" ? "bg-yellow-500" : "bg-gray-500"
                }`}
              ></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.username} {user.username === currentUser && "(You)"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.status}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}
