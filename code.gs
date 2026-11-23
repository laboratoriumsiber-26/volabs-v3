/**
 * Fungsi Pengujian Langsung di Editor Apps Script:
 * Pilih fungsi 'testManualPush' di dropdown atas editor lalu klik 'Run' (Jalankan)
 */
function testManualPush() {
  var sampleToken = "e2G2_43d6ZOJeHsy4xXeEC:APA91bF50mspbnIfy7IyWPBowv8Q-Y47ejejWXB-tvF_WXsGBxnnH7DiNUVgrHd9Kdf5irm2zew69cQ_eGUCc3kmeNLrLBg73BfXlTlOYPFRMDKFMXkRIEk";
  var res = sendFcmPushNotification({
    tokens: [sampleToken],
    title: "VoLabs PIPD: Uji Coba Status",
    body: "Tugas video Anda telah diperbarui menjadi Revisi.",
    url: "/"
  });
  Logger.log("HASIL EKSEKUSI FCM: " + JSON.stringify(res, null, 2));
}

/**
 * ============================================================================
 * VOLABS PIPD - GOOGLE DRIVE PHOTO STORAGE & FCM PUSH NOTIFICATION DISPATCHER
 * ============================================================================
 * 1. Otomatis menyimpan foto ke folder: "VoLABS PIPD - Absensi/[Nama Volunteer]".
 * 2. Di Web dihapus oleh Admin -> Foto di Google Drive otomatis dipindahkan ke Sampah (Trash).
 * 3. Di Google Drive dihapus -> Sistem mendeteksi & menghapus presensi di Web.
 * 4. FCM Push Notification HTTP v1: Menembak notifikasi ke HP relawan walau app tertutup.
 * ============================================================================
 */

// Kredensial Firebase Service Account untuk FCM HTTP v1
var FIREBASE_SERVICE_ACCOUNT = {
  "project_id": "volabs-3540a",
  "client_email": "firebase-adminsdk-fbsvc@volabs-3540a.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDBOdnEMQFjxGbo\n3UFxgN1eIjR/FiDvJ3+p2UrF6LzYecasUdMYFaLES9R0AR1h/ibepRjNl6uQ12NY\no5E445bNCCMXvMrcLvFkUxXA/3E4qjX8FckfDAZBPWHe8lmto4zpDM2hDYoUeW+x\nbYrAdTXTxyfokceXou1VL9GPIzI0zuA8Q7w5agDsaSRPlfK4RZEjxxKk/hsE5JLe\n15cOYew4cfLxewl0py5ZRgFszMp/FXUAg6ezNFgW/iePckwPkpoi33oZdyayaCUS\nLqXbNyXnzl0wInPA7jzJ/EVfu+BMrmMNMp7hArd0O7jn+rKQ/ZXqrGJB6Hn5NTGY\n3Lpr9Ra3AgMBAAECggEADCcKsCq/Qjp4mNqzImPCO6JkSz3lpZG5Y/UbnWWtQuKR\nATngNrQqcxtF0GOL9b0zTdUNjn8K6YAlnZrwwXNm6TXcZyjJ8jeUADhNg1oaRKZH\n4OpJ2bihSBPuBnfKXH/1yjTlvEq95w3AKmUphEABU6fdHBgKRcCXs3NF3cr1fgA/\n4l1MRyqUlCGtXEM1BYyVQYlSRVqiELX+K5Sigvvzx6+BG3029RSiktYaPU1wmhqd\n9mQYaH55LV0XmvedHz+yHgBfJXmMgCi1+DWebLYQMwZGhX+jP+KS8a2+/8wdGL4B\nl56HMO7j2NI5TDUHX5GgIO9KVOehB8QdtnUDMocycQKBgQD60uRqyzOA9+MbYJRF\nrRlSMxXXuQCIuBxhKokYE3IICnvjXcVeksFdXIcG/X/71c/nCIe4ET1XDefXFzC0\nKDMixNz2HTrHZL1k7pJRqEcLSK5YXDCkwaY9x0Zt/N0unO9Esp/gTk6TI1yd0w1P\nBxYT8DpJSoexdONxh14sqFKmHwKBgQDFNqr2xcUt9vE9yryuJuKvE4/D92ZPf8to\nBryyNNS2+XL8pYop45M7r41vgm/hPDhL4mqW0VlLAThKLj8HaPfPDw02xM3VJFOg\n9ydmmZX6LtPm1LrLvC1sl5Eq4Fj0ouVk4gmVLhHqOZBbXMeA8O4yboz5XZyPkDwx\nkU50DgqMaQKBgAXAlmp4lIrNpJC5K01Zxe3jrAmRfZilGEmGLzS1JXVXwDWbre4Y\nUYTxnUskvy2oXqc+w9YN1ylK8Vk2d/B5x4pxl1uxmep+vfU1n3dt84sntI/kNV1h\n740VJ+FX3j62bKpXqmD7isPHGNWpxHFeiTwV01Bg/DGuq5Sr9RXzGkojAoGBAKin\nPcHYE+5hFqHPdVhBrO4ofnQKaRZnpZ4K1OhZwefQoANr1iJImqsaUIwiMmeeRk6v\nDJR56DD6lBbsQb6mh/YtWxGRcK1saZBojOtzQQ05asIm/rAo93e8jsrqHWjoveBu\nZd+MDIoQPGHFkF+2qx256RmActlbcf650yvwrhixAoGBAJQzgfvN7jyV+ZjXGXCZ\nvUgYA/NGLP4ijRCuxhHE9+vw9ZV1/kqfuEYP5U5LhHMdVeMV0tLeifW4Zn7TdyPO\ndhThC4XMmoUzHFOBlB8p5QhQjZf4UtQX7IPs58NVBDgdIywlt5EN/66EF6TT/k/Q\nqykVoud6eWDx/cSaFBa4bm9G\n-----END PRIVATE KEY-----\n"
};

