"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { getPosts, likeDislikePost } from "@/lib/api"

interface Post {
  idUsers: string
  idPostingan: string
  timestamp: string
  judul: string
  deskripsi: string
  like: number
  dislike: number
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts()
        setPosts(data)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleLikeDislike = async (idPostingan: string, type: "like" | "dislike") => {
    try {
      const response = await likeDislikePost(idPostingan, type)

      // Update post in state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.idPostingan === idPostingan ? { ...post, like: response.like, dislike: response.dislike } : post,
        ),
      )
    } catch (error) {
      console.error("Error updating like/dislike:", error)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Postingan Mahasiswa</h1>
          <p className="text-gray-600">Lihat dan berikan dukungan pada keluh kesah dan saran mahasiswa</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">Belum ada postingan</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.idPostingan} className="h-full">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{post.judul}</CardTitle>
                  <CardDescription>
                    {new Date(post.timestamp).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-gray-600 line-clamp-4">{post.deskripsi}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleLikeDislike(post.idPostingan, "like")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.like}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleLikeDislike(post.idPostingan, "dislike")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>{post.dislike}</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
