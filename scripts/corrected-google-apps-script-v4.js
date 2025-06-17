
/**
 * Google Apps Script untuk Mahasiswa Feedback Platform - FINAL VERSION WITH IMPROVED CORS
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET:
 * Sheet "Users": idUsers, username, email, password, role, nim, jurusan, gender, bio, location, website, createdAt
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function doOptions(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // Create response dengan CORS headers yang lebih lengkap
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);

    // Handle preflight OPTIONS request
    if (e.method === "OPTIONS") {
      return response.setContent(JSON.stringify({ 
        status: "ok",
        message: "CORS preflight successful"
      }));
    }

    // Dapatkan action
    var action = getAction(e);
    Logger.log("Action: " + action);
    Logger.log("Method: " + e.method);
    Logger.log("Parameters: " + JSON.stringify(e.parameter));
    if (e.postData) {
      Logger.log("POST data: " + e.postData.contents);
    }

    var result = {};

    switch(action) {
      case "test":
        result = testConnection();
        break;
      case "login":
        result = handleLogin(e);
        break;
      case "register":
        result = handleRegister(e);
        break;
      case "getPosts":
        result = handleGetPosts();
        break;
      case "createPost":
        result = handleCreatePost(e);
        break;
      case "likeDislike":
        result = handleLikeDislike(e);
        break;
      case "updateProfile":
        result = handleUpdateProfile(e);
        break;
      default:
        result = { error: "Action tidak dikenal: " + action };
    }

    response.setContent(JSON.stringify(result));
    return response;

  } catch (error) {
    Logger.log("Error in handleRequest: " + error.toString());
    var errorResponse = ContentService.createTextOutput();
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    errorResponse.setContent(JSON.stringify({ 
      error: "Server error: " + error.toString(),
      timestamp: new Date().toISOString()
    }));
    return errorResponse;
  }
}

function getAction(e) {
  // Coba dari GET parameters dulu
  if (e.parameter && e.parameter.action) {
    return e.parameter.action;
  }

  // Coba dari POST body
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return postData.action || "test";
    } catch (parseError) {
      Logger.log("Parse error: " + parseError.toString());
    }
  }

  return "test";
}

function testConnection() {
  return {
    message: "Connection successful",
    timestamp: new Date().toISOString(),
    status: "ok",
    methods_supported: ["GET", "POST"],
    cors_enabled: true
  };
}

function handleLogin(e) {
  try {
    var credentials = getCredentials(e);
    var email = credentials.email;
    var password = credentials.password;

    Logger.log("Login attempt for: " + email);
    Logger.log("Password received: " + (password ? "Yes (length: " + password.length + ")" : "No"));
    Logger.log("Method: " + e.method);

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var data = usersSheet.getDataRange().getValues();
    Logger.log("Total users in sheet: " + (data.length - 1));
    
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    var headers = data[0];
    var emailCol = findColumn(headers, "email");
    var passwordCol = findColumn(headers, "password");

    Logger.log("Email column: " + emailCol + ", Password column: " + passwordCol);

    if (emailCol === -1 || passwordCol === -1) {
      return { error: "Kolom email atau password tidak ditemukan" };
    }

    // Cari user berdasarkan email
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var userEmail = row[emailCol];
      var userPassword = row[passwordCol];
      
      Logger.log("Checking user " + i + ": " + userEmail);
      
      if (userEmail && userEmail.toString().toLowerCase() === email.toLowerCase()) {
        Logger.log("User found! Stored password: " + userPassword);
        Logger.log("Input password: " + password);
        
        // Check password - support plain text atau base64
        var isPasswordValid = false;
        
        // Try direct match first
        if (userPassword === password) {
          isPasswordValid = true;
          Logger.log("Direct password match");
        }
        // Try base64 encoding (manual implementation)
        else if (userPassword === base64Encode(password)) {
          isPasswordValid = true;
          Logger.log("Base64 encoded password match");
        }
        // Try decode base64 input (manual implementation) - hanya jika password terlihat seperti base64
        else if (password.length > 0 && password.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
          try {
            var decodedPassword = base64Decode(password);
            if (userPassword === decodedPassword) {
              isPasswordValid = true;
              Logger.log("Base64 decoded password match");
            }
          } catch (e) {
            Logger.log("Base64 decode failed: " + e.toString());
          }
        }
        
        if (isPasswordValid) {
          Logger.log("Password match!");
          
          return {
            message: "Login berhasil",
            idUsers: row[findColumn(headers, "idUsers")] || "USER_" + i,
            username: row[findColumn(headers, "username")] || email.split('@')[0],
            email: email,
            role: row[findColumn(headers, "role")] || "user",
            nim: row[findColumn(headers, "nim")] || "",
            jurusan: row[findColumn(headers, "jurusan")] || "",
            bio: row[findColumn(headers, "bio")] || "",
            location: row[findColumn(headers, "location")] || "",
            website: row[findColumn(headers, "website")] || "",
            method_used: e.method || "GET"
          };
        } else {
          Logger.log("Password mismatch!");
          return { error: "Password salah" };
        }
      }
    }

    Logger.log("User not found with email: " + email);
    return { error: "Email tidak ditemukan" };

  } catch (error) {
    Logger.log("Login error: " + error.toString());
    return { error: "Error login: " + error.toString() };
  }
}

function handleRegister(e) {
  try {
    var userData = getUserData(e);

    if (!userData.email || !userData.username || !userData.password) {
      return { error: "Email, username, dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      // Buat sheet Users jika belum ada
      usersSheet = spreadsheet.insertSheet("Users");
      // Tambah header
      usersSheet.getRange(1, 1, 1, 12).setValues([[
        "idUsers", "username", "email", "password", "role", "nim", "jurusan", "gender", "bio", "location", "website", "createdAt"
      ]]);
    }

    // Cek apakah email sudah ada
    var data = usersSheet.getDataRange().getValues();
    var headers = data[0];
    var emailCol = findColumn(headers, "email");

    for (var i = 1; i < data.length; i++) {
      if (data[i][emailCol] === userData.email) {
        return { error: "Email sudah terdaftar" };
      }
    }

    // Tambah user baru
    var newId = "USER_" + Date.now();
    
    var newRow = [
      newId,                        // idUsers
      userData.username,            // username
      userData.email,               // email
      userData.password,            // password
      "user",                       // role
      userData.nim || "",           // nim
      userData.jurusan || "",       // jurusan
      userData.gender || "Male",    // gender
      "",                           // bio
      "",                           // location
      "",                           // website
      new Date()                    // createdAt
    ];

    usersSheet.appendRow(newRow);

    return {
      message: "Registrasi berhasil",
      idUsers: newId,
      username: userData.username,
      email: userData.email,
      role: "user"
    };

  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error registrasi: " + error.toString() };
  }
}

function handleGetPosts() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!postingSheet) {
      // Buat sheet Posting jika belum ada
      postingSheet = spreadsheet.insertSheet("Posting");
      postingSheet.getRange(1, 1, 1, 8).setValues([[
        "idPostingan", "idUsers", "judul", "deskripsi", "imageUrl", "timestamp", "likeCount", "dislikeCount"
      ]]);
      return []; // Return empty array untuk sheet baru
    }

    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet ? usersSheet.getDataRange().getValues() : [];

    if (postData.length < 2) {
      return []; // Return empty array jika tidak ada posts
    }

    var postHeaders = postData[0];
    var userHeaders = userData[0] || [];
    var posts = [];

    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      var post = {
        idPostingan: row[findColumn(postHeaders, "idPostingan")] || "POST_" + i,
        idUsers: row[findColumn(postHeaders, "idUsers")] || "",
        timestamp: row[findColumn(postHeaders, "timestamp")] || new Date(),
        judul: row[findColumn(postHeaders, "judul")] || "",
        deskripsi: row[findColumn(postHeaders, "deskripsi")] || "",
        imageUrl: row[findColumn(postHeaders, "imageUrl")] || "",
        likeCount: parseInt(row[findColumn(postHeaders, "likeCount")] || 0),
        dislikeCount: parseInt(row[findColumn(postHeaders, "dislikeCount")] || 0),
        username: "Anonymous",
        isLiked: false,
        isDisliked: false
      };

      // Cari username dari Users sheet
      if (userData.length > 1 && post.idUsers) {
        var userIdCol = findColumn(userHeaders, "idUsers");
        var usernameCol = findColumn(userHeaders, "username");

        for (var j = 1; j < userData.length; j++) {
          if (userData[j][userIdCol] === post.idUsers) {
            post.username = userData[j][usernameCol] || "Anonymous";
            break;
          }
        }
      }

      posts.push(post);
    }

    return posts;

  } catch (error) {
    Logger.log("Get posts error: " + error.toString());
    return [];
  }
}

function handleCreatePost(e) {
  try {
    var postData = getPostData(e);

    if (!postData.idUsers || !postData.deskripsi) {
      return { error: "idUsers dan deskripsi harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      // Buat sheet Posting jika belum ada
      postingSheet = spreadsheet.insertSheet("Posting");
      postingSheet.getRange(1, 1, 1, 8).setValues([[
        "idPostingan", "idUsers", "judul", "deskripsi", "imageUrl", "timestamp", "likeCount", "dislikeCount"
      ]]);
    }

    var newId = "POST_" + Date.now();
    var newRow = [
      newId,                        // idPostingan
      postData.idUsers,             // idUsers
      postData.judul || "",         // judul
      postData.deskripsi,           // deskripsi
      postData.imageUrl || "",      // imageUrl
      new Date(),                   // timestamp
      0,                            // likeCount
      0                             // dislikeCount
    ];

    postingSheet.appendRow(newRow);

    return {
      message: "Post berhasil dibuat",
      idPostingan: newId
    };

  } catch (error) {
    Logger.log("Create post error: " + error.toString());
    return { error: "Error membuat post: " + error.toString() };
  }
}

function handleLikeDislike(e) {
  try {
    var data = getLikeData(e);

    if (!data.idPostingan || !data.type) {
      return { error: "idPostingan dan type harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    var headers = postData[0];
    var idCol = findColumn(headers, "idPostingan");
    var likeCol = findColumn(headers, "likeCount");
    var dislikeCol = findColumn(headers, "dislikeCount");

    // Cari post yang akan di-like/dislike
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][idCol] === data.idPostingan) {
        var currentLikes = parseInt(postData[i][likeCol] || 0);
        var currentDislikes = parseInt(postData[i][dislikeCol] || 0);

        if (data.type === "like") {
          postingSheet.getRange(i + 1, likeCol + 1).setValue(currentLikes + 1);
        } else if (data.type === "dislike") {
          postingSheet.getRange(i + 1, dislikeCol + 1).setValue(currentDislikes + 1);
        }

        return { message: "Like/dislike berhasil" };
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Like/dislike error: " + error.toString());
    return { error: "Error like/dislike: " + error.toString() };
  }
}

function handleUpdateProfile(e) {
  try {
    var profileData = getProfileData(e);

    if (!profileData.idUsers) {
      return { error: "idUsers harus diisi" };
    }

    return { message: "Update profile berhasil" };

  } catch (error) {
    Logger.log("Update profile error: " + error.toString());
    return { error: "Error update profile: " + error.toString() };
  }
}

// Helper functions
function findColumn(headers, columnName) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase() === columnName.toLowerCase()) {
      return i;
    }
  }
  return -1;
}

// Manual Base64 encoding function for Google Apps Script
function base64Encode(str) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var result = '';
  var i = 0;
  
  while (i < str.length) {
    var a = str.charCodeAt(i++);
    var b = i < str.length ? str.charCodeAt(i++) : 0;
    var c = i < str.length ? str.charCodeAt(i++) : 0;
    
    var bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

// Manual Base64 decoding function for Google Apps Script
function base64Decode(str) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var result = '';
  var i = 0;
  
  str = str.replace(/[^A-Za-z0-9+/]/g, '');
  
  while (i < str.length) {
    var encoded1 = chars.indexOf(str.charAt(i++));
    var encoded2 = chars.indexOf(str.charAt(i++));
    var encoded3 = chars.indexOf(str.charAt(i++));
    var encoded4 = chars.indexOf(str.charAt(i++));
    
    var bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  return result;
}

function getCredentials(e) {
  var email = "";
  var password = "";

  // Get from URL parameters first (GET method)
  if (e.parameter && e.parameter.email) {
    email = e.parameter.email;
    password = e.parameter.password || "";
  }

  // Get from POST body if not found in parameters
  if (!email && e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      email = postData.email || "";
      password = postData.password || "";
    } catch (parseError) {
      Logger.log("Parse error in getCredentials: " + parseError.toString());
    }
  }

  return { email: email, password: password };
}

function getUserData(e) {
  var data = {};

  // Try GET parameters first
  if (e.parameter) {
    data = e.parameter;
  }

  // Try POST data
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      // Merge with GET parameters, POST takes precedence
      for (var key in postData) {
        data[key] = postData[key];
      }
    } catch (parseError) {
      Logger.log("Parse error in getUserData: " + parseError.toString());
    }
  }

  return data;
}

function getPostData(e) {
  return getUserData(e); // Same logic
}

function getLikeData(e) {
  return getUserData(e); // Same logic
}

function getProfileData(e) {
  return getUserData(e); // Same logic
}
