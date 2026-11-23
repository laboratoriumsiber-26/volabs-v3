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
    if (action === "test_token") {
      var token = getFcmOAuthToken();
      return outputJson({
        status: token ? "success" : "error",
        token: token ? token.substring(0, 20) + "..." : null
      });
    }

    return outputJson({
      status: "online",
      message: "VoLABS Google Apps Script Bridge Aktif (Drive Storage + FCM Push Notification v1)"
    });
  } catch (err) {
    return outputJson({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Endpoint POST - Menerima upload foto, perintah hapus Drive, dan pengiriman FCM Push
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return outputJson({ status: "error", message: "Tidak ada data payload yang dikirim." });
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return outputJson({ status: "error", message: "Format JSON tidak valid." });
    }

    var action = payload.action || "";

    // ACTION 1: UPLOAD FOTO KE GOOGLE DRIVE
    if (action === "upload_photo") {
      var base64Data = payload.image;
      var namaVolunteer = payload.namaVolunteer || "Volunteer Lainnya";
      var entryId = payload.entryId || new Date().getTime().toString();

      if (!base64Data) {
        return outputJson({ status: "error", message: "Data gambar kosong." });
      }

      var uploadResult = uploadPhotoToVolunteerFolder(base64Data, namaVolunteer, entryId);
      return outputJson({
        status: "success",
        data: uploadResult
      });
    }

    // ACTION 2: HAPUS FOTO DI GOOGLE DRIVE (Pindahkan ke Sampah)
    if (action === "delete_photo") {
      var fileId = payload.driveFileId;
      if (!fileId) {
        return outputJson({ status: "error", message: "driveFileId tidak disediakan." });
      }

      var delResult = trashPhotoFile(fileId);
      return outputJson({
        status: "success",
        data: delResult
      });
    }

    // ACTION 3: KIRIM PUSH NOTIFICATION (FCM HTTP v1)
    if (action === "send_push" || action === "send_fcm_push") {
      var pushResult = sendFcmPushNotification(payload);
      return outputJson(pushResult);
    }

    return outputJson({ status: "error", message: "Aksi tidak dikenali: " + action });

  } catch (err) {
    return outputJson({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Mengirim Push Notification FCM HTTP v1 ke target tokens
 */
function sendFcmPushNotification(payload) {
  var tokens = payload.tokens || [];
  if (payload.token) tokens.push(payload.token);

  // Buat list unik
  var uniqueTokens = [];
  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    if (t && uniqueTokens.indexOf(t) === -1) {
      uniqueTokens.push(t);
    }
  }

  if (uniqueTokens.length === 0) {
    return { status: "error", message: "Tidak ada token tujuan FCM." };
  }

  var accessToken = getFcmOAuthToken();
  if (!accessToken) {
    return { status: "error", message: "Gagal membuat Access Token FCM v1" };
  }

  var title = payload.title || "VoLabs PIPD";
  var body = payload.body || "Pembaruan penugasan baru.";
  var url = payload.url || "/";
  var iconUrl = "https://volabs.vercel.app/icon-192.png";

  var projectId = FIREBASE_SERVICE_ACCOUNT.project_id;
  var fcmEndpoint = "https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send";

  var successCount = 0;
  var failCount = 0;
  var errors = [];

  for (var k = 0; k < uniqueTokens.length; k++) {
    var targetToken = uniqueTokens[k];

    var messagePayload = {
      message: {
        token: targetToken,
        data: {
          title: title,
          body: body,
          url: url,
          icon: iconUrl,
          click_action: url
        },
        android: {
          priority: "HIGH",
          notification: {
            title: title,
            body: body,
            icon: iconUrl,
            color: "#BC305F",
            sound: "default"
          }
        },
        webpush: {
          headers: {
            Urgency: "high"
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

  var contentType = "image/jpeg";
  var rawBase64 = base64Data;
  if (base64Data.indexOf(",") > -1) {
    var parts = base64Data.split(",");
    rawBase64 = parts[1];
    var match = parts[0].match(/:(.*?);/);
    if (match && match[1]) {
      contentType = match[1];
    }
  }

  var decodedBytes = Utilities.base64Decode(rawBase64);
  var fileName = "Absensi_" + cleanNama.replace(/\s+/g, "_") + "_" + entryId + ".jpg";
  var blob = Utilities.newBlob(decodedBytes, contentType, fileName);

  var file = userFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
  var previewUrl = file.getUrl();

  return {
    driveFileId: fileId,
    driveUrl: directUrl,
    previewUrl: previewUrl,
    fileName: fileName,
    folderName: cleanNama
  };
}

/**
 * Memindahkan foto ke Trash Google Drive saat data presensi dihapus di Web
 */
function trashPhotoFile(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { success: true, message: "File berhasil dipindahkan ke Sampah Google Drive." };
  } catch (e) {
    return { success: false, message: "File tidak ditemukan atau sudah dihapus: " + e.toString() };
  }
}

/**
 * Mengambil semua ID file foto yang masih aktif di Google Drive untuk sinkronisasi balik
 */
function getActiveDrivePhotos() {
  var root = DriveApp.getRootFolder();
  var mainFolderName = "VoLABS PIPD - Absensi";
  var mainFolders = root.getFoldersByName(mainFolderName);
  if (!mainFolders.hasNext()) {
    return [];
  }

  var mainFolder = mainFolders.next();
  var subFolders = mainFolder.getFolders();
  var activeFileIds = [];

  while (subFolders.hasNext()) {
    var sub = subFolders.next();
    var files = sub.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      if (!file.isTrashed()) {
        activeFileIds.push({
          fileId: file.getId(),
          name: file.getName(),
          volunteer: sub.getName()
        });
      }
    }
  }

  return activeFileIds;
}

/**
 * Helper response JSON
 */
function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
