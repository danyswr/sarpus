"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getPosts, likeDislikePost, deletePost, searchPosts } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Post {
  idUsers: string
  idPostingan: string
  timestamp: string
  judul: string
  deskripsi: string
  like: number
  dislike: number
  imageUrl?: string
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const data = await getPosts()
      if (data.error) {
        throw new Error(data.error)
      }
      setPosts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading posts:", err)
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPosts()
      return
    }

    try {
      setIsLoading(true)
      const data = await searchPosts(searchQuery)
      setPosts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error searching posts:", err)
      setError(err instanceof Error ? err.message : "Failed to search posts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeDislike = async (idPostingan: string, type: "like" | "dislike") => {
    if (!user) return

    try {
      await likeDislikePost({
        idPostingan,
        idUsers: user.idUsers,
        type,
      })
      loadPosts() // Reload posts to get updated counts
    } catch (err) {
      console.error("Error updating like/dislike:", err)
    }
  }

  const handleDelete = async (idPostingan: string) => {
    if (!user) return

    try {
      await deletePost({
        idPostingan,
        idUsers: user.idUsers,
      })
      loadPosts() // Reload posts after deletion
    } catch (err) {
      console.error("Error deleting post:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading posts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4">Explore Posts</h1>
          <p className="text-gray-600">Discover what others are sharing</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
            />
            <Button 
              onClick={handleSearch}
              className="btn-primary"
            >
              Search
            </Button>
            <Button 
              onClick={loadPosts}
              variant="outline"
              className="border-2 border-black"
            >
              Show All
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts found</p>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.idPostingan} className="border-2 border-black card-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{post.judul}</span>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 block">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        User: {post.idUsers}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{post.deskripsi}</p>
                  {post.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={post.imageUrl} 
                        alt="Post image" 
                        className="max-w-full h-auto rounded-lg border-2 border-black"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLikeDislike(post.idPostingan, "like")}
                        className="border-2 border-black"
                      >
                        👍 {post.like}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLikeDislike(post.idPostingan, "dislike")}
                        className="border-2 border-black"
                      >
                        👎 {post.dislike}
                      </Button>
                    </div>
                    {user && (user.role === "admin" || user.idUsers === post.idUsers) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(post.idPostingan)}
                        className="border-2 border-black"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}