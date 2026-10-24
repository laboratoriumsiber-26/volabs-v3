/**
 * ============================================================================
 * VOLABS PIPD - ZERO-CONFIG GOOGLE DRIVE PHOTO STORAGE (PER-VOLUNTEER FOLDER)
 * ============================================================================
 * Fitur 100% Otomatis (Tanpa Perlu Setup Google Drive Manual):
 * - Otomatis membuat folder utama "VoLABS PIPD - Absensi" di Google Drive.
 * - Otomatis membuat subfolder khusus sesuai NAMA masing-masing volunteer.
 * - Menyimpan berkas foto absen langsung ke dalam folder nama volunteer tersebut.
 * - Tanpa Spreadsheet & tanpa perlu copy-paste ID folder apa pun.
 * ============================================================================
 */

/**
 * Endpoint GET - Digunakan untuk tes koneksi Web App
 */
function doGet(e) {
  return outputJson({
    status: "active",
    service: "VoLABS PIPD Auto-Folder Drive Storage",
    timestamp: new Date().toISOString()
  });
}

/**
 * Endpoint POST - Menerima foto & otomatis membuatkan folder sesuai nama volunteer
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
      message: "Foto berhasil disimpan ke folder " + namaVolunteer,
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
 * Otomatis mencari atau membuat folder per-volunteer, lalu mengunggah foto
 */
function uploadPhotoToVolunteerFolder(base64Data, namaVolunteer) {
  // 1. Dapatkan atau otomatis buat folder khusus untuk volunteer tersebut
  var userFolder = getOrCreateVolunteerFolder(namaVolunteer);
  var dateObj = new Date();

  // 2. Parsing format base64 foto
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
  var safeName = namaVolunteer.replace(/[^a-zA-Z0-9]/g, "_");
  var fileName = "Absen_" + safeName + "_" + timestampStr + ".jpg";

  var blob = Utilities.newBlob(decodedData, contentType, fileName);
  var file = userFolder.createFile(blob);

  // Atur akses agar foto dapat dibuka melalui tautan
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    fileName: fileName,
    fileUrl: file.getUrl(),
    folderName: namaVolunteer,
    uploadedAt: Utilities.formatDate(dateObj, "GMT+7", "yyyy-MM-dd HH:mm:ss")
  };
}

/**
 * Struktur Hirarki Folder Otomatis di Google Drive:
 * Google Drive Saya
 *   └── VoLABS PIPD - Absensi
 *         ├── [Nama Volunteer 1]
 *         │     └── Absen_[Nama]_20261025_083015.jpg
 *         ├── [Nama Volunteer 2]
 *         └── [Nama Volunteer 3]
 */
function getOrCreateVolunteerFolder(namaVolunteer) {
  var root = DriveApp.getRootFolder();
  var mainFolderName = "VoLABS PIPD - Absensi";

  // 1. Cari atau buat folder utama "VoLABS PIPD - Absensi" di root Drive
  var mainFolder;
  var mainFolders = root.getFoldersByName(mainFolderName);
  if (mainFolders.hasNext()) {
    mainFolder = mainFolders.next();
  } else {
    mainFolder = root.createFolder(mainFolderName);
    mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  // 2. Cari atau buat subfolder khusus atas nama volunteer
  var cleanNama = (namaVolunteer || "Volunteer Lainnya").trim();
  var userFolder;
  var userFolders = mainFolder.getFoldersByName(cleanNama);
  if (userFolders.hasNext()) {
    userFolder = userFolders.next();
  } else {
    userFolder = mainFolder.createFolder(cleanNama);
    userFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  return userFolder;
}

/**
 * Format output JSON
 */
function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}