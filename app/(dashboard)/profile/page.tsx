"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/auth"
import { updateUserProfile } from "@/lib/api"
import { ArrowLeft, Calendar, MapPin, LinkIcon } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nim: "",
    jurusan: "",
    bio: "",
    location: "",
    website: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        nim: user.nim || "",
        jurusan: user.jurusan || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Call API to update profile
      await updateUserProfile({
        idUsers: user.idUsers,
        ...formData,
      })

      // Update local user data
      if (updateUser) {
        updateUser({ ...user, ...formData })
      }

      setSuccess("Profile berhasil diperbarui")
      setIsEditing(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Gagal memperbarui profile")
      console.error(err)

      // Clear error message after 3 seconds
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto border-x border-gray-200 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{user.username}</h1>
              <p className="text-sm text-gray-500">Profil</p>
            </div>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-yellow-400 to-cyan-400"></div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="relative">
              <div className="w-32 h-32 bg-pink-400 rounded-full border-4 border-white -mt-16 flex items-center justify-center text-4xl font-bold text-black">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white border border-gray-300 text-black font-bold py-2 px-4 rounded-full hover:bg-gray-50"
            >
              {isEditing ? "Batal" : "Edit Profile"}
            </button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NIM</label>
                <input
                  type="text"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jurusan</label>
                <select
                  name="jurusan"
                  value={formData.jurusan}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Pilih jurusan</option>
                  <option value="Teknik Informatika">Teknik Informatika</option>
                  <option value="Sistem Informasi">Sistem Informasi</option>
                  <option value="Teknik Elektro">Teknik Elektro</option>
                  <option value="Teknik Sipil">Teknik Sipil</option>
                  <option value="Manajemen">Manajemen</option>
                  <option value="Akuntansi">Akuntansi</option>
                  <option value="Hukum">Hukum</option>
                  <option value="Kedokteran">Kedokteran</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Ceritakan tentang diri Anda..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lokasi</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Jakarta, Indonesia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-black font-bold py-2 px-6 rounded-full hover:bg-gray-300"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
              <p className="text-gray-500 mb-3">@{user.username.toLowerCase()}</p>

              {formData.bio && <p className="mb-3">{formData.bio}</p>}

              <div className="flex flex-wrap gap-4 text-gray-500 mb-4">
                {formData.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {formData.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Bergabung {new Date().getFullYear()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">NIM</p>
                  <p className="font-medium">{formData.nim || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jurusan</p>
                  <p className="font-medium">{formData.jurusan || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
