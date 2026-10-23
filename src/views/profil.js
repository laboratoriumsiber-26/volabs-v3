// Profil User View Module (Volunteer Directory, Front-Card Toggle Role Uploader, Details Modal & CSV Export)
import { state } from '../store/state.js';
import { dataVolunteer } from '../store/initialData.js';
import { api } from '../services/api.js';
import { db } from '../services/firebase.js';
import { showCustomDialog } from '../utils/dialog.js';
import { getDivisiMeta, getInitials, formatWaNumber, cleanWaForUrl } from '../utils/helpers.js';
import { navigateTo } from '../router/index.js';
import { applyRBAC } from '../services/auth.js';
import { getSkeletonProfilCards, getSkeletonTableRows } from '../utils/skeleton.js';

export const profilTemplate = `
        <section id="view-profil-user" class="view-section">
            <div
                style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-main); font-weight: 700;">Direktori Profil User (Volunteer)</h3>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                    <button class="btn-secondary" onclick="exportProfilUserCsv()"
                        title="Unduh Data Seluruh Profil ke file CSV (Excel)">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        <span>Unduh CSV</span>
                    </button>
                    <div class="view-toggle-btns">
                        <button class="toggle-btn active" id="btn-profil-view-cards"
                            onclick="setProfilViewMode('cards')">Kartu (Mobile)</button>
                        <button class="toggle-btn" id="btn-profil-view-table"
                            onclick="setProfilViewMode('table')">Tabel (Desktop)</button>
                    </div>
                </div>
            </div>

            <!-- 4 Stat Summary Cards for Profil User -->
            <div class="dashboard-grid" style="margin-bottom: 1.25rem;">
                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">Total Volunteer Terdaftar</span>
                        <div class="stat-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" id="stat-profil-total">46</div>
                    <div class="stat-desc">Mahasiswa volunteer aktif</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">Unit / Divisi</span>
                        <div class="stat-icon" style="color: #8b5cf6;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" id="stat-profil-divisi">5</div>
                    <div class="stat-desc">Bidang keahlian media</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">Fakultas Terlibat</span>
                        <div class="stat-icon" style="color: #0284c7;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 14l9-5-9-5-9 5 9 5z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" id="stat-profil-fakultas">5</div>
                    <div class="stat-desc">FITK, FDKI, FUA, FEBI, FASYA</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">Kontak Terkoneksi</span>
                        <div class="stat-icon" style="color: #10b981;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" style="color: #10b981;">100%</div>
                    <div class="stat-desc">WhatsApp siap hubungi</div>
                </div>
            </div>

            <!-- Filter and Search Toolbar -->
            <div class="card" style="padding: 1rem; margin-bottom: 1.25rem;">
                <div
                    style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between;">
                    <div
                        style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; flex: 1; min-width: 0; width: 100%;">
                        <div style="position: relative; flex: 1 1 200px; min-width: 0; width: 100%;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-light); pointer-events: none;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <input type="text" id="search-profil-input" class="form-input"
                                placeholder="Cari nama, NIM, jurusan..." oninput="renderProfilUser()"
                                style="padding-left: 32px; font-size: 13px;">
                        </div>

                        <select id="filter-profil-divisi" class="form-select" onchange="renderProfilUser()"
                            style="flex: 1 1 auto; min-width: 0; font-size: 13px;">
                            <option value="ALL">Semua Divisi</option>
                            <option value="Editor Video">Editor Video</option>
                            <option value="Fotografer/Videografer">Fotografer/Videografer</option>
                            <option value="Desain Grafis">Desain Grafis</option>
                            <option value="Operator Podcast">Operator Podcast</option>
                            <option value="Mentor">Mentor (Semua)</option>
                        </select>

                        <select id="filter-profil-fakultas" class="form-select" onchange="renderProfilUser()"
                            style="flex: 1 1 auto; min-width: 0; font-size: 13px;">
                            <option value="ALL">Semua Fakultas</option>
                            <option value="FITK">FITK</option>
                            <option value="FDKI">FDKI</option>
                            <option value="FUA">FUA</option>
                            <option value="FEBI">FEBI</option>
                            <option value="FASYA">FASYA</option>
                        </select>

                        <select id="filter-profil-semester" class="form-select" onchange="renderProfilUser()"
                            style="flex: 1 1 auto; min-width: 0; font-size: 13px;">
                            <option value="ALL">Semua Semester</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="7">Semester 7</option>
                        </select>
                    </div>

                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
                        <span id="profil-user-counter-label">Menampilkan 46 user</span>
                    </div>
                </div>
            </div>

            <!-- Card Grid View -->
            <div id="profil-cards-container" class="cards-container">
                ${getSkeletonProfilCards(4)}
            </div>

            <!-- Table View -->
            <div id="profil-table-container" class="table-wrapper" style="display: none;">
                <table class="content-table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">No</th>
                            <th>Mahasiswa / Identitas</th>
                            <th>Divisi</th>
                            <th>Fakultas & Prodi</th>
                            <th style="width: 80px; text-align: center;">Semester</th>
                            <th style="width: 140px;">Kontak WhatsApp</th>
                            <th style="width: 140px;">Akun Login</th>
                            <th style="width: 100px; text-align: center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="profil-table-body">
                        ${getSkeletonTableRows(8, 5)}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- SECTION STUDIO UPLOAD (KHUSUS UPLOADER / ADMIN) -->

        <section id="view-profil-user-detail" class="view-section">
            <div class="subview-header-bar">
                <div class="subview-header-left">
                    <button type="button" class="btn-back-nav" id="btn-back-profil" onclick="handleBackProfil()">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span id="btn-back-profil-text">Kembali</span>
                    </button>
                    <div>
                        <h2 class="subview-title" id="profil-detail-title">Profil Saya</h2>
                    </div>
                </div>
            </div>
            <div class="subview-card-form" style="padding: 0; overflow: hidden;">
                <!-- Header with Gradient Banner -->
                <div style="background: var(--volabs-gradient); padding: 1.5rem 1.25rem 1.25rem; color: white;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div id="modal-profil-avatar"
                            style="width: 64px; height: 64px; border-radius: 50%; background: #ffffff; color: var(--primary); font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.2); flex-shrink: 0; border: 3px solid rgba(255,255,255,0.85);">
                            SH
                        </div>
                        <div style="overflow: hidden; flex: 1;">
                            <div style="font-size: 11px; opacity: 0.85; font-weight: 600; letter-spacing: 0.2px;" id="modal-profil-div-badge">Editor Video</div>
                            <h3 id="modal-profil-nama"
                                style="margin: 4px 0 2px; font-size: 1.2rem; font-weight: 800; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.2); word-break: break-word;">
                                Nama Lengkap</h3>
                            <div style="font-size: 0.82rem; opacity: 0.9; display: flex; align-items: center; gap: 6px;">
                                <span>NIM: <strong id="modal-profil-nim">2384110102</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Content Body: Grouped Rows in Native Mobile Style -->
                <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
                    <!-- Card Kredensial Akun (Clean, without Admin Privileged disclaimers) -->
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
                        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.75rem;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px; color: var(--primary);">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                            <span>Kredensial Akun</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                            <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                <div style="font-size: 11px; color: var(--text-light); margin-bottom: 3px; font-weight: 600;">Username</div>
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <strong id="modal-profil-user-val" style="font-size: 0.92rem; color: var(--text-main); font-family: monospace;">-</strong>
                                    <button type="button" class="icon-btn" style="padding: 3px;" onclick="copyProfilField('modal-profil-user-val', 'Username')" title="Salin Username">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                <div style="font-size: 11px; color: var(--text-light); margin-bottom: 3px; font-weight: 600;">Password Default</div>
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <span id="modal-profil-pass-val" style="font-size: 0.92rem; color: var(--text-main); font-family: monospace; font-weight: 700;">••••••••</span>
                                    <div style="display: flex; gap: 2px;">
                                        <button type="button" class="icon-btn" style="padding: 3px;" id="btn-toggle-modal-pass" onclick="toggleModalPassword()" title="Lihat/Sembunyikan Password">
                                            <svg id="icon-modal-pass-eye" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                            </svg>
                                        </button>
                                        <button type="button" class="icon-btn" style="padding: 3px;" onclick="copyModalPassword()" title="Salin Password">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Data Akademik & Kontak Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
                            <div style="font-size: 11px; color: var(--text-light); font-weight: 600;">Fakultas</div>
                            <div id="modal-profil-fak" style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-top: 2px;">-</div>
                        </div>
                        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
                            <div style="font-size: 11px; color: var(--text-light); font-weight: 600;">Program Studi</div>
                            <div id="modal-profil-jur" style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-top: 2px;">-</div>
                        </div>
                        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
                            <div style="font-size: 11px; color: var(--text-light); font-weight: 600;">Semester</div>
                            <div id="modal-profil-smt" style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-top: 2px;">-</div>
                        </div>
                        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
                            <div style="font-size: 11px; color: var(--text-light); font-weight: 600;">Divisi PIPD</div>
                            <div id="modal-profil-div" style="font-weight: 700; color: var(--primary); font-size: 0.95rem; margin-top: 2px;">-</div>
                        </div>
                    </div>

                    <!-- Kontak WhatsApp Section -->
                    <div style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: var(--radius-md); padding: 0.9rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
                        <div>
                            <div style="font-size: 11px; color: #15803d; font-weight: 700;">Kontak WhatsApp Terhubung</div>
                            <div id="modal-profil-wa-num" style="font-size: 1.05rem; font-weight: 800; color: #166534; font-family: monospace;">-</div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <a id="modal-profil-wa-btn" href="#" target="_blank" class="btn-primary"
                                style="background: #25d366; border-color: #25d366; color: #fff; padding: 7px 14px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.35.491 1.196.534 1.284.043.088.072.19.014.305-.058.115-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z" />
                                </svg>
                                <span>Chat WhatsApp</span>
                            </a>
                            <button type="button" class="btn-secondary" style="padding: 7px 12px; font-size: 12px;" onclick="copyProfilField('modal-profil-wa-num', 'Nomor WA')">
                                Salin
                            </button>
                        </div>
                    </div>

                    <!-- Status Peran Uploader (Toggle Switch Native) -->
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.9rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Akses Peran: Uploader Studio</div>
                            <div id="modal-profil-uploader-status" style="display: flex; align-items: center;">
                                <span class="badge-uploader-off">Nonaktif</span>
                            </div>
                        </div>
                        <label class="toggle-switch-native" id="modal-profil-uploader-switch-container" title="Aktifkan / Nonaktifkan Peran Uploader" style="cursor: pointer;">
                            <input type="checkbox" id="modal-profil-toggle-uploader-switch" onchange="handleModalToggleUploader(this.checked)">
                            <span class="toggle-slider-track"></span>
                        </label>
                    </div>

                    <!-- Status Peran Editor (Toggle Switch Native) -->
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.9rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Akses Peran: Editor Video Studio</div>
                            <div id="modal-profil-editor-status" style="display: flex; align-items: center;">
                                <span class="badge-uploader-off">Nonaktif</span>
                            </div>
                        </div>
                        <label class="toggle-switch-native" id="modal-profil-editor-switch-container" title="Aktifkan / Nonaktifkan Peran Editor" style="cursor: pointer;">
                            <input type="checkbox" id="modal-profil-toggle-editor-switch" onchange="handleModalToggleEditor(this.checked)">
                            <span class="toggle-slider-track"></span>
                        </label>
                    </div>

                    <!-- Snapshot Rekapitulasi Keaktifan -->
                    <div>
                        <div style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 0.6rem; display: flex; align-items: center; gap: 6px;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 15px; height: 15px; color: var(--primary);">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            <span>Ringkasan Keaktifan di Sistem</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; text-align: center;">
                            <div style="background: var(--bg-tertiary); padding: 0.75rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                <div style="font-size: 10px; color: var(--text-light); margin-bottom: 3px; font-weight: 600;">Absensi Hari Ini</div>
                                <div id="modal-profil-stat-absen" style="font-size: 0.85rem; font-weight: 700; color: #10b981;">-</div>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 0.75rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                <div style="font-size: 10px; color: var(--text-light); margin-bottom: 3px; font-weight: 600;">Konten PIC</div>
                                <div id="modal-profil-stat-konten" style="font-size: 0.95rem; font-weight: 800; color: var(--primary);">0</div>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 0.75rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                <div style="font-size: 10px; color: var(--text-light); margin-bottom: 3px; font-weight: 600;">Jurnal KKN</div>
                                <div id="modal-profil-stat-jurnal" style="font-size: 0.95rem; font-weight: 800; color: #3b82f6;">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 0.9rem 1.25rem; background: var(--bg-secondary); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <button type="button" class="btn-secondary" onclick="salinRingkasanProfil()" style="font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                        </svg>
                        <span>Salin Ringkasan</span>
                    </button>
                    <button type="button" class="btn-secondary" onclick="handleBackProfil()">Kembali</button>
                </div>
            </div>
        </section>

        <!-- SUB-VIEW 6: FORM UPLOAD BAHAN MENTAH STUDIO (/studio-upload/tambah) -->
`;