/**
 * Endpoint GET - Tes koneksi & ambil daftar foto aktif untuk sinkronisasi dua arah
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "";

    // Sinkronisasi 2 Arah: Mengembalikan semua foto aktif yang belum dihapus di Drive
    if (action === "get_active_photos" || action === "sync_drive") {
      var activePhotos = getActiveDrivePhotos();
      return outputJson({
        status: "success",
        data: activePhotos
      });
    }

    // Tes FCM OAuth2 token
    if (action === "test_fcm_auth") {
      var token = getFcmOAuthToken();
      return outputJson({
        status: "success",
        token: token ? (token.substring(0, 15) + "...") : "null"
      });
    }

    // Tes langsung kirim notifikasi ke token perangkat Anda untuk mendiagnosa respon Google
    if (action === "test_send_push") {
      var targetDeviceToken = (e && e.parameter && e.parameter.token) || "fDX4UlZtx1m8ilr--IRkMl:APA91bG48O3_rCHEO_TzRqTvG4uIXfAk_evn4ipYPD8fFLr4tykBLi_JvpD1Gr_HkeLEbrbfH-6MkNdfF9way84t-aDg02uBW1Cg3AKkm-w2Xn6uEM5mzSI";
      var resDiag = sendFcmPushNotification({
        tokens: [targetDeviceToken],
        title: "Uji Coba Langsung VoLabs",
        body: "Ini adalah notifikasi langsung dari server ke HP Anda!",
        url: "/"
      });
      return outputJson(resDiag);
    }

    return outputJson({
      status: "active",
      service: "VoLABS PIPD Drive Photo & FCM Push Service",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return outputJson({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Endpoint POST - Menerima foto baru, menghapus foto, atau mengirim Push Notification FCM
 */
