"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { getPosts, deletePost } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Trash2, Users, MessageSquare, Heart } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Post {
  idUsers: string
  idPostingan: string
  timestamp: string
  judul: string
  deskripsi: string
  like: number
  dislike: number
  username: string
  imageUrl?: string
}

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = "/login"
        return
      }

      if (!user.role || user.role.toLowerCase() !== "admin") {
        window.location.href = "/dashboard"
      }
    }
  }, [user, isLoading])

  const fetchPosts = async () => {
    try {
      const data = await getPosts()
      if (Array.isArray(data)) {
        const sortedPosts = data.sort(
          (a: Post, b: Post) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        setPosts(sortedPosts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Gagal memuat postingan")
    }
  }

  useEffect(() => {
    if (user && user.role.toLowerCase() === "admin") {
      fetchPosts()
    }
  }, [user])

  const handleDeletePost = async (postId: string) => {
    if (!user) return

    if (confirm("Apakah Anda yakin ingin menghapus postingan ini?")) {
      try {
        await deletePost(user.idUsers, postId)
        setPosts(posts.filter((post) => post.idPostingan !== postId))
        setSuccess("Postingan berhasil dihapus")
        setTimeout(() => setSuccess(""), 3000)
      } catch (error) {
        setError("Gagal menghapus postingan")
        setTimeout(() => setError(""), 3000)
      }
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!user || user.role.toLowerCase() !== "admin") {
    return null // Will redirect in useEffect
  }

  const totalLikes = posts.reduce((sum, post) => sum + post.like, 0)
  const totalDislikes = posts.reduce((sum, post) => sum + post.dislike, 0)

  return (
    <div className="container mx-auto p-4">
      <Navbar />
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Selamat datang, Admin {user.username}!</h2>
        <p className="text-gray-600">Role: {user.role}</p>
        <p className="text-gray-600">NIM: {user.nim}</p>
        <p className="text-gray-600">Jurusan: {user.jurusan}</p>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border-2 border-black rounded-xl card-shadow p-6">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold">{posts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-black rounded-xl card-shadow p-6">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold">{totalLikes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-black rounded-xl card-shadow p-6">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-blue-500 rotate-180" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Dislikes</p>
              <p className="text-2xl font-bold">{totalDislikes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-black rounded-xl card-shadow p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">{new Set(posts.map((p) => p.idUsers)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Management */}
      <div className="bg-white border-2 border-black rounded-xl card-shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Kelola Postingan</h2>
        </div>

        <div className="p-6">
          {posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada postingan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.idPostingan} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold">{post.username}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500 text-sm">{formatDate(post.timestamp)}</span>
                      </div>
                      <p className="text-gray-900 mb-3">{post.deskripsi}</p>
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl || "/placeholder.svg"}
                          alt="Post image"
                          className="max-w-xs h-auto rounded-lg border border-gray-200 mb-3"
                        />
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{post.like} likes</span>
                        <span>{post.dislike} dislikes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.idPostingan)}
                      className="p-2 hover:bg-red-50 rounded-full group transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
