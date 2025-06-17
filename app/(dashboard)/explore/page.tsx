'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, MessageCircle, Share2, Trash2, Plus, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

interface Post {
  idUsers: string
  idPostingan: string
  timestamp: string
  judul: string
  deskripsi: string
  like: number
  dislike: number
  username?: string
  likedBy?: string[]
  dislikedBy?: string[]
  imageUrl?: string
}

export default function ExplorePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPost, setNewPost] = useState({
    judul: '',
    deskripsi: '',
    imageUrl: ''
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const fetchedPosts = await api.getPosts()
      setPosts(fetchedPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newPost.judul.trim() || !newPost.deskripsi.trim()) return

    try {
      const result = await api.createPost({
        idUsers: user.idUsers,
        judul: newPost.judul,
        deskripsi: newPost.deskripsi,
        imageUrl: newPost.imageUrl
      })

      if (result.message) {
        setNewPost({ judul: '', deskripsi: '', imageUrl: '' })
        setShowCreateForm(false)
        fetchPosts() // Refresh posts
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post')
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      const result = await api.uploadImage(file)
      if (result.imageUrl) {
        setNewPost(prev => ({ ...prev, imageUrl: result.imageUrl }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    }
  }

  const handleLike = async (postId: string, type: 'like' | 'dislike') => {
    if (!user) return

    try {
      await api.likePost(postId, user.idUsers, type)
      fetchPosts() // Refresh posts to show updated counts
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!user || !confirm('Are you sure you want to delete this post?')) return

    try {
      await api.deletePost(postId, user.idUsers)
      fetchPosts() // Refresh posts
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Explore Posts</h1>
        {user && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        )}
      </div>

      {showCreateForm && user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.judul}
                  onChange={(e) => setNewPost(prev => ({ ...prev, judul: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newPost.deskripsi}
                  onChange={(e) => setNewPost(prev => ({ ...prev, deskripsi: e.target.value }))}
                  className="w-full p-2 border rounded h-32"
                  placeholder="What's on your mind?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image (Optional)</label>
                <ImageUpload onImageUpload={handleImageUpload} />
                {newPost.imageUrl && (
                  <div className="mt-2">
                    <img src={newPost.imageUrl} alt="Preview" className="max-w-xs rounded" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Post</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No posts available yet.</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.idPostingan}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{post.judul}</CardTitle>
                    <p className="text-sm text-gray-500">
                      by {post.username || 'Unknown'} • {new Date(post.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  {user && (user.role === 'admin' || user.idUsers === post.idUsers) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(post.idPostingan)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <p className="mb-4">{post.deskripsi}</p>

                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post image" 
                    className="w-full max-w-md mx-auto rounded-lg mb-4"
                  />
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <button 
                    className="flex items-center gap-1 hover:text-red-500"
                    onClick={() => handleLike(post.idPostingan, 'like')}
                    disabled={!user}
                  >
                    <Heart className="w-4 h-4" />
                    {post.like}
                  </button>
                  <button 
                    className="flex items-center gap-1 hover:text-blue-500"
                    onClick={() => handleLike(post.idPostingan, 'dislike')}
                    disabled={!user}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {post.dislike}
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-500">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}