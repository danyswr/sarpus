
/**
 * Google Apps Script untuk Mahasiswa Feedback Platform
 * Dengan dukungan CORS dan kompatibilitas dengan website
 */

function doGet(e) {
  try {
    Logger.log("GET request received with params: " + JSON.stringify(e.parameter))
    Logger.log("GET request method: " + (e.parameter.method || "GET"))
    Logger.log("GET request headers: " + JSON.stringify(e.headers || {}))
    
    var action = e.parameter.action || "test"
    
    // Initialize spreadsheet and sheets at the beginning
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetUsers = spreadsheet.getSheetByName("Users")
    var sheetPostingan = spreadsheet.getSheetByName("Posting")
    var sheetLikes = spreadsheet.getSheetByName("Likes")

    if (action === "test") {
      Logger.log("Test connection requested")
      var response = ContentService.createTextOutput(
        JSON.stringify({
          message: "Connection successful",
          timestamp: new Date().toISOString(),
          status: "ok",
          received_params: e.parameter
        }),
      ).setMimeType(ContentService.MimeType.JSON)
      
      // Add comprehensive CORS headers
      response.setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'no-cache',
      })
      
      Logger.log("Test response sent successfully")
      return response
    }

    if (action === "login") {
      Logger.log("GET Login request received")
      Logger.log("Email: " + e.parameter.email)
      Logger.log("Password: " + e.parameter.password)
      
      // Get spreadsheet and sheets here
      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
      var sheetUsers = spreadsheet.getSheetByName("Users")
      
      if (!sheetUsers) {
        var response = ContentService.createTextOutput(
          JSON.stringify({
            error: "Sheet 'Users' tidak ditemukan",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
        
        response.setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
          'Access-Control-Max-Age': '86400',
          'Cache-Control': 'no-cache',
        })
        
        return response
      }

      var result = handleLogin({ 
        email: e.parameter.email, 
        password: e.parameter.password 
      }, sheetUsers)
      
      result.setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'no-cache',
      })
      
      return result
    }

    // Spreadsheet and sheets already initialized at the beginning

    // Create Likes sheet if it doesn't exist
    if (!sheetLikes) {
      sheetLikes = spreadsheet.insertSheet("Likes")
      sheetLikes.appendRow(["idPostingan", "idUsers", "type", "timestamp"])
    }

    if (action === "getPosts") {
      if (!sheetPostingan) {
        var response = ContentService.createTextOutput(
          JSON.stringify({
            error: "Sheet 'Posting' tidak ditemukan",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
        
        response.setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
        })
        
        return response
      }

      var dataPostingan = sheetPostingan.getDataRange().getValues()
      Logger.log("Raw posting data: " + JSON.stringify(dataPostingan))

      if (dataPostingan.length <= 1) {
        var response = ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON)
        response.setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
        })
        return response
      }

      // Get all likes/dislikes data
      var likesData = []
      if (sheetLikes && sheetLikes.getLastRow() > 1) {
        likesData = sheetLikes.getDataRange().getValues()
      }

      var likesMap = {}

      // Skip header row for likes
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

      var postsArray = []

      // Get username mapping from Users sheet
      var usernameMap = {}
      if (sheetUsers) {
        var usersData = sheetUsers.getDataRange().getValues()
        for (var k = 1; k < usersData.length; k++) {
          usernameMap[usersData[k][0]] = usersData[k][2] // ID Users -> Username
        }
      }

      // Skip header row - process existing posts
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
          like: parseInt(row[5]) || 0,
          dislike: parseInt(row[6]) || 0,
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

      Logger.log("Processed posts: " + JSON.stringify(postsArray))
      var response = ContentService.createTextOutput(JSON.stringify(postsArray)).setMimeType(ContentService.MimeType.JSON)
      response.setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      })
      return response
    }

    var response = ContentService.createTextOutput(
      JSON.stringify({
        error: "Aksi tidak ditemukan: " + action,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
    
    response.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    })
    
    return response
  } catch (e) {
    Logger.log("Error in doGet: " + e.toString())
    var response = ContentService.createTextOutput(
      JSON.stringify({
        error: "Server error: " + e.message,
        details: e.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
    
    response.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    })
    
    return response
  }
}

