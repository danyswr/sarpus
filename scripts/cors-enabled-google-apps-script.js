/**
 * Google Apps Script untuk Mahasiswa Feedback Platform
 * Dengan CORS enabled untuk mengatasi "Failed to fetch"
 */

var ContentService = GoogleAppsScript.ContentService
var Logger = GoogleAppsScript.Logger
var SpreadsheetApp = GoogleAppsScript.SpreadsheetApp

function doGet(e) {
  return handleRequest(e)
}

function doPost(e) {
  return handleRequest(e)
}

function handleRequest(e) {
  // Set CORS headers for all responses
  var output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)

  // Handle preflight OPTIONS request
  if (e.method === "OPTIONS") {
    return output.setContent(JSON.stringify({ status: "ok" }))
  }

  try {
    // Process the actual request
    if (e.method === "GET") {
      return handleGetRequest(e, output)
    } else if (e.method === "POST") {
      return handlePostRequest(e, output)
    } else {
      return output.setContent(
        JSON.stringify({
          error: "Method not supported",
        }),
      )
    }
  } catch (error) {
    Logger.log("Error in handleRequest: " + error.toString())
    return output.setContent(
      JSON.stringify({
        error: "Server error: " + error.message,
        details: error.toString(),
      }),
    )
  }
}

function handleGetRequest(e, output) {
  var action = e.parameter.action || "test"

  if (action === "test") {
    return output.setContent(
      JSON.stringify({
        message: "Connection successful",
        timestamp: new Date().toISOString(),
        status: "OK",
      }),
    )
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  var sheetPostingan = spreadsheet.getSheetByName("Posting")
  var sheetUsers = spreadsheet.getSheetByName("Users")
  var sheetLikes = spreadsheet.getSheetByName("Likes")

  // Create Likes sheet if it doesn't exist
  if (!sheetLikes) {
    sheetLikes = spreadsheet.insertSheet("Likes")
    sheetLikes.appendRow(["idPostingan", "idUsers", "type", "timestamp"])
  }

  if (action === "getPosts") {
    if (!sheetPostingan) {
      return output.setContent(
        JSON.stringify({
          error: "Sheet 'Posting' tidak ditemukan",
        }),
      )
    }

    var dataPostingan = sheetPostingan.getDataRange().getValues()

    if (dataPostingan.length <= 1) {
      return output.setContent(JSON.stringify([]))
    }

    // Get username mapping from Users sheet
    var usernameMap = {}
    if (sheetUsers) {
      var usersData = sheetUsers.getDataRange().getValues()
      for (var k = 1; k < usersData.length; k++) {
        usernameMap[usersData[k][0]] = usersData[k][2] // ID Users -> Username
      }
    }

    // Get likes/dislikes data
    var likesData = []
    if (sheetLikes && sheetLikes.getLastRow() > 1) {
      likesData = sheetLikes.getDataRange().getValues()
    }

    var likesMap = {}
    for (var i = 1; i < likesData.length; i++) {
      var postId = likesData[i][0]
      var userId = likesData[i][1]
      var type = likesData[i][2]

      if (!likesMap[postId]) {
        likesMap[postId] = { likedBy: [], dislikedBy: [] }
      }

      if (type === "like") {
        likesMap[postId].likedBy.push(userId)
      } else if (type === "dislike") {
        likesMap[postId].dislikedBy.push(userId)
      }
    }

    var postsArray = []

    // Process posts (skip header row)
    for (var j = 1; j < dataPostingan.length; j++) {
      var row = dataPostingan[j]

      // Skip empty rows
      if (!row[0] || !row[1]) continue

      var idPostingan = row[1] || ""
      var idUsers = row[0] || ""

      var postData = {
        idUsers: idUsers,
        idPostingan: idPostingan,
        timestamp: row[2] || new Date().toISOString(),
        judul: row[3] || "Post",
        deskripsi: row[4] || "",
        like: Number.parseInt(row[5]) || 0,
        dislike: Number.parseInt(row[6]) || 0,
        username: usernameMap[idUsers] || "User",
        imageUrl: row[7] || "",
      }

      // Add likes/dislikes data
      if (likesMap[idPostingan]) {
        postData.likedBy = likesMap[idPostingan].likedBy
        postData.dislikedBy = likesMap[idPostingan].dislikedBy
      } else {
        postData.likedBy = []
        postData.dislikedBy = []
      }

      postsArray.push(postData)
    }

    return output.setContent(JSON.stringify(postsArray))
  }

  return output.setContent(
    JSON.stringify({
      error: "Aksi tidak ditemukan: " + action,
    }),
  )
}

function handlePostRequest(e, output) {
  var postData = e.postData.contents
  Logger.log("Content: " + postData)

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  var sheetUsers = spreadsheet.getSheetByName("Users")
  var sheetPosts = spreadsheet.getSheetByName("Posting")
  var sheetLikes = spreadsheet.getSheetByName("Likes")

  // Create Likes sheet if it doesn't exist
  if (!sheetLikes) {
    sheetLikes = spreadsheet.insertSheet("Likes")
    sheetLikes.appendRow(["idPostingan", "idUsers", "type", "timestamp"])
  }

  if (!sheetUsers || !sheetPosts) {
    return output.setContent(
      JSON.stringify({
        error: "Required sheets not found",
      }),
    )
  }

  var params = JSON.parse(postData)
  var action = params.action

  Logger.log("Action: " + action)

  if (action === "register") {
    return handleRegistration(params, sheetUsers, output)
  } else if (action === "login") {
    return handleLogin(params, sheetUsers, output)
  } else if (action === "createPost") {
    return handleCreatePost(params, sheetPosts, output)
  } else if (action === "likeDislike") {
    return handleLikeDislike(params, sheetPosts, sheetLikes, output)
  } else if (action === "deletePost") {
    return handleDeletePost(params, sheetUsers, sheetPosts, sheetLikes, output)
  } else if (action === "updateProfile") {
    return handleUpdateProfile(params, sheetUsers, output)
  }

  return output.setContent(
    JSON.stringify({
      error: "Aksi tidak ditemukan: " + action,
    }),
  )
}

function handleLogin(params, sheetUsers, output) {
  try {
    if (!params.email || !params.password) {
      return output.setContent(
        JSON.stringify({
          error: "Email dan password wajib diisi",
        }),
      )
    }

    var dataUsers = sheetUsers.getDataRange().getValues()
    Logger.log("Looking for user with email: " + params.email)

    for (var i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][1] && dataUsers[i][1].toLowerCase() === params.email.toLowerCase()) {
        Logger.log("User found: " + JSON.stringify(dataUsers[i]))

        // Simple password check
        var storedPassword = dataUsers[i][3]
        if (storedPassword === params.password) {
          return output.setContent(
            JSON.stringify({
              message: "Login berhasil",
              idUsers: dataUsers[i][0],
              role: dataUsers[i][7] || "user", // Role is in column H (index 7)
              username: dataUsers[i][2],
              email: dataUsers[i][1],
              nim: dataUsers[i][4],
              jurusan: dataUsers[i][6],
            }),
          )
        } else {
          return output.setContent(
            JSON.stringify({
              error: "Password salah",
            }),
          )
        }
      }
    }

    return output.setContent(
      JSON.stringify({
        error: "Email tidak ditemukan",
      }),
    )
  } catch (e) {
    Logger.log("Login error: " + e.toString())
    return output.setContent(
      JSON.stringify({
        error: "Login error: " + e.message,
      }),
    )
  }
}

