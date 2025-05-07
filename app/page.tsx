"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeProvider } from "@/contexts/theme-context"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Mark component as mounted to avoid hydration issues
    setIsMounted(true)

    // Simulate loading for a smoother entrance animation
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    // Check if username is already stored
    const storedUsername = localStorage.getItem("chat-username")
    if (storedUsername) {
      setUsername(storedUsername)
    }

    return () => clearTimeout(timer)
  }, [])

  // Don't render anything until after hydration to avoid mismatch
  if (!isMounted) {
    return null
  }

  const handleLaunchApp = () => {
    if (username) {
      router.push("/chat/general")
    } else {
      // Show the username input modal by scrolling to it
      document.getElementById("join-section")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      // Store in localStorage
      localStorage.setItem("chat-username", username.trim())

      // Also set a cookie for middleware authentication
      document.cookie = `chat-username=${username.trim()}; path=/; max-age=86400`

      router.push("/chat/general")
    }
  }

  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
          <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
        </svg>
      ),
      title: "Real-time Messaging",
      description: "Instant message delivery with typing indicators and read receipts",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: "Multiple Chat Rooms",
      description: "Join different rooms for various topics and conversations",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="12" y1="7" x2="12" y2="13" />
        </svg>
      ),
      title: "Invite Friends",
      description: "Generate invite links to bring friends into your conversations",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      title: "Reactions & Emojis",
      description: "Express yourself with reactions and emoji support",
    },
  ]

  return (
    <ThemeProvider>
      <AnimatePresence>
        {isLoading ? (
          <motion.div
            key="loader"
            className="fixed inset-0 bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center z-50"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white text-4xl font-bold flex items-center"
            >
              <span>Chat</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                className="ml-1"
              >
                Wave
              </motion.span>
            </motion.div>
          </motion.div>
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
            <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center"
                >
                  <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-indigo-600 text-transparent bg-clip-text">
                    ChatWave
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center space-x-4"
                >
                  <ThemeToggle />
                  <button
                    onClick={handleLaunchApp}
                    className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm md:text-base"
                  >
                    Launch App
                  </button>
                </motion.div>
              </div>
            </header>

            <main>
              {/* Hero Section */}
              <section className="py-16 md:py-24 px-4">
                <div className="container mx-auto">
                  <div className="flex flex-col md:flex-row items-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="md:w-1/2 mb-10 md:mb-0 md:pr-10"
                    >
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                        <span className="text-gray-900 dark:text-white">Connect with </span>
                        <span className="bg-gradient-to-r from-rose-500 to-indigo-600 text-transparent bg-clip-text">
                          anyone, anywhere
                        </span>
                      </h1>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 md:pr-10">
                        Experience seamless real-time messaging with a beautiful interface. Join chat rooms, invite
                        friends, and communicate instantly.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLaunchApp}
                        className="bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-lg"
                      >
                        Start Chatting Now
                      </motion.button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="md:w-1/2"
                    >
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-indigo-400 rounded-2xl blur-md opacity-70 dark:opacity-50 animate-pulse"></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                          <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center">
                            <div className="flex space-x-1.5">
                              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                              <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mx-auto text-xs font-medium text-gray-600 dark:text-gray-300">ChatWave</div>
                          </div>
                          <div className="p-4 space-y-4">
                            <div className="flex items-start space-x-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-sm font-medium">
                                A
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 dark:bg-gray-700/70 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200">
                                  Hey everyone! Welcome to ChatWave 👋
                                </div>
                                <div className="text-xs text-gray-500 mt-1 ml-1">Alex • Just now</div>
                              </div>
                            </div>

                            <div className="flex items-start space-x-2">
                              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-300 text-sm font-medium">
                                S
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 dark:bg-gray-700/70 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200">
                                  This design is amazing! Love the new interface 🔥
                                </div>
                                <div className="text-xs text-gray-500 mt-1 ml-1">Sam • Just now</div>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <div className="max-w-[80%]">
                                <div className="bg-gradient-to-r from-rose-500 to-indigo-600 text-white p-3 rounded-lg text-sm">
                                  Thanks! Let's start chatting...
                                </div>
                                <div className="text-xs text-gray-500 mt-1 mr-1 text-right">You • Just now</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 mt-4">
                              <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none"
                                disabled
                              />
                              <button
                                disabled
                                className="bg-gradient-to-r from-rose-500 to-indigo-600 text-white p-2 rounded-lg disabled:opacity-50"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="container mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                      Powerful Features
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                      Everything you need for seamless communication in one beautiful app
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-indigo-100 dark:from-rose-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center text-rose-500 dark:text-rose-400 mb-4">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Join Section */}
              <section id="join-section" className="py-16 md:py-24 px-4">
                <div className="container mx-auto">
                  <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 md:p-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-6"
                      >
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Join ChatWave</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">Enter your name to start chatting</p>
                      </motion.div>

                      <form onSubmit={handleJoinChat} className="space-y-4">
                        <div>
                          <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Your Name
                          </label>
                          <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                            required
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50 transition-all"
                        >
                          Join Chat
                        </motion.button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 py-8 px-4">
              <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-4 md:mb-0"
                  >
                    <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-indigo-600 text-transparent bg-clip-text">
                      ChatWave
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      © {new Date().getFullYear()} ChatWave. All rights reserved.
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex space-x-6"
                  >
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                      Privacy
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                      Terms
                    </a>
                    <a
                      href="#"
                      className="text-gray-600 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                      Contact
                    </a>
                  </motion.div>
                </div>
              </div>
            </footer>
          </div>
        )}
      </AnimatePresence>
    </ThemeProvider>
  )
}
