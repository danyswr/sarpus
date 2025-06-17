/**
 * Google Apps Script dengan dukungan like/dislike sekali per user dan username
 */

var google = {} // Declare the google variable
google.script = {}
google.script.runtime = {
  ContentService: null,
  SpreadsheetApp: null,
  Logger: null,
}

var ContentService = google.script.runtime.ContentService
var SpreadsheetApp = google.script.runtime.SpreadsheetApp
var Logger = google.script.runtime.Logger

function doGet(e) {
  try {
    var action = e.parameter.action || "test"

    if (action === "test") {
      return ContentService.createTextOutput(
        JSON.stringify({
          message: "Connection successful",
          timestamp: new Date().toISOString(),
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetPostingan = spreadsheet.getSheetByName("Posting")
    var sheetLikes = spreadsheet.getSheetByName("Likes") || spreadsheet.insertSheet("Likes")

    // Pastikan sheet Likes memiliki header yang benar
    if (sheetLikes.getLastRow() === 0) {
      sheetLikes.appendRow(["idPostingan", "idUsers", "type", "timestamp"])
    }

    if (action === "getPosts") {
      if (!sheetPostingan) {
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "Sheet 'Posting' tidak ditemukan",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }

      var dataPostingan = sheetPostingan.getDataRange().getValues()
      if (dataPostingan.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON)
      }

      // Get all likes/dislikes data
      var likesData = sheetLikes.getDataRange().getValues()
      var likesMap = {}

      // Skip header row
      for (var i = 1; i < likesData.length; i++) {
        var postId = likesData[i][0]
        var userId = likesData[i][1]
        var type = likesData[i][2]

        if (!likesMap[postId]) {
          likesMap[postId] = {
            likedBy: [],
            dislikedBy: [],
          }
        }

        if (type === "like") {
          likesMap[postId].likedBy.push(userId)
        } else if (type === "dislike") {
          likesMap[postId].dislikedBy.push(userId)
        }
      }

      var postsPostingan = dataPostingan.slice(1).map((row) => {
        var postId = row[1] || ""
        var postData = {
          idUsers: row[0] || "",
          idPostingan: postId,
          timestamp: row[2] || new Date().toISOString(),
          judul: row[3] || "",
          deskripsi: row[4] || "",
          like: Number.parseInt(row[5]) || 0,
          dislike: Number.parseInt(row[6]) || 0,
          username: row[7] || "User", // Tambahkan username
        }

        // Add likes/dislikes data
        if (likesMap[postId]) {
          postData.likedBy = likesMap[postId].likedBy
          postData.dislikedBy = likesMap[postId].dislikedBy
        } else {
          postData.likedBy = []
          postData.dislikedBy = []
        }

        return postData
      })

      return ContentService.createTextOutput(JSON.stringify(postsPostingan)).setMimeType(ContentService.MimeType.JSON)
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Aksi tidak ditemukan: " + action,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Error in doGet: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Server error: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function doPost(e) {
  try {
    Logger.log("POST request received")

    var postData = e.postData.contents || e.parameter.data
    Logger.log("Content: " + postData)

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetUsers = spreadsheet.getSheetByName("Users")
    var sheetPosts = spreadsheet.getSheetByName("Posting")
    var sheetLikes = spreadsheet.getSheetByName("Likes") || spreadsheet.insertSheet("Likes")

    // Pastikan sheet Likes memiliki header yang benar
    if (sheetLikes.getLastRow() === 0) {
      sheetLikes.appendRow(["idPostingan", "idUsers", "type", "timestamp"])
    }

    if (!sheetUsers || !sheetPosts) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Required sheets not found",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var params = JSON.parse(postData)
    var action = params.action

    Logger.log("Action: " + action)

    if (action === "register") {
      return handleRegistration(params, sheetUsers)
    } else if (action === "login") {
      return handleLogin(params, sheetUsers)
    } else if (action === "updateProfile") {
      return handleUpdateProfile(params, sheetUsers)
    } else if (action === "createPost") {
      return handleCreatePost(params, sheetPosts)
    } else if (action === "likeDislike") {
      return handleLikeDislike(params, sheetPosts, sheetLikes)
    } else if (action === "deletePost") {
      return handleDeletePost(params, sheetUsers, sheetPosts, sheetLikes)
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Aksi tidak ditemukan: " + action,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Error in doPost: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Server error: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleRegistration(params, sheetUsers) {
  try {
    if (!params.email || !params.username || !params.password || !params.nim || !params.jurusan) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Semua field wajib diisi",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(params.email)) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Format email tidak valid",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var role = "user"
    if (
      params.email.indexOf("@admin.") > -1 ||
      params.email.indexOf("@staff.") > -1 ||
      params.nim.indexOf("ADM") === 0
    ) {
      role = "admin"
    }

    var idUsers = "USER" + Date.now() + Math.random().toString(36).substr(2, 5)
    var dataUsers = sheetUsers.getDataRange().getValues()

    // Check if email already exists
    for (var k = 1; k < dataUsers.length; k++) {
      if (dataUsers[k][1] && dataUsers[k][1].toLowerCase() === params.email.toLowerCase()) {
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "Email sudah terdaftar",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }
    }

    // Check if NIM already exists
    for (var l = 1; l < dataUsers.length; l++) {
      if (dataUsers[l][4] && dataUsers[l][4] === params.nim) {
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "NIM sudah terdaftar",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }
    }

    // Store hashed password directly (already hashed from frontend)
    sheetUsers.appendRow([
      idUsers,
      params.email,
      params.username,
      params.password, // Already hashed password from frontend
      params.nim,
      params.gender || "Male",
      params.jurusan,
      role,
      new Date().toISOString(),
      "", // bio
      "", // location
      "", // website
    ])

    Logger.log("User registered successfully: " + idUsers)

    return ContentService.createTextOutput(
      JSON.stringify({
        message: "Registrasi berhasil",
        idUsers: idUsers,
        role: role,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Registration error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Error saat registrasi: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleLogin(params, sheetUsers) {
  if (!params.email || !params.password) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Email dan password wajib diisi",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }

  var dataUsers = sheetUsers.getDataRange().getValues()
  for (var i = 1; i < dataUsers.length; i++) {
    if (dataUsers[i][1] && dataUsers[i][1].toLowerCase() === params.email.toLowerCase()) {
      // Return user data with hashed password for frontend verification
      return ContentService.createTextOutput(
        JSON.stringify({
          message: "User found",
          idUsers: dataUsers[i][0],
          role: dataUsers[i][7] || "user",
          username: dataUsers[i][2],
          email: dataUsers[i][1],
          nim: dataUsers[i][4],
          jurusan: dataUsers[i][6],
          hashedPassword: dataUsers[i][3], // Send hashed password for verification
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      error: "Email tidak ditemukan",
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

function handleCreatePost(params, sheetPosts) {
  if (!params.idUsers || !params.deskripsi) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Data postingan tidak lengkap",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }

  var idPostingan = "POST" + Date.now() + Math.random().toString(36).substr(2, 5)
  sheetPosts.appendRow([
    params.idUsers,
    idPostingan,
    new Date().toISOString(),
    params.judul || "Post",
    params.deskripsi,
    0, // like
    0, // dislike
    params.username || "User", // Tambahkan username
  ])

  return ContentService.createTextOutput(
    JSON.stringify({
      message: "Postingan berhasil dibuat",
      idPostingan: idPostingan,
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

function handleLikeDislike(params, sheetPosts, sheetLikes) {
  if (!params.idPostingan || !params.type || !params.idUsers) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Data tidak lengkap",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
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
      rowToUpdate = i + 1 // +1 because rows are 1-indexed
      break
    }
  }

  // Find post
  var dataPosts = sheetPosts.getDataRange().getValues()
  for (var j = 1; j < dataPosts.length; j++) {
    if (dataPosts[j][1] === params.idPostingan) {
      var like = Number.parseInt(dataPosts[j][5]) || 0
      var dislike = Number.parseInt(dataPosts[j][6]) || 0

      // If user already interacted with this post
      if (hasInteracted) {
        // If trying to do the same action again, return error
        if (previousType === params.type) {
          return ContentService.createTextOutput(
            JSON.stringify({
              error: "Anda sudah " + (params.type === "like" ? "menyukai" : "tidak menyukai") + " postingan ini",
              like: like,
              dislike: dislike,
            }),
          ).setMimeType(ContentService.MimeType.JSON)
        }

        // If changing from like to dislike or vice versa
        if (previousType === "like" && params.type === "dislike") {
          like--
          dislike++
        } else if (previousType === "dislike" && params.type === "like") {
          like++
          dislike--
        }

        // Update the like/dislike record
        sheetLikes.getRange(rowToUpdate, 3).setValue(params.type)
        sheetLikes.getRange(rowToUpdate, 4).setValue(new Date().toISOString())
      } else {
        // New interaction
        if (params.type === "like") {
          like++
        } else if (params.type === "dislike") {
          dislike++
        }

        // Add new like/dislike record
        sheetLikes.appendRow([params.idPostingan, params.idUsers, params.type, new Date().toISOString()])
      }

      // Update post like/dislike counts
      sheetPosts.getRange(j + 1, 6, 1, 2).setValues([[like, dislike]])

      return ContentService.createTextOutput(
        JSON.stringify({
          message: "Reaksi berhasil ditambahkan",
          like: like,
          dislike: dislike,
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      error: "Postingan tidak ditemukan",
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

function handleDeletePost(params, sheetUsers, sheetPosts, sheetLikes) {
  if (!params.idUsers || !params.idPostingan) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Data tidak lengkap",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }

  var dataUsers = sheetUsers.getDataRange().getValues()
  var userRole = ""
  for (var i = 1; i < dataUsers.length; i++) {
    if (dataUsers[i][0] === params.idUsers) {
      userRole = dataUsers[i][7] || "user"
      break
    }
  }

  var dataPosts = sheetPosts.getDataRange().getValues()
  for (var j = 1; j < dataPosts.length; j++) {
    if (dataPosts[j][1] === params.idPostingan) {
      if (userRole === "admin" || dataPosts[j][0] === params.idUsers) {
        // Delete post
        sheetPosts.deleteRow(j + 1)

        // Delete all likes/dislikes for this post
        var likesData = sheetLikes.getDataRange().getValues()
        for (var k = likesData.length - 1; k >= 1; k--) {
          if (likesData[k][0] === params.idPostingan) {
            sheetLikes.deleteRow(k + 1)
          }
        }

        return ContentService.createTextOutput(
          JSON.stringify({
            message: "Postingan berhasil dihapus",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      } else {
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "Tidak memiliki izin untuk menghapus postingan ini",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      error: "Postingan tidak ditemukan",
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

function handleUpdateProfile(params, sheetUsers) {
  try {
    if (!params.idUsers) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "ID Users diperlukan",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var dataUsers = sheetUsers.getDataRange().getValues()

    for (var i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][0] === params.idUsers) {
        sheetUsers.getRange(i + 1, 3).setValue(params.username || dataUsers[i][2])
        sheetUsers.getRange(i + 1, 2).setValue(params.email || dataUsers[i][1])
        sheetUsers.getRange(i + 1, 5).setValue(params.nim || dataUsers[i][4])
        sheetUsers.getRange(i + 1, 7).setValue(params.jurusan || dataUsers[i][6])

        if (dataUsers[i].length < 12) {
          sheetUsers.getRange(i + 1, 10).setValue(params.bio || "")
          sheetUsers.getRange(i + 1, 11).setValue(params.location || "")
          sheetUsers.getRange(i + 1, 12).setValue(params.website || "")
        } else {
          sheetUsers.getRange(i + 1, 10).setValue(params.bio || dataUsers[i][9])
          sheetUsers.getRange(i + 1, 11).setValue(params.location || dataUsers[i][10])
          sheetUsers.getRange(i + 1, 12).setValue(params.website || dataUsers[i][11])
        }

        return ContentService.createTextOutput(
          JSON.stringify({
            message: "Profile berhasil diperbarui",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        error: "User tidak ditemukan",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Update profile error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Error saat update profile: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}
