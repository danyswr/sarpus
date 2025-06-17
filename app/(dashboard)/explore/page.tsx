"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/auth"
import { getPosts } from "@/lib/api"
import { Search, TrendingUp, Hash } from "lucide-react"

interface Post {
  idUsers: string
  idPostingan: string
  timestamp: string
  judul: string
  deskripsi: string
  like: number
  dislike: number
}

export default function ExplorePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts()
        // Sort by engagement (likes) for explore page
        const sortedPosts = data.sort((a: Post, b: Post) => b.like - a.like)
        setPosts(sortedPosts)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const filteredPosts = posts.filter(
    (post) =>
      post.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.judul.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
        {/* Sticky Header with Search */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari postingan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Trending Section */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trending
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 rounded-xl text-black">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4" />
                <span className="font-bold">MahasiswaVoice</span>
              </div>
              <p className="text-sm opacity-80">1,234 posts</p>
            </div>
            <div className="bg-gradient-to-r from-cyan-400 to-blue-400 p-4 rounded-xl text-black">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4" />
                <span className="font-bold">KampusMerdeka</span>
              </div>
              <p className="text-sm opacity-80">856 posts</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">{searchQuery ? "Tidak ada hasil" : "Belum ada post"}</h3>
              <p>
                {searchQuery
                  ? `Tidak ditemukan post yang mengandung "${searchQuery}"`
                  : "Belum ada post untuk dijelajahi"}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <article
                key={post.idPostingan}
                className="border-b border-gray-200 p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0">
                    U
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">User</span>
                      <span className="text-gray-500">@user{post.idUsers.slice(-4)}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500">{new Date(post.timestamp).toLocaleDateString("id-ID")}</span>
                    </div>
                    <p className="text-gray-900 mb-3 whitespace-pre-wrap break-words">{post.deskripsi}</p>
                    <div className="flex items-center gap-4 text-gray-500">
                      <span className="text-sm">{post.like} likes</span>
                      <span className="text-sm">{post.dislike} dislikes</span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
