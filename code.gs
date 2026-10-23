// ============================================================================
// KONFIGURASI SISTEM VOLABS PIPD - GOOGLE APPS SCRIPT
// ============================================================================
// ID Folder Utama Google Drive untuk menyimpan arsip Foto Absensi & Bukti Konten.
// Contoh URL: https://drive.google.com/drive/folders/1v9zkWjdSlErSNB5DwkRp6oT3u6dc1lFn
// Jika dikosongkan (""), sistem otomatis membuat folder "VoLABS PIPD" di Google Drive Anda.
var MAIN_FOLDER_ID = "1v9zkWjdSlErSNB5DwkRp6oT3u6dc1lFn";

function doGet(e) {
  try {
    var action = e.parameter.action;
    
    // Default Routing to Absensi Monitoring if action is 'read_absensi'
    if (action === 'read_absensi') {
      var data = getTodayAbsensiData();
      return outputJson({ status: "success", data: data });
    }
    
    // ==========================================
    // LOGIKA AUTENTIKASI (RBAC)
    // ==========================================
    if (action === 'login') {
      var username = String(e.parameter.username).trim().toLowerCase();
      var password = String(e.parameter.password).trim();
      var usersSheet = initUsersSheet();
      var usersData = usersSheet.getDataRange().getValues();
      
      for (var i = 1; i < usersData.length; i++) {
        var sheetUsername = String(usersData[i][1]).trim().toLowerCase();
        var sheetPassword = String(usersData[i][2]).trim();
        
        if (sheetUsername === username && sheetPassword === password) {
          var userObj = {
            id: usersData[i][0],
            username: usersData[i][1],
            role: usersData[i][3], // Mahasiswa, DPL, Admin
            namaLengkap: usersData[i][4],
            kelompok: usersData[i][5],
            nim: usersData[i][6],
            fakultas: usersData[i][7],
            isUploader: String(usersData[i][9] || '').trim().toUpperCase() === 'TRUE' || usersData[i][9] === true
          };
          return outputJson({ status: "success", message: "Login berhasil", user: userObj });
        }
      }
      return outputJson({ status: "error", message: "Username atau password salah!" });
    }
    
    // ==========================================
    // LOGIKA BACA DATA PENGGUNA / PROFIL (ADMIN)
    // ==========================================
    if (action === 'read_users') {
      var usersSheet = initUsersSheet();
      var usersData = usersSheet.getDataRange().getValues();
      var result = [];
      for (var i = 1; i < usersData.length; i++) {
        result.push({
          id: usersData[i][0],
          username: usersData[i][1],
          role: usersData[i][3],
          namaLengkap: usersData[i][4],
          divisi: usersData[i][5],
          nim: usersData[i][6],
          fakultas: usersData[i][7],
          whatsapp: usersData[i][8],
          isUploader: String(usersData[i][9] || '').trim().toUpperCase() === 'TRUE' || usersData[i][9] === true
        });
      }
      return outputJson({ status: "success", data: result });
    }
    
    // ==========================================
    // LOGIKA BACA SEMUA JURNAL KKN (ADMIN)
    // ==========================================
    if (action === 'read_all_jurnal') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheets = ss.getSheets();
      var allJournal = [];
      var filterBulan = e.parameter.bulan || '';
      var filterUser  = e.parameter.user  || '';
      sheets.forEach(function(sheet) {
        var sName = sheet.getName();
        if (!sName.startsWith('Jurnal - ')) return;
        var namaUser = sName.replace('Jurnal - ', '');
        if (filterUser && namaUser.toLowerCase() !== filterUser.toLowerCase()) return;
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (!row[0] && !row[1] && !row[4]) continue;
          var tglVal = row[1] || '';
          if (tglVal instanceof Date && !isNaN(tglVal.getTime())) {
            tglVal = Utilities.formatDate(tglVal, 'GMT+7', 'yyyy-MM-dd');
          } else if (typeof tglVal === 'string') {
            if (tglVal.includes('T')) tglVal = tglVal.split('T')[0];
            else if (tglVal.match(/^\d{4}-\d{2}-\d{2}/)) tglVal = tglVal.substring(0, 10);
          }
          // Filter bulan
          if (filterBulan) {
            var bulanNames = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
            var tglParts = tglVal.split('-');
            var bulanNum = tglParts.length > 1 ? parseInt(tglParts[1]) : 0;
            if (bulanNames[bulanNum] !== filterBulan) continue;
          }
          allJournal.push({
            id: String(row[0] || ('J-' + i)),
            tanggal: String(tglVal || ''),
            jam: String(row[2] || ''),
            durasi: String(row[3] || ''),
            uraian: String(row[4] || ''),
            nama: String(row[5] || namaUser),
            nim: String(row[6] || ''),
            prodi: String(row[7] || ''),
            periode: String(row[8] || ''),
            sheetName: sName
          });
        }
      });
      allJournal.sort(function(a, b) { return b.tanggal.localeCompare(a.tanggal); });
      return outputJson({ status: 'success', data: allJournal });
    }
    
    // ==========================================
    // LOGIKA STUDIO EDITOR (READ TASKS)
    // ==========================================
    if (action === 'read_editor_tasks') {
      var tipe = e.parameter.tipe || 'pembelajaran'; // 'pembelajaran' | 'podcast'
      var editorName = e.parameter.editor || '';
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetName = tipe === 'podcast' ? 'EditorTask - Podcast' : 'EditorTask - Pembelajaran';
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return outputJson({ status: 'success', data: [] });
      var data = sheet.getDataRange().getValues();
      var result = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[0]) continue;
        if (editorName && String(row[4] || '').trim().toLowerCase() !== editorName.trim().toLowerCase()) continue;
        result.push({
          id: String(row[0]),
          uploadId: String(row[1] || ''),
          judul: String(row[2] || ''),
          mataKuliah: String(row[3] || ''),
          editor: String(row[4] || ''),
          uploader: String(row[5] || ''),
          deadline: String(row[6] || ''),
          status: String(row[7] || 'Belum Dikerjakan'),
          rawVideo: String(row[8] || ''),
          storyboard: String(row[9] || ''),
          hasilEdit: String(row[10] || ''),
          revisi: String(row[11] || ''),
          note: String(row[12] || ''),
          dosen: String(row[13] || ''),
          narasumber: String(row[14] || ''),
          host: String(row[15] || ''),
          createdAt: String(row[16] || '')
        });
      }
      return outputJson({ status: 'success', data: result });
    }
    
    // ==========================================
    // LOGIKA STUDIO UPLOAD (READ UPLOADS)
    // ==========================================
    if (action === 'read_uploads') {
      var tipe = e.parameter.tipe || 'pembelajaran';
      var uploaderName = e.parameter.uploader || '';
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetName = tipe === 'podcast' ? 'Upload - Podcast' : 'Upload - Pembelajaran';
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return outputJson({ status: 'success', data: [] });
      var data = sheet.getDataRange().getValues();
      var result = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!row[0]) continue;
        if (uploaderName && String(row[4] || '').trim().toLowerCase() !== uploaderName.trim().toLowerCase()) continue;
        result.push({
          id: String(row[0]),
          judul: String(row[1] || ''),
          mataKuliah: String(row[2] || ''),
          dosen: String(row[3] || ''),
          uploader: String(row[4] || ''),
          rawVideo: String(row[5] || ''),
          storyboard: String(row[6] || ''),
          status: String(row[7] || 'Submitted'),
          narasumber: String(row[8] || ''),
          host: String(row[9] || ''),
          createdAt: String(row[10] || '')
        });
      }
      return outputJson({ status: 'success', data: result });
    }
    
    // ==========================================
    // LOGIKA BANK MATERIAL & RAW ASSETS (UNIVERSAL READ)
    // ==========================================
    if (action === 'read_aset_video') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Bank Material & RAW");
      var list = [];
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (!row[0] && !row[1]) continue;
          list.push({
            id: String(row[0] || ('ASET-' + i)),
            nama: String(row[1] || ''),
            kategori: String(row[2] || ''),
            format: String(row[3] || ''),
            size: String(row[4] || ''),
            driveUrl: String(row[5] || ''),
            deskripsi: String(row[6] || ''),
            uploader: String(row[7] || 'Admin'),
            createdAt: String(row[8] || '')
          });
        }
      }
      return outputJson({ status: 'success', data: list });
    }
    
    // Content Plan Routing
    if (action === 'read') {
      var sheetName = e.parameter.sheetName;
      if (!sheetName) return outputJson({ status: "error", message: "Parameter sheetName hilang" });
      
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      
      // Auto-create Content Plan sheet jika belum ada saat mode read (agar langsung ready)
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        var headers = [
          "ID", "Tanggal", "Platform", "Judul", "Isi", "Content Pillar", "Value", "PIC",
          "Status", "Link Desain", "Link Publikasi", "Tanggal Publikasi", "SKP/KKN", "CTA", "Hashtag", "Caption", "Foto Bukti", "Kolaborator", "Request Kolaborasi"
        ];
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
        sheet.setFrozenRows(1);
        return outputJson({ status: "success", sheetName: sheetName, data: [] });
      }
      
      var data = sheet.getDataRange().getValues();
      var result = [];
      if (data.length > 0) {
        // Lakukan migrasi otomatis untuk kolom yang hilang
        var headers = migrateHeaders(sheet, data[0]);
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = row[j];
          }
          result.push(obj);
        }
      }
      return outputJson({ status: "success", sheetName: sheetName, data: result });
    }
    
    // ==========================================
    // LOGIKA JURNAL KKN (READ & AUTO-CREATE)
    // ==========================================
    // LOGIKA JURNAL KKN (READ & AUTO-CREATE)
    // ==========================================
    if (action === 'read_jurnal') {
      var sheetName = e.parameter.sheetName || "Jurnal - Mahasiswa";
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      
      var headers = [
        "ID", "Tanggal", "Jam Shift", "Durasi", "Uraian Kegiatan", "Nama Mahasiswa", "NIM", "Prodi", "Periode", "Last Updated"
      ];
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
        sheet.setFrozenRows(1);
        return outputJson({ status: "success", sheetName: sheetName, data: [] });
      } else {
        // Self-healing columns: pastikan jumlah kolom minimal 10 sebelum getRange
        var maxCols = sheet.getMaxColumns();
        if (maxCols < 10) {
          sheet.insertColumnsAfter(maxCols, 10 - maxCols);
        } else if (maxCols > 10) {
          sheet.deleteColumns(11, maxCols - 10);
        }
        
        // Self-healing header: perbaiki jika header salah (misal akibat bug versi lama)
        var col3 = String(sheet.getRange(1, 3).getValue() || "").trim();
        if (col3 !== "Jam Shift") {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
        }
      }
      
      var data = sheet.getDataRange().getValues();
      var result = [];
      if (data.length > 1) {
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (!row[0] && !row[1] && !row[4]) continue;
          if (String(row[2]).trim() === "Platform" || String(row[2]).trim() === "Jam Shift") continue;
          var tglVal = row[1] || "";
          if (tglVal instanceof Date && !isNaN(tglVal.getTime())) {
            tglVal = Utilities.formatDate(tglVal, "GMT+7", "yyyy-MM-dd");
          } else if (typeof tglVal === "string") {
            if (tglVal.includes("T")) tglVal = tglVal.split("T")[0];
            else if (tglVal.match(/^\d{4}-\d{2}-\d{2}/)) tglVal = tglVal.substring(0, 10);
            else if (tglVal.includes("GMT") || tglVal.match(/^[a-zA-Z]{3}\s[a-zA-Z]{3}/)) {
              var dTemp = new Date(tglVal);
              if (!isNaN(dTemp.getTime())) tglVal = Utilities.formatDate(dTemp, "GMT+7", "yyyy-MM-dd");
            }
          }
          result.push({
            id: String(row[0] || ("J-" + i)),
            tanggal: String(tglVal || ""),
            jam: String(row[2] || "08.00 - 11.00"),
            durasi: String(row[3] || "3 Jam"),
            uraian: String(row[4] || "")
          });
        }
      }
      return outputJson({ status: "success", sheetName: sheetName, data: result });
    }

    return outputJson({ status: "error", message: "Action doGet tidak dikenal" });
  } catch (err) {
    return outputJson({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var sheetName = payload.sheetName;
    var data = payload.data;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ==========================================
    // LOGIKA ABSENSI
    // ==========================================
    if (action === 'submit_absensi') {
      var result = saveAttendance(data);
      return outputJson({ status: "success", message: "Data berhasil disimpan", data: result });
    }
    
    // ==========================================
    // LOGIKA JURNAL KKN (SYNC DATABASE PER MAHASISWA)
    // ==========================================
    // ==========================================
    // LOGIKA TOGGLE UPLOADER ROLE
    // ==========================================
    if (action === 'toggle_uploader') {
      var usersSheet = initUsersSheet();
      var usersData = usersSheet.getDataRange().getValues();
      var targetId = payload.userId;
      var newStatus = payload.isUploader; // true / false
      for (var i = 1; i < usersData.length; i++) {
        if (String(usersData[i][0]).trim() === String(targetId).trim()) {
          // Kolom index 9 = IsUploader (tambahkan jika belum ada)
          var maxCols = usersSheet.getMaxColumns();
          if (maxCols < 10) {
            usersSheet.insertColumnsAfter(maxCols, 10 - maxCols);
            usersSheet.getRange(1, 10).setValue('IsUploader');
          }
          usersSheet.getRange(i + 1, 10).setValue(newStatus ? 'TRUE' : 'FALSE');
          SpreadsheetApp.flush();
          return outputJson({ status: 'success', message: 'Status uploader diperbarui' });
        }
      }
      return outputJson({ status: 'error', message: 'User tidak ditemukan' });
    }
    
    // ==========================================
    // LOGIKA CREATE UPLOAD (UPLOADER → EDITOR TASK)
    // ==========================================
    if (action === 'create_upload') {
      var tipe = payload.tipe || 'pembelajaran'; // 'pembelajaran' | 'podcast'
      var uploadData = payload.data;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // 1. Simpan ke sheet Upload
      var uploadSheetName = tipe === 'podcast' ? 'Upload - Podcast' : 'Upload - Pembelajaran';
      var uploadSheet = ss.getSheetByName(uploadSheetName);
      if (!uploadSheet) {
        uploadSheet = ss.insertSheet(uploadSheetName);
        if (tipe === 'podcast') {
          uploadSheet.appendRow(['ID','Judul Episode','Mata Kuliah','Dosen','Uploader','Raw Video (Link)','Storyboard','Status','Narasumber','Host','Created At']);
        } else {
          uploadSheet.appendRow(['ID','Judul','Mata Kuliah','Dosen','Uploader','Raw Video (Link)','Storyboard','Status','Narasumber','Host','Created At']);
        }
        uploadSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#e2e8f0');
        uploadSheet.setFrozenRows(1);
      }
      var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
      var uploadId = 'UP-' + new Date().getTime();
      uploadSheet.appendRow([
        uploadId,
        uploadData.judul || '',
        uploadData.mataKuliah || '',
        uploadData.dosen || '',
        uploadData.uploader || '',
        uploadData.rawVideo || '',
        uploadData.storyboard || '',
        'Submitted',
        uploadData.narasumber || '',
        uploadData.host || '',
        nowStr
      ]);
      
      // 2. Auto-assign editor (round-robin)
      var usersSheet = initUsersSheet();
      var usersData = usersSheet.getDataRange().getValues();
      var editors = [];
      for (var i = 1; i < usersData.length; i++) {
        if (String(usersData[i][5]).toLowerCase().indexOf('editor video') !== -1) {
          editors.push(String(usersData[i][4]));
        }
      }
      
      var assignedEditor = '';
      if (editors.length > 0) {
        // Hitung task per editor dari sheet EditorTask
        var taskSheetName = tipe === 'podcast' ? 'EditorTask - Podcast' : 'EditorTask - Pembelajaran';
        var taskSheet = ss.getSheetByName(taskSheetName);
        var taskCounts = {};
        editors.forEach(function(e) { taskCounts[e] = 0; });
        if (taskSheet && taskSheet.getLastRow() > 1) {
          var taskData = taskSheet.getDataRange().getValues();
          for (var i = 1; i < taskData.length; i++) {
            var editorCol = String(taskData[i][4] || '');
            if (taskCounts.hasOwnProperty(editorCol)) taskCounts[editorCol]++;
          }
        }
        // Pilih editor dengan task paling sedikit
        var minCount = Infinity;
        editors.forEach(function(e) {
          if (taskCounts[e] < minCount) { minCount = taskCounts[e]; assignedEditor = e; }
        });
      }
      
      // 3. Hitung deadline acak (antara 3 s/d 6 hari kerja dari hari upload)
      var deadline = new Date();
      var addedDays = 0;
      var maxDays = Math.floor(Math.random() * 4) + 3; // 3-6 hari kerja acak
      while (addedDays < maxDays) {
        deadline.setDate(deadline.getDate() + 1);
        var dow = deadline.getDay();
        if (dow !== 0 && dow !== 6) addedDays++; // Lewati Sabtu(6) dan Minggu(0)
      }
      var deadlineStr = Utilities.formatDate(deadline, 'GMT+7', 'yyyy-MM-dd');
      
      // 4. Simpan ke EditorTask
      if (assignedEditor) {
        var taskSheetName = tipe === 'podcast' ? 'EditorTask - Podcast' : 'EditorTask - Pembelajaran';
        var taskSheet = ss.getSheetByName(taskSheetName);
        if (!taskSheet) {
          taskSheet = ss.insertSheet(taskSheetName);
          taskSheet.appendRow(['ID','Upload ID','Judul','Mata Kuliah','Editor','Uploader','Deadline','Status','Raw Video','Storyboard','Hasil Edit','Revisi','Note','Dosen','Narasumber','Host','Created At']);
          taskSheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#e2e8f0');
          taskSheet.setFrozenRows(1);
        }
        var taskId = 'ET-' + new Date().getTime();
        taskSheet.appendRow([
          taskId, uploadId,
          uploadData.judul || '',
          uploadData.mataKuliah || '',
          assignedEditor,
          uploadData.uploader || '',
          deadlineStr,
          'Belum Dikerjakan',
          uploadData.rawVideo || '',
          uploadData.storyboard || '',
          '', '', '',
          uploadData.dosen || '',
          uploadData.narasumber || '',
          uploadData.host || '',
          nowStr
        ]);
      }
      SpreadsheetApp.flush();
      return outputJson({ status: 'success', message: 'Upload berhasil, editor: ' + (assignedEditor || 'belum ada editor'), assignedEditor: assignedEditor, deadline: deadlineStr, uploadId: uploadId });
    }
    
    // ==========================================
    // LOGIKA UPDATE EDITOR TASK
    // ==========================================
    if (action === 'update_editor_task') {
      var tipe = payload.tipe || 'pembelajaran';
      var taskData = payload.data;
      var taskSheetName = tipe === 'podcast' ? 'EditorTask - Podcast' : 'EditorTask - Pembelajaran';
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var taskSheet = ss.getSheetByName(taskSheetName);
      if (!taskSheet) return outputJson({ status: 'error', message: 'Sheet tidak ditemukan' });
      var allData = taskSheet.getDataRange().getValues();
      for (var i = 1; i < allData.length; i++) {
        if (String(allData[i][0]).trim() === String(taskData.id).trim()) {
          if (taskData.status !== undefined) taskSheet.getRange(i + 1, 8).setValue(taskData.status);
          if (taskData.hasilEdit !== undefined) taskSheet.getRange(i + 1, 11).setValue(taskData.hasilEdit);
          if (taskData.revisi !== undefined) taskSheet.getRange(i + 1, 12).setValue(taskData.revisi);
          if (taskData.note !== undefined) taskSheet.getRange(i + 1, 13).setValue(taskData.note);
          SpreadsheetApp.flush();
          return outputJson({ status: 'success', message: 'Task diperbarui' });
        }
      }
      return outputJson({ status: 'error', message: 'Task tidak ditemukan' });
    }
    
    // ==========================================
    // LOGIKA DELETE EDITOR TASK / UPLOAD (ADMIN)
    // ==========================================
    if (action === 'delete_editor_task') {
      var tipe = payload.tipe || 'pembelajaran';
      var taskId = payload.id;
      var taskSheetName = tipe === 'podcast' ? 'EditorTask - Podcast' : 'EditorTask - Pembelajaran';
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var taskSheet = ss.getSheetByName(taskSheetName);
      if (!taskSheet) return outputJson({ status: 'error', message: 'Sheet tidak ditemukan' });
      var allData = taskSheet.getDataRange().getValues();
      for (var i = 1; i < allData.length; i++) {
        if (String(allData[i][0]).trim() === String(taskId).trim()) {
          taskSheet.deleteRow(i + 1);
          return outputJson({ status: 'success', message: 'Task dihapus' });
        }
      }
      return outputJson({ status: 'error', message: 'ID tidak ditemukan' });
    }
    
    // ==========================================
    // LOGIKA JURNAL KKN ADMIN (UPDATE & DELETE LINTAS USER)
    // ==========================================
    if (action === 'admin_update_jurnal') {
      var data = payload.data;
      var sheetName = payload.sheetName;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return outputJson({ status: 'error', message: 'Sheet tidak ditemukan' });
      var allData = sheet.getDataRange().getValues();
      for (var i = 1; i < allData.length; i++) {
        if (String(allData[i][0]).trim() === String(data.id).trim()) {
          sheet.getRange(i + 1, 2).setValue(data.tanggal || allData[i][1]);
          sheet.getRange(i + 1, 3).setValue(data.jam || allData[i][2]);
          sheet.getRange(i + 1, 4).setValue(data.durasi || allData[i][3]);
          sheet.getRange(i + 1, 5).setValue(data.uraian || allData[i][4]);
          SpreadsheetApp.flush();
          return outputJson({ status: 'success', message: 'Jurnal diperbarui' });
        }
      }
      return outputJson({ status: 'error', message: 'ID tidak ditemukan' });
    }
    
    if (action === 'admin_delete_jurnal') {
      var jurnalId = payload.id;
      var sheetName = payload.sheetName;
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return outputJson({ status: 'error', message: 'Sheet tidak ditemukan' });
      var allData = sheet.getDataRange().getValues();
      for (var i = 1; i < allData.length; i++) {
        if (String(allData[i][0]).trim() === String(jurnalId).trim()) {
          sheet.deleteRow(i + 1);
          return outputJson({ status: 'success', message: 'Jurnal dihapus' });
        }
      }
      return outputJson({ status: 'error', message: 'ID tidak ditemukan' });
    }
    
    if (action === 'sync_jurnal') {
      var sheetName = payload.sheetName || "Jurnal - Mahasiswa";
      var list = payload.list || [];
      var meta = payload.meta || {};
      
      var sheet = ss.getSheetByName(sheetName);
      var headers = [
        "ID", "Tanggal", "Jam Shift", "Durasi", "Uraian Kegiatan", "Nama Mahasiswa", "NIM", "Prodi", "Periode", "Last Updated"
      ];
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
        sheet.setFrozenRows(1);
      } else {
        // Self-healing columns: pastikan jumlah kolom minimal 10 sebelum getRange
        var maxCols = sheet.getMaxColumns();
        if (maxCols < 10) {
          sheet.insertColumnsAfter(maxCols, 10 - maxCols);
        } else if (maxCols > 10) {
          sheet.deleteColumns(11, maxCols - 10);
        }
        
        // Self-healing header: perbaiki jika header salah
        var col3 = String(sheet.getRange(1, 3).getValue() || "").trim();
        if (col3 !== "Jam Shift") {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
        }
      }
      
      // Aman dari error "Cannot freeze all rows" di Google Sheets
      // Pertama, pastikan sheet memiliki ruang yg cukup dengan membersihkan data lama
      var maxRows = sheet.getMaxRows();
      if (maxRows > 1) {
        sheet.getRange(2, 1, maxRows - 1, 10).clearContent();
      }
      
      if (list.length > 0) {
        // Cek jika jumlah list lebih besar dari baris yang tersedia (maxRows - 1)
        var neededRows = list.length;
        var availableRows = maxRows - 1;
        if (neededRows > availableRows) {
          sheet.insertRowsAfter(maxRows, neededRows - availableRows);
        }
        
        var nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
        var rows = [];
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          rows.push([
            String(item.id || ("J-" + (i + 1))),
            String(item.tanggal || ""),
            String(item.jam || ""),
            String(item.durasi || ""),
            String(item.uraian || ""),
            String(meta.nama || ""),
            String(meta.nim || ""),
            String(meta.prodi || ""),
            String(meta.periode || ""),
            nowStr
          ]);
        }
        sheet.getRange(2, 1, rows.length, 10).setValues(rows);
        
        // Buang baris sisa yang tidak terpakai jika ada
        var currentMax = sheet.getMaxRows();
        var targetMax = list.length + 1;
        if (currentMax > targetMax) {
          sheet.deleteRows(targetMax + 1, currentMax - targetMax);
        }
      } else {
        // Jika jurnal dikosongkan/dihapus semua oleh user, buang baris berlebih sisakan 1 baris kosong
        var currentMax = sheet.getMaxRows();
        if (currentMax > 2) {
          sheet.deleteRows(3, currentMax - 2);
        }
      }
      return outputJson({ status: "success", message: "Jurnal berhasil disinkronkan", count: list.length });
    }
    
    // ==========================================
    // LOGIKA BANK MATERIAL & RAW ASSETS SYNC
    // ==========================================
    if (action === 'sync_aset_video') {
      var sheetNameAset = "Bank Material & RAW";
      var list = payload.list || [];
      var sheet = ss.getSheetByName(sheetNameAset);
      var headers = [
        "ID", "Nama Material", "Kategori", "Format", "Ukuran", "Link Google Drive", "Deskripsi", "Uploader", "Tanggal Dibuat", "Last Updated"
      ];
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetNameAset);
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e0f2fe");
        sheet.setFrozenRows(1);
      }
      
      var maxRows = sheet.getMaxRows();
      if (maxRows > 1) {
        sheet.getRange(2, 1, maxRows - 1, headers.length).clearContent();
      }
      
      if (list.length > 0) {
        if (list.length > (maxRows - 1)) {
          sheet.insertRowsAfter(maxRows, list.length - (maxRows - 1));
        }
        var nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        var rows = [];
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          rows.push([
            String(item.id || ("ASET-" + (i + 1))),
            String(item.nama || ""),
            String(item.kategori || ""),
            String(item.format || ""),
            String(item.size || ""),
            String(item.driveUrl || ""),
            String(item.deskripsi || ""),
            String(item.uploader || "Admin"),
            String(item.createdAt || nowStr),
            nowStr
          ]);
        }
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      return outputJson({ status: "success", message: "Bank Material berhasil disinkronkan", count: list.length });
    }
    
    // ==========================================
    // LOGIKA CONTENT PLAN
    // ==========================================
    if (action === 'create_sheet') {
      if (!ss.getSheetByName(sheetName)) {
        var newSheet = ss.insertSheet(sheetName);
        var headers = [
          "ID", "Tanggal", "Platform", "Judul", "Isi", "Content Pillar", "Value", "PIC",
          "Status", "Link Desain", "Link Publikasi", "Tanggal Publikasi", "SKP/KKN", "CTA", "Hashtag", "Caption", "Foto Bukti", "Kolaborator", "Request Kolaborasi"
        ];
        newSheet.appendRow(headers);
        newSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
        newSheet.setFrozenRows(1);
      }
      return outputJson({ status: "success", message: "Sheet dibuat", sheetName: sheetName });
    }
    
    if (action === 'create' || action === 'update' || action === 'delete') {
      var sheet = ss.getSheetByName(sheetName);
      
      // Auto-create Content Plan sheet jika belum ada saat melakukan operasi Create/Update/Delete
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        var headers = [
          "ID", "Tanggal", "Platform", "Judul", "Isi", "Content Pillar", "Value", "PIC",
          "Status", "Link Desain", "Link Publikasi", "Tanggal Publikasi", "SKP/KKN", "CTA", "Hashtag", "Caption", "Foto Bukti", "Kolaborator", "Request Kolaborasi"
        ];
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
        sheet.setFrozenRows(1);
      }
      
      if (action === 'create') {
        var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var headers = migrateHeaders(sheet, currentHeaders);

        if (data.FotoBuktiBase64) {
          data["Foto Bukti"] = uploadEvidencePhoto(data.FotoBuktiBase64, data.Judul, new Date());
        }
        
        var rowData = [];
        for (var i = 0; i < headers.length; i++) {
          var key = headers[i];
          rowData.push(data[key] || "");
        }
        sheet.appendRow(rowData);
        return outputJson({ status: "success", message: "Data dibuat" });
      }
      
      if (action === 'update') {
        var fullData = sheet.getDataRange().getValues();
        var headers = migrateHeaders(sheet, fullData[0]);
        // Reload fullData untuk mengakomodasi kolom baru jika ada migrasi
        fullData = sheet.getDataRange().getValues();
        
        var idIndex = headers.indexOf("ID");
        
        if (data.FotoBuktiBase64) {
          data["Foto Bukti"] = uploadEvidencePhoto(data.FotoBuktiBase64, data.Judul, new Date());
        }
        
        for (var i = 1; i < fullData.length; i++) {
          // Gunakan String() dan trim() untuk menghindari bug === (number vs string dan spasi berlebih)
          if (String(fullData[i][idIndex]).trim() === String(data.ID).trim()) {
            var rowData = [];
            for (var j = 0; j < headers.length; j++) {
              var key = headers[j];
              // Jika ada nilai baru dari payload, gunakan itu. Jika tidak, gunakan nilai lama.
              rowData.push(data[key] !== undefined ? data[key] : fullData[i][j]);
            }
            sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
            return outputJson({ status: "success", message: "Data diperbarui" });
          }
        }
        return outputJson({ status: "error", message: "ID tidak ditemukan" });
      }
      
      if (action === 'delete') {
        var fullData = sheet.getDataRange().getValues();
        var idIndex = fullData[0].indexOf("ID");
        
        for (var i = 1; i < fullData.length; i++) {
          if (String(fullData[i][idIndex]).trim() === String(data.ID).trim()) {
            sheet.deleteRow(i + 1);
            return outputJson({ status: "success", message: "Data dihapus" });
          }
        }
        return outputJson({ status: "error", message: "ID tidak ditemukan" });
      }
    }

    return outputJson({ status: "error", message: "Action doPost tidak dikenal" });
  } catch (err) {
    return outputJson({ status: "error", message: err.toString() });
  }
}

