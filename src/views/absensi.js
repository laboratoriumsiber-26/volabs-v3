// Absensi View Module (Geotag Watermark Camera, Live Attendance, GPS Reverse Geocoding)
import { state } from '../store/state.js';
import { dataVolunteer } from '../store/initialData.js';
import { api } from '../services/api.js';
import { db, saveAbsensiEntry, getAbsensiList } from '../services/firebase.js';
import { showCustomDialog } from '../utils/dialog.js';
import { getSkeletonAttendance } from '../utils/skeleton.js';

export const absensiTemplate = `
        <section id="view-absensi" class="view-section">
            <style>
                /* Absensi Scoped CSS */
                .absensi-nav-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .absensi-tab-btn {
                    background: transparent;
                    color: var(--text-muted);
                    border: 1px solid var(--border-color);
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .absensi-tab-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .absensi-subview {
                    display: none;
                }

                .absensi-subview.active {
                    display: block;
                }

                .viewport-wrapper {
                    position: relative;
                    width: 100%;
                    min-height: 250px;
                    max-height: 520px;
                    aspect-ratio: 16 / 9;
                    margin: 0 auto;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #0f172a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                @media (max-width: 850px) {
                    .viewport-wrapper {
                        aspect-ratio: 9 / 16;
                        max-height: 480px;
                    }
                }

                .viewport-wrapper video,
                .viewport-wrapper #abs-photo-preview {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .viewport-wrapper video {
                    transform: scaleX(-1);
                    display: none;
                }

                .viewport-wrapper #abs-photo-preview {
                    display: none;
                }

                .cam-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 15px;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
                    color: white;
                    display: none;
                    flex-direction: column;
                    pointer-events: none;
                }

                .att-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 15px;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .att-img {
                    width: 60px;
                    height: 60px;
                    border-radius: 10px;
                    object-fit: cover;
                    border: 1px solid var(--border-color);
                }

                .skeleton {
                    background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-color) 50%, var(--bg-tertiary) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 6px;
                }

                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }

                    100% {
                        background-position: -200% 0;
                    }
                }
            </style>

            <div class="header-section" style="margin-bottom: 20px;">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main);">Kehadiran Volunteer</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Pencatatan & Monitoring Progress Kegiatan</p>
            </div>

            <div class="absensi-nav-tabs">
                <button type="button" id="tab-btn-form" class="absensi-tab-btn active" onclick="switchAbsensiTab('form')">Form Absensi</button>
                <button type="button" id="tab-btn-monitor" class="absensi-tab-btn" onclick="switchAbsensiTab('monitor')">Monitoring Hari Ini</button>
            </div>

            <!-- FORM ABSENSI -->
            <div id="absensi-form" class="absensi-subview active box-card">
                <form id="form-absensi" onsubmit="event.preventDefault(); submitAbsensi();">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Nama Lengkap</label>
                            <input type="text" id="abs-nama" class="form-input" list="list-volunteer"
                                placeholder="Ketik atau pilih nama..." required oninput="handleAbsensiNama()">
                            <datalist id="list-volunteer"></datalist>
                        </div>
                        <div class="form-group">
                            <label>Divisi</label>
                            <input type="text" id="abs-jabatan" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Semester</label>
                            <input type="text" id="abs-semester" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Fakultas</label>
                            <input type="text" id="abs-fakultas" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Jurusan</label>
                            <input type="text" id="abs-jurusan" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>NIM</label>
                            <input type="text" id="abs-nim" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>WhatsApp</label>
                            <div style="display: flex; gap: 8px;">
                                <input class="form-input" value="+62" readonly
                                    style="width:60px; text-align:center; padding: 0.75rem 0.5rem;">
                                <input type="text" id="abs-wa" class="form-input" placeholder="81234..." required
                                    style="flex:1;">
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Notulensi Kegiatan</label>
                            <textarea id="abs-notulensi" class="form-input" rows="3"
                                placeholder="Tuliskan tugas/kegiatan hari ini..." required></textarea>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Bukti Kehadiran (Geotag)</label>
                            <div class="viewport-wrapper">
                                <div id="abs-loading"
                                    style="color:var(--text-muted); font-size:12px; text-align:center;">Kamera Belum
                                    Aktif</div>
                                <video id="abs-video" autoplay playsinline></video>
                                <img id="abs-photo-preview">
                                <div id="abs-overlay" class="cam-overlay">
                                    <div id="abs-time" style="font-size:12px; margin-bottom:2px;"></div>
                                    <div id="abs-coords" style="font-size:10px; color:#60a5fa;"></div>
                                    <div id="abs-address" style="font-size:11px; font-weight:bold; margin-top:3px;">
                                        Mencari lokasi...</div>
                                </div>
                            </div>
                            <div id="abs-action-init" style="margin-top:10px;">
                                <button type="button"
                                    style="width:100%; justify-content:center; padding:12px; font-size:15px; font-weight:600; background: #1f2937; color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;"
                                    onmouseover="this.style.background='#374151'"
                                    onmouseout="this.style.background='#1f2937'" onclick="startKamera()">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path
                                            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z">
                                        </path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    Aktifkan Kamera & GPS
                                </button>
                            </div>
                            <div id="abs-action-cam" style="margin-top:10px; display:none; gap:10px;">
                                <button type="button" class="btn-primary"
                                    style="flex:1; justify-content:center; padding:12px; gap:8px;" onclick="jepretFoto()">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Jepret Foto</span>
                                </button>
                                <button type="button" class="btn-outline"
                                    style="padding:12px; width:48px; justify-content:center;" onclick="toggleKamera()"
                                    title="Putar Kamera">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                                <button type="button" class="btn-danger"
                                    style="padding:12px; width:48px; justify-content:center; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444;"
                                    onclick="stopKamera()" title="Tutup Kamera">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div id="abs-action-retake" style="margin-top:10px; display:none; gap:10px;">
                                <button type="button" class="btn-outline"
                                    style="flex:1; justify-content:center; padding:12px; gap:8px;" onclick="resetFoto()">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Foto Ulang</span>
                                </button>
                                <button type="button" class="btn-danger"
                                    style="padding:12px; width:48px; justify-content:center; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444;"
                                    onclick="stopKamera()" title="Hapus & Tutup">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1; margin-top: 10px;">
                            <button type="submit" id="btn-submit-absensi" class="btn-primary"
                                style="width: 100%; justify-content:center; padding: 12px; font-size: 16px;">Kirim
                                Absensi</button>
                        </div>
                    </div>
                </form>
                <canvas id="abs-canvas" style="display:none;"></canvas>
            </div>

            <!-- MONITORING ABSENSI -->
            <div id="absensi-monitor" class="absensi-subview box-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <h3 style="font-size: 1.1rem; color: var(--text-main);">Daftar Kehadiran Hari Ini</h3>
                    <button class="btn-outline" onclick="loadMonitoring()"
                        style="padding: 6px 12px; font-size: 12px;">Refresh</button>
                </div>
                <div id="absensi-list-container">
                    ${getSkeletonAttendance(3)}
                </div>
            </div>
        </section>

        <!-- SECTION JURNAL HARIAN KKN -->
`;

