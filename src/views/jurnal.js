// Jurnal View Module (Daily Service Log for KKN Recognition, Admin Overview, PDF & DOC Generator)
import { state } from '../store/state.js';
import { dataVolunteer } from '../store/initialData.js';
import { api } from '../services/api.js';
import { db, saveJurnalEntry, deleteJurnalEntry } from '../services/firebase.js';
import { showCustomDialog } from '../utils/dialog.js';
import { cleanDate, formatTanggalIndo, getBulanFromTanggal } from '../utils/helpers.js';
import { navigateTo } from '../router/index.js';
import { getSkeletonCards, getSkeletonTableRows } from '../utils/skeleton.js';

export const jurnalTemplate = `
        <section id="view-jurnal-kkn" class="view-section">
            <div
                style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-main); font-weight: 700;">Jurnal Harian
                        Pengabdian (Rekognisi KKN)</h3>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                        <span id="ui-jurnal-nama">-</span> | NIM: <span id="ui-jurnal-nim">-</span> | Prodi: <span
                            id="ui-jurnal-prodi">-</span> | Periode: <span id="ui-jurnal-periode">-</span>
                    </div>
                </div>
                <div>
                    <button class="btn-secondary" id="btn-jurnal-meta-cfg" onclick="window.openJurnalMetaModal()"
                        style="color: var(--primary); border-color: var(--primary);" title="Atur Identitas dan Periode">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; height:18px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z">
                            </path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>Atur Identitas & Periode</span>
                    </button>
                </div>
            </div>

            <!-- Admin View Scope Switcher -->
            <div id="jurnal-admin-scope-tabs" style="display: none; margin-bottom: 1rem;">
                <div
                    style="display: inline-flex; background: var(--bg-tertiary); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-color); gap: 4px;">
                    <button type="button" id="btn-jurnal-scope-all" class="toggle-btn active"
                        onclick="switchJurnalScope('all')"
                        style="padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: var(--radius-sm);">
                        Semua Jurnal Mahasiswa
                    </button>
                    <button type="button" id="btn-jurnal-scope-mine" class="toggle-btn"
                        onclick="switchJurnalScope('mine')"
                        style="padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: var(--radius-sm);">
                        Jurnal Saya
                    </button>
                </div>
            </div>

            <!-- Controls & Filter Bar -->
            <div class="control-bar">
                <div class="filters-group" style="flex: 1; flex-wrap: wrap; gap: 8px;">
                    <select id="filter-jurnal-mahasiswa" class="filter-select" onchange="window.renderJurnalUi()"
                        style="display: none; flex: 1 1 140px; min-width: 0;">
                        <option value="ALL">Semua Mahasiswa</option>
                    </select>

                    <select id="filter-jurnal-bulan" class="filter-select" onchange="window.renderJurnalUi()"
                        style="flex: 1 1 130px; min-width: 0;">
                        <option value="ALL">Semua Bulan</option>
                        <option value="Januari">Januari</option>
                        <option value="Februari">Februari</option>
                        <option value="Maret">Maret</option>
                        <option value="April">April</option>
                        <option value="Mei">Mei</option>
                        <option value="Juni">Juni</option>
                        <option value="Juli">Juli</option>
                        <option value="Agustus">Agustus</option>
                        <option value="September">September</option>
                        <option value="Oktober">Oktober</option>
                        <option value="November">November</option>
                        <option value="Desember">Desember</option>
                    </select>

                    <input type="text" id="filter-jurnal-jam" class="filter-select" placeholder="Cari Jam Shift..."
                        oninput="window.renderJurnalUi()">

                    <select id="filter-jurnal-durasi" class="filter-select" onchange="window.renderJurnalUi()">
                        <option value="ALL">Semua Durasi</option>
                        <option value="1 Jam">1 Jam</option>
                        <option value="2 Jam">2 Jam</option>
                        <option value="3 Jam">3 Jam</option>
                        <option value="4 Jam">4 Jam</option>
                        <option value="5 Jam">5 Jam</option>
                        <option value="6 Jam">6 Jam</option>
                        <option value="7 Jam">7 Jam</option>
                        <option value="8 Jam">8 Jam</option>
                        <option value="9 Jam">9 Jam</option>
                        <option value="10 Jam">10 Jam</option>
                        <option value="11 Jam">11 Jam</option>
                        <option value="12 Jam">12 Jam</option>
                        <option value="13 Jam">13 Jam</option>
                        <option value="14 Jam">14 Jam</option>
                        <option value="15 Jam">15 Jam</option>
                        <option value="16 Jam">16 Jam</option>
                        <option value="17 Jam">17 Jam</option>
                        <option value="18 Jam">18 Jam</option>
                        <option value="19 Jam">19 Jam</option>
                        <option value="20 Jam">20 Jam</option>
                        <option value="21 Jam">21 Jam</option>
                        <option value="22 Jam">22 Jam</option>
                        <option value="23 Jam">23 Jam</option>
                        <option value="24 Jam">24 Jam</option>
                    </select>
                </div>

                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <button class="btn-secondary" onclick="window.printJurnalKkn('pdf')" id="btn-jurnal-pdf"
                        style="color: var(--primary); border-color: var(--primary);" title="Cetak Surat Jurnal ke PDF">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; height:18px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z">
                            </path>
                        </svg>
                        <span>Cetak PDF</span>
                    </button>
                    <button class="btn-secondary" onclick="window.printJurnalKkn('doc')" id="btn-jurnal-doc"
                        style="color: var(--text-main); border-color: var(--border-color);"
                        title="Unduh Dokumen Word (.doc)">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; height:18px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                            </path>
                        </svg>
                        <span>Unduh DOC</span>
                    </button>
                    <button class="btn-primary" id="btn-add-jurnal" onclick="window.openJurnalItemModal(-1)">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>Tambah Kegiatan</span>
                    </button>
                </div>
            </div>

            <!-- View Switcher (Cards vs Table) -->
            <div class="view-switcher-bar"
                style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span id="jurnal-count-label"
                        style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Menampilkan 0
                        kegiatan</span>
                    <span id="jurnal-total-durasi-label"
                        style="font-size: 0.82rem; background: rgba(188, 48, 95, 0.12); color: var(--primary); padding: 3px 10px; border-radius: 12px; font-weight: 700; border: 1px solid rgba(188, 48, 95, 0.25);">Total
                        Durasi: 0 Jam</span>
                </div>
                <div class="view-toggle-btns">
                    <button class="toggle-btn active" id="btn-jurnal-view-cards"
                        onclick="window.setJurnalViewMode('cards')">Kartu (Mobile)</button>
                    <button class="toggle-btn" id="btn-jurnal-view-table"
                        onclick="window.setJurnalViewMode('table')">Tabel (Desktop)</button>
                </div>
            </div>

            <!-- Container Tampilan Kartu -->
            <div id="jurnal-cards-view" class="cards-container">
                ${getSkeletonCards(3)}
            </div>

            <!-- Container Tampilan Tabel -->
            <div id="jurnal-table-view" class="table-wrapper" style="display: none;">
                <table class="content-table">
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">No</th>
                            <th style="width: 140px;">Tanggal</th>
                            <th style="width: 180px;">Jam (Mulai - Selesai)</th>
                            <th style="width: 100px;">Durasi</th>
                            <th>Uraian Kegiatan Pengabdian</th>
                            <th style="width: 160px;">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody id="jurnal-table-body">
                        ${getSkeletonTableRows(6, 4)}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- SECTION PROFIL USER / VOLUNTEER (KHUSUS ADMIN) -->

        <section id="view-jurnal-kkn-form" class="view-section">
            <div class="subview-header-bar">
                <div class="subview-header-left">
                    <button type="button" class="btn-back-nav" onclick="navigateTo('/jurnal')">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Kembali ke Jurnal KKN</span>
                    </button>
                    <div>
                        <h2 class="subview-title" id="modal-jurnal-title">Tambah Kegiatan Jurnal</h2>
                    </div>
                </div>
            </div>
            <div class="subview-card-form">
                <form onsubmit="event.preventDefault(); window.saveJurnalItemModal();" style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="hidden" id="edit-jurnal-index" value="-1">
                    <div class="form-group">
                        <label class="form-label" for="input-jurnal-tanggal">Tanggal Kegiatan *</label>
                        <input type="date" id="input-jurnal-tanggal" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Jam Shift (Mulai – Selesai) *</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="time" id="input-jurnal-jam-mulai" class="form-input" required>
                            <span> s.d. </span>
                            <input type="time" id="input-jurnal-jam-selesai" class="form-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="input-jurnal-durasi">Durasi Pelaksanaan *</label>
                        <select id="input-jurnal-durasi" class="form-select">
                            <option value="1 Jam">1 Jam</option>
                            <option value="2 Jam">2 Jam</option>
                            <option value="3 Jam">3 Jam</option>
                            <option value="4 Jam">4 Jam</option>
                            <option value="5 Jam">5 Jam</option>
                            <option value="6 Jam">6 Jam</option>
                            <option value="7 Jam">7 Jam</option>
                            <option value="8 Jam">8 Jam</option>
                            <option value="9 Jam">9 Jam</option>
                            <option value="10 Jam">10 Jam</option>
                            <option value="11 Jam">11 Jam</option>
                            <option value="12 Jam">12 Jam</option>
                            <option value="13 Jam">13 Jam</option>
                            <option value="14 Jam">14 Jam</option>
                            <option value="15 Jam">15 Jam</option>
                            <option value="16 Jam">16 Jam</option>
                            <option value="17 Jam">17 Jam</option>
                            <option value="18 Jam">18 Jam</option>
                            <option value="19 Jam">19 Jam</option>
                            <option value="20 Jam">20 Jam</option>
                            <option value="21 Jam">21 Jam</option>
                            <option value="22 Jam">22 Jam</option>
                            <option value="23 Jam">23 Jam</option>
                            <option value="24 Jam">24 Jam</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="input-jurnal-uraian">Uraian / Deskripsi Kegiatan *</label>
                        <textarea id="input-jurnal-uraian" class="form-input" rows="4"
                            placeholder="Tuliskan secara lengkap detail aktivitas pengabdian kepada masyarakat yang dilakukan..."
                            required style="resize: vertical;"></textarea>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <button type="button" class="btn-secondary" onclick="navigateTo('/jurnal')">Batal</button>
                        <button type="submit" class="btn-primary">Simpan Kegiatan</button>
                    </div>
                </form>
            </div>
        </section>

        <!-- SUB-VIEW 3: ATUR IDENTITAS & PERIODE JURNAL (/jurnal/identitas) -->

        <section id="view-jurnal-kkn-meta" class="view-section">
            <div class="subview-header-bar">
                <div class="subview-header-left">
                    <button type="button" class="btn-back-nav" onclick="navigateTo('/jurnal')">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Kembali ke Jurnal KKN</span>
                    </button>
                    <div>
                        <h2 class="subview-title">Atur Identitas & Periode Rekognisi</h2>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Informasi mahasiswa & pengesahan lembar laporan</span>
                    </div>
                </div>
            </div>
            <div class="subview-card-form">
                <form onsubmit="event.preventDefault(); window.saveJurnalMetaModal();" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label" for="meta-jurnal-nama">Nama Mahasiswa</label>
                        <input type="text" id="meta-jurnal-nama" class="form-input" placeholder="Nama lengkap">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="meta-jurnal-nim">NIM</label>
                        <input type="text" id="meta-jurnal-nim" class="form-input" placeholder="Nomor Induk Mahasiswa">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="meta-jurnal-prodi">Program Studi / Jurusan</label>
                        <input type="text" id="meta-jurnal-prodi" class="form-input" placeholder="Contoh: KPI / FDKI">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="meta-jurnal-periode">Periode Kegiatan</label>
                        <input type="text" id="meta-jurnal-periode" class="form-input"
                            placeholder="Contoh: 1 Juli s.d. 31 Agustus 2026">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <button type="button" class="btn-secondary" onclick="navigateTo('/jurnal')">Batal</button>
                        <button type="submit" class="btn-primary">Simpan Identitas</button>
                    </div>
                </form>
            </div>
        </section>

        <!-- SUB-VIEW 4: EDIT JURNAL MAHASISWA OLEH ADMIN (/jurnal/admin-edit) -->

        <section id="view-jurnal-admin-edit" class="view-section">
            <div class="subview-header-bar">
                <div class="subview-header-left">
                    <button type="button" class="btn-back-nav" onclick="navigateTo('/jurnal')">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Kembali ke Jurnal KKN</span>
                    </button>
                    <div>
                        <h2 class="subview-title">Edit Jurnal Mahasiswa</h2>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">Koreksi catatan kegiatan atau jam shift mahasiswa</span>
                    </div>
                </div>
            </div>
            <div class="subview-card-form">
                <input type="hidden" id="admin-jurnal-edit-id">
                <input type="hidden" id="admin-jurnal-edit-sheet">

                <div class="form-group" style="margin-bottom: 0.85rem;">
                    <label class="form-label" style="font-size: 12px; font-weight: 700;">Nama Mahasiswa</label>
                    <input type="text" id="admin-jurnal-edit-nama" class="form-input" readonly
                        style="background: var(--bg-tertiary); font-weight: 600;">
                </div>
                <div class="form-group" style="margin-bottom: 0.85rem;">
                    <label class="form-label" style="font-size: 12px; font-weight: 700;">Tanggal Kegiatan</label>
                    <input type="date" id="admin-jurnal-edit-tgl" class="form-input">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 0.85rem;">
                    <div class="form-group">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Jam Mulai</label>
                        <input type="time" id="admin-jurnal-edit-jam-mulai" class="form-input" value="08:00">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Jam Selesai</label>
                        <input type="time" id="admin-jurnal-edit-jam-selesai" class="form-input" value="11:00">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 0.85rem;">
                    <label class="form-label" style="font-size: 12px; font-weight: 700;">Durasi Kegiatan</label>
                    <select id="admin-jurnal-edit-durasi" class="form-select">
                        <option value="1 Jam">1 Jam</option>
                        <option value="2 Jam">2 Jam</option>
                        <option value="3 Jam" selected>3 Jam</option>
                        <option value="4 Jam">4 Jam</option>
                        <option value="5 Jam">5 Jam</option>
                        <option value="6 Jam">6 Jam</option>
                        <option value="7 Jam">7 Jam</option>
                        <option value="8 Jam">8 Jam</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size: 12px; font-weight: 700;">Uraian Kegiatan Pengabdian</label>
                    <textarea id="admin-jurnal-edit-uraian" class="form-input" rows="3" placeholder="Uraian kegiatan..."></textarea>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn-secondary" onclick="closeAdminJurnalEditModal()">Batal</button>
                    <button type="button" class="btn-primary" onclick="saveAdminJurnalEditModal()">Simpan Perubahan</button>
                </div>
            </div>
        </section>

        <!-- SUB-VIEW 5: DETAIL PROFIL & KREDENSIAL VOLUNTEER (/profil/detail) -->
`;