function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// HELPER CONTENT PLAN
// ==========================================
function migrateHeaders(sheet, currentHeaders) {
  var headers = currentHeaders.slice(); // Copy array
  var changed = false;

  // 1. Rename 'Pilar' to 'Content Pillar'
  var pilarIdx = headers.indexOf("Pilar");
  if (pilarIdx !== -1) {
    headers[pilarIdx] = "Content Pillar";
    changed = true;
  }
  
  // 2. Tambahkan kolom yang hilang
  var requiredColumns = ["Value", "CTA", "Hashtag", "Caption", "Foto Bukti", "Kolaborator", "Request Kolaborasi"];
  for (var i = 0; i < requiredColumns.length; i++) {
    if (headers.indexOf(requiredColumns[i]) === -1) {
      headers.push(requiredColumns[i]);
      changed = true;
    }
  }

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
  }
  return headers;
}

// ==========================================
// HELPER DATABASE (RBAC & PENGGUNA)
// ==========================================
function initUsersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  
  // Jika belum ada, atau jika masih menggunakan data lama, otomatis re-init
  if (!sheet || sheet.getRange(2, 2).getValue() === "abdullatif" || sheet.getLastRow() < 46 || sheet.getRange(1, 9).getValue() !== "WhatsApp" || sheet.getLastRow() < 47) {
    if (sheet) sheet.clear();
    else sheet = ss.insertSheet("Users");
    
    var header = ["ID", "Username", "Password", "Role", "Nama Lengkap", "Kelompok", "NIM", "Fakultas", "WhatsApp"];
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
    
    // Buat akun admin default
    sheet.appendRow(["U-001", "admin", "admin123", "Super Admin", "Administrator Sistem", "-", "-", "-", "-"]);
    // Buat akun mahasiswa (Volunteer) dari Master Data Akun
    sheet.appendRow(["U-002", "2384110102", "2384110102pipd", "Mahasiswa", "Siti Hamidah", "Mentor Fotografer/Videografer", "2384110102", "FDKI", "6281320995472"]);
    sheet.appendRow(["U-003", "2381020029", "2381020029pipd", "Mahasiswa", "Auliya Rahmi", "Mentor Fotografer/Videografer", "2381020029", "FITK", "62895404577828"]);
    sheet.appendRow(["U-004", "2381030113", "2381030113pipd", "Mahasiswa", "M. Surya Fadlilah Ramadhan", "Mentor Desain Grafis", "2381030113", "FITK", "6282185090756"]);
    sheet.appendRow(["U-005", "2385150043", "2385150043pipd", "Mahasiswa", "Rizki Faturohman", "Editor Video", "2385150043", "FUA", "6281394301290"]);
    sheet.appendRow(["U-006", "2485150040", "2485150040pipd", "Mahasiswa", "Muhammad Adam Habibie", "Editor Video", "2485150040", "FUA", "6289526573241"]);
    sheet.appendRow(["U-007", "2530212139", "2530212139pipd", "Mahasiswa", "Muhammad Lazuardi Ramadhani", "Editor Video", "2530212139", "FASYA", "6289699062022"]);
    sheet.appendRow(["U-008", "2384110019", "2384110019pipd", "Mahasiswa", "Azza Taqiuddin Mubarok", "Editor Video", "2384110019", "FDKI", "6285624891772"]);
    sheet.appendRow(["U-009", "2484110062", "2484110062pipd", "Mahasiswa", "Abdul Karim", "Editor Video", "2484110062", "FDKI", "6282240227905"]);
    sheet.appendRow(["U-010", "2481020044", "2481020044pipd", "Mahasiswa", "Muhammad Rafly Maulana", "Editor Video", "2481020044", "FITK", "6285281742740"]);
    sheet.appendRow(["U-011", "2530113072", "2530113072pipd", "Mahasiswa", "Amirul Abdillah Hakim", "Editor Video", "2530113072", "FITK", "6285784215990"]);
    sheet.appendRow(["U-012", "2385140026", "2385140026pipd", "Mahasiswa", "M Rizki Maulana", "Editor Video", "2385140026", "FUA", "6285712221459"]);
    sheet.appendRow(["U-013", "2530214029", "2530214029pipd", "Mahasiswa", "Ahmad Sakhi Habibi Habibi", "Editor Video", "2530214029", "FEBI", "6281214677120"]);
    sheet.appendRow(["U-014", "2484120001", "2484120001pipd", "Mahasiswa", "Cahyo Ferdhinan", "Editor Video", "2484120001", "FDKI", "6285281661009"]);
    sheet.appendRow(["U-015", "2385160011", "2385160011pipd", "Mahasiswa", "Dwi Juniarti Mirwandini", "Editor Video", "2385160011", "FUA", "6283829812717"]);
    sheet.appendRow(["U-016", "2485150027", "2485150027pipd", "Mahasiswa", "Lu’Lu Atul Ainiyah", "Editor Video", "2485150027", "FUA", "6287717776727"]);
    sheet.appendRow(["U-017", "248411098", "2484110098pipd", "Mahasiswa", "Naura Azzahra Akhmadi Tadjwid", "Editor Video", "2484110098", "FDKI", "59992"]);
    sheet.appendRow(["U-018", "2384110028", "2384110028pipd", "Mahasiswa", "Anjani Yuniarti", "Editor Video", "2384110028", "FDKI", "6288296942555"]);
    sheet.appendRow(["U-019", "2481070078", "2481070078pipd", "Mahasiswa", "Zalfa Nabila", "Editor Video", "2481070078", "FITK", "6285759120697"]);
    sheet.appendRow(["U-020", "2481100066", "2481100066pipd", "Mahasiswa", "Nabila Ainurrahmah", "Editor Video", "2481100066", "FITK", "6282117874268"]);
    sheet.appendRow(["U-021", "2481030090", "2481030090pipd", "Mahasiswa", "Masya Islamiah", "Editor Video", "2481030090", "FITK", "6285213960989"]);
    sheet.appendRow(["U-022", "2381050016", "2381050016pipd", "Mahasiswa", "Hanny Habibah Olansya Iyanuarinka", "Editor Video", "2381050016", "FITK", "62895357410822"]);
    sheet.appendRow(["U-023", "2385160005", "2385160005pipd", "Mahasiswa", "Sri Wulan Apriliyanti", "Editor Video", "2385160005", "FUA", "6283898112912"]);
    sheet.appendRow(["U-024", "2481020072", "2481020072pipd", "Mahasiswa", "Nurul Ramadhani", "Editor Video", "2481020072", "FITK", "6285786451894"]);
    sheet.appendRow(["U-025", "2484110049", "2484110049pipd", "Mahasiswa", "Fajar Nur Sidik", "Desain Grafis", "2484110049", "FDKI", "6282119887267"]);
    sheet.appendRow(["U-026", "2381020039", "2381020039pipd", "Mahasiswa", "Farhan Hilmy Mubaarok", "Desain Grafis", "2381020039", "FITK", "6285863803454"]);
    sheet.appendRow(["U-027", "2481020059", "2481020059pipd", "Mahasiswa", "Nur Sahid", "Desain Grafis", "2481020059", "FITK", "6285860263428"]);
    sheet.appendRow(["U-028", "2485130003", "2485130003pipd", "Mahasiswa", "Sofiyatul Zannah", "Desain Grafis", "2485130003", "FUA", "6285659650109"]);
    sheet.appendRow(["U-029", "2488010075", "2488010075pipd", "Mahasiswa", "Irfan Mubarok", "Operator Podcast", "2488010075", "FITK", "6283804339441"]);
    sheet.appendRow(["U-030", "2381020012", "2381020012pipd", "Mahasiswa", "Dadan Danu", "Operator Podcast", "2381020012", "FITK", "6282130270591"]);
    sheet.appendRow(["U-031", "2384110127", "2384110127pipd", "Mahasiswa", "Syarif Abdurohman", "Operator Podcast", "2384110127", "FDKI", "6281464438982"]);
    sheet.appendRow(["U-032", "2484110038", "2484110038pipd", "Mahasiswa", "Aminah Amna", "Operator Podcast", "2484110038", "FDKI", "6281573092061"]);
    sheet.appendRow(["U-033", "2481070044", "2481070044pipd", "Mahasiswa", "Ziyah Nujumul Inayah", "Operator Podcast", "2481070044", "FITK", "6283128975681"]);
    sheet.appendRow(["U-034", "2485130001", "2485130001pipd", "Mahasiswa", "Daffa Luthfillah", "Fotografer/Videografer", "2485130001", "FUA", "6289513586162"]);
    sheet.appendRow(["U-035", "2384110065", "2384110065pipd", "Mahasiswa", "Faiz Abdur Rojib", "Fotografer/Videografer", "2384110065", "FDKI", "6285722454077"]);
    sheet.appendRow(["U-036", "2384130156", "2384130156pipd", "Mahasiswa", "Devina Nuramalina", "Fotografer/Videografer", "2384130156", "FDKI", "6281288089413"]);
    sheet.appendRow(["U-037", "2384110089", "2384110089pipd", "Mahasiswa", "Nisa Nurmalasari", "Fotografer/Videografer", "2384110089", "FDKI", "62859113502878"]);
    sheet.appendRow(["U-038", "2481040056", "2481040056pipd", "Mahasiswa", "Regar Herlambang", "Fotografer/Videografer", "2481040056", "FITK", "6283824015255"]);
    sheet.appendRow(["U-039", "2385160025", "2385160025pipd", "Mahasiswa", "Rosiana Sari", "Fotografer/Videografer", "2385160025", "FUA", "6282110788902"]);
    sheet.appendRow(["U-040", "2482130116", "2482130116pipd", "Mahasiswa", "Tathia Putri Inasyah", "Operator Podcast", "2482130116", "FEBI", "62895320385097"]);
    sheet.appendRow(["U-041", "2384130064", "2384130064pipd", "Mahasiswa", "Muslikah Anggrayni", "Operator Podcast", "2384130064", "FDKI", "6288229226535"]);
    sheet.appendRow(["U-042", "2484110015", "2484110015pipd", "Mahasiswa", "Siti Rokhiya", "Operator Podcast", "2484110015", "FDKI", "6283890093451"]);
    sheet.appendRow(["U-043", "2384110098", "2384110098pipd", "Mahasiswa", "Eva Sulastri", "Operator Podcast", "2384110098", "FDKI", "6285880889338"]);
    sheet.appendRow(["U-044", "2384110132", "2384110132pipd", "Mahasiswa", "Laila Ulfatur Rahmah", "Fotografer/Videografer", "2384110132", "FDKI", "6281398066380"]);
    sheet.appendRow(["U-045", "2384110067", "2384110067pipd", "Mahasiswa", "Abdullatif Fuadi", "Fotografer/Videografer", "2384110067", "FDKI", "6289524003090"]);
    sheet.appendRow(["U-046", "2481030078", "2481030078pipd", "Mahasiswa", "Aisy Luthfia Dwi Rifani", "Desain Grafis", "2481030078", "FITK", "-"]);
    sheet.appendRow(["U-047", "2481030045", "2481030045pipd", "Mahasiswa", "Muthie’ah Umuril Adyan", "Desain Grafis", "2481030045", "FITK", "6282119230456"]);
    SpreadsheetApp.flush(); // Pastikan data tersimpan sebelum dibaca
  }
  return sheet;
}