function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (errParse) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || "";
    var data = payload.data || payload;

    // Aksi 1: Push Notifikasi FCM ke HP relawan walau aplikasi tertutup
    if (action === "send_fcm_push") {
      var pushResult = sendFcmPushNotification(payload);
      return outputJson(pushResult);
    }

    // Aksi 2: Hapus foto dari Google Drive saat admin menghapus di Web
    if (action === "delete_absensi" || action === "delete_foto") {
      var delRes = deletePhotoFromDrive(payload);
      return outputJson({
        status: "success",
        message: "Foto absensi berhasil dihapus dari Google Drive",
        data: delRes
      });
    }

    // Aksi 3: Simpan foto baru ke folder volunteer
    if (!data.foto || typeof data.foto !== "string" || data.foto.length < 50) {
      return outputJson({
        status: "error",
        message: "Data foto base64 tidak valid atau kosong"
      });
    }

    var namaVolunteer = (data.nama || "Volunteer").trim();
    var entryId = data.id || payload.id || "";
    var result = uploadPhotoToVolunteerFolder(data.foto, namaVolunteer, entryId);

    return outputJson({
      status: "success",
      message: "Foto berhasil disimpan ke Google Drive",
      data: result
    });

  } catch (err) {
    return outputJson({
      status: "error",
      message: "Gagal memproses request: " + err.toString()
    });
  }
}

/**
 * Mengirim Push Notification FCM HTTP v1 ke satu atau banyak token perangkat HP
 */
function sendFcmPushNotification(payload) {
  var tokens = payload.tokens || [];
  if (payload.token) tokens.push(payload.token);

  if (!tokens || tokens.length === 0) {
    return { status: "error", message: "Token FCM tidak ditemukan" };
  }

  var title = payload.title || "VoLabs PIPD";
  var body = payload.body || "Ada pembaruan tugas atau pengumuman baru.";
  var url = payload.url || "/";

  var accessToken = getFcmOAuthToken();
  if (!accessToken) {
    return { status: "error", message: "Gagal membuat Access Token FCM v1" };
  }

  var fcmEndpoint = "https://fcm.googleapis.com/v1/projects/" + FIREBASE_SERVICE_ACCOUNT.project_id + "/messages:send";
  var successCount = 0;
  var failCount = 0;
  var errors = [];

  // Deduplikasi token
  var uniqueTokens = [];
  for (var i = 0; i < tokens.length; i++) {
    var t = String(tokens[i]).trim();
    if (t && uniqueTokens.indexOf(t) === -1) {
      uniqueTokens.push(t);
    }
  }

  var origin = "https://volabs.vercel.app";
  var iconUrl = origin + "/icon-192.png";

  for (var j = 0; j < uniqueTokens.length; j++) {
    var targetToken = uniqueTokens[j];
    var messagePayload = {
      message: {
        token: targetToken,
        notification: {
          title: title,
          body: body
        },
        data: {
          title: title,
          body: body,
          url: url,
          icon: iconUrl,
          badge: iconUrl
        },
        android: {
          priority: "HIGH",
          ttl: "86400s",
          notification: {
            title: title,
            body: body,
            icon: iconUrl,
            color: "#BC305F",
            sound: "default",
            click_action: url,
            notification_priority: "PRIORITY_MAX",
            visibility: "PUBLIC"
          }
        },
        webpush: {
          headers: {
            Urgency: "high",
            TTL: "86400"
          },
          notification: {
            title: title,
            body: body,
            icon: iconUrl,
            badge: iconUrl,
            vibrate: [300, 150, 300, 150, 300],
            requireInteraction: true,
            tag: "volabs-push-" + new Date().getTime(),
            renotify: true
          },
          fcm_options: {
            link: url
          }
        }
      }
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + accessToken
      },
      payload: JSON.stringify(messagePayload),
      muteHttpExceptions: true
    };

    try {
      var res = UrlFetchApp.fetch(fcmEndpoint, options);
      var code = res.getResponseCode();
      if (code === 200) {
        successCount++;
      } else {
        failCount++;
        errors.push({ token: targetToken.substring(0, 15) + "...", error: res.getContentText() });
      }
    } catch (e) {
      failCount++;
      errors.push({ token: targetToken.substring(0, 15) + "...", error: e.toString() });
    }
  }

  return {
    status: successCount > 0 ? "success" : (failCount > 0 ? "partial_error" : "error"),
    total: uniqueTokens.length,
    successCount: successCount,
    failCount: failCount,
    errors: errors
  };
}

/**
 * Generate Google OAuth2 Access Token untuk FCM v1 menggunakan JWT RS256
 */