let currentJurnalList = [];
let adminAllJurnalList = [];
let currentJurnalScope = 'mine';
let currentJurnalViewMode = window.innerWidth <= 850 ? 'cards' : 'table';

export function getJurnalStorageKey() {
    const uName = state.currentUser ? state.currentUser.namaLengkap : 'default';
    return `volabs_jurnal_kkn_list_${uName}`;
}

export function getJurnalMetaKey() {
    const uName = state.currentUser ? state.currentUser.namaLengkap : 'default';
    return `volabs_jurnal_kkn_meta_${uName}`;
}

export function populateJurnalMahasiswaOptions() {
    const sel = document.getElementById('filter-jurnal-mahasiswa');
    if (!sel) return;
    const curVal = sel.value;
    sel.innerHTML = '<option value="ALL">Semua Mahasiswa</option>';
    const names = Object.keys(dataVolunteer).sort();
    names.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        sel.appendChild(opt);
    });
    if (curVal) sel.value = curVal;
}

export function switchJurnalScope(scope) {
    currentJurnalScope = scope;
    state.currentJurnalScope = scope;
    const btnAll = document.getElementById('btn-jurnal-scope-all');
    const btnMine = document.getElementById('btn-jurnal-scope-mine');
    const filterMhs = document.getElementById('filter-jurnal-mahasiswa');
    if (scope === 'all') {
        if (btnAll) btnAll.classList.add('active');
        if (btnMine) btnMine.classList.remove('active');
        if (filterMhs) filterMhs.style.display = 'inline-block';
        loadAllJurnalDataAdmin();
    } else {
        if (btnAll) btnAll.classList.remove('active');
        if (btnMine) btnMine.classList.add('active');
        if (filterMhs) filterMhs.style.display = 'none';
        renderJurnalUi();
    }
}

