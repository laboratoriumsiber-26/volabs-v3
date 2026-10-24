/**
 * ============================================================================
 * VOLABS PIPD - GOOGLE DRIVE STORAGE PRESENSI (PURE GOOGLE DRIVE API)
 * ============================================================================
 * Script ini MURNI HANYA untuk:
 * - Menerima foto bukti presensi (Base64) dari aplikasi web VoLABS PIPD.
 * - Menyimpan berkas foto .jpg ke Folder Google Drive.
 * - Mengembalikan link/URL foto Google Drive publik.
 * (Tidak menggunakan Spreadsheet sama sekali, database penuh di Cloud Firestore)
 * ============================================================================
 */

// ID Folder Google Drive untuk menyimpan foto absen.
// Contoh URL Folder: https://drive.google.com/drive/folders/1v9zkWjdSlErSNB5DwkRp6oT3u6dc1lFn
// Jika dikosongkan (""), script otomatis membuat folder "VoLABS PIPD - Arsip Absensi" di Drive Anda.
var FOLDER_ID = "1v9zkWjdSlErSNB5DwkRp6oT3u6dc1lFn";

/**
 * Endpoint GET - Digunakan untuk tes koneksi Web App
 */
function doGet(e) {
  return outputJson({
    status: "active",
    service: "VoLABS PIPD Google Drive Photo Storage",
    timestamp: new Date().toISOString()
  });
}

/**
 * Endpoint POST - Menerima foto & menyimpan langsung ke Google Drive
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

    // Ambil data foto dari payload
    var data = payload.data || payload;

    if (!data.foto || typeof data.foto !== "string" || data.foto.length < 50) {
      return outputJson({
        status: "error",
        message: "Data foto base64 tidak valid atau kosong"
      });
    }

    var result = uploadPhotoToDrive(data.foto, data.nama || "Volunteer");
    return outputJson({
      status: "success",
      message: "Foto berhasil disimpan ke Google Drive",
      data: result
    });

  } catch (err) {
    return outputJson({
      status: "error",
      message: "Gagal memproses upload: " + err.toString()
    });
  }
}

/**
 * Mengunggah data base64 foto ke Google Drive
 */
function uploadPhotoToDrive(base64Data, nama) {
  var folder = getDriveFolder();
  var dateObj = new Date();

  // Parsing data base64 (mendukung data:image/jpeg;base64,... maupun raw base64)
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
  var safeName = (nama || "Volunteer").replace(/[^a-zA-Z0-9]/g, "_");
  var timestampStr = Utilities.formatDate(dateObj, "GMT+7", "yyyyMMdd_HHmmss");
  var fileName = "Absen_" + safeName + "_" + timestampStr + ".jpg";

  var blob = Utilities.newBlob(decodedData, contentType, fileName);
  var file = folder.createFile(blob);

  // Atur akses agar foto dapat dilihat publik melalui link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    fileName: fileName,
    fileUrl: file.getUrl(),
    uploadedAt: Utilities.formatDate(dateObj, "GMT+7", "yyyy-MM-dd HH:mm:ss")
  };
}

/**
 * Mengambil folder target di Google Drive dengan auto-fallback
 */
function getDriveFolder() {
  var folder = null;
  if (FOLDER_ID && String(FOLDER_ID).trim() !== "") {
    try {
      folder = DriveApp.getFolderById(String(FOLDER_ID).trim());
    } catch (err) {
      Logger.log("Folder ID khusus tidak ditemukan / tidak ada izin: " + err.toString());
      folder = null;
    }
  }

  // Jika FOLDER_ID kosong atau tidak ditemukan, otomatis buat di Google Drive utama
  if (!folder) {
    var folderName = "VoLABS PIPD - Arsip Absensi";
    var existingFolders = DriveApp.getRootFolder().getFoldersByName(folderName);
    if (existingFolders.hasNext()) {
      folder = existingFolders.next();
    } else {
      folder = DriveApp.getRootFolder().createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  }

  return folder;
}

/**
 * Format output JSON
 */
function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}