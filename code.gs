/**
 * ============================================================================
 * VOLABS PIPD - GOOGLE APPS SCRIPT STORAGE PRESENSI (GOOGLE DRIVE & SPREADSHEET)
 * ============================================================================
 * Script ini KHUSUS & HANYA untuk:
 * 1. Menerima foto bukti kehadiran dari web aplikasi VoLABS PIPD.
 * 2. Mengunggah dan mengarsipkan foto ke Folder Google Drive.
 * 3. Mencatat rekap presensi dan tautan foto Google Drive ke Google Sheets.
 * ============================================================================
 */

// ID Folder Utama di Google Drive Anda (Contoh: "1v9zkWjdSlErSNB5DwkRp6oT3u6dc1lFn")
// Kosongkan ("") jika ingin sistem otomatis membuat folder "VoLABS PIPD/Absensi" di Google Drive Anda.
var MAIN_FOLDER_ID = "1v9zkWjdSlErSNB5DwkRp6oT3u6dc1lFn";

/**
 * Endpoint GET - Digunakan untuk pengujian koneksi & status server
 */
function doGet(e) {
  return outputJson({
    status: "active",
    service: "VoLABS PIPD Attendance Storage",
    timestamp: new Date().toISOString()
  });
}

/**
 * Endpoint POST - Menerima foto & data presensi dari web aplikasi
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
    var action = payload.action || (data ? data.action : "");

    // Simpan data presensi dan foto ke Google Drive
    if (action === "submit_absensi" || (data && (data.foto || data.nama))) {
      var result = saveAttendanceStorage(data);
      return outputJson({
        status: "success",
        message: "Foto absen berhasil disimpan di Google Drive",
        data: result
      });
    }

    return outputJson({
      status: "error",
      message: "Action tidak dikenal: " + action
    });

  } catch (err) {
    return outputJson({
      status: "error",
      message: "Server Error: " + err.toString()
    });
  }
}

/**
 * Fungsi Inti: Mengunggah foto ke Drive dan mencatat ke Google Sheets
 */
function saveAttendanceStorage(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = initAbsensiSheet(ss);
  var now = new Date();
  var fotoUrl = "Tidak ada foto";

  // 1. Unggah Foto ke Google Drive
  if (data.foto && typeof data.foto === "string" && data.foto.length > 50) {
    fotoUrl = uploadPhotoToDrive(data.foto, data.nama || "Volunteer", now);
  }

  // 2. Format baris data presensi
  var koordinat = (data.lat && data.lon) ? (data.lat + ", " + data.lon) : "-";
  var rowData = [
    now,
    data.nama || "-",
    "'" + (data.nim || "-"),
    data.divisi || data.jabatan || "-",
    data.semester || "-",
    data.fakultas || "-",
    data.jurusan || "-",
    data.wa || "-",
    data.lokasi || "-",
    koordinat,
    fotoUrl,
    data.notulensi || "-"
  ];

  // 3. Rekap ke Google Sheets
  sheet.appendRow(rowData);

  return {
    nama: data.nama,
    waktu: Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss"),
    fotoUrl: fotoUrl
  };
}

/**
 * Mengunggah data foto base64 ke Google Drive
 */
function uploadPhotoToDrive(base64Data, nama, dateObj) {
  try {
    var folder = getTargetFolder("Absensi");

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

    // Set akses agar foto dapat dilihat melalui tautan
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("Gagal upload foto ke Drive: " + err.toString());
    return "Gagal upload: " + err.toString();
  }
}

/**
 * Mencari atau membuat folder penyimpanan di Google Drive
 */
function getTargetFolder(subFolderName) {
  var parentFolder;
  if (MAIN_FOLDER_ID && String(MAIN_FOLDER_ID).trim() !== "") {
    try {
      parentFolder = DriveApp.getFolderById(String(MAIN_FOLDER_ID).trim());
    } catch (err) {
      Logger.log("Folder ID khusus tidak ditemukan / tidak ada izin: " + err.toString());
      parentFolder = null;
    }
  }

  // Fallback otomatis ke root Google Drive jika ID kosong/tidak valid
  if (!parentFolder) {
    var rootFolders = DriveApp.getRootFolder().getFoldersByName("VoLABS PIPD");
    if (rootFolders.hasNext()) {
      parentFolder = rootFolders.next();
    } else {
      parentFolder = DriveApp.getRootFolder().createFolder("VoLABS PIPD");
      parentFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  }

  // Cari atau buat subfolder (misal: "Absensi")
  var subFolders = parentFolder.getFoldersByName(subFolderName);
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    var newSub = parentFolder.createFolder(subFolderName);
    newSub.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newSub;
  }
}

/**
 * Inisialisasi sheet bulanan untuk presensi
 */
function initAbsensiSheet(ss) {
  var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var now = new Date();
  var sheetName = "Absensi " + months[now.getMonth()] + " " + now.getFullYear();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var header = [
      "Timestamp",
      "Nama",
      "NIM",
      "Divisi",
      "Semester",
      "Fakultas",
      "Jurusan",
      "WhatsApp",
      "Lokasi",
      "Koordinat",
      "Foto (URL Google Drive)",
      "Notulensi"
    ];
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Output Response JSON
 */
function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}