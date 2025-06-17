
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { loginUser } from "./api"
import { useRouter } from "next/navigation"

interface User {
  idUsers: string
  username: string
  email: string
  role: string
  nim: string
  jurusan: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)

        // Don't auto-redirect on mount to avoid conflicts
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [router])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login for:", email)

      const response = await loginUser(email, password)
      console.log("Login response:", response)

      if (response.error) {
        console.error("Login failed:", response.error)
        throw new Error(response.error)
      }

      // Verify password hash if hashedPassword is provided
      if (response.hashedPassword) {
        // Simple hash verification (you might want to use a proper library like bcrypt)
        const hashedInput = btoa(password) // Simple base64 encoding for demo
        if (hashedInput !== response.hashedPassword) {
          throw new Error("Password salah")
        }
      }

      // Create user object from response
      const userData: User = {
        idUsers: response.idUsers,
        username: response.username,
        email: response.email,
        role: response.role || "user",
        nim: response.nim || "",
        jurusan: response.jurusan || "",
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      console.log("Login successful, user data:", userData)

      // Set cookies for middleware
      document.cookie = `auth-token=authenticated; path=/; max-age=86400`
      document.cookie = `user-data=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=86400`

      // Redirect after successful login
      console.log("Login successful, redirecting...")
      console.log("User role for redirect:", userData.role)
      
      // Use setTimeout to ensure state is set before redirect
      setTimeout(() => {
        if (userData.role && userData.role.toLowerCase() === "admin") {
          console.log("Redirecting to admin dashboard")
          router.replace("/admin")
        } else {
          console.log("Redirecting to user dashboard") 
          router.replace("/dashboard")
        }
      }, 100)

      return true
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    document.cookie = "user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