let absLat = "", absLon = "", absLokasi = "Mencari alamat...", absFotoBase64 = "", absIsFront = true, absStreamObj = null;

export function switchAbsensiTab(tab) {
    const btnForm = document.getElementById("tab-btn-form");
    const btnMonitor = document.getElementById("tab-btn-monitor");
    const viewForm = document.getElementById("absensi-form");
    const viewMonitor = document.getElementById("absensi-monitor");

    if (tab === 'form') {
        if (btnForm) btnForm.classList.add("active");
        if (btnMonitor) btnMonitor.classList.remove("active");
        if (viewForm) {
            viewForm.style.display = "block";
            viewForm.classList.add("active");
        }
        if (viewMonitor) {
            viewMonitor.style.display = "none";
            viewMonitor.classList.remove("active");
        }
    } else {
        if (btnMonitor) btnMonitor.classList.add("active");
        if (btnForm) btnForm.classList.remove("active");
        if (viewForm) {
            viewForm.style.display = "none";
            viewForm.classList.remove("active");
        }
        if (viewMonitor) {
            viewMonitor.style.display = "block";
            viewMonitor.classList.add("active");
        }
        stopKamera();
        loadMonitoring();
    }
}

export function initVolunteerData() {
    const list = document.getElementById("list-volunteer");
    const filterLaporPic = document.getElementById("filter-lapor-pic");
    const printPic = document.getElementById("print-pic");
    const filterPic = document.getElementById("filter-pic");

    if (filterLaporPic) filterLaporPic.innerHTML = '<option value="Semua PIC">-- Semua PIC --</option>';
    if (printPic) printPic.innerHTML = '<option value="Semua PIC">Semua PIC (Kompilasi Seluruh Volunteer)</option>';
    if (filterPic) filterPic.innerHTML = '<option value="ALL">Semua PIC</option>';
    if (list) list.innerHTML = '';

    Object.keys(dataVolunteer)
        .filter(nama => nama !== 'Administrator Sistem' && !nama.toLowerCase().includes('admin'))
        .sort()
        .forEach(nama => {
            if (list) {
                let option = document.createElement('option');
                option.value = nama;
                list.appendChild(option);
            }
            if (filterLaporPic) {
                let optFilter = document.createElement('option');
                optFilter.value = nama;
                optFilter.textContent = nama;
                filterLaporPic.appendChild(optFilter);
            }
        if (printPic) {
            let optPrint = document.createElement('option');
            optPrint.value = nama;
            optPrint.textContent = nama;
            printPic.appendChild(optPrint);
        }
        if (filterPic) {
            let optF = document.createElement('option');
            optF.value = nama;
            optF.textContent = nama;
            filterPic.appendChild(optF);
        }
    });
}

