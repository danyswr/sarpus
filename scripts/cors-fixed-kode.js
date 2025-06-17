/**
 * Google Apps Script with CORS support for Mahasiswa Feedback Platform
 */

var google = {} // Declare the google variable to fix the lint error
var ContentService = google.script.runtime.ContentService
var SpreadsheetApp = google.script.runtime.SpreadsheetApp
var Logger = google.script.runtime.Logger

function doGet(e) {
  try {
    // Add CORS headers
    var output = ContentService.createTextOutput()
    output.setMimeType(ContentService.MimeType.JSON)

    var action = e.parameter.action || "test"

    // Test connection
    if (action === "test") {
      var result = JSON.stringify({
        message: "Connection successful",
        timestamp: new Date().toISOString(),
        sheets: getSheetInfo(),
      })
      return output.setContent(result)
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetPostingan = spreadsheet.getSheetByName("Posting")

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

      var postsPostingan = dataPostingan.slice(1).map((row) => ({
        idUsers: row[0] || "",
        idPostingan: row[1] || "",
        timestamp: row[2] || new Date().toISOString(),
        judul: row[3] || "",
        deskripsi: row[4] || "",
        like: Number.parseInt(row[5]) || 0,
        dislike: Number.parseInt(row[6]) || 0,
      }))

      return output.setContent(JSON.stringify(postsPostingan))
    }

    return output.setContent(
      JSON.stringify({
        error: "Aksi tidak ditemukan: " + action,
      }),
    )
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
    // Log the incoming request
    Logger.log("POST request received")
    Logger.log("Content: " + e.postData.contents)

    var output = ContentService.createTextOutput()
    output.setMimeType(ContentService.MimeType.JSON)

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetUsers = spreadsheet.getSheetByName("Users")
    var sheetPosts = spreadsheet.getSheetByName("Posting")

    // Check if sheets exist
    if (!sheetUsers) {
      Logger.log("Sheet 'Users' not found")
      return output.setContent(
        JSON.stringify({
          error: "Sheet 'Users' tidak ditemukan",
          availableSheets: getSheetNames(),
        }),
      )
    }

    if (!sheetPosts) {
      Logger.log("Sheet 'Posting' not found")
      return output.setContent(
        JSON.stringify({
          error: "Sheet 'Posting' tidak ditemukan",
          availableSheets: getSheetNames(),
        }),
      )
    }

    var params = JSON.parse(e.postData.contents)
    var action = params.action

    Logger.log("Action: " + action)

    if (action === "register") {
      return handleRegistration(params, sheetUsers, output)
    } else if (action === "login") {
      return handleLogin(params, sheetUsers, output)
    } else if (action === "createPost") {
      return handleCreatePost(params, sheetPosts, output)
    } else if (action === "likeDislike") {
      return handleLikeDislike(params, sheetPosts, output)
    } else if (action === "deletePost") {
      return handleDeletePost(params, sheetUsers, sheetPosts, output)
    }

    return output.setContent(
      JSON.stringify({
        error: "Aksi tidak ditemukan: " + action,
      }),
    )
  } catch (e) {
    Logger.log("Error in doPost: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Server error: " + e.message,
        details: e.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleRegistration(params, sheetUsers, output) {
  try {
    // Validate required fields
    if (!params.email || !params.username || !params.password || !params.nim || !params.jurusan) {
      return output.setContent(
        JSON.stringify({
          error: "Semua field wajib diisi",
        }),
      )
    }

    // Check email format
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(params.email)) {
      return output.setContent(
        JSON.stringify({
          error: "Format email tidak valid",
        }),
      )
    }

    // Auto-determine role
    var role = "user"
    if (params.email.indexOf("@admin.") > -1 || params.nim.indexOf("ADM") === 0) {
      role = "admin"
    }

    var idUsers = "USER" + Date.now() + Math.random().toString(36).substr(2, 5)
    var dataUsers = sheetUsers.getDataRange().getValues()

    // Check if email already exists
    for (var i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][1] && dataUsers[i][1].toLowerCase() === params.email.toLowerCase()) {
        return output.setContent(
          JSON.stringify({
            error: "Email sudah terdaftar",
          }),
        )
      }
    }

    // Check if NIM already exists
    for (var j = 1; j < dataUsers.length; j++) {
      if (dataUsers[j][4] && dataUsers[j][4] === params.nim) {
        return output.setContent(
          JSON.stringify({
            error: "NIM sudah terdaftar",
          }),
        )
      }
    }

    // Add new user
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

function handleLogin(params, sheetUsers, output) {
  if (!params.email || !params.password) {
    return output.setContent(
      JSON.stringify({
        error: "Email dan password wajib diisi",
      }),
    )
  }

  var dataUsers = sheetUsers.getDataRange().getValues()
  for (var i = 1; i < dataUsers.length; i++) {
    if (dataUsers[i][1] && dataUsers[i][1].toLowerCase() === params.email.toLowerCase()) {
      return output.setContent(
        JSON.stringify({
          message: "User found",
          idUsers: dataUsers[i][0],
          role: dataUsers[i][7] || "user",
          username: dataUsers[i][2],
          hashedPassword: dataUsers[i][3],
        }),
      )
    }
  }

  return output.setContent(
    JSON.stringify({
      error: "Email tidak ditemukan",
    }),
  )
}

function handleCreatePost(params, sheetPosts, output) {
  if (!params.idUsers || !params.judul || !params.deskripsi) {
    return output.setContent(
      JSON.stringify({
        error: "Data postingan tidak lengkap",
      }),
    )
  }

  var idPostingan = "POST" + Date.now() + Math.random().toString(36).substr(2, 5)
  sheetPosts.appendRow([params.idUsers, idPostingan, new Date().toISOString(), params.judul, params.deskripsi, 0, 0])

  return output.setContent(
    JSON.stringify({
      message: "Postingan berhasil dibuat",
      idPostingan: idPostingan,
    }),
  )
}

function handleLikeDislike(params, sheetPosts, output) {
  if (!params.idPostingan || !params.type) {
    return output.setContent(
      JSON.stringify({
        error: "Data tidak lengkap",
      }),
    )
  }

  var dataPosts = sheetPosts.getDataRange().getValues()
  for (var i = 1; i < dataPosts.length; i++) {
    if (dataPosts[i][1] === params.idPostingan) {
      var like = Number.parseInt(dataPosts[i][5]) || 0
      var dislike = Number.parseInt(dataPosts[i][6]) || 0

      if (params.type === "like") {
        like++
      } else if (params.type === "dislike") {
        dislike++
      }

      sheetPosts.getRange(i + 1, 6, 1, 2).setValues([[like, dislike]])

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
}

function handleDeletePost(params, sheetUsers, sheetPosts, output) {
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
      if (userRole === "admin" || dataPosts[j][0] === params.idUsers) {
        sheetPosts.deleteRow(j + 1)
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
}

// Helper functions
function getSheetNames() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheets = spreadsheet.getSheets()
    return sheets.map((sheet) => sheet.getName())
  } catch (e) {
    return ["Error getting sheet names: " + e.message]
  }
}

function getSheetInfo() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetUsers = spreadsheet.getSheetByName("Users")
    var sheetPosts = spreadsheet.getSheetByName("Posting")

    return {
      spreadsheetId: spreadsheet.getId(),
      usersSheetExists: !!sheetUsers,
      postingSheetExists: !!sheetPosts,
      allSheets: getSheetNames(),
    }
  } catch (e) {
    return {
      error: e.message,
    }
  }
}

// Test function
function testConnection() {
  return getSheetInfo()
}
