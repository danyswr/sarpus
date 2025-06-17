/**
 * Google Apps Script untuk Mahasiswa Feedback Platform
 * PENTING: Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 */

// JANGAN gunakan require() di Google Apps Script
// ContentService, SpreadsheetApp, dan Logger sudah tersedia secara global

function doGet(e) {
  try {
    var action = e.parameter.action || "test"

    // Test connection
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

      var postsPostingan = dataPostingan.slice(1).map((row) => ({
        idUsers: row[0] || "",
        idPostingan: row[1] || "",
        timestamp: row[2] || new Date().toISOString(),
        judul: row[3] || "",
        deskripsi: row[4] || "",
        like: Number.parseInt(row[5]) || 0,
        dislike: Number.parseInt(row[6]) || 0,
      }))

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
    // Log the incoming request for debugging
    Logger.log("POST request received")
    Logger.log("Content: " + e.postData.contents)

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetUsers = spreadsheet.getSheetByName("Users")
    var sheetPosts = spreadsheet.getSheetByName("Posting")

    // Check if sheets exist
    if (!sheetUsers) {
      Logger.log("Sheet 'Users' not found")
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Sheet 'Users' tidak ditemukan. Pastikan nama sheet benar.",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    if (!sheetPosts) {
      Logger.log("Sheet 'Posting' not found")
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Sheet 'Posting' tidak ditemukan. Pastikan nama sheet benar.",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var params = JSON.parse(e.postData.contents)
    var action = params.action

    Logger.log("Action: " + action)

    if (action === "register") {
      return handleRegistration(params, sheetUsers)
    } else if (action === "login") {
      return handleLogin(params, sheetUsers)
    } else if (action === "createPost") {
      return handleCreatePost(params, sheetPosts)
    } else if (action === "likeDislike") {
      return handleLikeDislike(params, sheetPosts)
    } else if (action === "deletePost") {
      return handleDeletePost(params, sheetUsers, sheetPosts)
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
        details: e.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleRegistration(params, sheetUsers) {
  try {
    // Validate required fields
    if (!params.email || !params.username || !params.password || !params.nim || !params.jurusan) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Semua field wajib diisi",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    // Check email format
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(params.email)) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Format email tidak valid",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    // Auto-determine role
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
      return ContentService.createTextOutput(
        JSON.stringify({
          message: "User found",
          idUsers: dataUsers[i][0],
          role: dataUsers[i][7] || "user",
          username: dataUsers[i][2],
          hashedPassword: dataUsers[i][3],
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
  if (!params.idUsers || !params.judul || !params.deskripsi) {
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
    params.judul,
    params.deskripsi,
    0, // like
    0, // dislike
  ])

  return ContentService.createTextOutput(
    JSON.stringify({
      message: "Postingan berhasil dibuat",
      idPostingan: idPostingan,
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

function handleLikeDislike(params, sheetPosts) {
  if (!params.idPostingan || !params.type) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Data tidak lengkap",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
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

function handleDeletePost(params, sheetUsers, sheetPosts) {
  if (!params.idUsers || !params.idPostingan) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Data tidak lengkap",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
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
        return ContentService.createTextOutput(
          JSON.stringify({
            message: "Postingan berhasil dihapus",
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

var ContentService = SpreadsheetApp.newTextOutput
var SpreadsheetApp = SpreadsheetApp
var Logger = Logger