export function handleAbsensiNama() {
    const inputNama = document.getElementById("abs-nama").value;
    const fields = {
        jabatan: document.getElementById("abs-jabatan"),
        semester: document.getElementById("abs-semester"),
        fakultas: document.getElementById("abs-fakultas"),
        jurusan: document.getElementById("abs-jurusan"),
        nim: document.getElementById("abs-nim"),
        wa: document.getElementById("abs-wa")
    };
    if (dataVolunteer[inputNama]) {
        const d = dataVolunteer[inputNama];
        if (fields.jabatan) fields.jabatan.value = d.div || "";
        if (fields.semester) fields.semester.value = d.smt || "";
        if (fields.fakultas) fields.fakultas.value = d.fak || "";
        if (fields.jurusan) fields.jurusan.value = d.jur || "";
        if (fields.nim) fields.nim.value = d.nim || "";
        if (fields.wa) fields.wa.value = d.wa ? d.wa.replace(/^62|^0/, "") : "";

        Object.values(fields).forEach(f => {
            if (f) {
                f.readOnly = true;
                f.style.backgroundColor = 'var(--bg-tertiary)';
            }
        });
    } else {
        Object.values(fields).forEach(f => {
            if (f) {
                f.value = "";
                f.readOnly = false;
                f.style.backgroundColor = 'var(--bg-secondary)';
            }
        });
    }
}

