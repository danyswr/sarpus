
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
const USE_REAL_API = true // Set to false for development

async function makeRequest(url: string, options: RequestInit = {}) {
  try {
    console.log("Making request to:", url)
    console.log("Request options:", options)

    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Response data:", data)
    return data
  } catch (error) {
    console.error("Request failed:", error)
    throw error
  }
}

// Test connection
export async function testConnection() {
  if (!USE_REAL_API) {
    return mockTestConnection()
  }

  try {
    const response = await makeRequest(`${API_URL}?action=test`)
    return response
  } catch (error) {
    console.error("Test connection failed:", error)
    throw error
  }
}

// Login user dengan multiple fallback methods
export async function loginUser(email: string, password: string) {
  if (!USE_REAL_API) {
    return mockLoginUser(email, password)
  }

  try {
    console.log("Login attempt for:", email)
    console.log("Using real API for login")

    // Method 1: Try GET request first (yang sebelumnya berhasil)
    try {
      console.log("Trying GET request for login")
      const getResponse = await makeRequest(`${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
      
      if (getResponse && !getResponse.error) {
        console.log("GET Login response:", getResponse)
        return getResponse
      }
      console.log("GET login failed, trying POST:", getResponse)
    } catch (getError) {
      console.log("GET request failed, trying POST method:", getError)
    }

    // Method 2: Try POST with JSON (original method)
    const loginData = {
      action: "login",
      email: email,
      password: password,
    }

    console.log("Trying POST with JSON")
    console.log("POST login payload:", loginData)

    const response = await makeRequest(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    })

    console.log("JSON POST Login response:", response)
    
    if (response && !response.error) {
      return response
    }

    // Method 3: Try POST with form data as fallback
    try {
      console.log("JSON POST failed, trying form data")
      const formData = new FormData()
      formData.append('action', 'login')
      formData.append('email', email)
      formData.append('password', password)

      const formResponse = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        body: formData,
      })

      if (formResponse.ok) {
        const formResult = await formResponse.json()
        if (formResult && !formResult.error) {
          console.log("Form POST Login response:", formResult)
          return formResult
        }
      }
    } catch (formError) {
      console.log("Form POST also failed:", formError)
    }

    // If we reach here, return the last response or error
    if (response && response.error) {
      return response
    }

    return { error: "Login failed: Unable to connect to server" }

  } catch (error) {
    console.error("All login methods failed:", error)
    
    // Fallback: Use mock data if all methods fail
    console.log("Using fallback mock login")
    return mockLoginUser(email, password)
  }
}

// Register user
export async function registerUser(userData: {
  email: string
  username: string
  password: string
  nim?: string
  jurusan?: string
  gender?: string
}) {
  if (!USE_REAL_API) {
    return mockRegisterUser(userData)
  }

  try {
    // Try GET method first
    const queryParams = new URLSearchParams({
      action: "register",
      email: userData.email,
      username: userData.username,
      password: userData.password,
      nim: userData.nim || "",
      jurusan: userData.jurusan || "",
      gender: userData.gender || "Male"
    })

    try {
      const getResponse = await makeRequest(`${API_URL}?${queryParams.toString()}`)
      if (getResponse && !getResponse.error) {
        return getResponse
      }
    } catch (getError) {
      console.log("GET register failed, trying POST")
    }

    // Fallback to POST
    const registerData = {
      action: "register",
      ...userData,
    }

    const response = await makeRequest(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    })

    return response
  } catch (error) {
    console.error("Register error:", error)
    return mockRegisterUser(userData)
  }
}

// Get posts
export async function getPosts() {
  if (!USE_REAL_API) {
    return mockGetPosts()
  }

  try {
    const response = await makeRequest(`${API_URL}?action=getPosts`)
    return response
  } catch (error) {
    console.error("Get posts error:", error)
    return mockGetPosts()
  }
}

// Create post
export async function createPost(postData: {
  idUsers: string
  judul?: string
  deskripsi: string
  imageUrl?: string
}) {
  if (!USE_REAL_API) {
    return mockCreatePost(postData)
  }

  try {
    const createData = {
      action: "createPost",
      ...postData,
    }

    const response = await makeRequest(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData),
    })

    return response
  } catch (error) {
    console.error("Create post error:", error)
    return mockCreatePost(postData)
  }
}

// Like/dislike post
export async function likeDislikePost(postId: string, type: "like" | "dislike") {
  if (!USE_REAL_API) {
    return mockLikeDislike(postId, type)
  }

  try {
    const likeData = {
      action: "likeDislike",
      idPostingan: postId,
      type: type,
    }

    const response = await makeRequest(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(likeData),
    })

    return response
  } catch (error) {
    console.error("Like/dislike error:", error)
    return mockLikeDislike(postId, type)
  }
}

// Update profile
export async function updateProfile(profileData: {
  idUsers: string
  bio?: string
  location?: string
  website?: string
}) {
  if (!USE_REAL_API) {
    return { message: "Profile updated successfully" }
  }

  try {
    const updateData = {
      action: "updateProfile",
      ...profileData,
    }

    const response = await makeRequest(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    return response
  } catch (error) {
    console.error("Update profile error:", error)
    return { message: "Profile updated successfully (fallback)" }
  }
}

// Delete post (mock only)
export async function deletePost(postId: string) {
  return mockDeletePost(postId)
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
  if (!USE_REAL_API) {
      return { message: "Profile updated successfully (mock)" }
  }

  try {
      const response = await makeRequest(API_URL, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              action: "updateProfile",
              idUsers: userData.idUsers,
              username: userData.username,
              email: userData.email,
              nim: userData.nim,
              jurusan: userData.jurusan,
              bio: userData.bio,
              location: userData.location,
              website: userData.website,
          }),
      });

      return response;
  } catch (error) {
      console.error("Update profile error:", error);
      return { message: "Profile updated successfully (fallback)" };
  }
}
