
/**
 * Google Apps Script untuk Mahasiswa Feedback Platform - CORRECTED VERSION
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);

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
      error: "Server error: " + error.toString()
    }));
    return errorResponse;
  }
}

function getAction(e) {
  if (e.parameter && e.parameter.action) {
    return e.parameter.action;
  }

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

    // Headers: idUsers, username, email, password, role, nim, jurusan, gender, bio, location, website, createdAt
    var headers = data[0];
    
    // Cari user berdasarkan email
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var userEmail = row[2]; // email column
      var userPassword = row[3]; // password column
      var userRole = row[4]; // role column
      
      if (userEmail && userEmail.toString().toLowerCase() === email.toLowerCase()) {
        Logger.log("User found! Role: " + userRole);
        
        // Check password - bisa plain text atau hashed
        if (userPassword === password || userPassword === btoa(password)) {
          Logger.log("Password match! Returning user data with role: " + userRole);
          
          return {
            message: "Login berhasil",
            idUsers: row[0] || "USER_" + i, // idUsers
            username: row[1] || email.split('@')[0], // username
            email: email,
            role: userRole || "user", // Make sure role is returned
            nim: row[5] || "", // nim
            jurusan: row[6] || "", // jurusan
            bio: row[8] || "", // bio
            location: row[9] || "", // location
            website: row[10] || "" // website
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
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] === userData.email) { // email column
        return { error: "Email sudah terdaftar" };
      }
    }

    // Tambah user baru
    var newId = "USER_" + Date.now();
    var hashedPassword = userData.password; // Sudah di-hash dari client
    
    var newRow = [
      newId,                        // idUsers
      userData.username,            // username
      userData.email,               // email
      hashedPassword,               // password (hashed)
      "user",                       // role (default user)
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
