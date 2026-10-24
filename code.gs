/**
 * ============================================================================
 * VOLABS PIPD - GOOGLE DRIVE PHOTO STORAGE (2-WAY BIDIRECTIONAL SYNC)
 * ============================================================================
 * Fitur Sinkronisasi Segala Arah:
 * 1. Otomatis menyimpan foto ke folder: "VoLABS PIPD - Absensi/[Nama Volunteer]".
 * 2. Di Web dihapus oleh Admin -> Foto di Google Drive otomatis dipindahkan ke Sampah (Trash).
 * 3. Di Google Drive dihapus -> Sistem mendeteksi & menghapus presensi di Web.
 * 4. Tanpa Spreadsheet, 100% Google Drive murni terhubung ke Cloud Firestore.
 * ============================================================================
 */

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

    return outputJson({
      status: "active",
      service: "VoLABS PIPD 2-Way Drive Photo Storage",
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
 * Endpoint POST - Menerima foto baru atau menghapus foto saat presensi dihapus di web
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

    // Aksi 1: Hapus foto dari Google Drive saat admin menghapus di Web
    if (action === "delete_absensi" || action === "delete_foto") {
      var delRes = deletePhotoFromDrive(payload);
      return outputJson({
        status: "success",
        message: "Foto absensi berhasil dihapus dari Google Drive",
        data: delRes
      });
    }

    // Aksi 2: Simpan foto baru ke folder volunteer
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