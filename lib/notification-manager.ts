// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if notifications are supported
const isNotificationSupported = isBrowser && "Notification" in window

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported) {
    console.warn("Notifications are not supported in this browser")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

// Show a notification
export const showNotification = (title: string, options?: NotificationOptions): boolean => {
  if (!isNotificationSupported) {
    console.warn("Notifications are not supported in this browser")
    return false
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted")
    return false
  }

  try {
    const notification = new Notification(title, options)

    // Add click handler to focus the window
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return true
  } catch (error) {
    console.error("Error showing notification:", error)
    return false
  }
}

// Check if notifications are enabled
export const areNotificationsEnabled = (): boolean => {
  if (!isNotificationSupported) {
    return false
  }

  return Notification.permission === "granted"
}

// Toggle notifications (request permission if not granted)
export const toggleNotifications = async (): Promise<boolean> => {
  if (!isNotificationSupported) {
    console.warn("Notifications are not supported in this browser")
    return false
  }

  if (Notification.permission === "granted") {
    // Already enabled, can't disable (browser limitation)
    return true
  }

  return await requestNotificationPermission()
}