let currentProfilViewMode = window.innerWidth <= 850 ? 'cards' : 'table';
let currentActiveProfilDetail = null;
let isModalPassVisible = false;

export function setProfilViewMode(mode) {
    currentProfilViewMode = mode;
    state.currentProfilViewMode = mode;
    const cardsContainer = document.getElementById('profil-cards-container');
    const tableContainer = document.getElementById('profil-table-container');
    const btnCards = document.getElementById('btn-profil-view-cards');
    const btnTable = document.getElementById('btn-profil-view-table');

    if (mode === 'cards') {
        if (cardsContainer) cardsContainer.style.display = 'grid';
        if (tableContainer) tableContainer.style.display = 'none';
        if (btnCards) btnCards.classList.add('active');
        if (btnTable) btnTable.classList.remove('active');
    } else {
        if (cardsContainer) cardsContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
        if (btnCards) btnCards.classList.remove('active');
        if (btnTable) btnTable.classList.add('active');
    }
}

export function renderProfilUser() {
    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');

    // Jika bukan Admin, otomatis tampilkan profil pengguna sendiri
    if (!isAdmin && state.currentUser) {
        openDetailProfilModal(state.currentUser.namaLengkap, false);
        if (typeof window.switchView === 'function') {
            window.switchView('profil-user-detail', false);
        }
        return;
    }

    const searchVal = (document.getElementById('search-profil-input')?.value || document.getElementById('search-profil')?.value || '').toLowerCase().trim();
    const filterDiv = document.getElementById('filter-profil-divisi')?.value || 'ALL';
    const filterFak = document.getElementById('filter-profil-fakultas')?.value || 'ALL';
    const filterSmt = document.getElementById('filter-profil-semester')?.value || 'ALL';

    const allUsers = Object.keys(dataVolunteer)
        .sort((a, b) => a.localeCompare(b, 'id'))
        .map(name => {
        const item = dataVolunteer[name];
        return {
            nama: name,
            nim: item.nim || '-',
            username: item.nim || '-',
            password: (item.nim || '') + 'pipd',
            smt: item.smt || '-',
            fak: item.fak || '-',
            jur: item.jur || '-',
            div: item.div || '-',
            wa: item.wa || '-',
            email: item.email || '-',
            tglLahir: item.tglLahir || '-'
        };
    });

    const filtered = allUsers.filter(u => {
        if (filterDiv !== 'ALL' && u.div !== filterDiv) return false;
        if (filterFak !== 'ALL' && u.fak !== filterFak) return false;
        if (filterSmt !== 'ALL' && String(u.smt) !== String(filterSmt)) return false;

        if (searchVal) {
            const matchName = u.nama.toLowerCase().includes(searchVal);
            const matchNim = u.nim.toLowerCase().includes(searchVal);
            const matchJur = u.jur.toLowerCase().includes(searchVal);
            const matchDiv = u.div.toLowerCase().includes(searchVal);
            const matchEmail = (u.email || '').toLowerCase().includes(searchVal);
            if (!matchName && !matchNim && !matchJur && !matchDiv && !matchEmail) return false;
        }
        return true;
    });

    const totalEl = document.getElementById('stat-profil-total');
    if (totalEl) totalEl.textContent = allUsers.length;

    const countEl = document.getElementById('profil-count-label');
    if (countEl) countEl.textContent = `Menampilkan ${filtered.length} dari ${allUsers.length} profil volunteer`;

    const userCounterLabel = document.getElementById('profil-user-counter-label');
    if (userCounterLabel) userCounterLabel.textContent = `Menampilkan ${filtered.length} user`;

    const cardsContainer = document.getElementById('profil-cards-container');
    if (cardsContainer) {
        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <div style="font-weight: 700; font-size: 15px; margin-bottom: 6px;">Tidak Ada Data Profil</div>
                    <div style="font-size: 13px;">Tidak ada profil yang cocok dengan kriteria pencarian atau filter.</div>
                </div>
            `;
        } else {
            cardsContainer.innerHTML = filtered.map(u => {
                const meta = getDivisiMeta(u.div);
                const initials = getInitials(u.nama);
                const cleanWa = cleanWaForUrl(u.wa);
                const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent('Halo ' + u.nama + ', kami dari Admin VoLabs PIPD...')}`;
                const isUp = state.isUserUploader(u.nama);
                const isEd = state.isUserEditor(u.nama);
                const safeName = encodeURIComponent(u.nama);
                return `
                    <div class="card profil-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; position: relative;">
                        <div style="height: 6px; background: ${meta.gradient}; width: 100%;"></div>
                        <div style="padding: 1.15rem; display: flex; flex-direction: column; flex: 1;">
                            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 0.75rem;">
                                <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; flex: 1;">
                                    <div style="width: 44px; height: 44px; border-radius: 50%; background: ${meta.gradient}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.12);">
                                        ${initials}
                                    </div>
                                    <div style="overflow: hidden;">
                                        <div style="font-weight: 800; font-size: 14px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${u.nama}">
                                            ${u.nama}
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                            <span style="font-family: monospace; font-size: 11px; color: var(--text-muted); background: var(--bg-tertiary); padding: 1px 6px; border-radius: 4px; font-weight: 600;">
                                                NIM: ${u.nim}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                                    <label class="toggle-switch-native toggle-switch-sm" style="margin: 0;" title="${isUp ? 'Nonaktifkan Uploader' : 'Aktifkan Uploader'}">
                                        <input type="checkbox" ${isUp ? 'checked' : ''} onchange="window.toggleUploaderRoleSafe('${safeName}', this.checked)">
                                        <span class="toggle-slider-track"></span>
                                    </label>
                                    <label class="toggle-switch-native toggle-switch-sm" style="margin: 0;" title="${isEd ? 'Nonaktifkan Editor' : 'Aktifkan Editor'}">
                                        <input type="checkbox" ${isEd ? 'checked' : ''} onchange="window.toggleEditorRoleSafe('${safeName}', this.checked)">
                                        <span class="toggle-slider-track"></span>
                                    </label>
                                </div>
                            </div>

                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 0.75rem;">
                                <span style="font-size: 11px; background: ${meta.bg}; color: ${meta.color}; border: 1px solid ${meta.border}; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                                    ${u.div}
                                </span>
                                ${isUp ? '<span class="badge-role-uploader">Uploader</span>' : ''}
                                ${isEd && !u.div.toLowerCase().includes('editor') ? '<span class="badge-role-editor">Editor</span>' : ''}
                                <span style="font-size: 11px; color: var(--text-muted); padding: 2px 4px; font-weight: 600;">${u.fak} &middot; Smt ${u.smt}</span>
                            </div>

                            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 1rem; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
                                ${u.jur}
                            </div>

                            <div style="display: flex; gap: 8px; margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                                <a href="${waUrl}" target="_blank" class="btn-secondary" style="flex: 1; min-width: 65px; padding: 7px 10px; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: #16a34a; border-color: rgba(22, 163, 74, 0.3); border-radius: var(--radius-md);" title="Chat WhatsApp">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.35.491 1.196.534 1.284.043.088.072.19.014.305-.058.115-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
                                    <span>WA</span>
                                </a>
                                <button type="button" class="btn-primary" style="flex: 2; min-width: 100px; padding: 7px 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-md);" onclick="window.openDetailProfilSafe('${safeName}')">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    <span>Detail Profil</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const tableBody = document.getElementById('profil-table-body');
    if (tableBody) {
        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">Tidak ada data profil volunteer.</td></tr>`;
        } else {
            tableBody.innerHTML = filtered.map((u, idx) => {
                const meta = getDivisiMeta(u.div);
                const initials = getInitials(u.nama);
                const cleanWa = cleanWaForUrl(u.wa);
                const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent('Halo ' + u.nama + ', kami dari Admin VoLabs PIPD...')}`;
                const isUp = state.isUserUploader(u.nama);
                const isEd = state.isUserEditor(u.nama);
                const safeName = encodeURIComponent(u.nama);

                return `
                    <tr>
                        <td style="text-align: center; font-weight: 600; font-size: 12px;">${idx + 1}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${meta.gradient}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; flex-shrink: 0;">
                                    ${initials}
                                </div>
                                <div>
                                    <div style="font-weight: 700; font-size: 13px; color: var(--text-main);">${u.nama}</div>
                                    <div style="font-family: monospace; font-size: 10.5px; color: var(--text-muted);">NIM: ${u.nim}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                                <span style="font-size: 11px; background: ${meta.bg}; color: ${meta.color}; border: 1px solid ${meta.border}; padding: 2px 6px; border-radius: 6px; font-weight: 700;">
                                    ${u.div}
                                </span>
                                ${isUp ? '<span class="badge-role-uploader">Up</span>' : ''}
                                ${isEd && !u.div.toLowerCase().includes('editor') ? '<span class="badge-role-editor">Ed</span>' : ''}
                            </div>
                        </td>
                        <td>
                            <div style="font-size: 12px; font-weight: 600; color: var(--text-main);">${u.fak}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${u.jur}</div>
                        </td>
                        <td style="text-align: center; font-weight: 600; font-size: 12px;">
                            ${u.smt}
                        </td>
                        <td>
                            <a href="${waUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 4px; color: #16a34a; font-size: 12px; text-decoration: none; font-weight: 600;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.35.491 1.196.534 1.284.043.088.072.19.014.305-.058.115-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
                                <span>${formatWaNumber(u.wa)}</span>
                            </a>
                        </td>
                        <td>
                            <div style="font-size: 11px; font-family: monospace; color: var(--text-main);">User: <strong>${u.username}</strong></div>
                            <div style="font-size: 10px; color: var(--text-light);">Pass: ${u.password}</div>
                        </td>
                        <td style="text-align: center;">
                            <div style="display: flex; gap: 6px; align-items: center; justify-content: center;">
                                <label class="toggle-switch-native toggle-switch-sm" style="margin: 0;" title="${isUp ? 'Nonaktifkan Uploader' : 'Aktifkan Uploader'}">
                                    <input type="checkbox" ${isUp ? 'checked' : ''} onchange="window.toggleUploaderRoleSafe('${safeName}', this.checked)">
                                    <span class="toggle-slider-track"></span>
                                </label>
                                <label class="toggle-switch-native toggle-switch-sm" style="margin: 0;" title="${isEd ? 'Nonaktifkan Editor' : 'Aktifkan Editor'}">
                                    <input type="checkbox" ${isEd ? 'checked' : ''} onchange="window.toggleEditorRoleSafe('${safeName}', this.checked)">
                                    <span class="toggle-slider-track"></span>
                                </label>
                                <button type="button" class="btn-primary" style="padding: 5px 10px; font-size: 11px; border-radius: var(--radius-md);" onclick="window.openDetailProfilSafe('${safeName}')">
                                    Detail
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

export function findVolunteer(identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim();
    if (dataVolunteer[cleanId]) {
        return { nama: cleanId, ...dataVolunteer[cleanId] };
    }
    const normalize = s => (s || '').toLowerCase().replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim();
    const targetNorm = normalize(cleanId);
    for (const [name, d] of Object.entries(dataVolunteer)) {
        if (normalize(name) === targetNorm) {
            return { nama: name, ...d };
        }
    }
    for (const [name, d] of Object.entries(dataVolunteer)) {
        if (d.nim && String(d.nim).trim() === cleanId) {
            return { nama: name, ...d };
        }
    }
    const stripApos = s => (s || '').toLowerCase().replace(/['’`]/g, '').replace(/\s+/g, ' ').trim();
    const targetStrip = stripApos(cleanId);
    for (const [name, d] of Object.entries(dataVolunteer)) {
        if (stripApos(name) === targetStrip) {
            return { nama: name, ...d };
        }
    }
    return null;
}

export function openDetailProfilModal(userName, triggerNavigate = true) {
    if (!userName && state.currentUser) {
        userName = state.currentUser.namaLengkap;
    }
    let vol = findVolunteer(userName);
    if (!vol && state.currentUser) {
        vol = findVolunteer(state.currentUser.namaLengkap) ||
              findVolunteer(state.currentUser.nim) ||
              findVolunteer(state.currentUser.username);
    }

    const u = vol || {
        nama: userName || (state.currentUser ? state.currentUser.namaLengkap : 'Pengguna'),
        nim: (state.currentUser && state.currentUser.nim) || '-',
        username: (state.currentUser && (state.currentUser.username || state.currentUser.nim)) || '-',
        smt: (state.currentUser && state.currentUser.smt) || '-',
        fak: (state.currentUser && state.currentUser.fakultas) || '-',
        jur: (state.currentUser && state.currentUser.jurusan) || '-',
        div: (state.currentUser && (state.currentUser.divisi || state.currentUser.role)) || 'Relawan PIPD',
        wa: (state.currentUser && state.currentUser.wa) || '-'
    };

    const resolvedName = u.nama || userName;
    currentActiveProfilDetail = {
        nama: resolvedName,
        nim: u.nim || '-',
        username: u.username || u.nim || '-',
        password: (u.nim && u.nim !== '-') ? (u.nim + 'pipd') : 'volabs123',
        smt: u.smt || '-',
        fak: u.fak || '-',
        jur: u.jur || '-',
        div: u.div || '-',
        wa: u.wa || '-',
        email: u.email || '-',
        tglLahir: u.tglLahir || '-'
    };
    state.currentActiveProfilDetail = currentActiveProfilDetail;

    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    const isSelf = state.currentUser && (
        state.currentUser.namaLengkap.toLowerCase() === resolvedName.toLowerCase() ||
        (state.currentUser.nim && state.currentUser.nim === u.nim)
    );

    const backBtnText = document.getElementById('btn-back-profil-text');
    const profilTitle = document.getElementById('profil-detail-title');
    const profilSubtitle = document.getElementById('profil-detail-subtitle');
    const switchContainerUp = document.getElementById('modal-profil-uploader-switch-container');
    const switchContainerEd = document.getElementById('modal-profil-editor-switch-container');

    if (!isAdmin || isSelf) {
        if (profilTitle) profilTitle.textContent = isSelf ? "Profil Saya" : "Detail Profil Relawan";
        if (profilSubtitle) profilSubtitle.textContent = "Informasi data akun, akademik, dan keaktifan relawan PIPD";
        if (backBtnText) backBtnText.textContent = "Kembali ke Dasbor";
    } else {
        if (profilTitle) profilTitle.textContent = "Detail Profil & Kredensial Relawan";
        if (profilSubtitle) profilSubtitle.textContent = "Informasi keaktifan dan hak akses anggota";
        if (backBtnText) backBtnText.textContent = "Kembali ke Direktori";
    }

    if (switchContainerUp) {
        switchContainerUp.style.display = isAdmin ? 'inline-flex' : 'none';
    }
    if (switchContainerEd) {
        switchContainerEd.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    const meta = getDivisiMeta(currentActiveProfilDetail.div);
    const initials = getInitials(resolvedName);

    const avatarEl = document.getElementById('modal-profil-avatar');
    if (avatarEl) {
        avatarEl.textContent = initials;
        avatarEl.style.color = meta.color;
    }
    const namaEl = document.getElementById('modal-profil-nama');
    if (namaEl) namaEl.textContent = resolvedName;
    const nimEl = document.getElementById('modal-profil-nim');
    if (nimEl) nimEl.textContent = currentActiveProfilDetail.nim;
    const divBadgeEl = document.getElementById('modal-profil-div-badge');
    if (divBadgeEl) {
        divBadgeEl.textContent = isAdmin ? 'Administrator' : currentActiveProfilDetail.div;
    }

    const userValEl = document.getElementById('modal-profil-user-val');
    if (userValEl) userValEl.textContent = currentActiveProfilDetail.username;
    
    isModalPassVisible = false;
    const passValEl = document.getElementById('modal-profil-pass-val');
    if (passValEl) passValEl.textContent = '••••••••';
    const iconPass = document.getElementById('icon-modal-pass-eye');
    if (iconPass) {
        iconPass.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
    }

    const fakEl = document.getElementById('modal-profil-fak');
    if (fakEl) fakEl.textContent = currentActiveProfilDetail.fak;
    const jurEl = document.getElementById('modal-profil-jur');
    if (jurEl) jurEl.textContent = currentActiveProfilDetail.jur;
    const smtEl = document.getElementById('modal-profil-smt');
    if (smtEl) smtEl.textContent = currentActiveProfilDetail.smt !== '-' ? 'Semester ' + currentActiveProfilDetail.smt : '-';
    const divEl = document.getElementById('modal-profil-div');
    if (divEl) divEl.textContent = currentActiveProfilDetail.div;

    const formattedWa = formatWaNumber(currentActiveProfilDetail.wa);
    const waNumEl = document.getElementById('modal-profil-wa-num');
    if (waNumEl) waNumEl.textContent = formattedWa;
    const cleanWa = cleanWaForUrl(currentActiveProfilDetail.wa);
    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent('Halo ' + resolvedName + ', kami dari VoLabs PIPD...')}`;
    const waBtn = document.getElementById('modal-profil-wa-btn');
    if (waBtn) waBtn.href = waUrl;

    const statAbsenEl = document.getElementById('modal-profil-stat-absen');
    let hasAbsenToday = false;
    if (window.todayAbsensiList && Array.isArray(window.todayAbsensiList)) {
        hasAbsenToday = window.todayAbsensiList.some(item => (item.nama || '').trim().toLowerCase() === resolvedName.trim().toLowerCase());
    }
    if (statAbsenEl) {
        if (hasAbsenToday) {
            statAbsenEl.textContent = 'Sudah Hadir';
            statAbsenEl.style.color = '#10b981';
        } else {
            statAbsenEl.textContent = 'Belum Hadir';
            statAbsenEl.style.color = '#f59e0b';
        }
    }

    let kontenCount = 0;
    if (Array.isArray(state.contentPlans)) {
        kontenCount = state.contentPlans.filter(p => (p.PIC || '').trim().toLowerCase() === resolvedName.trim().toLowerCase()).length;
    }
    const statKontenEl = document.getElementById('modal-profil-stat-konten');
    if (statKontenEl) statKontenEl.textContent = `${kontenCount} Konten`;

    let jurnalCount = 0;
    try {
        const savedJurnal = localStorage.getItem(`volabs_jurnal_kkn_list_${resolvedName}`);
        if (savedJurnal) {
            const parsed = JSON.parse(savedJurnal);
            if (Array.isArray(parsed)) jurnalCount = parsed.length;
        }
    } catch (e) { }
    const statJurnalEl = document.getElementById('modal-profil-stat-jurnal');
    if (statJurnalEl) statJurnalEl.textContent = `${jurnalCount} Kegiatan`;

    updateModalProfilUploaderUI(resolvedName);
    updateModalProfilEditorUI(resolvedName);

    if (triggerNavigate && typeof window.navigateTo === 'function') {
        navigateTo('/profil/detail');
    }
}

export function handleBackProfil() {
    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    if (isAdmin) {
        if (typeof window.navigateTo === 'function') window.navigateTo('/profil');
    } else {
        if (typeof window.navigateTo === 'function') window.navigateTo('/dashboard');
    }
}

export function closeDetailProfilModal() {
    handleBackProfil();
}

export function toggleModalPassword() {
    if (!currentActiveProfilDetail) return;
    const passValEl = document.getElementById('modal-profil-pass-val');
    const iconPass = document.getElementById('icon-modal-pass-eye');
    isModalPassVisible = !isModalPassVisible;
    if (isModalPassVisible) {
        passValEl.textContent = currentActiveProfilDetail.password;
        if (iconPass) {
            iconPass.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';
        }
    } else {
        passValEl.textContent = '••••••••';
        if (iconPass) {
            iconPass.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
        }
    }
}

export function copyModalPassword() {
    if (!currentActiveProfilDetail) return;
    navigator.clipboard.writeText(currentActiveProfilDetail.password).then(() => {
        showCustomDialog({
            title: "Disalin",
            message: "Password default user berhasil disalin ke clipboard!",
            confirmText: "OK"
        });
    });
}

export function copyProfilField(elementId, fieldName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
        showCustomDialog({
            title: "Disalin",
            message: `${fieldName} (${text}) berhasil disalin ke clipboard!`,
            confirmText: "OK"
        });
    });
}

export function salinRingkasanProfil() {
    if (!currentActiveProfilDetail) return;
    const u = currentActiveProfilDetail;
    const text = `PROFIL VOLUNTEER PIPD\n` +
        `Nama: ${u.nama}\n` +
        `NIM: ${u.nim}\n` +
        `Divisi: ${u.div}\n` +
        `Fakultas: ${u.fak}\n` +
        `Program Studi: ${u.jur}\n` +
        `Semester: ${u.smt}\n` +
        (u.tglLahir && u.tglLahir !== '-' ? `Tanggal Lahir: ${u.tglLahir}\n` : '') +
        (u.email && u.email !== '-' ? `Email: ${u.email}\n` : '') +
        `WhatsApp: ${formatWaNumber(u.wa)}\n` +
        `Username: ${u.username}\n` +
        `Password: ${u.password}`;

    navigator.clipboard.writeText(text).then(() => {
        showCustomDialog({
            title: "Biodata Disalin",
            message: `Ringkasan profil ${u.nama} berhasil disalin ke clipboard!`,
            confirmText: "OK"
        });
    });
}

export function exportProfilUserCsv() {
    const users = Object.keys(dataVolunteer)
        .sort((a, b) => a.localeCompare(b, 'id'))
        .map((name, idx) => {
        const item = dataVolunteer[name];
        return {
            no: idx + 1,
            nama: name,
            nim: item.nim || '-',
            username: item.nim || '-',
            password: (item.nim || '') + 'pipd',
            smt: item.smt || '-',
            fak: item.fak || '-',
            jur: item.jur || '-',
            div: item.div || '-',
            wa: formatWaNumber(item.wa),
            email: item.email || '-',
            tglLahir: item.tglLahir || '-'
        };
    });

    const headers = ["No", "Nama Lengkap", "NIM", "Username", "Password Default", "Semester", "Fakultas", "Program Studi", "Divisi", "WhatsApp", "Email", "Tanggal Lahir"];
    const rows = users.map(u => [
        u.no,
        `"${u.nama.replace(/"/g, '""')}"`,
        `"${u.nim}"`,
        `"${u.username}"`,
        `"${u.password}"`,
        `"${u.smt}"`,
        `"${u.fak}"`,
        `"${u.jur.replace(/"/g, '""')}"`,
        `"${u.div.replace(/"/g, '""')}"`,
        `"${u.wa}"`,
        `"${u.email}"`,
        `"${u.tglLahir}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Data_Profil_Volunteer_PIPD_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function toggleUploaderRole(userName, newStatus) {
    let list = state.getUploaderList();
    const norm = s => (s || '').toLowerCase().replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim();
    const normStrip = s => (s || '').toLowerCase().replace(/['’`\s]/g, '');
    const targetNorm = norm(userName);
    const targetStrip = normStrip(userName);

    if (newStatus) {
        if (!list.some(n => norm(n) === targetNorm || normStrip(n) === targetStrip)) {
            list.push(userName);
        }
    } else {
        list = list.filter(n => norm(n) !== targetNorm && normStrip(n) !== targetStrip);
    }
    localStorage.setItem('volabs_uploaders_list', JSON.stringify(list));

    if (state.currentUser) {
        const myName = norm(state.currentUser.namaLengkap);
        const myNim = norm(state.currentUser.nim);
        if (myName === targetNorm || normStrip(state.currentUser.namaLengkap) === targetStrip || myNim === targetNorm) {
            state.currentUser.isUploader = newStatus;
            localStorage.setItem('volabs_user', JSON.stringify(state.currentUser));
            applyRBAC();
        }
    }

    if (db) {
        try {
            await db.collection('app_settings').doc('uploaders').set({
                list: list,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (fbErr) {
            console.warn("Firestore uploader sync error:", fbErr);
        }
    }

    renderProfilUser();
    if (currentActiveProfilDetail) {
        const detailNorm = norm(currentActiveProfilDetail.nama);
        if (detailNorm === targetNorm || normStrip(currentActiveProfilDetail.nama) === targetStrip) {
            updateModalProfilUploaderUI(currentActiveProfilDetail.nama);
        }
    }
    showCustomDialog({
        title: "Peran Uploader Diperbarui",
        message: `Peran Uploader untuk ${userName} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
        confirmText: "OK"
    });
}

export function updateModalProfilUploaderUI(userName) {
    const isUp = state.isUserUploader(userName);
    const statusEl = document.getElementById('modal-profil-uploader-status');
    const switchEl = document.getElementById('modal-profil-toggle-uploader-switch');
    if (statusEl) {
        statusEl.innerHTML = isUp 
            ? '<span class="badge-role-uploader">Aktif</span>' 
            : '<span class="badge-uploader-off">Nonaktif</span>';
    }
    if (switchEl) {
        switchEl.checked = isUp;
    }
}

export function handleModalToggleUploader(isChecked) {
    if (!currentActiveProfilDetail) return;
    const userName = currentActiveProfilDetail.nama;
    const targetStatus = typeof isChecked === 'boolean' ? isChecked : !state.isUserUploader(userName);
    toggleUploaderRole(userName, targetStatus);
}

export async function toggleEditorRole(userName, newStatus) {
    let list = state.getEditorList();
    const norm = s => (s || '').toLowerCase().replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim();
    const normStrip = s => (s || '').toLowerCase().replace(/['’`\s]/g, '');
    const targetNorm = norm(userName);
    const targetStrip = normStrip(userName);

    if (newStatus) {
        if (!list.some(n => norm(n) === targetNorm || normStrip(n) === targetStrip)) {
            list.push(userName);
        }
    } else {
        list = list.filter(n => norm(n) !== targetNorm && normStrip(n) !== targetStrip);
    }
    localStorage.setItem('volabs_editors_list', JSON.stringify(list));

    if (state.currentUser) {
        const myName = norm(state.currentUser.namaLengkap);
        const myNim = norm(state.currentUser.nim);
        if (myName === targetNorm || normStrip(state.currentUser.namaLengkap) === targetStrip || myNim === targetNorm) {
            state.currentUser.isEditor = newStatus;
            localStorage.setItem('volabs_user', JSON.stringify(state.currentUser));
            applyRBAC();
        }
    }

    if (db) {
        try {
            await db.collection('app_settings').doc('editors').set({
                list: list,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (fbErr) {
            console.warn("Firestore editor sync error:", fbErr);
        }
    }

    renderProfilUser();
    if (currentActiveProfilDetail) {
        const detailNorm = norm(currentActiveProfilDetail.nama);
        if (detailNorm === targetNorm || normStrip(currentActiveProfilDetail.nama) === targetStrip) {
            updateModalProfilEditorUI(currentActiveProfilDetail.nama);
        }
    }
    showCustomDialog({
        title: "Peran Editor Diperbarui",
        message: `Peran Editor untuk ${userName} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
        confirmText: "OK"
    });
}

export function updateModalProfilEditorUI(userName) {
    const isEd = state.isUserEditor(userName);
    const statusEl = document.getElementById('modal-profil-editor-status');
    const switchEl = document.getElementById('modal-profil-toggle-editor-switch');
    if (statusEl) {
        statusEl.innerHTML = isEd 
            ? '<span class="badge-role-editor" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 700;">Aktif</span>' 
            : '<span class="badge-uploader-off">Nonaktif</span>';
    }
    if (switchEl) {
        switchEl.checked = isEd;
    }
}

export function handleModalToggleEditor(isChecked) {
    if (!currentActiveProfilDetail) return;
    const userName = currentActiveProfilDetail.nama;
    const targetStatus = typeof isChecked === 'boolean' ? isChecked : !state.isUserEditor(userName);
    toggleEditorRole(userName, targetStatus);
}

// Global safe helpers immune to quotes/special characters in names
window.openDetailProfilSafe = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    openDetailProfilModal(name);
};
window.toggleUploaderRoleSafe = function(encodedName, isChecked) {
    const name = decodeURIComponent(encodedName);
    toggleUploaderRole(name, isChecked);
};
window.toggleEditorRoleSafe = function(encodedName, isChecked) {
    const name = decodeURIComponent(encodedName);
    toggleEditorRole(name, isChecked);
};

export function initProfil() {
    window.renderProfilUser = renderProfilUser;
    window.setProfilViewMode = setProfilViewMode;
    window.openDetailProfilModal = openDetailProfilModal;
    window.showProfilDetail = openDetailProfilModal;
    window.closeDetailProfilModal = closeDetailProfilModal;
    window.handleBackProfil = handleBackProfil;
    window.toggleModalPassword = toggleModalPassword;
    window.copyModalPassword = copyModalPassword;
    window.copyProfilField = copyProfilField;
    window.salinRingkasanProfil = salinRingkasanProfil;
    window.exportProfilUserCsv = exportProfilUserCsv;
    window.toggleUploaderRole = toggleUploaderRole;
    window.handleModalToggleUploader = handleModalToggleUploader;
    window.updateModalProfilUploaderUI = updateModalProfilUploaderUI;
    window.toggleEditorRole = toggleEditorRole;
    window.handleModalToggleEditor = handleModalToggleEditor;
    window.updateModalProfilEditorUI = updateModalProfilEditorUI;
    window.findVolunteer = findVolunteer;

    const btnCards = document.getElementById('btn-profil-view-cards');
    const btnTable = document.getElementById('btn-profil-view-table');
    if (btnCards) btnCards.addEventListener('click', () => setProfilViewMode('cards'));
    if (btnTable) btnTable.addEventListener('click', () => setProfilViewMode('table'));

    const defaultMode = window.innerWidth <= 850 ? 'cards' : 'table';
    setProfilViewMode(defaultMode);

    const btnExport = document.getElementById('btn-export-profil-csv');
    if (btnExport) btnExport.addEventListener('click', exportProfilUserCsv);

    const btnClose = document.getElementById('btn-close-detail-profil');
    if (btnClose) btnClose.addEventListener('click', closeDetailProfilModal);

    ['search-profil-input', 'search-profil', 'filter-profil-divisi', 'filter-profil-fakultas', 'filter-profil-semester'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderProfilUser);
    });
}