export async function startKamera() {
    const absVideo = document.getElementById("abs-video");
    const absOverlay = document.getElementById("abs-overlay");
    const loadingText = document.getElementById("abs-loading");
    if (loadingText) {
        loadingText.style.display = "block";
        loadingText.innerText = "Mengakses Kamera...";
    }

    if (absStreamObj) absStreamObj.getTracks().forEach(t => t.stop());
    try {
        const isDesktop = window.innerWidth > 850;
        const videoConstraints = {
            facingMode: absIsFront ? "user" : "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        };
        absStreamObj = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        if (absVideo) {
            absVideo.srcObject = absStreamObj;
            absVideo.style.display = "block";
            absVideo.style.transform = absIsFront ? "scaleX(-1)" : "scaleX(1)";

            absVideo.onloadedmetadata = () => {
                const ratio = absVideo.videoWidth / absVideo.videoHeight;
                const wrapper = document.querySelector('.viewport-wrapper');
                if (wrapper) {
                    wrapper.style.aspectRatio = ratio;
                    if (isDesktop) {
                        wrapper.style.maxHeight = '450px';
                        wrapper.style.maxWidth = '600px';
                        wrapper.style.margin = '0 auto';
                    } else {
                        wrapper.style.maxHeight = '550px';
                        wrapper.style.maxWidth = '100%';
                    }
                }
            };
        }

        if (absOverlay) absOverlay.style.display = "flex";
        const actInit = document.getElementById("abs-action-init");
        const actCam = document.getElementById("abs-action-cam");
        if (actInit) actInit.style.display = "none";
        if (actCam) actCam.style.display = "flex";
        if (loadingText) loadingText.style.display = "none";

        if (!window.absTimeInterval) {
            window.absTimeInterval = setInterval(() => {
                const timeEl = document.getElementById("abs-time");
                if (timeEl) timeEl.innerText = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
            }, 1000);
        }
    } catch (e) {
        if (loadingText) loadingText.innerText = "Akses kamera ditolak atau tidak ditemukan.";
        showCustomDialog({ title: "Error Kamera", message: "Gagal mengakses kamera. Mohon izinkan akses kamera di pengaturan browser Anda.", confirmText: "Tutup" });
        return;
    }

    const addrEl = document.getElementById("abs-address");
    if (addrEl) addrEl.innerText = "Sedang mendeteksi lokasi...";

    const fetchAddressFromOSM = async (lat, lon) => {
        try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const d = await r.json();
            absLokasi = d.display_name ? d.display_name.split(',').slice(0, 4).join(',') : "Lokasi akurat";
            if (addrEl) addrEl.innerText = absLokasi;
        } catch (e) {
            absLokasi = `Lat: ${lat}, Lon: ${lon}`;
            if (addrEl) addrEl.innerText = absLokasi;
        }
    };

    const applyCoords = (lat, lon) => {
        absLat = Number(lat).toFixed(7);
        absLon = Number(lon).toFixed(7);
        const coordsEl = document.getElementById("abs-coords");
        if (coordsEl) coordsEl.innerText = `Lat: ${absLat} Lon: ${absLon}`;
        fetchAddressFromOSM(absLat, absLon);
    };

    const tryIpFallback = async () => {
        try {
            const r = await fetch('https://ipwho.is/');
            const d = await r.json();
            if (d && d.success && d.latitude && d.longitude) {
                absLat = Number(d.latitude).toFixed(7);
                absLon = Number(d.longitude).toFixed(7);
                const coordsEl = document.getElementById("abs-coords");
                if (coordsEl) coordsEl.innerText = `Lat: ${absLat} Lon: ${absLon}`;
                absLokasi = [d.city, d.region, d.country].filter(Boolean).join(', ');
                if (addrEl) addrEl.innerText = absLokasi + " (Perkiraan Jaringan)";
                return;
            }
            throw new Error("IP Geolocation failed");
        } catch (e) {
            absLat = "-"; absLon = "-"; absLokasi = "Lokasi Tidak Terdeteksi (GPS Wajib Aktif)";
            const coordsEl = document.getElementById("abs-coords");
            if (coordsEl) coordsEl.innerText = "Lat: - Lon: -";
            if (addrEl) addrEl.innerText = absLokasi;
            showCustomDialog({ title: "Wajib Aktifkan GPS", message: "Sistem mewajibkan deteksi lokasi (GPS) untuk absensi agar posisi penugasan Anda tercatat. Mohon izinkan akses lokasi di browser/perangkat Anda.", confirmText: "Mengerti" });
        }
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            applyCoords(pos.coords.latitude, pos.coords.longitude);
        }, err1 => {
            navigator.geolocation.getCurrentPosition(pos2 => {
                applyCoords(pos2.coords.latitude, pos2.coords.longitude);
            }, err2 => {
                tryIpFallback();
            }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
        }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    } else {
        tryIpFallback();
    }
}

export function toggleKamera() {
    absIsFront = !absIsFront;
    startKamera();
}