export async function loadAllJurnalDataAdmin() {
    let combined = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('volabs_jurnal_kkn_list_')) {
            const uName = key.replace('volabs_jurnal_kkn_list_', '');
            try {
                const items = JSON.parse(localStorage.getItem(key)) || [];
                items.forEach(it => {
                    const entry = { ...it, namaMahasiswa: it.namaMahasiswa || uName, sheetName: it.sheetName || uName };
                    if (!combined.some(c => String(c.id) === String(entry.id))) {
                        combined.push(entry);
                    }
                });
            } catch (e) { }
        }
    }

    // 1. Prioritaskan data dari state dan Firestore
    if (state.allJurnalDataAdmin && state.allJurnalDataAdmin.length > 0) {
        adminAllJurnalList = state.allJurnalDataAdmin;
        renderJurnalUi();
        return;
    }

    try {
        const cached = JSON.parse(localStorage.getItem('volabs_cached_jurnal') || '[]');
        if (cached.length > 0) {
            adminAllJurnalList = cached;
            renderJurnalUi();
            return;
        }
    } catch (e) { }

    if (combined.length > 0) {
        adminAllJurnalList = combined;
        renderJurnalUi();
    } else if (db) {
        try {
            const snap = await db.collection('jurnal_kkn').get();
            if (!snap.empty) {
                const list = [];
                snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
                adminAllJurnalList = list;
                state.allJurnalDataAdmin = list;
                localStorage.setItem('volabs_cached_jurnal', JSON.stringify(list));
                renderJurnalUi();
            }
        } catch (err) {
            console.log("Firestore get all jurnal error:", err);
        }
    }
}

