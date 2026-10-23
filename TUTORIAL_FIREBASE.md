# Panduan Lengkap Setup Database Firebase (Cloud Firestore)
## VoLABS PIPD (Single Page Application)

Dokumen ini merupakan panduan lengkap langkah demi langkah untuk mengonfigurasi dan mengaktifkan database **Google Cloud Firestore (Firebase)** pada aplikasi **VoLABS PIPD**.

Kini aplikasi VoLABS PIPD telah **sepenuhnya bermigrasi ke Firebase Firestore** sebagai database utama. Google Apps Script (GAS) **hanya digunakan khusus untuk mengunggah dan menyimpan file foto absensi ke Google Drive**. Seluruh penarikan data yang sebelumnya menyebabkan *loading skeleton* yang lama telah dibersihkan, sehingga aplikasi berjalan sangat cepat (**0ms instant load**) dengan sinkronisasi **real-time**.

---

### Daftar Isi
1. [Langkah 1: Membuat Proyek Firebase Baru](#langkah-1-membuat-proyek-firebase-baru)
2. [Langkah 2: Mengaktifkan Cloud Firestore Database](#langkah-2-mengaktifkan-cloud-firestore-database)
3. [Langkah 3: Mengonfigurasi Security Rules Firestore](#langkah-3-mengonfigurasi-security-rules-firestore)
4. [Langkah 4: Mendaftarkan Web App & Mengambil Kunci Konfigurasi](#langkah-4-mendaftarkan-web-app--mengambil-kunci-konfigurasi)
5. [Langkah 5: Memasang Konfigurasi ke Aplikasi](#langkah-5-memasang-konfigurasi-ke-aplikasi)
6. [Struktur Koleksi Database (Firestore Schema)](#struktur-koleksi-database-firestore-schema)
7. [Penjelasan Fitur Baru yang Telah Disinkronkan](#penjelasan-fitur-baru-yang-telah-disinkronkan)
8. [Verifikasi & Pengujian](#verifikasi--pengujian)

---

## Langkah 1: Membuat Proyek Firebase Baru

1. Buka browser dan buka konsol Firebase di: **[https://console.firebase.google.com/](https://console.firebase.google.com/)**.
2. Masuk menggunakan akun Google Anda.
3. Klik tombol **"Add project"** (atau **"Tambahkan proyek"**).
4. Masukkan nama proyek yang diinginkan, misalnya: `volabs-pipd`.
5. Klik **Continue**.
6. Pada opsi *Google Analytics*, Anda dapat memilih menonaktifkannya (*Disable*) atau membiarkannya aktif, kemudian klik **Create project**.
7. Tunggu beberapa saat hingga proses pembuatan proyek selesai, lalu klik **Continue**.

---

## Langkah 2: Mengaktifkan Cloud Firestore Database

1. Pada sidebar navigasi sebelah kiri di Firebase Console, buka menu **Build** > **Firestore Database**.
2. Klik tombol **"Create database"** (Buat database).
3. **Database location:** Pilih lokasi server yang paling dekat dengan Indonesia, misalnya `asia-southeast2` (Jakarta) atau `asia-southeast1` (Singapura). Klik **Next**.
4. **Security rules:** Pilih opsi **"Start in test mode"** (Mulai dalam mode pengujian) agar aplikasi dapat langsung membaca dan menulis data tanpa hambatan autentikasi awal.
5. Klik **Create** / **Enable** dan tunggu beberapa detik sampai database siap digunakan.

---

## Langkah 3: Mengonfigurasi Security Rules Firestore

Agar seluruh modul (Rencana Konten, Pelaporan, Absensi, Jurnal KKN, dan Studio Video) dapat melakukan operasi baca dan tulis secara real-time:

1. Pada halaman Firestore Database di Firebase Console, klik tab **Rules** (di sebelah tab Data).
2. Hapus seluruh isi yang ada dan ganti dengan aturan berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Memberikan izin baca dan tulis ke seluruh koleksi sistem VoLABS PIPD
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Klik tombol **Publish** di sudut kanan atas untuk menerapkan aturan tersebut.

---

## Langkah 4: Mendaftarkan Web App & Mengambil Kunci Konfigurasi

1. Klik ikon **Gerigi (Project settings)** di samping menu *Project Overview* pada pojok kiri atas.
2. Gulir ke bawah hingga menemukan bagian **"Your apps"** (Aplikasi Anda).
3. Klik ikon web **`</>`** untuk menambahkan aplikasi web.
4. Masukkan nama aplikasi, contoh: `VoLABS Web App`.
5. Kosongkan centang *Firebase Hosting* (opsional), lalu klik **Register app**.
6. Firebase akan menampilkan potongan kode JavaScript yang berisi objek konfigurasi `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "volabs-pipd.firebaseapp.com",
  projectId: "volabs-pipd",
  storageBucket: "volabs-pipd.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

7. Salin seluruh nilai konfigurasi tersebut.

---

## Langkah 5: Memasang Konfigurasi ke Aplikasi

Tersedia **2 cara mudah** untuk memasang konfigurasi Firebase ke dalam aplikasi:

### Cara A: Edit File Kode Sumber (Permanen di Codebase)
1. Buka file `src/services/firebase.js`.
2. Temukan variabel `DEFAULT_FIREBASE_CONFIG` di bagian atas (sekitar baris 5-12):
```javascript
export const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
    projectId: "GANTI_DENGAN_PROJECT_ID",
    storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
    messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID",
    appId: "GANTI_DENGAN_APP_ID"
};
```
3. Tempelkan nilai asli dari Langkah 4 ke dalam objek tersebut.
4. Simpan file (`Cmd + S` atau `Ctrl + S`).

### Cara B: Mengatur Dinamis Melalui Browser Console (Tanpa Edit File)
1. Buka aplikasi VoLABS PIPD di browser Anda.
2. Tekan `F12` atau klik kanan > **Inspect** > tab **Console**.
3. Ketikkan perintah berikut dengan konfigurasi Firebase Anda:
```javascript
setFirebaseConfig({
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "volabs-pipd.firebaseapp.com",
  projectId: "volabs-pipd",
  storageBucket: "volabs-pipd.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
});
```
4. Tekan **Enter**. Halaman akan otomatis memuat ulang dan langsung terhubung ke project Firebase Anda.

---

## Struktur Koleksi Database (Firestore Schema)

Database Firestore mengelola data melalui koleksi-koleksi berikut secara otomatis:

| Koleksi | Deskripsi & Isi Dokumen |
| :--- | :--- |
| `content_plans` | Dokumen rencana konten (`ID`, `Tanggal`, `Platform`, `Content Pillar`, `Value`, `Judul`, `Isi`, `Hashtag`, `CTA`, `Status`, `PIC`, `Kolaborator`, `Link Publikasi`, `Foto Bukti`, `createdAt`, `updatedAt`). |
| `studio_tasks` | Dokumen penugasan editing video (`id`, `tipe`, `judul`, `mataKuliah/episode`, `dosen/narasumber`, `editor`, `uploader`, `deadline`, `status`, `rawVideo`, `storyboard`, `hasilEdit`, `revisi`, `note`, `createdAt`). |
| `absensi` | Dokumen absensi harian volunteer (`id`, `nama`, `nim`, `divisi`, `semester`, `fakultas`, `jurusan`, `wa`, `foto`, `lat`, `lon`, `lokasi`, `notulensi`, `waktu`, `tanggal`, `timestamp`). |
| `jurnal_kkn` | Dokumen catatan kegiatan pengabdian KKN (`id`, `nama`, `nim`, `tanggal`, `jam`, `durasi`, `uraian`, `createdAt`, `updatedAt`). |
| `app_settings` | Pengaturan sistem: dokumen `uploaders` (daftar nama uploader aktif), dokumen `editors` (daftar editor video aktif), dan dokumen `aset_video` (bank material mentah). |

---

## Penjelasan Fitur Baru yang Telah Disinkronkan

Sesuai permintaan pembaruan sistem:

1. **Pembersihan Loading Skeleton & Latensi GAS**:
   - Penarikan data rencana konten dan absensi melalui Google Apps Script yang sebelumnya menimbulkan jeda loading dan skeleton shimmer telah dinonaktifkan.
   - Aplikasi menggunakan **local storage cache berkecepatan 0ms** saat pertama kali dibuka, kemudian Firestore menyinkronkan data terbaru di latar belakang (*seamless real-time sync*).
   - Google Apps Script kini murni difungsikan untuk menerima kiriman foto absensi guna diarsipkan ke Google Drive.

2. **Filter Bulan & Pengurutan Fleksibel pada Rencana Konten**:
   - **Filter Bulan (`filter-month`)**: Memungkinkan memfilter konten berdasarkan bulan tertentu (Januari hingga Desember) atau menampilkan semua bulan.
   - **Default Sort (`filter-sort`)**: Secara bawaan konten diurutkan dari **yang terbaru ditambahkan** (`createdAt` descending).
   - **Pilihan Sort Lengkap**:
     - *Urut: Terbaru Ditambahkan*
     - *Urut: Terlama Ditambahkan*
     - *Tanggal Tayang (Terbaru)*
     - *Tanggal Tayang (Terlama)*
     - *Judul Konten (A - Z)*
     - *Judul Konten (Z - A)*
     - *Nama PIC (A - Z)*
   - **Filter PIC Dinamis**: Menampilkan seluruh 46 anggota volunteer VoLABS secara alfabetis.

3. **Sinkronisasi Lengkap Menu Pelaporan**:
   - Seluruh pekerjaan volunteer kini terakumulasi otomatis, menggabungkan **Rencana Konten** (desain, penulisan, podcast) dan **Hasil Editing Video** dari Studio Editor (`state.allEditorTasks`).
   - Filter PIC di Pelaporan telah memuat seluruh 46 nama volunteer dari `dataVolunteer`.
   - Tombol evidence menampilkan tautan hasil publikasi, hasil video final, maupun bahan video RAW.
   - Cetak Laporan (PDF & DOC Word) otomatis menyertakan seluruh output tugas konten dan tugas editing video volunteer secara terpadu.

4. **Dasbor & Alur Produksi**:
   - Metrik statistik, grafik donut platform, dan pembagian pilar konten pada Dasbor otomatis tersinkronisasi saat ada data baru dari Firestore.

---

## Verifikasi & Pengujian

Untuk memastikan Firebase telah terhubung dengan benar:

1. Buka aplikasi VoLABS PIPD di browser.
2. Buka Console Browser (`F12`).
3. Anda akan melihat log:
   ```text
   Firebase Cloud Firestore berhasil terhubung ke project: volabs-pipd
   ```
4. Tambah rencana konten baru di menu **Rencana Konten**.
5. Buka tab **Firestore Database** di Firebase Console: dokumen baru akan langsung muncul di koleksi `content_plans`.
6. Coba buka aplikasi di perangkat atau jendela incognito lain: konten baru akan otomatis muncul tanpa perlu refresh manual.
