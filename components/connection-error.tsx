"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface ConnectionErrorProps {
  onRetry: () => void
  errorMessage?: string
}

export function ConnectionError({ onRetry, errorMessage }: ConnectionErrorProps) {
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && retryCount > 0) {
      onRetry()
    }
  }, [countdown, retryCount, onRetry])

  const handleManualRetry = () => {
    setRetryCount(retryCount + 1)
    onRetry()
  }

  const handleAutoRetry = () => {
    setRetryCount(retryCount + 1)
    setCountdown(5)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
      <div className="text-center p-8 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl max-w-md">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
          className="w-16 h-16 mx-auto mb-6 text-rose-500 dark:text-rose-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </motion.div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Connection Error</h2>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          We're having trouble connecting to the chat server. This could be due to:
        </p>

        <ul className="text-left text-sm text-gray-600 dark:text-gray-300 mb-6 space-y-1 list-disc list-inside">
          <li>The Socket.IO server is not running on port 3001</li>
          <li>Network connectivity issues</li>
          <li>Firewall or security settings</li>
        </ul>

        {countdown > 0 ? (
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Retrying in <span className="font-bold">{countdown}</span> seconds...
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-rose-500 dark:bg-rose-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManualRetry}
              className="w-full py-2 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Try Again Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAutoRetry}
              className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Auto-Retry in 5 Seconds
            </motion.button>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Make sure the Socket.IO server is running on port 3000.
        </p>
      </div>
    </div>
  )
}
