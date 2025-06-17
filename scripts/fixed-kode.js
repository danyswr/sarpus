/**
 * Fixed Google Apps Script for Mahasiswa Feedback Platform
 * Make sure to deploy this as a web app with proper permissions
 */

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

    if (action === "getTopPosts") {
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

      // Sort by engagement score
      postsPostingan.sort((a, b) => {
        var scoreA = a.like - a.dislike
        var scoreB = b.like - b.dislike
        if (scoreB !== scoreA) return scoreB - scoreA
        return b.like - a.like
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
        details: e.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function doPost(e) {
  try {
    // Log the incoming request for debugging
    Logger.log("POST request received: " + e.postData.contents)

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
      if (params.email.includes("@admin.") || params.email.includes("@staff.") || params.nim.startsWith("ADM")) {
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
        params.password, // Already hashed from frontend
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
    } else if (action === "login") {
      if (!params.email || !params.password) {
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "Email dan password wajib diisi",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }

      var dataUsers = sheetUsers.getDataRange().getValues()
      for (var m = 1; m < dataUsers.length; m++) {
        if (dataUsers[m][1] && dataUsers[m][1].toLowerCase() === params.email.toLowerCase()) {
          return ContentService.createTextOutput(
            JSON.stringify({
              message: "User found",
              idUsers: dataUsers[m][0],
              role: dataUsers[m][7] || "user",
              username: dataUsers[m][2],
              hashedPassword: dataUsers[m][3],
            }),
          ).setMimeType(ContentService.MimeType.JSON)
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Email tidak ditemukan",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    } else if (action === "createPost") {
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
    } else if (action === "likeDislike") {
      if (!params.idPostingan || !params.type) {
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "Data tidak lengkap",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }

      var dataPosts = sheetPosts.getDataRange().getValues()
      for (var n = 1; n < dataPosts.length; n++) {
        if (dataPosts[n][1] === params.idPostingan) {
          var like = Number.parseInt(dataPosts[n][5]) || 0
          var dislike = Number.parseInt(dataPosts[n][6]) || 0

          if (params.type === "like") {
            like++
          } else if (params.type === "dislike") {
            dislike++
          }

          sheetPosts.getRange(n + 1, 6, 1, 2).setValues([[like, dislike]])

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
    } else if (action === "deletePost") {
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
      for (var o = 1; o < dataUsers.length; o++) {
        if (dataUsers[o][0] === params.idUsers) {
          userRole = dataUsers[o][7] || "user"
          break
        }
      }

      // Find and delete post
      var dataPosts = sheetPosts.getDataRange().getValues()
      for (var p = 1; p < dataPosts.length; p++) {
        if (dataPosts[p][1] === params.idPostingan) {
          // Check permission
          if (userRole === "admin" || dataPosts[p][0] === params.idUsers) {
            sheetPosts.deleteRow(p + 1)
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

// Test function to verify sheet access
function testSheetAccess() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetUsers = spreadsheet.getSheetByName("Users")
    var sheetPosts = spreadsheet.getSheetByName("Posting")

    Logger.log("Spreadsheet ID: " + spreadsheet.getId())
    Logger.log("Users sheet found: " + (sheetUsers ? "Yes" : "No"))
    Logger.log("Posting sheet found: " + (sheetPosts ? "Yes" : "No"))

    if (sheetUsers) {
      Logger.log("Users sheet range: " + sheetUsers.getDataRange().getA1Notation())
    }

    if (sheetPosts) {
      Logger.log("Posting sheet range: " + sheetPosts.getDataRange().getA1Notation())
    }

    return "Test completed - check logs"
  } catch (e) {
    Logger.log("Test error: " + e.toString())
    return "Test failed: " + e.message
  }
}

// Declare variables before using them
var ContentService = google.script.content
var SpreadsheetApp = google.script.spreadsheet
var Logger = google.script.logger