export function initJurnalMetaFromUser() {
    if (!state.currentUser) return;
    const metaStr = localStorage.getItem(getJurnalMetaKey());
    let meta = metaStr ? JSON.parse(metaStr) : null;
    const volData = dataVolunteer[state.currentUser.namaLengkap] || {};

    if (!meta || !meta.nama) {
        meta = {
            nama: state.currentUser.namaLengkap,
            nim: volData.nim || state.currentUser.nim || '',
            prodi: volData.jur || '',
            periode: `1 Juli s.d. 31 Agustus 2026`
        };
        localStorage.setItem(getJurnalMetaKey(), JSON.stringify(meta));
    } else if (volData.jur && meta.prodi !== volData.jur) {
        meta.prodi = volData.jur;
        localStorage.setItem(getJurnalMetaKey(), JSON.stringify(meta));
    }

    const elUiNama = document.getElementById('ui-jurnal-nama');
    const elUiNim = document.getElementById('ui-jurnal-nim');
    const elUiProdi = document.getElementById('ui-jurnal-prodi');
    const elUiPeriode = document.getElementById('ui-jurnal-periode');
    if (elUiNama) elUiNama.textContent = meta.nama || state.currentUser.namaLengkap;
    if (elUiNim) elUiNim.textContent = meta.nim || volData.nim || '-';
    if (elUiProdi) elUiProdi.textContent = meta.prodi || volData.jur || '-';
    if (elUiPeriode) elUiPeriode.textContent = meta.periode || '-';

    loadJurnalData();
}

export async function loadJurnalData() {
    if (!state.currentUser) return;
    const myName = (state.currentUser.namaLengkap || '').trim().toLowerCase();

    // 1. Ambil dari state jika sudah ada
    if (state.jurnalList && state.jurnalList.length > 0) {
        currentJurnalList = state.jurnalList;
        renderJurnalUi();
        return;
    }

    // 2. Ambil dari local cache
    try {
        const cached = JSON.parse(localStorage.getItem('volabs_cached_jurnal') || '[]');
        const mine = cached.filter(j => (j.nama || '').trim().toLowerCase() === myName);
        if (mine.length > 0) {
            currentJurnalList = mine;
            state.jurnalList = mine;
            renderJurnalUi();
            return;
        }
    } catch (e) { }

    // 3. Fallback direct Firestore
    if (db) {
        try {
            const snap = await db.collection('jurnal_kkn').where('nama', '==', state.currentUser.namaLengkap).get();
            if (!snap.empty) {
                const list = [];
                snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
                currentJurnalList = list;
                state.jurnalList = list;
                renderJurnalUi();
                return;
            }
        } catch (err) {
            console.log("Firestore load my jurnal notice:", err);
        }
    }

    currentJurnalList = [];
    renderJurnalUi();
}

export function saveJurnalData() {
    if (currentJurnalList && state.currentUser) {
        const storeKey = getJurnalStorageKey();
        localStorage.setItem(storeKey, JSON.stringify(currentJurnalList));
    }
}

export function setJurnalViewMode(mode) {
    currentJurnalViewMode = mode;
    state.jurnalViewMode = mode;
    const btnCards = document.getElementById('btn-jurnal-view-cards');
    const btnTable = document.getElementById('btn-jurnal-view-table');
    const cardsView = document.getElementById('jurnal-cards-view');
    const tableView = document.getElementById('jurnal-table-view');

    if (mode === 'cards') {
        if (btnCards) btnCards.classList.add('active');
        if (btnTable) btnTable.classList.remove('active');
        if (cardsView) cardsView.style.display = 'grid';
        if (tableView) tableView.style.display = 'none';
    } else {
        if (btnCards) btnCards.classList.remove('active');
        if (btnTable) btnTable.classList.add('active');
        if (cardsView) cardsView.style.display = 'none';
        if (tableView) tableView.style.display = 'block';
    }
}

