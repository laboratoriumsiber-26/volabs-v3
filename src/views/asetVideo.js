// Bank Material & Aset RAW Video Module (Universal View, Admin Write)
import { state } from '../store/state.js';
import { db, saveAsetVideoList } from '../services/firebase.js';
import { showCustomDialog } from '../utils/dialog.js';
import { formatTanggalIndo } from '../utils/helpers.js';
import { getSkeletonCards, getSkeletonTableRows } from '../utils/skeleton.js';

export const asetVideoTemplate = `
        <section id="view-aset-video" class="view-section">
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-main); font-weight: 700;">Bank Material Video</h3>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn-primary" id="btn-tambah-aset-video" onclick="openAsetModal()" style="display: none;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>Tambah Material</span>
                    </button>
                </div>
            </div>

            <!-- Category Filter Tabs -->
            <div style="display: flex; gap: 6px; border-bottom: 1px solid var(--border-color); margin-bottom: 1.25rem; overflow-x: auto; padding-bottom: 2px;">
                <button type="button" class="tab-btn active" id="tab-aset-all" onclick="filterAsetKategori('ALL')"
                    style="padding: 10px 16px; font-weight: 700; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--primary); border-bottom: 2px solid var(--primary); white-space: nowrap;">
                    Semua Material
                </button>
                <button type="button" class="tab-btn" id="tab-aset-footage" onclick="filterAsetKategori('Footage RAW / B-Roll')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; white-space: nowrap;">
                    Footage RAW / B-Roll
                </button>
                <button type="button" class="tab-btn" id="tab-aset-bumper" onclick="filterAsetKategori('Bumper & Intro')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; white-space: nowrap;">
                    Bumper & Intro
                </button>
                <button type="button" class="tab-btn" id="tab-aset-audio" onclick="filterAsetKategori('Audio & SFX')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; white-space: nowrap;">
                    Audio & SFX
                </button>
                <button type="button" class="tab-btn" id="tab-aset-template" onclick="filterAsetKategori('Template & Overlay')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; white-space: nowrap;">
                    Template & Overlay
                </button>
                <button type="button" class="tab-btn" id="tab-aset-grafis" onclick="filterAsetKategori('Logo & Grafis')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; white-space: nowrap;">
                    Logo & Grafis
                </button>
                <button type="button" class="tab-btn" id="tab-aset-lain" onclick="filterAsetKategori('Lain-lain')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; white-space: nowrap;">
                    Lain-lain
                </button>
            </div>

            <!-- Controls bar -->
            <div class="control-bar" style="margin-bottom: 1rem;">
                <div class="filters-group" style="flex: 1;">
                    <input type="text" id="search-aset-input" class="filter-select"
                        placeholder="Cari nama material aset, format, deskripsi..." oninput="renderAsetVideo()"
                        style="flex: 1 1 220px; min-width: 0; width: 100%;">
                </div>
                <div class="view-toggle-btns">
                    <button class="toggle-btn" id="btn-aset-view-cards" onclick="setAsetViewMode('cards', true)">Kartu (Mobile)</button>
                    <button class="toggle-btn" id="btn-aset-view-table" onclick="setAsetViewMode('table', true)">Tabel (Desktop)</button>
                </div>
            </div>

            <div class="view-switcher-bar" style="margin-bottom: 0.85rem;">
                <span id="aset-counter-label"
                    style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Menampilkan 0 material</span>
            </div>

            <!-- Container Kartu & Tabel -->
            <div id="aset-cards-container" class="cards-container">
                ${getSkeletonCards(3)}
            </div>
            <div id="aset-table-container" class="table-wrapper" style="display: none;">
                <table class="content-table" style="min-width: 760px; width: 100%;">
                    <thead id="aset-table-head">
                        <tr>
                            <th style="width: 40px; text-align: center;">No</th>
                            <th>Nama Material & Deskripsi</th>
                            <th>Kategori</th>
                            <th>Format / Ukuran</th>
                            <th>Ditambahkan Oleh</th>
                            <th>Tanggal</th>
                            <th>Akses Google Drive</th>
                            <th style="text-align: center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="aset-table-body">
                        ${getSkeletonTableRows(8, 4)}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- MODAL FORM TAMBAH / EDIT ASET (KHUSUS ADMIN) -->
        <div class="modal-overlay" id="modal-aset-video" style="display: none; z-index: 350;">
            <div class="modal-box" style="max-width: 580px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-aset-title">Tambah Material Aset Video</h3>
                    <button class="btn-close" type="button" onclick="closeAsetModal()" title="Tutup">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="form-aset-video" onsubmit="submitAsetModal(event)">
                    <div class="modal-body" style="display: flex; flex-direction: column; gap: 0.85rem;">
                        <input type="hidden" id="aset-input-id">

                        <div class="form-group">
                            <label class="form-label" style="font-size: 12px; font-weight: 700;">
                                Nama / Judul Material Aset <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="text" id="aset-input-nama" class="form-input" placeholder="Contoh: Bumper Opening PIPD 2026 (4K & 60FPS)" required>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="form-group">
                                <label class="form-label" style="font-size: 12px; font-weight: 700;">
                                    Kategori Aset <span style="color: #ef4444;">*</span>
                                </label>
                                <select id="aset-input-kategori" class="form-select" required>
                                    <option value="Footage RAW / B-Roll">Footage RAW / B-Roll</option>
                                    <option value="Bumper & Intro">Bumper & Intro</option>
                                    <option value="Audio & SFX">Audio & SFX</option>
                                    <option value="Template & Overlay">Template & Overlay</option>
                                    <option value="Logo & Grafis">Logo & Grafis</option>
                                    <option value="Lain-lain">Lain-lain</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="font-size: 12px; font-weight: 700;">
                                    Format File
                                </label>
                                <input type="text" id="aset-input-format" class="form-input" placeholder="Contoh: MP4 4K, ZIP, WAV 48kHz, MOGRT">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="form-group">
                                <label class="form-label" style="font-size: 12px; font-weight: 700;">
                                    Ukuran / Durasi File (Opsional)
                                </label>
                                <input type="text" id="aset-input-size" class="form-input" placeholder="Contoh: 1.2 GB, 250 MB, 15 Detik">
                            </div>
                            <div class="form-group">
                                <label class="form-label" style="font-size: 12px; font-weight: 700;">
                                    Tautan Google Drive (Folder/File) <span style="color: #ef4444;">*</span>
                                </label>
                                <input type="url" id="aset-input-drive" class="form-input" placeholder="https://drive.google.com/drive/folders/..." required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-size: 12px; font-weight: 700;">
                                Deskripsi & Catatan Penggunaan
                            </label>
                            <textarea id="aset-input-desc" class="form-input" rows="3" placeholder="Tuliskan petunjuk pemakaian, resolusi, color grading, atau ketentuan lisensi aset ini..."></textarea>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="closeAsetModal()">Batal</button>
                        <button type="submit" class="btn-primary">
                            Simpan Material Aset
                        </button>
                    </div>
                </form>
            </div>
        </div>
`;

