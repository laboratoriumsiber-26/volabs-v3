# VoLabs V.3 - PIPD (Pusat Informasi dan Pangkalan Data)

Platform **Web Application Monolithic (Single Page Application)** untuk pendataan, manajemen absensi geolokasi berserta watermark real-time, dan manajemen rencana konten (Content Plan) dengan arsitektur serverless menggunakan **Google Apps Script (GAS)** dan **Google Spreadsheet**.

---

## 🌟 Fitur Utama

### 1. 📋 Manajemen Absensi Geolocation & Smart Watermark
* **Rasio Kamera Adaptif**: Rasio kamera otomatis menyesuaikan dengan perangkat pengguna (16:9 Landscape untuk Desktop/Laptop dan 9:16 Portrait untuk Smartphone).
* **Dynamic Premium Watermark**: Setiap foto jepretan absensi langsung dilampiri watermark bergradasi elegan bergaya modern dengan logo **VOLABS PIPD**, nama volunteer, divisi, timestamp real-time, dan koordinat geolokasi GPS yang presisi.
* **Wajib GPS**: Sistem mewajibkan aktivasi GPS untuk mengonfirmasi lokasi bertugas di lapangan maupun di kantor.

### 2. 📅 Manajemen Rencana Konten (Content Plan) & Kanban Board
* **Tampilan Dual-Mode**: Mendukung tampilan **Kanban Board** yang ringkas dan efisien ruang, serta tampilan **Tabel Eksekutif**.
* **Kolaborasi & Notifikasi**: Volunteer dapat mengajukan kolaborasi ke anggota tim lain. Anggota yang diajukan akan mendapatkan **badge notifikasi real-time** pada dasbor mereka untuk memberikan *approval* (setuju/tolak).
* **Super Admin Control**: Fitur khusus bagi Super Admin untuk menandai (*checklist*) nama-nama volunteer yang terlibat dalam sebuah konten saat penambahan atau pengeditan data.

### 3. 🔄 Auto-Generate Sheet Bulanan & Auto-Switch Bulan
* **Otomatisasi Backend**: Ketika berganti bulan atau saat pengguna memilih bulan baru, sistem secara otomatis mendeteksi dan membuat sheet baru di Google Spreadsheet (contoh: `Content Plan Agustus 2026` atau `Absensi Agustus 2026`) beserta format header dan styling yang rapi tanpa perlu intervensi admin.
* **Auto-Switch Frontend**: Web aplikasi dilengkapi pelacak bulan real-time. Ketika memasuki bulan baru, sistem otomatis mengalihkan dasbor volunteer ke sheet bulan berjalan tanpa perlu hapus cache atau hard refresh.

### 4. ⚡ Performa & Anti-CORS Architecture
* **No-Preflight CORS**: Komunikasi API dirancang khusus menggunakan standard header dan `cache: "no-store"` disertai timestamp query untuk mencegah error preflight (`OPTIONS`) pada Google Apps Script Web App.
* **Fixed Navigation**: Top Header dan Side/Bottom Navigation dikunci (*fixed positioning*) agar tidak tergeser saat melakukan scroll pada tabel atau kanban.

---

## 📂 Struktur Folder & File

```text
volabs-pipd/
├── index.html              # Frontend utama (Monolithic SPA, HTML5 Canvas Watermark, CSS, & Logic)
├── code.gs                 # Backend API (Google Apps Script untuk manipulasi Google Sheets)
├── manifest.json           # Konfigurasi PWA WebAPK (192x192 & 512x512 icons, pure standalone tanpa badge browser)
├── sw.js                   # Service Worker fisik untuk cache offline & verifikasi WebAPK native murni
├── icon-192.png            # Ikon PWA beresolusi presisi 192x192 PNG (syarat wajib WebAPK Chrome)
├── icon-512.png            # Ikon PWA beresolusi presisi 512x512 PNG (syarat wajib WebAPK Chrome)
├── logo.png                # Aset logo utama VoLabs (brand identity & antarmuka)
├── .gitignore              # Konfigurasi keamanan git (mengecualikan Master Data Akun & kredensial)
├── kop_surat.png           # Aset gambar kop surat untuk keperluan ekspor/laporan
└── README.md               # Dokumen petunjuk penggunaan repositori
```

---

## 🛠️ Panduan Deploy & Instalasi

### Langkah 1: Setup Backend (Google Spreadsheet & GAS)
1. Buat **Google Spreadsheet** baru di Google Drive Anda.
2. Klik menu **Ekstensi > Apps Script**.
3. Hapus kode default yang ada, lalu salin dan tempel seluruh isi file `code.gs` dari repositori ini.
4. Klik tombol **Simpan**, lalu pilih **Terapkan > Deployment baru (New Deployment)**.
5. Pilih jenis deployment **Aplikasi Web (Web App)** dengan pengaturan:
   * **Jalankan sebagai (Execute as)**: *Me (Akun Google Anda)*
   * **Siapa yang memiliki akses (Who has access)**: *Anyone (Siapa saja)*
6. Klik **Terapkan**, izinkan akses akun Google, lalu salin **URL Web App** yang dihasilkan.

### Langkah 2: Setup Frontend (GitHub / Web Hosting)
1. Buka file `index.html`.
2. Cari konstanta `APPS_SCRIPT_URL` (di bagian atas script JS) dan tempelkan **URL Web App** dari Langkah 1.
3. Upload seluruh file web (kecuali `Master Data Akun.html` yang dilindungi `.gitignore`) ke repositori GitHub Anda.
4. Aktifkan **GitHub Pages** (Settings > Pages > Deploy from a branch > `main` / `master`), dan web aplikasi siap digunakan!

---

## 👥 Database Volunteer (Terbaru)
Sudah terintegrasi penuh di dalam sistem web dan Google Spreadsheet, mencakup 46 relawan aktif dengan data terbaru:
* **Aisy Luthfia Dwi Rifani** (NIM: `2481030078`) - *Tadris Bahasa Inggris, FITK (Semester 5) - Divisi Desain Grafis*.
* **Muthie’ah Umuril Adyan** (NIM: `2481030045`) - *Tadris Bahasa Inggris, FITK (Semester 5) - Divisi Desain Grafis*.

---
*© 2026 VoLabs PIPD - Advanced Agentic Coding.*