// ==========================================
// HELPER ABSENSI
// ==========================================
function getAbsensiSheetName() {
  var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var now = new Date();
  return "Absensi " + months[now.getMonth()] + " " + now.getFullYear();
}

function initAbsensiSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = getAbsensiSheetName();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var header = ["Timestamp", "Nama", "NIM", "Divisi", "Semester", "Fakultas", "Jurusan", "WhatsApp", "Lokasi", "Koordinat", "Foto (URL)", "Notulensi"];
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveAttendance(data) {
  var sheet = initAbsensiSheet();
  var now = new Date();
  var fotoUrl = "Tidak ada foto";
  
  if (data.foto && data.foto.includes("base64")) {
    fotoUrl = uploadPhoto(data.foto, data.nama, now);
  }
  
  var rowData = [
    now,
    data.nama,
    "'" + data.nim,
    data.jabatan,
    data.semester,
    data.fakultas,
    data.jurusan,
    data.wa,
    data.lokasi,
    data.lat + "," + data.lon,
    fotoUrl,
    data.notulensi
  ];
  
  sheet.appendRow(rowData);
  return {
    nama: data.nama,
    waktu: Utilities.formatDate(now, "GMT+7", "HH:mm:ss")
  };
}

function getSubFolder(parentFolderId, subFolderName) {
  var parentFolder;
  if (parentFolderId && String(parentFolderId).trim() !== "") {
    try {
      parentFolder = DriveApp.getFolderById(String(parentFolderId).trim());
    } catch (err) {
      Logger.log("Folder ID khusus tidak ditemukan / tidak ada akses: " + err.toString());
      parentFolder = null;
    }
  }

  // Fallback otomatis jika folder ID kosong atau tidak valid:
  if (!parentFolder) {
    var rootFolders = DriveApp.getRootFolder().getFoldersByName("VoLABS PIPD");
    if (rootFolders.hasNext()) {
      parentFolder = rootFolders.next();
    } else {
      parentFolder = DriveApp.getRootFolder().createFolder("VoLABS PIPD");
      parentFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  }

  var folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var newSub = parentFolder.createFolder(subFolderName);
    newSub.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newSub;
  }
}