function handleRegistration(params, sheetUsers, output) {
  try {
    if (!params.email || !params.username || !params.password || !params.nim || !params.jurusan) {
      return output.setContent(
        JSON.stringify({
          error: "Semua field wajib diisi",
        }),
      )
    }

    // Determine role
    var role = "user"
    if (
      params.email.indexOf("@admin.") > -1 ||
      params.email.indexOf("@staff.") > -1 ||
      params.nim.indexOf("ADM") === 0
    ) {
      role = "Admin"
    }

    var idUsers = "USER" + Date.now() + Math.random().toString(36).substr(2, 5)
    var dataUsers = sheetUsers.getDataRange().getValues()

    // Check if email already exists
    for (var k = 1; k < dataUsers.length; k++) {
      if (dataUsers[k][1] && dataUsers[k][1].toLowerCase() === params.email.toLowerCase()) {
        return output.setContent(
          JSON.stringify({
            error: "Email sudah terdaftar",
          }),
        )
      }
    }

    // Check if NIM already exists
    for (var l = 1; l < dataUsers.length; l++) {
      if (dataUsers[l][4] && dataUsers[l][4] === params.nim) {
        return output.setContent(
          JSON.stringify({
            error: "NIM sudah terdaftar",
          }),
        )
      }
    }

    // Add new user: ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
    sheetUsers.appendRow([
      idUsers,
      params.email,
      params.username,
      params.password,
      params.nim,
      params.gender || "Male",
      params.jurusan,
      role,
      new Date().toISOString(),
    ])

    Logger.log("User registered successfully: " + idUsers)

    return output.setContent(
      JSON.stringify({
        message: "Registrasi berhasil",
        idUsers: idUsers,
        role: role,
      }),
    )
  } catch (e) {
    Logger.log("Registration error: " + e.toString())
    return output.setContent(
      JSON.stringify({
        error: "Error saat registrasi: " + e.message,
      }),
    )
  }
}

