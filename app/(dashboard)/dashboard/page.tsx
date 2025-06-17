"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Dashboard Mahasiswa</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Informasi Profil</h3>
              <p className="text-sm text-blue-600 mt-2">Nama: {user.username}</p>
              <p className="text-sm text-blue-600">Email: {user.email}</p>
              <p className="text-sm text-blue-600">NIM: {user.nim}</p>
              <p className="text-sm text-blue-600">Jurusan: {user.jurusan}</p>
              <p className="text-sm text-blue-600">Role: {user.role}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Quick Actions</h3>
              <div className="mt-2 space-y-2">
                <button className="block w-full text-left text-sm text-green-600 hover:text-green-800">
                  View Profile
                </button>
                <button className="block w-full text-left text-sm text-green-600 hover:text-green-800">
                  Explore Posts
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600">Belum ada aktivitas terbaru.</p>
        </div>
      </div>
    </div>
  )
}