let currentAsetKategori = 'ALL';
let asetViewMode = null;
let userExplicitlyToggledMode = false;

export function getDeviceDefaultMode() {
    return window.innerWidth <= 850 ? 'cards' : 'table';
}

export function getStoredAsetList() {
    try {
        const stored = localStorage.getItem('volabs_aset_video_list');
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            const dummyIds = ['ASET-101', 'ASET-102', 'ASET-103', 'ASET-104', 'ASET-105'];
            const clean = Array.isArray(parsed) ? parsed.filter(a => !dummyIds.includes(a.id) && !String(a.driveUrl || '').includes('sample-')) : [];
            if (clean.length !== parsed.length) {
                localStorage.setItem('volabs_aset_video_list', JSON.stringify(clean));
                state.asetVideoList = clean;
            }
            return clean;
        }
        return [];
    } catch (e) {
        return [];
    }
}

export function saveStoredAsetList(list) {
    state.asetVideoList = list;
    localStorage.setItem('volabs_aset_video_list', JSON.stringify(list));
}

export function getKategoriMeta(kategori) {
    switch (kategori) {
        case 'Footage RAW / B-Roll':
            return { color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)' };
        case 'Bumper & Intro':
            return { color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.3)' };
        case 'Audio & SFX':
            return { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.3)' };
        case 'Template & Overlay':
            return { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)', border: 'rgba(124, 58, 237, 0.3)' };
        case 'Logo & Grafis':
            return { color: '#e11d48', bg: 'rgba(225, 29, 72, 0.12)', border: 'rgba(225, 29, 72, 0.3)' };
        default:
            return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)' };
    }
}