export function jepretFoto() {
    const absVideo = document.getElementById("abs-video");
    const absPhoto = document.getElementById("abs-photo-preview");
    const absOverlay = document.getElementById("abs-overlay");
    const canvas = document.getElementById("abs-canvas");
    if (!absVideo || !canvas) return;

    let targetW = absVideo.videoWidth || 1280;
    let targetH = absVideo.videoHeight || 720;

    if (targetW < 1920 && targetH < 1920) {
        const scaleUp = 1920 / Math.max(targetW, targetH);
        targetW = Math.round(targetW * scaleUp);
        targetH = Math.round(targetH * scaleUp);
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");

    if (absIsFront) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(absVideo, 0, 0, targetW, targetH);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const isPortrait = canvas.height > canvas.width;
    let scale = isPortrait ? Math.max(0.7, canvas.width / 750) : Math.max(0.6, canvas.height / 850);
    const padX = Math.round(24 * scale);
    const padY = Math.round(24 * scale);

    ctx.save();

    const timeStr = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "long" }).toUpperCase();
    let locStr = absLokasi ? absLokasi.toUpperCase() : "LOKASI TERDETEKSI";
    const userName = state.currentUser ? state.currentUser.namaLengkap.toUpperCase() : "RELAWAN VOLABS";
    const coordStr = `LAT: ${absLat || '0.000'} | LON: ${absLon || '0.000'}   •   ${userName}`;
    const badgeText = "VOLABS PIPD • VERIFIED GEOTAG";

    const fontBadge = `700 ${Math.round(10 * scale)}px 'Fira Sans', Arial, sans-serif`;
    const fontTime = `800 ${Math.round(14 * scale)}px 'Fira Sans', Arial, sans-serif`;
    const fontLoc = `700 ${Math.round(12 * scale)}px 'Fira Sans', Arial, sans-serif`;
    const fontCoord = `600 ${Math.round(11 * scale)}px monospace`;

    function wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    ctx.font = fontTime; const wTime = ctx.measureText(timeStr).width;
    ctx.font = fontCoord; const wCoord = ctx.measureText(coordStr).width;
    ctx.font = fontBadge; const wBadgeText = ctx.measureText(badgeText).width;

    const maxTextW = Math.max(canvas.width * 0.6, canvas.width - (padX * 4) - Math.round(50 * scale));
    ctx.font = fontLoc;
    const locLines = wrapText(ctx, locStr, maxTextW);

    let maxLineW = Math.max(wTime, wCoord, wBadgeText + Math.round(20 * scale));
    for (let l of locLines) { maxLineW = Math.max(maxLineW, ctx.measureText(l).width); }

    const boxW = Math.min(canvas.width - (padX * 2), maxLineW + Math.round(50 * scale));
    const baseBoxH = Math.round(115 * scale);
    const boxH = baseBoxH + (locLines.length - 1) * Math.round(22 * scale);
    const boxX = padX;
    const boxY = canvas.height - padY - boxH;

    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = Math.round(15 * scale);
    ctx.shadowOffsetY = Math.round(5 * scale);
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(boxX, boxY, boxW, boxH, Math.round(14 * scale));
    } else {
        ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fill();

    ctx.lineWidth = Math.round(1.5 * scale);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();
    ctx.shadowColor = "transparent";

    const textX = boxX + Math.round(34 * scale);
    const dotX = boxX + Math.round(20 * scale);
    let currentY = boxY + Math.round(22 * scale);

    const badgeW = wBadgeText + Math.round(16 * scale);
    const badgeH = Math.round(22 * scale);
    const badgeY = currentY - Math.round(11 * scale);

    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(boxX + Math.round(16 * scale), badgeY, badgeW, badgeH, Math.round(6 * scale));
    } else {
        ctx.rect(boxX + Math.round(16 * scale), badgeY, badgeW, badgeH);
    }
    const badgeGrad = ctx.createLinearGradient(boxX, badgeY, boxX + badgeW, badgeY);
    badgeGrad.addColorStop(0, "#BC305F");
    badgeGrad.addColorStop(1, "#F8A734");
    ctx.fillStyle = badgeGrad;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = fontBadge;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, boxX + Math.round(16 * scale) + badgeW / 2, badgeY + badgeH / 2);

    currentY += Math.round(22 * scale);

    function drawDot(y, color) {
        ctx.beginPath();
        ctx.arc(dotX, y, Math.round(4 * scale), 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }

    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 2;

    drawDot(currentY, "#F8A734");
    ctx.fillStyle = "#F8A734";
    ctx.font = fontTime;
    ctx.fillText(timeStr, textX, currentY);
    currentY += Math.round(24 * scale);

    drawDot(currentY, "#ffffff");
    ctx.fillStyle = "#ffffff";
    ctx.font = fontLoc;
    for (let i = 0; i < locLines.length; i++) {
        ctx.fillText(locLines[i], textX, currentY);
        if (i < locLines.length - 1) currentY += Math.round(22 * scale);
    }
    currentY += Math.round(22 * scale);

    drawDot(currentY, "#C03959");
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = fontCoord;
    ctx.fillText(coordStr, textX, currentY);

    ctx.restore();

    absFotoBase64 = canvas.toDataURL("image/jpeg", 0.75);
    if (absPhoto) {
        absPhoto.src = absFotoBase64;
        absPhoto.style.display = "block";
    }
    if (absVideo) absVideo.style.display = "none";
    if (absOverlay) absOverlay.style.display = "none";

    const actCam = document.getElementById("abs-action-cam");
    const actRetake = document.getElementById("abs-action-retake");
    if (actCam) actCam.style.display = "none";
    if (actRetake) actRetake.style.display = "block";
}

