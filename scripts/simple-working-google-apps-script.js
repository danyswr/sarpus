
/**
 * Google Apps Script sederhana untuk Mahasiswa Feedback Platform
 * Copy kode ini ke Google Apps Script dan deploy sebagai web app
 * 
 * PENTING: 
 * 1. Deploy sebagai web app dengan "Execute as: Me" 
 * 2. "Who has access: Anyone"
 * 3. Pastikan spreadsheet memiliki sheet: Users, Posting, Likes
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // Set CORS headers
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Get action from parameter
    var action = "";
    
    if (e.parameter && e.parameter.action) {
      action = e.parameter.action;
    } else if (e.postData && e.postData.contents) {
      try {
        var postData = JSON.parse(e.postData.contents);
        action = postData.action || "test";
      } catch (parseError) {
        action = "test";
      }
    } else {
      action = "test";
    }
    
    Logger.log("Request action: " + action);
    Logger.log("Request parameters: " + JSON.stringify(e.parameter));
    
    var result = {};
    
    switch(action) {
      case "test":
        result = { message: "Connection successful", timestamp: new Date().toISOString(), status: "ok" };
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
        
      default:
        result = { error: "Action tidak dikenal: " + action };
    }
    
    output.setContent(JSON.stringify(result));
    return output;
    
  } catch (error) {
    Logger.log("Error: " + error.toString());
    var errorOutput = ContentService.createTextOutput();
    errorOutput.setMimeType(ContentService.MimeType.JSON);
    errorOutput.setContent(JSON.stringify({ error: error.toString() }));
    return errorOutput;
  }
}

function handleLogin(e) {
  try {
    var email = "";
    var password = "";
    
    // Get data from GET parameters
    if (e.parameter && e.parameter.email) {
      email = e.parameter.email;
      password = e.parameter.password || "";
    }
    
    // Get data from POST body if not found in parameters
    if (!email && e.postData && e.postData.contents) {
      try {
        var postData = JSON.parse(e.postData.contents);
        email = postData.email || "";
        password = postData.password || "";
      } catch (parseError) {
        Logger.log("Parse error: " + parseError.toString());
      }
    }
    
    Logger.log("Login attempt for: " + email);
    
    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }
    
    // Get Users sheet
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");
    
    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }
    
    // Get all user data
    var data = usersSheet.getDataRange().getValues();
    var headers = data[0];
    
    // Find email and password columns
    var emailCol = headers.indexOf("email");
    var passwordCol = headers.indexOf("password");
    var idCol = headers.indexOf("idUsers");
    var usernameCol = headers.indexOf("username");
    var roleCol = headers.indexOf("role");
    var nimCol = headers.indexOf("nim");
    var jurusanCol = headers.indexOf("jurusan");
    
    if (emailCol === -1 || passwordCol === -1) {
      return { error: "Kolom email atau password tidak ditemukan di spreadsheet" };
    }
    
    // Search for user
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[emailCol] === email && row[passwordCol] === password) {
        return {
          message: "Login berhasil",
          idUsers: row[idCol] || "USER_" + i,
          username: row[usernameCol] || email.split('@')[0],
          email: email,
          role: row[roleCol] || "user",
          nim: row[nimCol] || "",
          jurusan: row[jurusanCol] || ""
        };
      }
    }
    
    return { error: "Email atau password salah" };
    
  } catch (error) {
    Logger.log("Login error: " + error.toString());
    return { error: "Terjadi kesalahan saat login: " + error.toString() };
  }
}

function handleRegister(e) {
  try {
    var data = {};
    
    // Get data from POST body
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }
    
    var email = data.email;
    var username = data.username;
    var password = data.password;
    var nim = data.nim;
    var jurusan = data.jurusan;
    var gender = data.gender || "Male";
    
    if (!email || !username || !password) {
      return { error: "Email, username, dan password harus diisi" };
    }
    
    // Get Users sheet
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");
    
    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }
    
    // Check if email already exists
    var existingData = usersSheet.getDataRange().getValues();
    var headers = existingData[0];
    var emailCol = headers.indexOf("email");
    
    if (emailCol !== -1) {
      for (var i = 1; i < existingData.length; i++) {
        if (existingData[i][emailCol] === email) {
          return { error: "Email sudah terdaftar" };
        }
      }
    }
    
    // Add new user
    var newId = "USER_" + Date.now();
    var newRow = [
      newId,           // idUsers
      username,        // username  
      email,          // email
      password,       // password
      "user",         // role
      nim || "",      // nim
      jurusan || "",  // jurusan
      gender,         // gender
      "",             // bio
      "",             // location
      "",             // website
      new Date()      // createdAt
    ];
    
    usersSheet.appendRow(newRow);
    
    return { 
      message: "Registrasi berhasil",
      idUsers: newId,
      username: username,
      email: email
    };
    
  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Terjadi kesalahan saat registrasi: " + error.toString() };
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
    var postHeaders = postData[0];
    
    var userData = usersSheet ? usersSheet.getDataRange().getValues() : [];
    var userHeaders = userData[0] || [];
    
    var posts = [];
    
    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      var post = {};
      
      // Map post data
      for (var j = 0; j < postHeaders.length; j++) {
        post[postHeaders[j]] = row[j];
      }
      
      // Find username from Users sheet
      if (usersSheet && post.idUsers) {
        var userIdCol = userHeaders.indexOf("idUsers");
        var usernameCol = userHeaders.indexOf("username");
        
        if (userIdCol !== -1 && usernameCol !== -1) {
          for (var k = 1; k < userData.length; k++) {
            if (userData[k][userIdCol] === post.idUsers) {
              post.username = userData[k][usernameCol];
              break;
            }
          }
        }
      }
      
      // Set default values
      post.username = post.username || "Anonymous";
      post.likeCount = post.likeCount || 0;
      post.dislikeCount = post.dislikeCount || 0;
      post.isLiked = false;
      post.isDisliked = false;
      
      posts.push(post);
    }
    
    return posts;
    
  } catch (error) {
    Logger.log("Get posts error: " + error.toString());
    return { error: "Terjadi kesalahan saat mengambil posts: " + error.toString() };
  }
}

function handleCreatePost(e) {
  try {
    var data = {};
    
    // Get data from POST body
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }
    
    var idUsers = data.idUsers;
    var judul = data.judul || "";
    var deskripsi = data.deskripsi;
    var imageUrl = data.imageUrl || "";
    
    if (!idUsers || !deskripsi) {
      return { error: "idUsers dan deskripsi harus diisi" };
    }
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    
    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }
    
    var newId = "POST_" + Date.now();
    var newRow = [
      newId,              // idPostingan
      idUsers,            // idUsers
      judul,              // judul
      deskripsi,          // deskripsi
      imageUrl,           // imageUrl
      new Date(),         // timestamp
      0,                  // likeCount
      0                   // dislikeCount
    ];
    
    postingSheet.appendRow(newRow);
    
    return { 
      message: "Post berhasil dibuat",
      idPostingan: newId
    };
    
  } catch (error) {
    Logger.log("Create post error: " + error.toString());
    return { error: "Terjadi kesalahan saat membuat post: " + error.toString() };
  }
}

function handleLikeDislike(e) {
  try {
    var data = {};
    
    // Get data from POST body
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }
    
    return { message: "Like/dislike berhasil" };
    
  } catch (error) {
    Logger.log("Like/dislike error: " + error.toString());
    return { error: "Terjadi kesalahan: " + error.toString() };
  }
}