function uploadPhoto(base64Data, nama, dateObj) {
  try {
    var folder = getSubFolder(MAIN_FOLDER_ID, "Absensi");
    
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
    var fileName = "Absen_" + nama.replace(/[^a-zA-Z0-9]/g, "_") + "_" + Utilities.formatDate(dateObj, "GMT+7", "yyyyMMdd_HHmm") + ".jpg";
    
    var blob = Utilities.newBlob(decodedData, contentType, fileName);
    var file = folder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("Gagal upload foto absen: " + err.toString());
    return "Gagal upload: " + err.toString();
  }
}

function uploadEvidencePhoto(base64Data, judul, dateObj) {
  try {
    var folder = getSubFolder(MAIN_FOLDER_ID, "Foto Bukti Konten");
    
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
    var safeJudul = judul ? judul.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30) : "Konten";
    var fileName = "Bukti_" + safeJudul + "_" + Utilities.formatDate(dateObj, "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
    
    var blob = Utilities.newBlob(decodedData, contentType, fileName);
    var file = folder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("Gagal upload bukti konten: " + err.toString());
    return "Gagal upload bukti: " + err.toString();
  }
}

function getTodayAbsensiData() {
  var sheet = initAbsensiSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Hanya header
  
  var today = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var result = [];
  
  // Baca dari bawah ke atas agar data terbaru di atas
  for (var i = data.length - 1; i > 0; i--) {
    var row = data[i];
    if(!row[0]) continue;
    var rowDate = new Date(row[0]);
    var rowDateStr = Utilities.formatDate(rowDate, "GMT+7", "yyyy-MM-dd");
    
    // Hanya ambil data hari ini
    if (rowDateStr === today) {
      result.push({
        waktu: Utilities.formatDate(rowDate, "GMT+7", "HH:mm"),
        nama: row[1],
        divisi: row[3],
        foto: row[10],
        notulensi: row[11]
      });
    }
  }
  
  return result;
}