export function resetFoto() {
    const absVideo = document.getElementById("abs-video");
    const absPhoto = document.getElementById("abs-photo-preview");
    const absOverlay = document.getElementById("abs-overlay");
    if (absPhoto) absPhoto.style.display = "none";
    if (absVideo) absVideo.style.display = "block";
    if (absOverlay) absOverlay.style.display = "flex";

    const actCam = document.getElementById("abs-action-cam");
    const actRetake = document.getElementById("abs-action-retake");
    if (actCam) actCam.style.display = "flex";
    if (actRetake) actRetake.style.display = "none";
    absFotoBase64 = "";
}

export function stopKamera() {
    if (absStreamObj) {
        absStreamObj.getTracks().forEach(t => t.stop());
        absStreamObj = null;
    }
    if (window.absTimeInterval) {
        clearInterval(window.absTimeInterval);
        window.absTimeInterval = null;
    }
    const absVideo = document.getElementById("abs-video");
    const absPhoto = document.getElementById("abs-photo-preview");
    const absOverlay = document.getElementById("abs-overlay");
    if (absVideo) absVideo.style.display = "none";
    if (absOverlay) absOverlay.style.display = "none";
    if (absPhoto) absPhoto.style.display = "none";

    const actInit = document.getElementById("abs-action-init");
    const actCam = document.getElementById("abs-action-cam");
    const actRetake = document.getElementById("abs-action-retake");
    if (actInit) actInit.style.display = "block";
    if (actCam) actCam.style.display = "none";
    if (actRetake) actRetake.style.display = "none";

    const loadEl = document.getElementById("abs-loading");
    if (loadEl) {
        loadEl.style.display = "block";
        loadEl.innerText = "Kamera dinonaktifkan.";
    }
    absFotoBase64 = "";
}

export async function submitAbsensi() {
    const isUserAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    if (isUserAdmin) {
        return showCustomDialog({
            title: "Akses Dibatasi",
            message: "Administrator Sistem hanya bertugas memantau kehadiran relawan dan tidak melakukan absensi.",
            confirmText: "Mengerti"
        });
    }

    const btn = document.getElementById("btn-submit-absensi");
    if (!absFotoBase64) return showCustomDialog({ title: "Peringatan", message: "Mohon ambil foto bukti kehadiran!", confirmText: "Mengerti" });
    if (!absLat || !absLon || absLat === "-" || absLon === "-") {
        return showCustomDialog({ title: "GPS Wajib Aktif", message: "Lokasi (GPS) wajib diaktifkan sebelum mengirim absensi agar posisi penugasan Anda dapat diketahui. Mohon izinkan akses lokasi pada browser/HP Anda lalu ambil ulang foto absensi.", confirmText: "Mengerti" });
    }

    const absData = {
        nama: document.getElementById("abs-nama").value,
        nim: document.getElementById("abs-nim").value,
        jabatan: document.getElementById("abs-jabatan").value,
        divisi: document.getElementById("abs-jabatan").value,
        semester: document.getElementById("abs-semester").value,
        fakultas: document.getElementById("abs-fakultas").value,
        jurusan: document.getElementById("abs-jurusan").value,
        wa: "+62" + document.getElementById("abs-wa").value,
        foto: absFotoBase64,
        lat: absLat,
        lon: absLon,
        lokasi: absLokasi,
        notulensi: document.getElementById("abs-notulensi").value
    };

    if (btn) { btn.disabled = true; btn.textContent = "Menyimpan Absensi..."; }
    try {
        // 1. Simpan langsung ke database Firestore (0ms delay)
        await saveAbsensiEntry(absData);
        if (typeof window.renderDashboard === 'function') window.renderDashboard();

        // 2. Kirim foto ke GAS hanya untuk arsip Google Drive (Background)
        if (api && api.isConfigured()) {
            fetch(api.apiUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "submit_absensi", data: absData })
            }).catch(e => console.log("Google Drive photo upload background notice:", e));
        }

        showCustomDialog({ title: "Berhasil", message: "Data absensi berhasil dicatat!", confirmText: "Tutup" });
        document.getElementById("form-absensi").reset();
        resetFoto();
        switchAbsensiTab('monitor');
        await loadMonitoring();
    } catch (err) {
        showCustomDialog({ title: "Gagal", message: "Gagal menyimpan absensi. Periksa koneksi internet Anda.", confirmText: "Tutup" });
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Kirim Absensi"; }
    }
}