function handleCreatePost(params, sheetPosts, output) {
  try {
    if (!params.idUsers || !params.deskripsi) {
      return output.setContent(
        JSON.stringify({
          error: "Data postingan tidak lengkap",
        }),
      )
    }

    var idPostingan = "POST" + Date.now() + Math.random().toString(36).substr(2, 5)

    // Add new post: ID Users, ID Postingan, timestamp, Judul, Deskripsi, Like, Dislike, ImageUrl
    sheetPosts.appendRow([
      params.idUsers,
      idPostingan,
      new Date().toISOString(),
      params.judul || "Post",
      params.deskripsi,
      0, // like
      0, // dislike
      params.imageUrl || "",
    ])

    return output.setContent(
      JSON.stringify({
        message: "Postingan berhasil dibuat",
        idPostingan: idPostingan,
      }),
    )
  } catch (e) {
    Logger.log("Create post error: " + e.toString())
    return output.setContent(
      JSON.stringify({
        error: "Create post error: " + e.message,
      }),
    )
  }
}

function handleLikeDislike(params, sheetPosts, sheetLikes, output) {
  try {
    if (!params.idPostingan || !params.type || !params.idUsers) {
      return output.setContent(
        JSON.stringify({
          error: "Data tidak lengkap",
        }),
      )
    }

    // Check if user already liked/disliked this post
    var likesData = sheetLikes.getDataRange().getValues()
    var hasInteracted = false
    var previousType = ""
    var rowToUpdate = -1

    // Skip header row
    for (var i = 1; i < likesData.length; i++) {
      if (likesData[i][0] === params.idPostingan && likesData[i][1] === params.idUsers) {
        hasInteracted = true
        previousType = likesData[i][2]
        rowToUpdate = i + 1
        break
      }
    }

    // Prevent spam - user can only like/dislike once
    if (hasInteracted && previousType === params.type) {
      return output.setContent(
        JSON.stringify({
          error: "Anda sudah " + (params.type === "like" ? "menyukai" : "tidak menyukai") + " postingan ini",
        }),
      )
    }

    // Find and update post
    var dataPosts = sheetPosts.getDataRange().getValues()
    for (var j = 1; j < dataPosts.length; j++) {
      if (dataPosts[j][1] === params.idPostingan) {
        var like = Number.parseInt(dataPosts[j][5]) || 0
        var dislike = Number.parseInt(dataPosts[j][6]) || 0

        if (hasInteracted) {
          // User is changing from like to dislike or vice versa
          if (previousType === "like" && params.type === "dislike") {
            like--
            dislike++
          } else if (previousType === "dislike" && params.type === "like") {
            like++
            dislike--
          }

          // Update existing record
          sheetLikes.getRange(rowToUpdate, 3).setValue(params.type)
          sheetLikes.getRange(rowToUpdate, 4).setValue(new Date().toISOString())
        } else {
          // First time interaction
          if (params.type === "like") {
            like++
          } else if (params.type === "dislike") {
            dislike++
          }

          // Add new record
          sheetLikes.appendRow([params.idPostingan, params.idUsers, params.type, new Date().toISOString()])
        }

        // Update post counts
        sheetPosts.getRange(j + 1, 6, 1, 2).setValues([[like, dislike]])

        return output.setContent(
          JSON.stringify({
            message: "Reaksi berhasil ditambahkan",
            like: like,
            dislike: dislike,
          }),
        )
      }
    }

    return output.setContent(
      JSON.stringify({
        error: "Postingan tidak ditemukan",
      }),
    )
  } catch (e) {
    Logger.log("Like/Dislike error: " + e.toString())
    return output.setContent(
      JSON.stringify({
        error: "Like/Dislike error: " + e.message,
      }),
    )
  }
}