export function renderJurnalUi() {
    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    const isAllScope = isAdmin && (currentJurnalScope === 'all');

    const filterMhsEl = document.getElementById('filter-jurnal-mahasiswa');
    const filterBulanEl = document.getElementById('filter-jurnal-bulan');
    const filterJamEl = document.getElementById('filter-jurnal-jam');
    const filterDurasiEl = document.getElementById('filter-jurnal-durasi');

    const filterMhs = filterMhsEl ? filterMhsEl.value : 'ALL';
    const filterBulan = filterBulanEl ? filterBulanEl.value : 'ALL';
    const filterJam = filterJamEl ? filterJamEl.value.trim().toLowerCase() : '';
    const filterDurasi = filterDurasiEl ? filterDurasiEl.value : 'ALL';

    const sourceList = isAllScope ? adminAllJurnalList : currentJurnalList;

    const filtered = sourceList.filter(item => {
        if (isAllScope && filterMhs !== 'ALL') {
            if ((item.nama || '').trim().toLowerCase() !== filterMhs.trim().toLowerCase()) return false;
        }
        if (filterBulan !== 'ALL') {
            const itemBulan = getBulanFromTanggal(item.tanggal);
            if (itemBulan !== filterBulan) return false;
        }
        if (filterJam && !(item.jam || '').toLowerCase().includes(filterJam)) {
            return false;
        }
        if (filterDurasi !== 'ALL' && item.durasi !== filterDurasi) {
            return false;
        }
        return true;
    });

    let totalJam = 0;
    filtered.forEach(it => {
        if (it.durasi) {
            const num = parseInt(String(it.durasi).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num)) totalJam += num;
        }
    });

    const durasiLabel = document.getElementById('jurnal-total-durasi-label');
    if (durasiLabel) {
        durasiLabel.textContent = `Total Durasi: ${totalJam} Jam`;
    }

    const labelCount = document.getElementById('jurnal-count-label');
    if (labelCount) {
        labelCount.textContent = `Menampilkan ${filtered.length} dari ${sourceList.length} kegiatan${isAllScope ? ' (Semua Mahasiswa)' : ''}`;
    }

    const cardsContainer = document.getElementById('jurnal-cards-view');
    if (cardsContainer) {
        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 48px; height: 48px; margin: 0 auto 1rem; opacity: 0.4;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    <p style="font-size: 0.95rem; margin-bottom: 0.5rem;">Belum ada catatan kegiatan harian yang sesuai filter.</p>
                </div>
            `;
        } else {
            cardsContainer.innerHTML = filtered.map(item => {
                const mhsBadge = isAllScope ? `<div style="font-size: 11px; color: #6366f1; font-weight: 700; margin-bottom: 6px;">${item.nama || '-'}</div>` : '';
                const actionBtns = isAllScope ? `
                    <button class="btn-card-action btn-edit-action" onclick="window.openAdminJurnalEditModal('${item.id}')" title="Edit Jurnal Mahasiswa">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        <span>Edit</span>
                    </button>
                    <button class="btn-card-action btn-del-action" onclick="window.adminDeleteJurnalRow('${item.id}')" title="Hapus Jurnal Mahasiswa">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        <span>Hapus</span>
                    </button>
                ` : `
                    <button class="btn-card-action btn-edit-action" onclick="window.openJurnalItemModal(${currentJurnalList.indexOf(item)}) title="Edit Kegiatan">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        <span>Edit</span>
                    </button>
                    <button class="btn-card-action btn-del-action" onclick="window.deleteJurnalRow(${currentJurnalList.indexOf(item)}) title="Hapus Kegiatan">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        <span>Hapus</span>
                    </button>
                `;

                return `
                <div class="content-card">
                  ${mhsBadge}
                  <div class="card-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                    <span class="card-date" style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${formatTanggalIndo(item.tanggal)}</span>
                    <div style="display: flex; gap: 4px; align-items: center;">
                      <span class="status-badge status-ready" style="font-size: 0.78rem;">${item.jam || '-'}</span>
                      <span class="badge" style="font-size: 0.75rem;">${item.durasi || '-'}</span>
                    </div>
                  </div>
                  <h4 class="card-title" style="margin-bottom: 0.8rem; font-weight: 500; font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">${item.uraian || '-'}</h4>
                  <div class="card-footer" style="justify-content: flex-end;">
                    <div class="card-actions">
                      ${actionBtns}
                    </div>
                  </div>
                </div>
                `;
            }).join("");
        }
    }

    const tableBody = document.getElementById('jurnal-table-body');
    if (tableBody) {
        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted); font-style: italic;">Belum ada kegiatan yang sesuai filter.</td></tr>`;
        } else {
            tableBody.innerHTML = filtered.map((item, idx) => {
                const mhsCell = isAllScope ? `<div style="font-size: 11px; color: #6366f1; font-weight: 700;">${item.nama || '-'}</div>` : '';
                const actionBtns = isAllScope ? `
                    <button class="btn-card-action btn-edit-action" onclick="window.openAdminJurnalEditModal('${item.id}')" title="Edit Jurnal Mahasiswa">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        <span>Edit</span>
                    </button>
                    <button class="btn-card-action btn-del-action" onclick="window.adminDeleteJurnalRow('${item.id}')" title="Hapus Jurnal Mahasiswa">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        <span>Hapus</span>
                    </button>
                ` : `
                    <button class="btn-card-action btn-edit-action" onclick="window.openJurnalItemModal(${currentJurnalList.indexOf(item)}) title="Edit Kegiatan">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        <span>Edit</span>
                    </button>
                    <button class="btn-card-action btn-del-action" onclick="window.deleteJurnalRow(${currentJurnalList.indexOf(item)}) title="Hapus Kegiatan">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        <span>Hapus</span>
                    </button>
                `;

                return `
                <tr>
                    <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
                    <td style="white-space: nowrap;">
                        <div style="font-weight: 600;">${formatTanggalIndo(item.tanggal)}</div>
                        ${mhsCell}
                    </td>
                    <td style="white-space: nowrap;"><span class="status-badge status-ready">${item.jam}</span></td>
                    <td style="white-space: nowrap;"><span class="badge">${item.durasi}</span></td>
                    <td style="white-space: pre-wrap; min-width: 220px; line-height: 1.4;">${item.uraian || '-'}</td>
                    <td>
                        <div class="card-actions" style="justify-content: center;">
                            ${actionBtns}
                        </div>
                    </td>
                </tr>
                `;
            }).join("");
        }
    }
}

export function renderJurnalKkn() {
    initJurnalMetaFromUser();
    if (state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL')) {
        const tabs = document.getElementById('jurnal-admin-scope-tabs');
        if (tabs) tabs.style.display = 'block';
        populateJurnalMahasiswaOptions();
        if (currentJurnalScope === 'all') {
            loadAllJurnalDataAdmin();
            return;
        }
    }
    renderJurnalUi();
}

export function openAdminJurnalEditModal(itemId) {
    const item = adminAllJurnalList.find(x => String(x.id) === String(itemId));
    if (!item) return;
    document.getElementById('admin-jurnal-edit-id').value = item.id;
    document.getElementById('admin-jurnal-edit-sheet').value = item.sheetName || `Jurnal - ${(item.nama || '').substring(0, 22).trim()}`;
    document.getElementById('admin-jurnal-edit-nama').value = item.nama || '-';
    document.getElementById('admin-jurnal-edit-tgl').value = item.tanggal || '';
    let jmMulai = '08:00', jmSelesai = '11:00';
    if (item.jam) {
        const parts = item.jam.split('-');
        if (parts.length >= 2) {
            jmMulai = parts[0].trim().replace('.', ':');
            jmSelesai = parts[1].trim().replace('.', ':');
        }
    }
    document.getElementById('admin-jurnal-edit-jam-mulai').value = jmMulai;
    document.getElementById('admin-jurnal-edit-jam-selesai').value = jmSelesai;
    document.getElementById('admin-jurnal-edit-durasi').value = item.durasi || '3 Jam';
    document.getElementById('admin-jurnal-edit-uraian').value = item.uraian || '';
    document.getElementById('modal-jurnal-admin-edit').classList.add('active');
    navigateTo('/jurnal/admin-edit');
}

