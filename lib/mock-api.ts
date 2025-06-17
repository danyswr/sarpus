// Mock API untuk testing lokal
const mockUsers = [
  {
    idUsers: "USER123",
    email: "admin@admin.admin",
    username: "Admin User",
    password: "admin123",
    nim: "ADM123456",
    jurusan: "Teknik Informatika",
    role: "Admin",
  },
  {
    idUsers: "USER456",
    email: "user@test.com",
    username: "Regular User",
    password: "user123",
    nim: "2023071234",
    jurusan: "Teknik Elektro",
    role: "user",
  },
]

const mockPosts = [
  {
    idUsers: "USER123",
    idPostingan: "POST123",
    timestamp: new Date().toISOString(),
    judul: "Pengumuman Penting",
    deskripsi: "Ini adalah pengumuman penting dari admin",
    like: 5,
    dislike: 1,
    username: "Admin User",
    likedBy: ["USER456"],
    dislikedBy: [],
  },
  {
    idUsers: "USER456",
    idPostingan: "POST456",
    timestamp: new Date().toISOString(),
    judul: "Halo Semua",
    deskripsi: "Ini adalah postingan dari user biasa",
    like: 2,
    dislike: 0,
    username: "Regular User",
    likedBy: ["USER123"],
    dislikedBy: [],
  },
]

export async function mockTestConnection() {
  return {
    message: "Mock API connection successful",
    timestamp: new Date().toISOString(),
  }
}

export async function mockLoginUser(email: string, password: string) {
  const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

  if (!user) {
    return { error: "Email tidak ditemukan" }
  }

  if (user.password !== password) {
    return { error: "Password salah" }
  }

  return {
    message: "Login berhasil",
    idUsers: user.idUsers,
    username: user.username,
    email: user.email,
    role: user.role,
    nim: user.nim,
    jurusan: user.jurusan,
  }
}

export async function mockRegisterUser(userData: any) {
  const existingUser = mockUsers.find((u) => u.email.toLowerCase() === userData.email.toLowerCase())

  if (existingUser) {
    return { error: "Email sudah terdaftar" }
  }

  const newUser = {
    idUsers: `USER${Date.now()}`,
    email: userData.email,
    username: userData.username,
    password: userData.password,
    nim: userData.nim,
    jurusan: userData.jurusan,
    role: userData.email.includes("admin") ? "Admin" : "user",
  }

  mockUsers.push(newUser)

  return {
    message: "Registrasi berhasil",
    idUsers: newUser.idUsers,
    role: newUser.role,
  }
}

export async function mockGetPosts() {
  return mockPosts
}

export async function mockCreatePost(postData: any) {
  const newPost = {
    idUsers: postData.idUsers,
    idPostingan: `POST${Date.now()}`,
    timestamp: new Date().toISOString(),
    judul: postData.judul || "Post",
    deskripsi: postData.deskripsi,
    like: 0,
    dislike: 0,
    username: mockUsers.find((u) => u.idUsers === postData.idUsers)?.username || "User",
    likedBy: [],
    dislikedBy: [],
    imageUrl: postData.imageUrl || "",
  }

  mockPosts.push(newPost)

  return {
    message: "Postingan berhasil dibuat",
    idPostingan: newPost.idPostingan,
  }
}

export async function mockLikeDislike(data: any) {
  const post = mockPosts.find((p) => p.idPostingan === data.idPostingan)

  if (!post) {
    return { error: "Postingan tidak ditemukan" }
  }

  const userLiked = post.likedBy.includes(data.idUsers)
  const userDisliked = post.dislikedBy.includes(data.idUsers)

  if (data.type === "like") {
    if (userLiked) {
      return {
        error: "Anda sudah menyukai postingan ini",
        like: post.like,
        dislike: post.dislike,
      }
    }

    if (userDisliked) {
      post.dislikedBy = post.dislikedBy.filter((id) => id !== data.idUsers)
      post.dislike--
    }

    post.likedBy.push(data.idUsers)
    post.like++
  } else if (data.type === "dislike") {
    if (userDisliked) {
      return {
        error: "Anda sudah tidak menyukai postingan ini",
        like: post.like,
        dislike: post.dislike,
      }
    }

    if (userLiked) {
      post.likedBy = post.likedBy.filter((id) => id !== data.idUsers)
      post.like--
    }

    post.dislikedBy.push(data.idUsers)
    post.dislike++
  }

  return {
    message: "Reaksi berhasil ditambahkan",
    like: post.like,
    dislike: post.dislike,
  }
}

export async function mockDeletePost(data: any) {
  const postIndex = mockPosts.findIndex((p) => p.idPostingan === data.idPostingan)

  if (postIndex === -1) {
    return { error: "Postingan tidak ditemukan" }
  }

  const post = mockPosts[postIndex]
  const user = mockUsers.find((u) => u.idUsers === data.idUsers)

  if (post.idUsers !== data.idUsers && user?.role.toLowerCase() !== "admin") {
    return { error: "Tidak memiliki izin untuk menghapus postingan ini" }
  }

  mockPosts.splice(postIndex, 1)

  return {
    message: "Postingan berhasil dihapus",
  }
}