export function renderTodayAbsensiList(list) {
    const c = document.getElementById("absensi-list-container");
    if (!c) return;

    // Filter out Administrator Sistem dari daftar kehadiran
    const volunteerList = (list || []).filter(item => {
        const n = (item.nama || '').trim();
        return n && n !== 'Administrator Sistem' && !n.toLowerCase().includes('admin');
    });

    if (volunteerList && volunteerList.length > 0) {
        c.innerHTML = volunteerList.map(item => {
            const timeStr = item.waktu || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-');
            const dateStr = item.tanggal ? ` (${item.tanggal})` : '';
            return `
            <div class="att-card" style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-secondary); border-radius:10px; margin-bottom:10px; border:1px solid var(--border-color);">
                <img src="${item.foto}" class="att-img" style="width:58px; height:58px; border-radius:8px; object-fit:cover; flex-shrink:0; cursor:pointer;" onclick="if(window.showCustomDialog) window.showCustomDialog({title:'Foto Bukti Presensi', message:'<div style=\\'text-align:center\\'><img src=\\'${item.foto}\\' style=\\'max-width:100%; max-height:60vh; border-radius:8px; object-fit:contain;\\'></div>', confirmText:'Tutup'})" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama || 'Volunteer')}&background=10b981&color=fff'">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight:700; font-size:14.5px; margin-bottom:2px; display:flex; justify-content:space-between; align-items:baseline; gap:8px;">
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-main);">${item.nama}</span>
                        <span style="font-size:11px; flex-shrink:0; background:rgba(16,185,129,0.12); color:#10b981; font-weight:600; padding:2px 8px; border-radius:12px;">${timeStr}</span>
                    </div>
                    <div style="font-size:12px; color:var(--primary); font-weight:600; margin-bottom:4px;">${item.divisi || item.jabatan || 'Volunteer PIPD'}${dateStr}</div>
                    ${item.lokasi && item.lokasi !== '-' ? `
                    <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:4px; display:flex; align-items:center; gap:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px; height:12px; flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.lokasi}">${item.lokasi}</span>
                    </div>` : ''}
                    <div style="font-size:12.5px; color:var(--text-main); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.4;">${item.notulensi || '-'}</div>
                </div>
            </div>
            `;
        }).join('');
    } else {
        c.innerHTML = `<div style="text-align:center; padding: 30px; color: var(--text-muted);">Belum ada data absensi hari ini.</div>`;
    }
}

export async function loadMonitoring() {
    const list = await getAbsensiList(true);
    renderTodayAbsensiList(list);
}

export function renderAbsensi() {
    initVolunteerData();
    const isUserAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    const absNamaField = document.getElementById("abs-nama");
    if (absNamaField) {
        if (isUserAdmin) {
            absNamaField.value = '';
            absNamaField.placeholder = 'Mode Administrator (Monitoring Saja)';
            absNamaField.readOnly = true;
            absNamaField.disabled = true;
            switchAbsensiTab('monitor');
        } else if (state.currentUser) {
            absNamaField.value = state.currentUser.namaLengkap;
            absNamaField.readOnly = true;
            absNamaField.disabled = false;
            handleAbsensiNama();
        }
    }
}

export function initAbsensi() {
    window.switchAbsensiTab = switchAbsensiTab;
    window.startKamera = startKamera;
    window.toggleKamera = toggleKamera;
    window.jepretFoto = jepretFoto;
    window.resetFoto = resetFoto;
    window.stopKamera = stopKamera;
    window.submitAbsensi = submitAbsensi;
    window.loadMonitoring = loadMonitoring;
    window.renderTodayAbsensiList = renderTodayAbsensiList;
    window.handleAbsensiNama = handleAbsensiNama;
    window.renderAbsensi = renderAbsensi;

    initVolunteerData();
}