export function closeAdminJurnalEditModal() {
    document.getElementById('modal-jurnal-admin-edit').classList.remove('active');
    navigateTo('/jurnal');
}

export async function saveAdminJurnalEditModal() {
    const id = document.getElementById('admin-jurnal-edit-id').value;
    const tgl = document.getElementById('admin-jurnal-edit-tgl').value;
    const jmMulai = document.getElementById('admin-jurnal-edit-jam-mulai').value;
    const jmSelesai = document.getElementById('admin-jurnal-edit-jam-selesai').value;
    const durasi = document.getElementById('admin-jurnal-edit-durasi').value;
    const uraian = document.getElementById('admin-jurnal-edit-uraian').value.trim();

    if (!tgl || !uraian) {
        showCustomDialog({ title: "Peringatan", message: "Tanggal dan Uraian wajib diisi!", confirmText: "Mengerti" });
        return;
    }

    const item = adminAllJurnalList.find(x => String(x.id) === String(id));
    if (item) {
        item.tanggal = tgl;
        item.jam = `${jmMulai} - ${jmSelesai}`;
        item.durasi = durasi;
        item.uraian = uraian;
        item.updatedAt = new Date().toISOString();
        await saveJurnalEntry(item);
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
    }

    closeAdminJurnalEditModal();
    renderJurnalUi();
    showCustomDialog({ title: "Berhasil", message: "Data jurnal mahasiswa berhasil diperbarui!", confirmText: "Tutup" });
}

export async function adminDeleteJurnalRow(itemId) {
    const confirmed = await showCustomDialog({
        title: "Hapus Jurnal Mahasiswa",
        message: "Apakah Anda yakin ingin menghapus catatan jurnal mahasiswa ini secara permanen?",
        confirmText: "Hapus",
        confirmColor: "#ef4444"
    });
    if (!confirmed) return;

    adminAllJurnalList = adminAllJurnalList.filter(x => String(x.id) !== String(itemId));
    state.allJurnalDataAdmin = adminAllJurnalList;
    localStorage.setItem('volabs_cached_jurnal', JSON.stringify(adminAllJurnalList));

    renderJurnalUi();
    await deleteJurnalEntry(itemId);
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
}

export function openJurnalItemModal(idx = -1) {
    document.getElementById('edit-jurnal-index').value = idx;
    const titleEl = document.getElementById('modal-jurnal-title');
    if (idx >= 0 && currentJurnalList[idx]) {
        const item = currentJurnalList[idx];
        if (titleEl) titleEl.textContent = "Edit Kegiatan Jurnal";
        document.getElementById('input-jurnal-tanggal').value = item.tanggal || '';
        let jmMulai = '08:00', jmSelesai = '11:00';
        if (item.jam) {
            const parts = item.jam.split('-');
            if (parts.length >= 2) {
                jmMulai = parts[0].trim().replace('.', ':');
                jmSelesai = parts[1].trim().replace('.', ':');
            }
        }
        document.getElementById('input-jurnal-jam-mulai').value = jmMulai;
        document.getElementById('input-jurnal-jam-selesai').value = jmSelesai;
        document.getElementById('input-jurnal-durasi').value = item.durasi || '3 Jam';
        document.getElementById('input-jurnal-uraian').value = item.uraian || '';
    } else {
        if (titleEl) titleEl.textContent = "Tambah Kegiatan Jurnal";
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        document.getElementById('input-jurnal-tanggal').value = `${yyyy}-${mm}-${dd}`;
        document.getElementById('input-jurnal-jam-mulai').value = '08:00';
        document.getElementById('input-jurnal-jam-selesai').value = '11:00';
        document.getElementById('input-jurnal-durasi').value = '3 Jam';
        document.getElementById('input-jurnal-uraian').value = '';
    }
    document.getElementById('modal-jurnal-item').classList.add('active');
    navigateTo(idx >= 0 ? '/jurnal/edit' : '/jurnal/tambah');
}

export function closeJurnalItemModal() {
    document.getElementById('modal-jurnal-item').classList.remove('active');
    navigateTo('/jurnal');
}

export async function saveJurnalItemModal() {
    const idx = parseInt(document.getElementById('edit-jurnal-index').value, 10);
    const tgl = document.getElementById('input-jurnal-tanggal').value;
    const jamMulai = document.getElementById('input-jurnal-jam-mulai').value;
    const jamSelesai = document.getElementById('input-jurnal-jam-selesai').value;
    const jam = `${jamMulai} - ${jamSelesai}`;
    const durasi = document.getElementById('input-jurnal-durasi').value;
    const uraian = document.getElementById('input-jurnal-uraian').value.trim();

    if (!tgl || !uraian) {
        showCustomDialog({ title: "Peringatan", message: "Tanggal dan Uraian Kegiatan wajib diisi!", confirmText: "Mengerti" });
        return;
    }

    let entry = null;
    if (idx >= 0 && currentJurnalList[idx]) {
        entry = {
            ...currentJurnalList[idx],
            tanggal: tgl,
            jam,
            durasi,
            uraian,
            nama: state.currentUser?.namaLengkap || '',
            nim: state.currentUser?.nim || '',
            updatedAt: new Date().toISOString()
        };
        currentJurnalList[idx] = entry;
    } else {
        entry = {
            id: 'JRN-' + Date.now(),
            nama: state.currentUser?.namaLengkap || '',
            nim: state.currentUser?.nim || '',
            tanggal: tgl,
            jam,
            durasi,
            uraian,
            createdAt: new Date().toISOString()
        };
        currentJurnalList.unshift(entry);
    }

    saveJurnalData();
    closeJurnalItemModal();
    renderJurnalUi();

    if (entry) {
        await saveJurnalEntry(entry);
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
    }
}