function doPost(e) {
  try {
    Logger.log("POST request received")
    Logger.log("POST method: " + (e.method || "POST"))
    Logger.log("POST headers: " + JSON.stringify(e.headers || {}))
    Logger.log("POST data: " + (e.postData ? e.postData.contents : "No post data"))
    Logger.log("POST parameter: " + JSON.stringify(e.parameter || {}))

    if (!e.postData || !e.postData.contents) {
      Logger.log("No post data received")
      var response = ContentService.createTextOutput(
        JSON.stringify({
          error: "No data received in POST request",
          received_method: e.method || "POST",
          received_headers: e.headers || {},
          received_params: e.parameter || {}
        }),
      ).setMimeType(ContentService.MimeType.JSON)
      
      response.setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      })
      
      return response
    }

    var postData = e.postData.contents
    Logger.log("Content: " + postData)

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheetUsers = spreadsheet.getSheetByName("Users")
    var sheetPosts = spreadsheet.getSheetByName("Posting")
    var sheetLikes = spreadsheet.getSheetByName("Likes")

    // Create Likes sheet if it doesn't exist
    if (!sheetLikes) {
      Logger.log("Creating Likes sheet")
      sheetLikes = spreadsheet.insertSheet("Likes")
      sheetLikes.appendRow(["idPostingan", "idUsers", "type", "timestamp"])
    }

    if (!sheetUsers) {
      Logger.log("Creating Users sheet")
      sheetUsers = spreadsheet.insertSheet("Users")
      sheetUsers.appendRow(["ID Users", "Email", "Username", "Password", "NIM", "Gender", "Jurusan", "Role", "Timestamp", "Bio", "Location", "Website"])
    }

    if (!sheetPosts) {
      Logger.log("Creating Posting sheet")
      sheetPosts = spreadsheet.insertSheet("Posting")
      sheetPosts.appendRow(["ID Users", "ID Postingan", "Timestamp", "Judul", "Deskripsi", "Like", "Dislike", "ImageUrl"])
    }

    var params = JSON.parse(postData)
    var action = params.action

    Logger.log("Action: " + action)

    var result
    if (action === "register") {
      result = handleRegistration(params, sheetUsers)
    } else if (action === "login") {
      result = handleLogin(params, sheetUsers)
    } else if (action === "updateProfile") {
      result = handleUpdateProfile(params, sheetUsers)
    } else if (action === "createPost") {
      result = handleCreatePost(params, sheetPosts)
    } else if (action === "likeDislike") {
      result = handleLikeDislike(params, sheetPosts, sheetLikes)
    } else if (action === "deletePost") {
      result = handleDeletePost(params, sheetUsers, sheetPosts, sheetLikes)
    } else if (action === "uploadImage") {
      result = handleImageUpload(params)
    } else {
      result = ContentService.createTextOutput(
        JSON.stringify({
          error: "Aksi tidak ditemukan: " + action,
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    // Add CORS headers to all responses
    result.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    })

    return result
  } catch (e) {
    Logger.log("Error in doPost: " + e.toString())
    var response = ContentService.createTextOutput(
      JSON.stringify({
        error: "Server error: " + e.message,
        details: e.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
    
    response.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    })
    
    return response
  }
}

function handleRegistration(params, sheetUsers) {
  try {
    Logger.log("=== REGISTRATION ATTEMPT START ===")
    Logger.log("Registration attempt for email: " + params.email)
    Logger.log("Registration params: " + JSON.stringify(params))
    Logger.log("Sheet Users exists: " + (sheetUsers ? "YES" : "NO"))
    
    if (!params.email || !params.username || !params.password || !params.nim || !params.jurusan) {
      Logger.log("Missing required fields")
      Logger.log("Email: " + (params.email ? "OK" : "MISSING"))
      Logger.log("Username: " + (params.username ? "OK" : "MISSING"))
      Logger.log("Password: " + (params.password ? "OK" : "MISSING"))
      Logger.log("NIM: " + (params.nim ? "OK" : "MISSING"))
      Logger.log("Jurusan: " + (params.jurusan ? "OK" : "MISSING"))
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Semua field wajib diisi",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(params.email)) {
      Logger.log("Invalid email format: " + params.email)
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
    Logger.log("Generated user ID: " + idUsers)
    
    var dataUsers = sheetUsers.getDataRange().getValues()
    Logger.log("Existing users count: " + (dataUsers.length - 1))

    // Check if email already exists
    for (var k = 1; k < dataUsers.length; k++) {
      if (dataUsers[k][1] && dataUsers[k][1].toLowerCase() === params.email.toLowerCase()) {
        Logger.log("Email already exists: " + params.email)
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
        Logger.log("NIM already exists: " + params.nim)
        return ContentService.createTextOutput(
          JSON.stringify({
            error: "NIM sudah terdaftar",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }
    }

    // Add new user with complete structure
    var newUserRow = [
      idUsers,
      params.email,
      params.username,
      params.password, // Store password as-is (already hashed from frontend)
      params.nim,
      params.gender || "Male",
      params.jurusan,
      role,
      new Date().toISOString(),
      "", // bio
      "", // location
      "", // website
    ]
    
    Logger.log("Adding new user row: " + JSON.stringify(newUserRow))
    sheetUsers.appendRow(newUserRow)

    Logger.log("User registered successfully: " + idUsers)
    Logger.log("=== REGISTRATION SUCCESS ===")

    return ContentService.createTextOutput(
      JSON.stringify({
        message: "Registrasi berhasil",
        idUsers: idUsers,
        role: role,
        success: true,
        timestamp: new Date().toISOString()
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Registration error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Error saat registrasi: " + e.message,
        details: e.toString()
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleLogin(params, sheetUsers) {
  try {
    Logger.log("Login attempt for: " + params.email)
    
    if (!params.email || !params.password) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Email dan password wajib diisi",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var dataUsers = sheetUsers.getDataRange().getValues()
    Logger.log("Looking for user with email: " + params.email)

    for (var i = 1; i < dataUsers.length; i++) {
      if (dataUsers[i][1] && dataUsers[i][1].toLowerCase() === params.email.toLowerCase()) {
        Logger.log("User found: " + JSON.stringify(dataUsers[i]))

        return ContentService.createTextOutput(
          JSON.stringify({
            message: "User found",
            idUsers: dataUsers[i][0],
            role: dataUsers[i][7] || "user",
            username: dataUsers[i][2],
            email: dataUsers[i][1],
            nim: dataUsers[i][4],
            jurusan: dataUsers[i][6],
            hashedPassword: dataUsers[i][3],
            bio: dataUsers[i][9] || "",
            location: dataUsers[i][10] || "",
            website: dataUsers[i][11] || "",
          }),
        ).setMimeType(ContentService.MimeType.JSON)
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Email tidak ditemukan",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Login error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Login error: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleCreatePost(params, sheetPosts) {
  try {
    Logger.log("Create post attempt for user: " + params.idUsers)
    
    if (!params.idUsers || !params.deskripsi) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Data postingan tidak lengkap",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    var idPostingan = "POST" + Date.now() + Math.random().toString(36).substr(2, 5)

    // Add new post with proper column structure
    sheetPosts.appendRow([
      params.idUsers,
      idPostingan,
      new Date().toISOString(),
      params.judul || "Post",
      params.deskripsi,
      0, // like
      0, // dislike
      params.imageUrl || "", // image URL
    ])

    Logger.log("Post created successfully: " + idPostingan)

    return ContentService.createTextOutput(
      JSON.stringify({
        message: "Postingan berhasil dibuat",
        idPostingan: idPostingan,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Create post error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Create post error: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleLikeDislike(params, sheetPosts, sheetLikes) {
  try {
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
        rowToUpdate = i + 1
        break
      }
    }

    // Find post
    var dataPosts = sheetPosts.getDataRange().getValues()
    for (var j = 1; j < dataPosts.length; j++) {
      if (dataPosts[j][1] === params.idPostingan) {
        var like = parseInt(dataPosts[j][5]) || 0
        var dislike = parseInt(dataPosts[j][6]) || 0

        if (hasInteracted) {
          if (previousType === params.type) {
            return ContentService.createTextOutput(
              JSON.stringify({
                error: "Anda sudah " + (params.type === "like" ? "menyukai" : "tidak menyukai") + " postingan ini",
                like: like,
                dislike: dislike,
              }),
            ).setMimeType(ContentService.MimeType.JSON)
          }

          if (previousType === "like" && params.type === "dislike") {
            like--
            dislike++
          } else if (previousType === "dislike" && params.type === "like") {
            like++
            dislike--
          }

          sheetLikes.getRange(rowToUpdate, 3).setValue(params.type)
          sheetLikes.getRange(rowToUpdate, 4).setValue(new Date().toISOString())
        } else {
          if (params.type === "like") {
            like++
          } else if (params.type === "dislike") {
            dislike++
          }

          sheetLikes.appendRow([params.idPostingan, params.idUsers, params.type, new Date().toISOString()])
        }

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
  } catch (e) {
    Logger.log("Like/Dislike error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Like/Dislike error: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function handleDeletePost(params, sheetUsers, sheetPosts, sheetLikes) {
  try {
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
        if (userRole === "admin" || userRole === "Admin" || dataPosts[j][0] === params.idUsers) {
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
  } catch (e) {
    Logger.log("Delete post error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Delete post error: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
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
        sheetUsers.getRange(i + 1, 10).setValue(params.bio || dataUsers[i][9] || "")
        sheetUsers.getRange(i + 1, 11).setValue(params.location || dataUsers[i][10] || "")
        sheetUsers.getRange(i + 1, 12).setValue(params.website || dataUsers[i][11] || "")

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

function handleImageUpload(params) {
  try {
    if (!params.imageData || !params.fileName) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Data gambar tidak lengkap",
        }),
      ).setMimeType(ContentService.MimeType.JSON)
    }

    // Google Drive folder ID
    var folderId = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw"
    var folder = DriveApp.getFolderById(folderId)
    
    // Decode base64 image data
    var imageBlob = Utilities.newBlob(
      Utilities.base64Decode(params.imageData.split(',')[1]),
      params.mimeType || 'image/jpeg',
      params.fileName
    )
    
    // Upload to Google Drive
    var file = folder.createFile(imageBlob)
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
    
    var imageUrl = "https://drive.google.com/uc?id=" + file.getId()
    
    return ContentService.createTextOutput(
      JSON.stringify({
        message: "Gambar berhasil diupload",
        imageUrl: imageUrl,
        fileId: file.getId()
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    Logger.log("Image upload error: " + e.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        error: "Error saat upload gambar: " + e.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

// Handle preflight OPTIONS requests for CORS
function doOptions(e) {
  Logger.log("OPTIONS request received")
  Logger.log("OPTIONS params: " + JSON.stringify(e.parameter || {}))
  Logger.log("OPTIONS headers: " + JSON.stringify(e.headers || {}))
  
  var response = ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
  
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, HEAD',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })
  
  Logger.log("OPTIONS response sent")
  return response
}

// Add a function to handle any HTTP method
function doHead(e) {
  return doOptions(e)
}

function doPut(e) {
  return doPost(e)
}

function doDelete(e) {
  return doPost(e)
}

function doPatch(e) {
  return doPost(e)
}
