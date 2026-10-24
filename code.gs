/**
 * ============================================================================
 * VOLABS PIPD - ZERO-CONFIG GOOGLE DRIVE PHOTO STORAGE
 * ============================================================================
 * Script ini MURNI HANYA untuk:
 * - Menyimpan berkas foto .jpg bukti presensi ke Google Drive.
 * - Otomatis membuat folder utama "VoLABS PIPD - Absensi" & subfolder nama volunteer.
 * - Mengembalikan URL foto Google Drive publik.
 * (Seluruh database presensi, data absensi, dan sinkronisasi dikelola Firebase)
 * ============================================================================
 */

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
 * Endpoint POST - Menerima foto & menyimpan ke folder nama volunteer di Google Drive
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

    var data = payload.data || payload;

    if (!data.foto || typeof data.foto !== "string" || data.foto.length < 50) {
      return outputJson({
        status: "error",
        message: "Data foto base64 tidak valid atau kosong"
      });
    }

    var namaVolunteer = (data.nama || "Volunteer").trim();
    var result = uploadPhotoToVolunteerFolder(data.foto, namaVolunteer);

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
 * Otomatis mencari atau membuat folder per-volunteer di Drive, lalu mengunggah foto
 */
function uploadPhotoToVolunteerFolder(base64Data, namaVolunteer) {
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
  var fileName = "Absen_" + safeName + "_" + timestampStr + ".jpg";

  var blob = Utilities.newBlob(decodedData, contentType, fileName);
  var file = userFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    fileName: fileName,
    fileUrl: file.getUrl(),
    uploadedAt: Utilities.formatDate(dateObj, "GMT+7", "yyyy-MM-dd HH:mm:ss")
  };
}

/**
 * Format output JSON
 */
function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}