"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { updateUserProfile } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    nim: user?.nim || "",
    jurusan: user?.jurusan || "",
    bio: "",
    location: "",
    website: "",
  })

  const handleSave = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError("")
      setMessage("")

      await updateUserProfile({
        idUsers: user.idUsers,
        ...formData,
      })

      setMessage("Profile updated successfully!")
      setIsEditing(false)
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        {message && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-2 border-black card-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Account Information</span>
              <div className="space-x-2">
                {isEditing && (
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                )}
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="border-2 border-black"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Username</label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
                />
              ) : (
                <p className="text-gray-700">{user.username}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
                />
              ) : (
                <p className="text-gray-700">{user.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">NIM</label>
              {isEditing ? (
                <input
                  type="text"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
                />
              ) : (
                <p className="text-gray-700">{user.nim}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Jurusan</label>
              {isEditing ? (
                <select
                  name="jurusan"
                  value={formData.jurusan}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
                >
                  <option value="Teknik Informatika">Teknik Informatika</option>
                  <option value="Sistem Informasi">Sistem Informasi</option>
                  <option value="Teknik Elektro">Teknik Elektro</option>
                  <option value="Teknik Sipil">Teknik Sipil</option>
                  <option value="Manajemen">Manajemen</option>
                  <option value="Akuntansi">Akuntansi</option>
                  <option value="Hukum">Hukum</option>
                  <option value="Kedokteran">Kedokteran</option>
                </select>
              ) : (
                <p className="text-gray-700">{user.jurusan}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Role</label>
              <p className="text-gray-700 capitalize">{user.role}</p>
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button onClick={logout} variant="destructive" className="border-2 border-black">
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}