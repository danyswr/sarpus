// API URL untuk Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec"

// Import mock API functions
import {
  mockTestConnection,
  mockLoginUser,
  mockRegisterUser,
  mockGetPosts,
  mockCreatePost,
  mockLikeDislike,
  mockDeletePost,
} from "./mock-api"

// Helper untuk menentukan apakah menggunakan mock API atau real API
// Now using real Google Apps Script API
const useMockAPI = () => {
  // Force use real API
  return false
}

// Simple password hashing function
async function hashPassword(password: string): Promise<string> {
  // Use btoa for consistency with register page
  return btoa(password)
}

// Test connection to API
export async function testConnection() {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      console.log("Using mock API")
      return await mockTestConnection()
    }

    console.log("Testing connection to:", API_URL)
    
    const response = await fetch(`${API_URL}?action=test`, {
      method: "GET",
      mode: 'cors',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    })

    console.log("Test response status:", response.status)
    console.log("Test response ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Test connection failed:", errorText)
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Test connection result:", result)
    return result
  } catch (error) {
    console.error("Connection test failed:", error)
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Unable to reach Google Apps Script. Please check the URL or try again later.")
    }
    
    throw new Error("Connection test failed: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Login user
export async function loginUser(email: string, password: string) {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      return await mockLoginUser(email, password)
    }

    // Hash password to match what's stored in spreadsheet
    const hashedPassword = btoa(password)

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "login",
        email,
        password: hashedPassword,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    // Handle the Google Apps Script response format
    if (result.error) {
      throw new Error(result.error)
    }
    
    // If user found, verify password client-side since GAS returns hashed password
    if (result.hashedPassword) {
      if (result.hashedPassword === hashedPassword) {
        return {
          message: "Login berhasil",
          idUsers: result.idUsers,
          role: result.role,
          username: result.username,
          email: result.email,
          nim: result.nim,
          jurusan: result.jurusan,
          bio: result.bio,
          location: result.location,
          website: result.website,
        }
      } else {
        throw new Error("Password salah")
      }
    }
    
    return result
  } catch (error) {
    console.error("Login error:", error)
    throw new Error("Login error: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Register user
export async function registerUser(userData: {
  email: string
  username: string
  password: string
  nim: string
  jurusan: string
  gender?: string
}) {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      console.log("Using mock API for registration")
      return await mockRegisterUser(userData)
    }

    console.log('Using real API for registration')
    console.log('Registering user:', userData)
    
    // Use the same hashing as register page for consistency
    const hashedPassword = btoa(userData.password)

    const payload = {
      action: 'register',
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      nim: userData.nim,
      jurusan: userData.jurusan,
      gender: userData.gender || 'Male',
    }

    console.log('Registration payload:', payload)

    // First test connection
    try {
      await testConnection()
      console.log('Connection test successful')
    } catch (connError) {
      console.error('Connection test failed:', connError)
      throw new Error("Unable to connect to the registration service. Please try again later.")
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Registration failed with status:', response.status)
      console.error('Error text:', errorText)
      throw new Error(`Registration failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Registration response:', result)
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    return result
  } catch (error) {
    console.error("Registration error:", error)
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Network error: Unable to connect to registration service. The Google Apps Script may be down or misconfigured.")
    }
    
    if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error("CORS error: The registration service is not allowing requests from this domain.")
    }
    
    throw new Error("Registration error: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Get all posts
export async function getPosts() {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      return await mockGetPosts()
    }

    const response = await fetch(`${API_URL}?action=getPosts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Get posts error:", error)
    throw new Error("Get posts error: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Create a new post
export async function createPost(postData: {
  idUsers: string
  judul?: string
  deskripsi: string
  imageUrl?: string
}) {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      return await mockCreatePost(postData)
    }

    // If imageUrl is provided, make sure it's from the Google Drive folder
    let processedImageUrl = postData.imageUrl
    if (processedImageUrl && !processedImageUrl.includes("drive.google.com")) {
      // Convert to Google Drive shareable link format
      processedImageUrl = `https://drive.google.com/file/d/${processedImageUrl}/view?usp=sharing`
    }

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "createPost",
        ...postData,
        imageUrl: processedImageUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Create post error:", error)
    throw new Error("Create post error: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Like or dislike a post
export async function likeDislikePost(data: {
  idPostingan: string
  idUsers: string
  type: "like" | "dislike"
}) {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      return await mockLikeDislike(data)
    }

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "likeDislike",
        ...data,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Like/dislike error:", error)
    throw new Error("Like/dislike error: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Delete a post
export async function deletePost(data: { idPostingan: string; idUsers: string }) {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      return await mockDeletePost(data)
    }

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "deletePost",
        ...data,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Delete post error:", error)
    throw new Error("Delete post error: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Search posts
export async function searchPosts(query: string) {
  try {
    const posts = await getPosts()
    if (posts.error) {
      throw new Error(posts.error)
    }

    // Filter posts based on query
    const filteredPosts = posts.filter((post: any) => 
      post.judul?.toLowerCase().includes(query.toLowerCase()) ||
      post.deskripsi?.toLowerCase().includes(query.toLowerCase())
    )

    return filteredPosts
  } catch (error) {
    console.error("Search posts error:", error)
    throw new Error("Search posts error: " + (error instanceof Error ? error.message : String(error)))
  }
}

// Update user profile
export async function updateUserProfile(userData: {
  idUsers: string
  username?: string
  email?: string
  nim?: string
  jurusan?: string
  bio?: string
  location?: string
  website?: string
}) {
  try {
    const isMock = useMockAPI()
    if (isMock) {
      // Mock update for development
      return { message: "Profile updated successfully (mock)" }
    }

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "updateProfile",
        ...userData,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Update profile error:", error)
    throw new Error("Update profile error: " + (error instanceof Error ? error.message : String(error)))
  }
}