function getFcmOAuthToken() {
  var cache = CacheService.getScriptCache();
  // Bypass cache saat pengujian
  // var cachedToken = cache.get("fcm_oauth_token");
  // if (cachedToken) return cachedToken;

  var now = Math.floor(new Date().getTime() / 1000);
  var exp = now + 3600; // 1 jam

  var header = {
    alg: "RS256",
    typ: "JWT"
  };

  var claimSet = {
    iss: FIREBASE_SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: exp,
    iat: now
  };

  var headerStr = JSON.stringify(header);
  var claimSetStr = JSON.stringify(claimSet);
  var headerEncoded = Utilities.base64EncodeWebSafe(headerStr).replace(/=+$/, "");
  var claimSetEncoded = Utilities.base64EncodeWebSafe(claimSetStr).replace(/=+$/, "");
  var signatureInput = headerEncoded + "." + claimSetEncoded;

  var signatureBytes = Utilities.computeRsaSha256Signature(signatureInput, FIREBASE_SERVICE_ACCOUNT.private_key);
  var signatureEncoded = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, "");

  var jwt = signatureInput + "." + signatureEncoded;

  var tokenResponse = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + encodeURIComponent(jwt),
    muteHttpExceptions: true
  });

  if (tokenResponse.getResponseCode() === 200) {
    var tokenData = JSON.parse(tokenResponse.getContentText());
    var accessToken = tokenData.access_token;
    cache.put("fcm_oauth_token", accessToken, 3500);
    return accessToken;
  } else {
    Logger.log("OAuth Token error: " + tokenResponse.getContentText());
    return null;
  }
}

/**
 * Otomatis mencari atau membuat folder per-volunteer di Drive, lalu mengunggah foto
 */
