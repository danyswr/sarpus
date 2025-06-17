"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/auth"
import { useWebSocket } from "@/lib/websocket"
import { createPost, getPosts, likeDislikePost, deletePost } from "@/lib/api"
import { Heart, Trash2, Share, Smile, Calendar, RefreshCw } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  likedBy?: string[]
  dislikedBy?: string[]
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { isConnected, lastMessage } = useWebSocket()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPost, setNewPost] = useState("")
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      // Only redirect to login if user is not authenticated
      window.location.href = "/login"
    }
  }, [user, authLoading])

  const fetchPosts = async () => {
    try {
      console.log("Fetching posts...")
      const data = await getPosts()
      console.log("Posts received:", data)

      if (Array.isArray(data)) {
        // Sort by timestamp descending (newest first)
        const sortedPosts = data.sort(
          (a: Post, b: Post) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        setPosts(sortedPosts)
      } else {
        console.warn("Posts data is not an array:", data)
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Gagal memuat postingan. Silakan coba lagi.")
      setPosts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (user && user.role.toLowerCase() === "user") {
      fetchPosts()
    }
  }, [user])

  // Listen for WebSocket updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === "post_update") {
      fetchPosts()
    }
  }, [lastMessage])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError("")
    await fetchPosts()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!newPost.trim()) {
      setError("Post tidak boleh kosong")
      return
    }

    if (newPost.length > 280) {
      setError("Post maksimal 280 karakter")
      return
    }

    setIsSubmitting(true)

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }

      const response = await createPost({
        idUsers: user.idUsers,
        username: user.username,
        judul: "Post",
        deskripsi: newPost,
        imageUrl: selectedImage,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Reset form
      setNewPost("")
      setSelectedImage("")
      setSuccess("Post berhasil dibuat")

      // Add new post to the top of the list
      const newPostData: Post = {
        idUsers: user.idUsers,
        idPostingan: response.idPostingan || `POST${Date.now()}`,
        timestamp: new Date().toISOString(),
        judul: "Post",
        deskripsi: newPost,
        like: 0,
        dislike: 0,
        username: user.username,
        imageUrl: selectedImage,
        likedBy: [],
        dislikedBy: [],
      }

      setPosts((prevPosts) => [newPostData, ...prevPosts])

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Gagal membuat post")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (post: Post) => {
    if (!user) return

    // Check if user already liked this post
    if (post.likedBy?.includes(user.idUsers)) {
      setError("Anda sudah menyukai postingan ini")
      setTimeout(() => setError(""), 3000)
      return
    }

    try {
      const response = await likeDislikePost(post.idPostingan, user.idUsers, "like")

      if (response.error) {
        throw new Error(response.error)
      }

      // Update post in state
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.idPostingan === post.idPostingan) {
            return {
              ...p,
              like: response.like,
              dislike: response.dislike,
              likedBy: [...(p.likedBy || []), user.idUsers],
              dislikedBy: p.dislikedBy?.filter((id) => id !== user.idUsers) || [],
            }
          }
          return p
        }),
      )
    } catch (error: any) {
      console.error("Error liking post:", error)
      setError(error.message || "Gagal menyukai postingan")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleDislike = async (post: Post) => {
    if (!user) return

    // Check if user already disliked this post
    if (post.dislikedBy?.includes(user.idUsers)) {
      setError("Anda sudah tidak menyukai postingan ini")
      setTimeout(() => setError(""), 3000)
      return
    }

    try {
      const response = await likeDislikePost(post.idPostingan, user.idUsers, "dislike")

      if (response.error) {
        throw new Error(response.error)
      }

      // Update post in state
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.idPostingan === post.idPostingan) {
            return {
              ...p,
              like: response.like,
              dislike: response.dislike,
              dislikedBy: [...(p.dislikedBy || []), user.idUsers],
              likedBy: p.likedBy?.filter((id) => id !== user.idUsers) || [],
            }
          }
          return p
        }),
      )
    } catch (error: any) {
      console.error("Error disliking post:", error)
      setError(error.message || "Gagal tidak menyukai postingan")
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleDeleteClick = (postId: string) => {
    setDeletePostId(postId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!user || !deletePostId) return

    try {
      const response = await deletePost(user.idUsers, deletePostId)

      if (response.error) {
        throw new Error(response.error)
      }

      // Remove post from state
      setPosts((prevPosts) => prevPosts.filter((post) => post.idPostingan !== deletePostId))

      setSuccess("Postingan berhasil dihapus")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error deleting post:", error)
      setError(error.message || "Gagal menghapus postingan")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletePostId(null)
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes > 0) return `${minutes}m`
    return "now"
  }

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto border-x border-gray-200 min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-40">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Beranda</h1>
            <div className="flex items-center gap-2">
              {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Create Post Section */}
        <div className="border-b border-gray-200 p-4 bg-white">
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

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Apa yang sedang terjadi?"
                  className="w-full text-xl placeholder-gray-500 border-none outline-none resize-none bg-transparent"
                  rows={3}
                  maxLength={280}
                />

                {/* Image Preview */}
                {selectedImage && (
                  <div className="mt-3">
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <ImageUpload
                      onImageSelect={setSelectedImage}
                      onImageRemove={() => setSelectedImage("")}
                      selectedImage={selectedImage}
                    />
                    <button type="button" className="p-2 hover:bg-blue-50 rounded-full group">
                      <Smile className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
                    </button>
                    <button type="button" className="p-2 hover:bg-blue-50 rounded-full group">
                      <Calendar className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${newPost.length > 260 ? "text-red-500" : "text-gray-500"}`}>
                      {newPost.length}/280
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newPost.trim() || newPost.length > 280}
                      className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Belum ada post</h3>
              <p>Jadilah yang pertama membuat post!</p>
              <button
                onClick={handleRefresh}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.idPostingan}
                className="border-b border-gray-200 p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0">
                    {post.username ? post.username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{post.username || "User"}</span>
                      <span className="text-gray-500">
                        @{post.username?.toLowerCase() || `user${post.idUsers.slice(-4)}`}
                      </span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500">{formatDate(post.timestamp)}</span>

                      {/* Show delete button only for user's own posts */}
                      {post.idUsers === user.idUsers && (
                        <div className="ml-auto">
                          <button
                            onClick={() => handleDeleteClick(post.idPostingan)}
                            className="p-2 hover:bg-red-50 rounded-full group transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-900 mb-3 whitespace-pre-wrap break-words">{post.deskripsi}</p>

                    {/* Image */}
                    {post.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={post.imageUrl || "/placeholder.svg"}
                          alt="Post image"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Post Actions - Only Like and Dislike */}
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLike(post)}
                        className={`flex items-center gap-2 p-2 rounded-full group transition-colors ${
                          post.likedBy?.includes(user.idUsers)
                            ? "text-red-500 hover:bg-red-50"
                            : "text-gray-500 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.likedBy?.includes(user.idUsers) ? "fill-red-500" : ""}`} />
                        <span>{post.like || 0}</span>
                      </button>

                      <button
                        onClick={() => handleDislike(post)}
                        className={`flex items-center gap-2 p-2 rounded-full group transition-colors ${
                          post.dislikedBy?.includes(user.idUsers)
                            ? "text-blue-500 hover:bg-blue-50"
                            : "text-gray-500 hover:bg-blue-50 hover:text-blue-500"
                        }`}
                      >
                        <Share
                          className={`w-5 h-5 rotate-180 ${
                            post.dislikedBy?.includes(user.idUsers) ? "fill-blue-500" : ""
                          }`}
                        />
                        <span>{post.dislike || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Postingan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