export async function deleteJurnalRow(idx) {
    const confirmed = await showCustomDialog({
        title: "Hapus Kegiatan Jurnal",
        message: "Apakah Anda yakin ingin menghapus catatan kegiatan ini?",
        confirmText: "Hapus",
        confirmColor: "#ef4444"
    });
    if (!confirmed) return;

    if (idx >= 0 && idx < currentJurnalList.length) {
        const item = currentJurnalList[idx];
        currentJurnalList.splice(idx, 1);
        saveJurnalData();
        renderJurnalUi();
        if (item && item.id) {
            await deleteJurnalEntry(item.id);
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
        }
    }
}

export function openJurnalMetaModal() {
    const metaStr = localStorage.getItem(getJurnalMetaKey());
    const meta = metaStr ? JSON.parse(metaStr) : {};
    document.getElementById('meta-jurnal-nama').value = meta.nama || state.currentUser?.namaLengkap || '';
    document.getElementById('meta-jurnal-nim').value = meta.nim || state.currentUser?.nim || '';
    document.getElementById('meta-jurnal-prodi').value = meta.prodi || '';
    document.getElementById('meta-jurnal-periode').value = meta.periode || '1 Juli s.d. 31 Agustus 2026';
    document.getElementById('modal-jurnal-meta').classList.add('active');
    navigateTo('/jurnal/identitas');
}

export function closeJurnalMetaModal() {
    document.getElementById('modal-jurnal-meta').classList.remove('active');
    navigateTo('/jurnal');
}

export function saveJurnalMetaModal() {
    const nama = document.getElementById('meta-jurnal-nama').value.trim();
    const nim = document.getElementById('meta-jurnal-nim').value.trim();
    const prodi = document.getElementById('meta-jurnal-prodi').value.trim();
    const periode = document.getElementById('meta-jurnal-periode').value.trim();

    const meta = { nama, nim, prodi, periode };
    localStorage.setItem(getJurnalMetaKey(), JSON.stringify(meta));

    document.getElementById('ui-jurnal-nama').textContent = nama || '-';
    document.getElementById('ui-jurnal-nim').textContent = nim || '-';
    document.getElementById('ui-jurnal-prodi').textContent = prodi || '-';
    document.getElementById('ui-jurnal-periode').textContent = periode || '-';

    saveJurnalData();
    closeJurnalMetaModal();
}

export function syncJurnalPrintView() {
    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    const isAllScope = isAdmin && (currentJurnalScope === 'all');
    const filterMhs = document.getElementById('filter-jurnal-mahasiswa')?.value || 'ALL';
    const filterBulan = document.getElementById('filter-jurnal-bulan')?.value || 'ALL';

    let nama = '-', nim = '-', prodi = '-', periode = '1 Juli s.d. 31 Agustus 2026';
    let printItems = [];

    if (isAllScope) {
        if (filterMhs !== 'ALL') {
            nama = filterMhs;
            const volData = dataVolunteer[filterMhs] || {};
            nim = volData.nim || '-';
            prodi = volData.jur || '-';
            printItems = adminAllJurnalList.filter(item => (item.nama || '').trim().toLowerCase() === filterMhs.trim().toLowerCase());
        } else {
            nama = "Rekap Seluruh Mahasiswa Volunteer";
            nim = "-";
            prodi = "PIPD UIN Siber Syekh Nurjati";
            printItems = [...adminAllJurnalList];
        }
    } else {
        const metaStr = localStorage.getItem(getJurnalMetaKey());
        const meta = metaStr ? JSON.parse(metaStr) : {};
        const volData = (state.currentUser && dataVolunteer[state.currentUser.namaLengkap]) || {};
        nama = meta.nama || (state.currentUser ? state.currentUser.namaLengkap : '-');
        nim = meta.nim || volData.nim || '-';
        prodi = meta.prodi || volData.jur || '-';
        periode = meta.periode || '1 Juli s.d. 31 Agustus 2026';
        printItems = [...currentJurnalList];
    }

    if (filterBulan !== 'ALL') {
        printItems = printItems.filter(item => getBulanFromTanggal(item.tanggal) === filterBulan);
    }

    document.getElementById('print-jurnal-nama').textContent = nama;
    document.getElementById('print-jurnal-nim').textContent = nim;
    document.getElementById('print-jurnal-prodi').textContent = prodi;
    document.getElementById('print-jurnal-periode').textContent = periode;

    document.getElementById('print-jurnal-nama-ttd').textContent = `(${nama})`;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    document.getElementById('print-jurnal-tgl-ttd').textContent = formatTanggalIndo(`${yyyy}-${mm}-${dd}`);

    const tbodyPrint = document.getElementById('print-jurnal-tbody');
    if (!printItems || printItems.length === 0) {
        tbodyPrint.innerHTML = `<tr><td colspan="5" style="border: 1px solid #000; padding: 15px; text-align: center; font-style: italic;">Belum ada entri jurnal kegiatan untuk kriteria ini.</td></tr>`;
    } else {
        let totalJam = 0;
        const rows = printItems.map((item, idx) => {
            if (item.durasi) {
                const jam = parseInt(item.durasi.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(jam)) totalJam += jam;
            }
            const uraianText = (isAllScope && filterMhs === 'ALL' && item.nama) ? `[${item.nama}] ${item.uraian || '-'}` : (item.uraian || '-');
            return `
            <tr>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: top;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: top;">${formatTanggalIndo(item.tanggal) || item.tanggal || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: top;">${item.jam || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: top;">${item.durasi || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; white-space: pre-wrap;">${uraianText}</td>
            </tr>
            `;
        }).join("");

        const totalRow = `
            <tr>
                <td colspan="3" style="border: 1px solid #000; padding: 8px 12px; text-align: right; font-weight: bold; background-color: #f8fafc;">Total Durasi Pelaksanaan Kegiatan:</td>
                <td style="border: 1px solid #000; padding: 8px 6px; text-align: center; font-weight: bold; background-color: #f8fafc; font-size: 1.05em;">${totalJam} Jam</td>
                <td style="border: 1px solid #000; padding: 8px; background-color: #f8fafc;"></td>
            </tr>
        `;

        tbodyPrint.innerHTML = rows + totalRow;
    }
}

