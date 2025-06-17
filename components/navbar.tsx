"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { useState } from "react"
import { Menu, X, Home, Search, User, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  if (!user) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-black">
            MAHASISWA VOICE
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="btn-outline">Masuk</button>
            </Link>
            <Link href="/register">
              <button className="btn-primary">Daftar</button>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Desktop Sidebar - Sticky */}
      <div className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-200 bg-white">
        <div className="p-4">
          <Link href="/dashboard" className="text-2xl font-black mb-8 block">
            MAHASISWA VOICE
          </Link>

          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 font-medium transition-colors ${
                isActive("/dashboard") ? "bg-gray-100 font-bold" : ""
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xl">Beranda</span>
            </Link>

            <Link
              href="/explore"
              className={`flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 font-medium transition-colors ${
                isActive("/explore") ? "bg-gray-100 font-bold" : ""
              }`}
            >
              <Search className="w-6 h-6" />
              <span className="text-xl">Jelajahi</span>
            </Link>

            <Link
              href="/profile"
              className={`flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 font-medium transition-colors ${
                isActive("/profile") ? "bg-gray-100 font-bold" : ""
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xl">Profile</span>
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-4">
          <button
            onClick={logout}
            className="flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 font-medium w-full text-left transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xl">Keluar</span>
          </button>

          <div className="flex items-center gap-3 p-3 mt-4 rounded-full hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold">{user.username}</p>
              <p className="text-gray-500 text-sm">@{user.username.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header - Sticky */}
      <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold">MAHASISWA VOICE</span>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="bg-white border-t border-gray-200 p-4">
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors ${
                  isActive("/dashboard") ? "bg-gray-100 font-bold" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>Beranda</span>
              </Link>

              <Link
                href="/explore"
                className={`flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors ${
                  isActive("/explore") ? "bg-gray-100 font-bold" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="w-5 h-5" />
                <span>Jelajahi</span>
              </Link>

              <Link
                href="/profile"
                className={`flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors ${
                  isActive("/profile") ? "bg-gray-100 font-bold" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>

              <button
                onClick={() => {
                  logout()
                  setIsMenuOpen(false)
                }}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg w-full text-left transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
