/**
 * Updated Google Apps Script with better error handling and password hashing support
 */

function doGet(e) {
  try {
    var action = e.parameter.action
    var sheetPostingan = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Postingan")

    if (action === "getPosts") {
      if (!sheetPostingan) {
        throw new Error("Sheet Postingan tidak ditemukan")
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
    } else if (action === "getTopPosts") {
      if (!sheetPostingan) {
        throw new Error("Sheet Postingan tidak ditemukan")
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

      // Sort by engagement score (like - dislike) then by like count
      postsPostingan.sort((a, b) => {
        var scoreA = a.like - a.dislike
        var scoreB = b.like - b.dislike
        if (scoreB !== scoreA) return scoreB - scoreA
        return b.like - a.like
      })

      return ContentService.createTextOutput(JSON.stringify(postsPostingan)).setMimeType(ContentService.MimeType.JSON)
    }

    return ContentService.createTextOutput(JSON.stringify({ error: "Aksi tidak ditemukan" })).setMimeType(
      ContentService.MimeType.JSON,
    )
  } catch (e) {
    Logger.log("Error in doGet: " + e.toString())
    return ContentService.createTextOutput(JSON.stringify({ error: "Server error: " + e.message })).setMimeType(
      ContentService.MimeType.JSON,
    )
  }
}

function doPost(e) {
  try {
    var sheetUsers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users")
    var sheetPosts = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Postingan")

    if (!sheetUsers || !sheetPosts) {
      throw new Error("Required sheets not found")
    }

    var params = JSON.parse(e.postData.contents)
    var action = params.action

    if (action === "register") {
      // Validate required fields
      if (!params.email || !params.username || !params.password || !params.nim || !params.jurusan) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Semua field wajib diisi" })).setMimeType(
          ContentService.MimeType.JSON,
        )
      }

      // Check email format
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(params.email)) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Format email tidak valid" })).setMimeType(
          ContentService.MimeType.JSON,
        )
      }

      // Auto-determine role based on email domain or NIM pattern
      var role = "user" // default
      if (params.email.includes("@admin.") || params.email.includes("@staff.") || params.nim.startsWith("ADM")) {
        role = "admin"
      }

      var idUsers = `USER${Date.now()}${Math.random().toString(36).substr(2, 5)}`
      var dataUsers = sheetUsers.getDataRange().getValues()

      // Check if email already exists
      for (var iUsers = 1; iUsers < dataUsers.length; iUsers++) {
        if (dataUsers[iUsers][1] && dataUsers[iUsers][1].toLowerCase() === params.email.toLowerCase()) {
          return ContentService.createTextOutput(JSON.stringify({ error: "Email sudah terdaftar" })).setMimeType(
            ContentService.MimeType.JSON,
          )
        }
      }

      // Check if NIM already exists
      for (var iNim = 1; iNim < dataUsers.length; iNim++) {
        if (dataUsers[iNim][4] && dataUsers[iNim][4] === params.nim) {
          return ContentService.createTextOutput(JSON.stringify({ error: "NIM sudah terdaftar" })).setMimeType(
            ContentService.MimeType.JSON,
          )
        }
      }

      // Add new user (password is already hashed from frontend)
      sheetUsers.appendRow([
        idUsers,
        params.email,
        params.username,
        params.password, // Already hashed
        params.nim,
        params.gender || "",
        params.jurusan,
        role,
        new Date().toISOString(), // Registration timestamp
      ])

      return ContentService.createTextOutput(
        JSON.stringify({
          message: "Registrasi berhasil",
          idUsers: idUsers,
          role: role,
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    } else if (action === "login") {
      if (!params.email || !params.password) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Email dan password wajib diisi" })).setMimeType(
          ContentService.MimeType.JSON,
        )
      }

      var dataUsers = sheetUsers.getDataRange().getValues()
      for (var iLogin = 1; iLogin < dataUsers.length; iLogin++) {
        if (dataUsers[iLogin][1] && dataUsers[iLogin][1].toLowerCase() === params.email.toLowerCase()) {
          // For frontend verification, we need to send the stored password
          return ContentService.createTextOutput(
            JSON.stringify({
              message: "User found",
              idUsers: dataUsers[iLogin][0],
              role: dataUsers[iLogin][7] || "user",
              username: dataUsers[iLogin][2],
              hashedPassword: dataUsers[iLogin][3], // Send hashed password for verification
            }),
          ).setMimeType(ContentService.MimeType.JSON)
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ error: "Email tidak ditemukan" })).setMimeType(
        ContentService.MimeType.JSON,
      )
    } else if (action === "createPost") {
      if (!params.idUsers || !params.judul || !params.deskripsi) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Data postingan tidak lengkap" })).setMimeType(
          ContentService.MimeType.JSON,
        )
      }

      var idPostingan = `POST${Date.now()}${Math.random().toString(36).substr(2, 5)}`
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
        return ContentService.createTextOutput(JSON.stringify({ error: "Data tidak lengkap" })).setMimeType(
          ContentService.MimeType.JSON,
        )
      }

      var dataPosts = sheetPosts.getDataRange().getValues()
      for (var iLikeDislike = 1; iLikeDislike < dataPosts.length; iLikeDislike++) {
        if (dataPosts[iLikeDislike][1] === params.idPostingan) {
          var like = Number.parseInt(dataPosts[iLikeDislike][5]) || 0
          var dislike = Number.parseInt(dataPosts[iLikeDislike][6]) || 0

          if (params.type === "like") {
            like++
          } else if (params.type === "dislike") {
            dislike++
          }

          sheetPosts.getRange(iLikeDislike + 1, 6, 1, 2).setValues([[like, dislike]])

          return ContentService.createTextOutput(
            JSON.stringify({
              message: "Reaksi berhasil ditambahkan",
              like: like,
              dislike: dislike,
            }),
          ).setMimeType(ContentService.MimeType.JSON)
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ error: "Postingan tidak ditemukan" })).setMimeType(
        ContentService.MimeType.JSON,
      )
    } else if (action === "deletePost") {
      if (!params.idUsers || !params.idPostingan) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Data tidak lengkap" })).setMimeType(
          ContentService.MimeType.JSON,
        )
      }

      // Get user role
      var dataUsers = sheetUsers.getDataRange().getValues()
      var userRole = ""
      for (var iUserRole = 1; iUserRole < dataUsers.length; iUserRole++) {
        if (dataUsers[iUserRole][0] === params.idUsers) {
          userRole = dataUsers[iUserRole][7] || "user"
          break
        }
      }

      // Find and delete post
      var dataPosts = sheetPosts.getDataRange().getValues()
      for (var iDeletePost = 1; iDeletePost < dataPosts.length; iDeletePost++) {
        if (dataPosts[iDeletePost][1] === params.idPostingan) {
          // Check permission
          if (userRole === "admin" || dataPosts[iDeletePost][0] === params.idUsers) {
            sheetPosts.deleteRow(iDeletePost + 1)
            return ContentService.createTextOutput(
              JSON.stringify({ message: "Postingan berhasil dihapus" }),
            ).setMimeType(ContentService.MimeType.JSON)
          } else {
            return ContentService.createTextOutput(
              JSON.stringify({ error: "Tidak memiliki izin untuk menghapus postingan ini" }),
            ).setMimeType(ContentService.MimeType.JSON)
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ error: "Postingan tidak ditemukan" })).setMimeType(
        ContentService.MimeType.JSON,
      )
    }

    return ContentService.createTextOutput(JSON.stringify({ error: "Aksi tidak ditemukan" })).setMimeType(
      ContentService.MimeType.JSON,
    )
  } catch (e) {
    Logger.log("Error in doPost: " + e.toString())
    return ContentService.createTextOutput(JSON.stringify({ error: "Server error: " + e.message })).setMimeType(
      ContentService.MimeType.JSON,
    )
  }
}
