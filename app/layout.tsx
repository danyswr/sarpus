import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth"
import { WebSocketProvider } from "@/lib/websocket"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mahasiswa Feedback Platform",
  description: "Platform feedback untuk mahasiswa",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <WebSocketProvider>{children}</WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