function uploadPhotoToVolunteerFolder(base64Data, namaVolunteer, entryId) {
  var root = DriveApp.getRootFolder();
  var mainFolderName = "VoLABS PIPD - Absensi";
  var mainFolder;
  var mainFolders = root.getFoldersByName(mainFolderName);
  if (mainFolders.hasNext()) {
    mainFolder = mainFolders.next();
  } else {
    mainFolder = root.createFolder(mainFolderName);
    mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  var cleanNama = (namaVolunteer || "Volunteer Lainnya").trim();
  var userFolder;
  var userFolders = mainFolder.getFoldersByName(cleanNama);
  if (userFolders.hasNext()) {
    userFolder = userFolders.next();
  } else {
    userFolder = mainFolder.createFolder(cleanNama);
    userFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  var dateObj = new Date();
  var contentType = "image/jpeg";
  var rawBase64 = base64Data;
  if (base64Data.indexOf(",") !== -1) {
    var parts = base64Data.split(",");
    rawBase64 = parts[1];
    var meta = parts[0];
    if (meta.indexOf(":") !== -1 && meta.indexOf(";") !== -1) {
      contentType = meta.split(":")[1].split(";")[0];
    }
  }

  var decodedData = Utilities.base64Decode(rawBase64);
  var timestampStr = Utilities.formatDate(dateObj, "GMT+7", "yyyyMMdd_HHmmss");
  var safeName = cleanNama.replace(/[^a-zA-Z0-9]/g, "_");
  var safeId = entryId ? ("_" + String(entryId).replace(/[^a-zA-Z0-9]/g, "_")) : "";
  var fileName = "Absen_" + safeName + "_" + timestampStr + safeId + ".jpg";

  var blob = Utilities.newBlob(decodedData, contentType, fileName);
  var file = userFolder.createFile(blob);
  if (entryId) file.setDescription(String(entryId));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    fileName: fileName,
    fileUrl: file.getUrl(),
    uploadedAt: Utilities.formatDate(dateObj, "GMT+7", "yyyy-MM-dd HH:mm:ss")
  };
}

/**
 * Menghapus foto dari Google Drive saat admin menghapus presensi di web
 */
function deletePhotoFromDrive(payload) {
  var deletedCount = 0;
  var targetId = String(payload.id || (payload.data ? payload.data.id : "")).trim();
  var safeTargetId = targetId ? targetId.replace(/[^a-zA-Z0-9]/g, "_") : "";
  var fileUrl = String(payload.foto || payload.fileUrl || (payload.data ? (payload.data.foto || payload.data.fileUrl) : "")).trim();
  var namaVolunteer = (payload.nama || (payload.data ? payload.data.nama : "") || "").trim();
  var dateStr = String(payload.tanggal || (payload.data ? payload.data.tanggal : "") || "").replace(/[^0-9]/g, "");

  // 1. Hapus jika URL file Drive langsung disertakan
  if (fileUrl && fileUrl.indexOf("drive.google.com") !== -1) {
    try {
      var directFileId = "";
      if (fileUrl.indexOf("/d/") !== -1) {
        directFileId = fileUrl.split("/d/")[1].split("/")[0].split("?")[0];
      } else if (fileUrl.indexOf("id=") !== -1) {
        directFileId = fileUrl.split("id=")[1].split("&")[0];
      }
      if (directFileId) {
        var directFile = DriveApp.getFileById(directFileId);
        if (directFile && !directFile.isTrashed()) {
          directFile.setTrashed(true);
          deletedCount++;
        }
      }
    } catch (e1) {
      Logger.log("Notice delete by URL: " + e1.toString());
    }
  }

  // 2. Cari global dengan DriveApp.searchFiles berdasarkan ID
  if (targetId) {
    try {
      var query = "title contains '" + safeTargetId + "' or title contains '" + targetId + "' or description = '" + targetId + "'";
      var searchFiles = DriveApp.searchFiles(query);
      while (searchFiles.hasNext()) {
        var sf = searchFiles.next();
        if (!sf.isTrashed()) {
          sf.setTrashed(true);
          deletedCount++;
        }
      }
    } catch (eSearch) {
      Logger.log("Notice searchFiles: " + eSearch.toString());
    }
  }

  // 3. Cari teliti di dalam folder "VoLABS PIPD - Absensi" dan subfolder volunteer
  try {
    var root = DriveApp.getRootFolder();
    var mainFolders = root.getFoldersByName("VoLABS PIPD - Absensi");
    if (mainFolders.hasNext()) {
      var mainFolder = mainFolders.next();
      var subFolders = mainFolder.getFolders();
      while (subFolders.hasNext()) {
        var sFolder = subFolders.next();
        var sName = sFolder.getName().trim().toLowerCase();
        var isTargetFolder = !namaVolunteer || (sName === namaVolunteer.toLowerCase()) || (sName.indexOf(namaVolunteer.toLowerCase()) !== -1);

        if (isTargetFolder) {
          var files = sFolder.getFiles();
          while (files.hasNext()) {
            var f = files.next();
            if (f.isTrashed()) continue;

            var fName = f.getName();
            var fDesc = f.getDescription() || "";
            var isMatch = false;

            if (targetId && (fName.indexOf(targetId) !== -1 || fName.indexOf(safeTargetId) !== -1 || fDesc === targetId)) {
              isMatch = true;
            } else if (!targetId && dateStr && fName.indexOf(dateStr) !== -1) {
              isMatch = true;
            }

            if (isMatch) {
              f.setTrashed(true);
              deletedCount++;
            }
          }
        }
      }
    }
  } catch (eFolder) {
    Logger.log("Notice folder scan: " + eFolder.toString());
  }

  return { success: true, deletedCount: deletedCount };
}

/**
 * Mengambil seluruh foto aktif di Google Drive (yang BELUM dipindah ke Sampah/Trash)
 * Digunakan untuk sinkronisasi dua arah: jika foto dihapus di Drive, otomatis terhapus di Web.
 */
function getActiveDrivePhotos() {
  var root = DriveApp.getRootFolder();
  var mainFolders = root.getFoldersByName("VoLABS PIPD - Absensi");
  if (!mainFolders.hasNext()) return [];
  var mainFolder = mainFolders.next();

  var volunteerFolders = mainFolder.getFolders();
  var activeList = [];

  while (volunteerFolders.hasNext()) {
    var vFolder = volunteerFolders.next();
    var vName = vFolder.getName();
    var files = vFolder.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      if (!f.isTrashed()) {
        activeList.push({
          fileId: f.getId(),
          fileName: f.getName(),
          fileUrl: f.getUrl(),
          volunteerName: vName,
          entryId: f.getDescription() || ""
        });
      }
    }
  }
  return activeList;
}

/**
 * Format output JSON
 */
function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