export function filterAsetKategori(kategori) {
    currentAsetKategori = kategori;
    const tabIds = {
        'ALL': 'tab-aset-all',
        'Footage RAW / B-Roll': 'tab-aset-footage',
        'Bumper & Intro': 'tab-aset-bumper',
        'Audio & SFX': 'tab-aset-audio',
        'Template & Overlay': 'tab-aset-template',
        'Logo & Grafis': 'tab-aset-grafis',
        'Lain-lain': 'tab-aset-lain'
    };

    Object.keys(tabIds).forEach(k => {
        const btn = document.getElementById(tabIds[k]);
        if (btn) {
            if (k === kategori) {
                btn.classList.add('active');
                btn.style.color = 'var(--primary)';
                btn.style.borderBottom = '2px solid var(--primary)';
                btn.style.fontWeight = '700';
            } else {
                btn.classList.remove('active');
                btn.style.color = 'var(--text-muted)';
                btn.style.borderBottom = '2px solid transparent';
                btn.style.fontWeight = '600';
            }
        }
    });

    renderAsetVideo();
}

export function setAsetViewMode(mode, isManual = true) {
    if (isManual) {
        userExplicitlyToggledMode = true;
    }
    asetViewMode = mode;
    state.asetViewMode = mode;
    const cards = document.getElementById('aset-cards-container');
    const table = document.getElementById('aset-table-container');
    const btnCards = document.getElementById('btn-aset-view-cards');
    const btnTable = document.getElementById('btn-aset-view-table');

    if (mode === 'cards') {
        if (cards) cards.style.display = 'grid';
        if (table) table.style.display = 'none';
        if (btnCards) btnCards.classList.add('active');
        if (btnTable) btnTable.classList.remove('active');
    } else {
        if (cards) cards.style.display = 'none';
        if (table) table.style.display = 'block';
        if (btnCards) btnCards.classList.remove('active');
        if (btnTable) btnTable.classList.add('active');
    }
}

