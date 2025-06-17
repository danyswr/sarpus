"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface WebSocketContextType {
  isConnected: boolean
  lastMessage: any
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    // Simulate WebSocket connection for demo
    setIsConnected(true)

    // Simulate periodic updates
    const interval = setInterval(() => {
      setLastMessage({
        type: "post_update",
        timestamp: new Date().toISOString(),
      })
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return <WebSocketContext.Provider value={{ isConnected, lastMessage }}>{children}</WebSocketContext.Provider>
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}
