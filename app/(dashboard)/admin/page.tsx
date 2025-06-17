typescript jsx
"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    if (!isLoading && user && user.role?.toLowerCase() !== "admin") {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || user.role?.toLowerCase() !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-red-600">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="font-semibold text-red-800">Admin Info</h3>
              <p className="text-sm text-red-600 mt-2">Nama: {user.username}</p>
              <p className="text-sm text-red-600">Email: {user.email}</p>
              <p className="text-sm text-red-600">Role: {user.role}</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-semibold text-yellow-800">User Management</h3>
              <div className="mt-2 space-y-2">
                <button className="block w-full text-left text-sm text-yellow-600 hover:text-yellow-800">
                  View All Users
                </button>
                <button className="block w-full text-left text-sm text-yellow-600 hover:text-yellow-800">
                  Manage Roles
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-800">Content Management</h3>
              <div className="mt-2 space-y-2">
                <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800">
                  Manage Posts
                </button>
                <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800">
                  View Reports
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
            <p className="text-gray-600">Belum ada data pengguna terbaru.</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
            <p className="text-gray-600">Statistik sistem akan ditampilkan di sini.</p>
          </div>
        </div>
      </div>
    </div>
  )
}