export function printJurnalKkn(type) {
    syncJurnalPrintView();
    const printAreaJurnal = document.getElementById('print-area-jurnal');
    const btnDoc = document.getElementById('btn-jurnal-doc');
    const originalDocText = btnDoc ? btnDoc.innerHTML : 'Unduh DOC';

    if (type === 'doc') {
        printAreaJurnal.classList.add('export-active');
        if (btnDoc) btnDoc.innerHTML = 'Menyiapkan DOC...';

        setTimeout(() => {
            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Jurnal Harian Pengabdian</title></" + "head><" + "body>";
            const footer = "</" + "body></" + "html>";
            const styles = "<style>#print-area-jurnal { font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.15; padding: 2cm; } table { border-collapse: collapse; width: 100%; font-size: 11pt; } td, th { padding: 6px 8px; border: 1px solid #000; } </style>";
            const htmlContent = header + styles + "<div id='print-area-jurnal'>" + printAreaJurnal.innerHTML + "</div>" + footer;

            const blob = new Blob(['﻿', htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            const metaStr = localStorage.getItem(getJurnalMetaKey());
            const meta = metaStr ? JSON.parse(metaStr) : {};
            const cleanNama = (meta.nama || (state.currentUser ? state.currentUser.namaLengkap : 'Mahasiswa')).replace(/ /g, '_');
            downloadLink.download = `Jurnal_Pengabdian_${cleanNama}.doc`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);

            printAreaJurnal.classList.remove('export-active');
            if (btnDoc) btnDoc.innerHTML = originalDocText;
        }, 500);
    } else if (type === 'pdf') {
        document.body.classList.add('is-printing-jurnal');
        let pageMarginStyle = document.getElementById('print-page-margin-override');
        if (!pageMarginStyle) {
            pageMarginStyle = document.createElement('style');
            pageMarginStyle.id = 'print-page-margin-override';
            document.head.appendChild(pageMarginStyle);
        }
        pageMarginStyle.innerHTML = `@media print { @page { size: A4; margin: 2cm !important; } }`;

        let parent = printAreaJurnal.parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
            parent.classList.add('print-ancestor');
            parent = parent.parentElement;
        }

        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing-jurnal');
            if (pageMarginStyle) pageMarginStyle.innerHTML = '';
            let p = printAreaJurnal.parentElement;
            while (p && p !== document.body && p !== document.documentElement) {
                p.classList.remove('print-ancestor');
                p = p.parentElement;
            }
        }, 300);
    }
}

export function syncJurnalFromFirestore(jurnals) {
    if (!Array.isArray(jurnals)) return;
    adminAllJurnalList = jurnals;
    state.allJurnalDataAdmin = jurnals;
    if (state.currentUser) {
        const myName = (state.currentUser.namaLengkap || '').trim().toLowerCase();
        currentJurnalList = jurnals.filter(j => (j.nama || '').trim().toLowerCase() === myName);
        state.jurnalList = currentJurnalList;
    }
    if (state.currentView === 'jurnal-kkn') {
        renderJurnalUi();
    }
}
window.syncJurnalFromFirestore = syncJurnalFromFirestore;

export function initJurnal() {
    window.renderJurnalKkn = renderJurnalKkn;
    window.renderJurnalUi = renderJurnalUi;
    window.populateJurnalMahasiswaOptions = populateJurnalMahasiswaOptions;
    window.switchJurnalScope = switchJurnalScope;
    window.setJurnalViewMode = setJurnalViewMode;
    window.openJurnalItemModal = openJurnalItemModal;
    window.closeJurnalItemModal = closeJurnalItemModal;
    window.saveJurnalItemModal = saveJurnalItemModal;
    window.openJurnalMetaModal = openJurnalMetaModal;
    window.closeJurnalMetaModal = closeJurnalMetaModal;
    window.saveJurnalMetaModal = saveJurnalMetaModal;
    window.deleteJurnalRow = deleteJurnalRow;
    window.openAdminJurnalEditModal = openAdminJurnalEditModal;
    window.closeAdminJurnalEditModal = closeAdminJurnalEditModal;
    window.saveAdminJurnalEditModal = saveAdminJurnalEditModal;
    window.adminDeleteJurnalRow = adminDeleteJurnalRow;
    window.printJurnalKkn = printJurnalKkn;
    window.syncJurnalPrintView = syncJurnalPrintView;
    window.initJurnalMetaFromUser = initJurnalMetaFromUser;
    window.syncJurnalFromFirestore = syncJurnalFromFirestore;

    const btnScopeMine = document.getElementById('btn-jurnal-scope-mine');
    if (btnScopeMine) btnScopeMine.addEventListener('click', () => switchJurnalScope('mine'));
    const btnScopeAll = document.getElementById('btn-jurnal-scope-all');
    if (btnScopeAll) btnScopeAll.addEventListener('click', () => switchJurnalScope('all'));

    const btnCards = document.getElementById('btn-jurnal-view-cards');
    const btnTable = document.getElementById('btn-jurnal-view-table');
    if (btnCards) btnCards.addEventListener('click', () => setJurnalViewMode('cards'));
    if (btnTable) btnTable.addEventListener('click', () => setJurnalViewMode('table'));

    const defaultMode = window.innerWidth <= 850 ? 'cards' : 'table';
    setJurnalViewMode(defaultMode);

    const btnAdd = document.getElementById('btn-add-jurnal-item');
    if (btnAdd) btnAdd.addEventListener('click', () => openJurnalItemModal(-1));

    const btnEditMeta = document.getElementById('btn-edit-jurnal-meta');
    if (btnEditMeta) btnEditMeta.addEventListener('click', openJurnalMetaModal);

    const btnPdf = document.getElementById('btn-jurnal-pdf');
    if (btnPdf) btnPdf.addEventListener('click', () => printJurnalKkn('pdf'));
    const btnDoc = document.getElementById('btn-jurnal-doc');
    if (btnDoc) btnDoc.addEventListener('click', () => printJurnalKkn('doc'));

    ['filter-jurnal-mahasiswa', 'filter-jurnal-bulan', 'filter-jurnal-jam', 'filter-jurnal-durasi'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderJurnalUi);
    });
}