function handleDeletePost(params, sheetUsers, sheetPosts, sheetLikes, output) {
  try {
    if (!params.idUsers || !params.idPostingan) {
      return output.setContent(
        JSON.stringify({
          error: "Data tidak lengkap",
        }),
      )
    }

    // Get user role
    var dataUsers = sheetUsers.getDataRange().getValues()
    var userRole = ""
    for (var i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][0] === params.idUsers) {
        userRole = dataUsers[i][7] || "user"
        break
      }
    }

    // Find and delete post
    var dataPosts = sheetPosts.getDataRange().getValues()
    for (var j = 1; j < dataPosts.length; j++) {
      if (dataPosts[j][1] === params.idPostingan) {
        // Check permissions
        if (userRole === "Admin" || dataPosts[j][0] === params.idUsers) {
          sheetPosts.deleteRow(j + 1)

          // Delete all likes/dislikes for this post
          var likesData = sheetLikes.getDataRange().getValues()
          for (var k = likesData.length - 1; k >= 1; k--) {
            if (likesData[k][0] === params.idPostingan) {
              sheetLikes.deleteRow(k + 1)
            }
          }

          return output.setContent(
            JSON.stringify({
              message: "Postingan berhasil dihapus",
            }),
          )
        } else {
          return output.setContent(
            JSON.stringify({
              error: "Tidak memiliki izin untuk menghapus postingan ini",
            }),
          )
        }
      }
    }

    return output.setContent(
      JSON.stringify({
        error: "Postingan tidak ditemukan",
      }),
    )
  } catch (e) {
    Logger.log("Delete post error: " + e.toString())
    return output.setContent(
      JSON.stringify({
        error: "Delete post error: " + e.message,
      }),
    )
  }
}

function handleUpdateProfile(params, sheetUsers, output) {
  try {
    if (!params.idUsers) {
      return output.setContent(
        JSON.stringify({
          error: "ID Users diperlukan",
        }),
      )
    }

    var dataUsers = sheetUsers.getDataRange().getValues()

    for (var i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][0] === params.idUsers) {
        // Update user data
        sheetUsers.getRange(i + 1, 2).setValue(params.email || dataUsers[i][1])
        sheetUsers.getRange(i + 1, 3).setValue(params.username || dataUsers[i][2])
        sheetUsers.getRange(i + 1, 5).setValue(params.nim || dataUsers[i][4])
        sheetUsers.getRange(i + 1, 7).setValue(params.jurusan || dataUsers[i][6])

        return output.setContent(
          JSON.stringify({
            message: "Profile berhasil diperbarui",
          }),
        )
      }
    }

    return output.setContent(
      JSON.stringify({
        error: "User tidak ditemukan",
      }),
    )
  } catch (e) {
    Logger.log("Update profile error: " + e.toString())
    return output.setContent(
      JSON.stringify({
        error: "Error saat update profile: " + e.message,
      }),
    )
  }
}
