/**
 * Google Apps Script untuk Mahasiswa Feedback Platform
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
 * Sheet "Posting": ID Postingan, ID Users, timestamp, Judul, Deskripsi, Like, Dislike
 * Sheet "Likes": (opsional untuk tracking likes per user)
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // Create response dengan CORS headers
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);

    // Dapatkan action
    var action = getAction(e);
    Logger.log("Action: " + action);

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
    status: "ok"
  };
}

function handleLogin(e) {
  try {
    var credentials = getCredentials(e);
    var email = credentials.email;
    var password = credentials.password;

    Logger.log("Login attempt for: " + email);

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var data = usersSheet.getDataRange().getValues();
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    var headers = data[0];
    var emailCol = findColumn(headers, "Email");
    var passwordCol = findColumn(headers, "Password");

    if (emailCol === -1 || passwordCol === -1) {
      return { error: "Kolom Email atau Password tidak ditemukan" };
    }

    // Cari user
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[emailCol] === email && row[passwordCol] === password) {
        return {
          message: "Login berhasil",
          idUsers: row[findColumn(headers, "ID Users")] || "USER_" + i,
          username: row[findColumn(headers, "Username")] || email.split('@')[0],
          email: email,
          role: row[findColumn(headers, "Role")] || "user",
          nim: row[findColumn(headers, "NIM")] || "",
          jurusan: row[findColumn(headers, "Jurusan")] || ""
        };
      }
    }

    return { error: "Email atau password salah" };

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
      return { error: "Sheet Users tidak ditemukan" };
    }

    // Cek apakah email sudah ada
    var data = usersSheet.getDataRange().getValues();
    var headers = data[0];
    var emailCol = findColumn(headers, "Email");

    for (var i = 1; i < data.length; i++) {
      if (data[i][emailCol] === userData.email) {
        return { error: "Email sudah terdaftar" };
      }
    }

    // Tambah user baru
    var newId = "USER" + Date.now();
    var newRow = [
      newId,                        // ID Users
      userData.email,               // Email
      userData.username,            // Username
      userData.password,            // Password
      userData.nim || "",           // NIM
      userData.gender || "Male",    // Gender
      userData.jurusan || "",       // Jurusan
      "user",                       // Role
      new Date()                    // TimeStamp
    ];

    usersSheet.appendRow(newRow);

    return {
      message: "Registrasi berhasil",
      idUsers: newId,
      username: userData.username,
      email: userData.email
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
      return { error: "Sheet Posting tidak ditemukan" };
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
        idPostingan: row[findColumn(postHeaders, "ID Postingan")] || "POST_" + i,
        idUsers: row[findColumn(postHeaders, "ID Users")] || "",
        timestamp: row[findColumn(postHeaders, "timestamp")] || new Date(),
        judul: row[findColumn(postHeaders, "Judul")] || "",
        deskripsi: row[findColumn(postHeaders, "Deskripsi")] || "",
        likeCount: parseInt(row[findColumn(postHeaders, "Like")] || 0),
        dislikeCount: parseInt(row[findColumn(postHeaders, "Dislike")] || 0),
        imageUrl: "",
        username: "Anonymous",
        isLiked: false,
        isDisliked: false
      };

      // Cari username dari Users sheet
      if (userData.length > 1 && post.idUsers) {
        var userIdCol = findColumn(userHeaders, "ID Users");
        var usernameCol = findColumn(userHeaders, "Username");

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
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var newId = "POST" + Date.now();
    var newRow = [
      newId,                    // ID Postingan
      postData.idUsers,         // ID Users
      new Date(),               // timestamp
      postData.judul || "",     // Judul
      postData.deskripsi,       // Deskripsi
      0,                        // Like
      0                         // Dislike
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
    var idCol = findColumn(headers, "ID Postingan");
    var likeCol = findColumn(headers, "Like");
    var dislikeCol = findColumn(headers, "Dislike");

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

function getCredentials(e) {
  var email = "";
  var password = "";

  if (e.parameter && e.parameter.email) {
    email = e.parameter.email;
    password = e.parameter.password || "";
  }

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

  if (e.postData && e.postData.contents) {
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      data = e.parameter || {};
    }
  } else {
    data = e.parameter || {};
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