export function renderAsetVideo() {
    // Otomatis tentukan mode default: HP => Kartu (Mobile), Desktop => Tabel (Desktop)
    if (!userExplicitlyToggledMode || !asetViewMode) {
        setAsetViewMode(getDeviceDefaultMode(), false);
    } else {
        setAsetViewMode(asetViewMode, false);
    }

    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    
    // Tampilkan tombol Tambah Aset hanya untuk Admin
    const btnTambah = document.getElementById('btn-tambah-aset-video');
    if (btnTambah) {
        btnTambah.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    const items = getStoredAsetList();
    const searchVal = (document.getElementById('search-aset-input')?.value || '').toLowerCase().trim();

    const filtered = items.filter(item => {
        if (currentAsetKategori !== 'ALL' && item.kategori !== currentAsetKategori) {
            return false;
        }
        if (searchVal) {
            const matchNama = (item.nama || '').toLowerCase().includes(searchVal);
            const matchKat = (item.kategori || '').toLowerCase().includes(searchVal);
            const matchFmt = (item.format || '').toLowerCase().includes(searchVal);
            const matchDesc = (item.deskripsi || '').toLowerCase().includes(searchVal);
            if (!matchNama && !matchKat && !matchFmt && !matchDesc) return false;
        }
        return true;
    });

    const countEl = document.getElementById('aset-counter-label');
    if (countEl) {
        countEl.textContent = `Menampilkan ${filtered.length} dari ${items.length} material aset`;
    }

    // Render Cards View
    const cardsContainer = document.getElementById('aset-cards-container');
    if (cardsContainer) {
        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Tidak Ada Material Aset</div>
                    <div style="font-size: 12px;">Belum ada material yang cocok dengan filter atau pencarian saat ini.</div>
                </div>
            `;
        } else {
            cardsContainer.innerHTML = filtered.map(item => {
                const meta = getKategoriMeta(item.kategori);
                const safeUrl = item.driveUrl || '#';
                const formatBadge = item.format 
                    ? `<span style="font-family: monospace; font-size: 11px; background: var(--bg-tertiary); color: var(--text-main); padding: 2px 7px; border-radius: 6px; font-weight: 600; border: 1px solid var(--border-color);">${item.format}</span>`
                    : '';
                const sizeBadge = item.size
                    ? `<span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Ukuran: ${item.size}</span>`
                    : '';

                const adminActions = isAdmin ? `
                    <div style="display: flex; gap: 6px; margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                        <button type="button" class="btn-secondary" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="window.openAsetModal('${item.id}')">
                            Edit
                        </button>
                        <button type="button" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="window.deleteAset('${item.id}')">
                            Hapus
                        </button>
                    </div>
                ` : '';

                return `
                    <div class="content-card" style="display: flex; flex-direction: column; justify-content: space-between; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                                <span style="font-size: 11px; font-weight: 700; color: ${meta.color}; background: ${meta.bg}; border: 1px solid ${meta.border}; padding: 2px 8px; border-radius: 8px;">
                                    ${item.kategori}
                                </span>
                                ${formatBadge}
                            </div>
                            <div style="font-weight: 800; font-size: 14.5px; color: var(--text-main); line-height: 1.35; margin-bottom: 6px;">
                                ${item.nama}
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); line-height: 1.45; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                ${item.deskripsi || 'Tidak ada deskripsi tambahan.'}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-light); margin-bottom: 10px;">
                                ${sizeBadge}
                                <span>Oleh: <b>${item.uploader || 'Admin'}</b></span>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; gap: 6px; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
                                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary"
                                    style="flex: 2; padding: 7px 12px; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
                                    </svg>
                                    <span>Unduh / Buka Drive</span>
                                </a>
                                <button type="button" class="btn-secondary" style="flex: 1; padding: 7px 8px; font-size: 11.5px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" onclick="window.copyAsetLink('${safeUrl}')" title="Salin Tautan Google Drive">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                    </svg>
                                    <span>Salin</span>
                                </button>
                            </div>
                            ${adminActions}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Render Table View
    const tableBody = document.getElementById('aset-table-body');
    if (tableBody) {
        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">Tidak ada material aset.</td></tr>`;
        } else {
            tableBody.innerHTML = filtered.map((item, idx) => {
                const meta = getKategoriMeta(item.kategori);
                const safeUrl = item.driveUrl || '#';
                const adminTableBtns = isAdmin ? `
                    <div style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;">
                        <button type="button" class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="window.openAsetModal('${item.id}')">Edit</button>
                        <button type="button" class="btn-secondary" style="padding: 2px 6px; font-size: 10px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="window.deleteAset('${item.id}')">Hapus</button>
                    </div>
                ` : '';

                return `
                    <tr>
                        <td style="text-align: center; font-weight: 600; font-size: 12px;">${idx + 1}</td>
                        <td>
                            <div style="font-weight: 700; font-size: 13.5px; color: var(--text-main); margin-bottom: 2px;">${item.nama}</div>
                            <div style="font-size: 11px; color: var(--text-muted); line-height: 1.35;">${item.deskripsi || '-'}</div>
                        </td>
                        <td>
                            <span style="font-size: 11px; font-weight: 700; color: ${meta.color}; background: ${meta.bg}; border: 1px solid ${meta.border}; padding: 2px 8px; border-radius: 8px; white-space: nowrap;">
                                ${item.kategori}
                            </span>
                        </td>
                        <td>
                            <div style="font-weight: 600; font-size: 12px;">${item.format || '-'}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${item.size ? 'Ukuran: ' + item.size : '-'}</div>
                        </td>
                        <td style="font-size: 12px; font-weight: 600;">${item.uploader || 'Admin'}</td>
                        <td style="white-space: nowrap; font-size: 11.5px; color: var(--text-muted);">${item.createdAt ? formatTanggalIndo(item.createdAt.split('T')[0]) : '-'}</td>
                        <td style="white-space: nowrap;">
                            <div style="display: flex; gap: 4px; align-items: center;">
                                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">
                                    Drive
                                </a>
                                <button type="button" class="btn-secondary" style="padding: 3px 6px; font-size: 11px;" onclick="window.copyAsetLink('${safeUrl}')" title="Salin Link">
                                    Salin
                                </button>
                            </div>
                        </td>
                        <td style="text-align: center;">
                            ${isAdmin ? adminTableBtns : '<span style="color: var(--text-muted); font-size: 11px;">-</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

export function openAsetModal(asetId = null) {
    const modal = document.getElementById('modal-aset-video');
    const titleEl = document.getElementById('modal-aset-title');
    const inputId = document.getElementById('aset-input-id');
    const inputNama = document.getElementById('aset-input-nama');
    const inputKat = document.getElementById('aset-input-kategori');
    const inputFormat = document.getElementById('aset-input-format');
    const inputSize = document.getElementById('aset-input-size');
    const inputDrive = document.getElementById('aset-input-drive');
    const inputDesc = document.getElementById('aset-input-desc');

    if (!modal) return;

    if (asetId) {
        const list = getStoredAsetList();
        const item = list.find(x => String(x.id) === String(asetId));
        if (item) {
            if (titleEl) titleEl.textContent = 'Edit Material Aset Video';
            if (inputId) inputId.value = item.id;
            if (inputNama) inputNama.value = item.nama || '';
            if (inputKat) inputKat.value = item.kategori || 'Footage RAW / B-Roll';
            if (inputFormat) inputFormat.value = item.format || '';
            if (inputSize) inputSize.value = item.size || '';
            if (inputDrive) inputDrive.value = item.driveUrl || '';
            if (inputDesc) inputDesc.value = item.deskripsi || '';
        }
    } else {
        if (titleEl) titleEl.textContent = 'Tambah Material Aset Video';
        if (inputId) inputId.value = '';
        if (inputNama) inputNama.value = '';
        if (inputKat) inputKat.value = 'Footage RAW / B-Roll';
        if (inputFormat) inputFormat.value = '';
        if (inputSize) inputSize.value = '';
        if (inputDrive) inputDrive.value = '';
        if (inputDesc) inputDesc.value = '';
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
}

export function closeAsetModal() {
    const modal = document.getElementById('modal-aset-video');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

export async function submitAsetModal(e) {
    if (e && e.preventDefault) e.preventDefault();

    const idVal = document.getElementById('aset-input-id')?.value;
    const nama = (document.getElementById('aset-input-nama')?.value || '').trim();
    const kategori = document.getElementById('aset-input-kategori')?.value || 'Footage RAW / B-Roll';
    const format = (document.getElementById('aset-input-format')?.value || '').trim();
    const size = (document.getElementById('aset-input-size')?.value || '').trim();
    const driveUrl = (document.getElementById('aset-input-drive')?.value || '').trim();
    const deskripsi = (document.getElementById('aset-input-desc')?.value || '').trim();

    if (!nama || !driveUrl) {
        showCustomDialog({
            title: "Validasi Form",
            message: "Mohon isi Nama Material dan Tautan Google Drive!",
            confirmText: "Mengerti"
        });
        return;
    }

    let list = getStoredAsetList();
    const uploaderName = state.currentUser ? state.currentUser.namaLengkap : 'Admin';

    if (idVal) {
        // Edit existing
        const idx = list.findIndex(x => String(x.id) === String(idVal));
        if (idx !== -1) {
            list[idx] = {
                ...list[idx],
                nama,
                kategori,
                format,
                size,
                driveUrl,
                deskripsi,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Tambah baru
        const newItem = {
            id: 'ASET-' + Date.now(),
            nama,
            kategori,
            format,
            size,
            driveUrl,
            deskripsi,
            uploader: uploaderName,
            createdAt: new Date().toISOString()
        };
        list.unshift(newItem);
    }

    saveStoredAsetList(list);
    closeAsetModal();
    renderAsetVideo();

    await saveAsetVideoList(list);

    showCustomDialog({
        title: "Aset Berhasil Disimpan",
        message: `Material "${nama}" berhasil ${idVal ? 'diperbarui' : 'ditambahkan ke Bank Material'} dan dapat diakses oleh seluruh anggota tim.`,
        confirmText: "OK"
    });
}

export async function deleteAset(asetId) {
    const list = getStoredAsetList();
    const item = list.find(x => String(x.id) === String(asetId));
    if (!item) return;

    const confirmed = await showCustomDialog({
        title: "Hapus Material Aset",
        message: `Apakah Anda yakin ingin menghapus material "${item.nama}" dari Bank Aset?`,
        confirmText: "Hapus",
        confirmColor: "#ef4444"
    });
    if (!confirmed) return;

    const updated = list.filter(x => String(x.id) !== String(asetId));
    saveStoredAsetList(updated);
    renderAsetVideo();

    await saveAsetVideoList(updated);

    showCustomDialog({
        title: "Aset Dihapus",
        message: "Material aset berhasil dihapus dari sistem.",
        confirmText: "OK"
    });
}

export function copyAsetLink(url) {
    if (!url || url === '#') return;
    navigator.clipboard.writeText(url).then(() => {
        showCustomDialog({
            title: "Tautan Disalin",
            message: "Tautan Google Drive berhasil disalin ke clipboard!",
            confirmText: "OK"
        });
    }).catch(() => {
        prompt("Salin tautan Google Drive berikut:", url);
    });
}

export function initAsetVideo() {
    window.renderAsetVideo = renderAsetVideo;
    window.filterAsetKategori = filterAsetKategori;
    window.setAsetViewMode = setAsetViewMode;
    window.openAsetModal = openAsetModal;
    window.closeAsetModal = closeAsetModal;
    window.submitAsetModal = submitAsetModal;
    window.deleteAset = deleteAset;
    window.copyAsetLink = copyAsetLink;

    const btnCards = document.getElementById('btn-aset-view-cards');
    const btnTable = document.getElementById('btn-aset-view-table');
    if (btnCards) btnCards.addEventListener('click', () => setAsetViewMode('cards', true));
    if (btnTable) btnTable.addEventListener('click', () => setAsetViewMode('table', true));

    const searchInput = document.getElementById('search-aset-input');
    if (searchInput) searchInput.addEventListener('input', renderAsetVideo);

    // Initial default berdasarkan device: HP => Tabel, Desktop => Kartu (Grid)
    setAsetViewMode(getDeviceDefaultMode(), false);

    window.addEventListener('resize', () => {
        if (!userExplicitlyToggledMode) {
            setAsetViewMode(getDeviceDefaultMode(), false);
        }
    });
}
