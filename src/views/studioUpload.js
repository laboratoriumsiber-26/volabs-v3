// Studio Upload View Module (Raw Video Upload for Learning & Podcast, Drive Links & Assignments)
import { state } from '../store/state.js';
import { dataVolunteer } from '../store/initialData.js';
import { db, saveStudioTask } from '../services/firebase.js';
import { showCustomDialog } from '../utils/dialog.js';
import { formatTanggalIndo } from '../utils/helpers.js';
import { navigateTo } from '../router/index.js';
import { getSkeletonCards, getSkeletonTableRows } from '../utils/skeleton.js';

export const studioUploadTemplate = `
        <section id="view-studio-upload" class="view-section">
            <div
                style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-main); font-weight: 700;">Studio Upload</h3>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn-primary" onclick="openCreateUploadModal()" id="btn-open-upload-modal">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>Upload Video Baru</span>
                    </button>
                </div>
            </div>

            <!-- Tabs Nav: Pembelajaran vs Podcast -->
            <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 1.25rem;">
                <button type="button" class="tab-btn active" id="tab-upload-pembelajaran"
                    onclick="switchUploadTab('pembelajaran')"
                    style="padding: 10px 16px; font-weight: 700; font-size: 13px; border: none; background: none; cursor: pointer; color: #f59e0b; border-bottom: 2px solid #f59e0b;">
                    Video Pembelajaran
                </button>
                <button type="button" class="tab-btn" id="tab-upload-podcast" onclick="switchUploadTab('podcast')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent;">
                    Video Podcast
                </button>
            </div>

            <!-- Controls bar -->
            <div class="control-bar" style="margin-bottom: 1rem;">
                <div class="filters-group" style="flex: 1;">
                    <input type="text" id="search-upload-input" class="filter-select"
                        placeholder="Cari judul, dosen, host, matkul..." oninput="renderStudioUpload()"
                        style="flex: 1 1 200px; min-width: 0; width: 100%;">
                </div>
                <div class="view-toggle-btns">
                    <button class="toggle-btn active" id="btn-upload-view-cards"
                        onclick="setUploadViewMode('cards')">Kartu (Mobile)</button>
                    <button class="toggle-btn" id="btn-upload-view-table"
                        onclick="setUploadViewMode('table')">Tabel (Desktop)</button>
                </div>
            </div>

            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.75rem;">
                <span id="upload-counter-label">Menampilkan 0 video</span>
            </div>

            <!-- Container Kartu & Tabel -->
            <div id="upload-cards-container" class="cards-container">
                ${getSkeletonCards(3)}
            </div>
            <div id="upload-table-container" class="table-wrapper" style="display: none;">
                <table class="content-table">
                    <thead id="upload-table-head"></thead>
                    <tbody id="upload-table-body">
                        ${getSkeletonTableRows(7, 4)}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- SECTION STUDIO EDITOR (KHUSUS EDITOR VIDEO / ADMIN) -->

        <section id="view-studio-upload-form" class="view-section">
            <div class="subview-header-bar">
                <div class="subview-header-left">
                    <button type="button" class="btn-back-nav" onclick="navigateTo('/studio-upload')">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Kembali ke Studio Upload</span>
                    </button>
                    <div>
                        <h2 class="subview-title">Upload Video Baru (Penyerahan Bahan Mentah)</h2>
                    </div>
                </div>
            </div>
            <div class="subview-card-form">
                <!-- Type Selection -->
                <div style="display: flex; gap: 8px; margin-bottom: 1.25rem;">
                    <button type="button" class="btn-secondary active" id="btn-upload-type-pembelajaran"
                        onclick="setUploadModalType('pembelajaran')"
                        style="flex: 1; padding: 8px 12px; font-weight: 700; font-size: 12px; border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.08);">
                        Video Pembelajaran
                    </button>
                    <button type="button" class="btn-secondary" id="btn-upload-type-podcast"
                        onclick="setUploadModalType('podcast')"
                        style="flex: 1; padding: 8px 12px; font-weight: 600; font-size: 12px; border-color: var(--border-color); color: var(--text-muted); background: var(--bg-secondary);">
                        Video Podcast
                    </button>
                </div>

                <!-- Form Fields: Pembelajaran -->
                <div id="form-upload-pembelajaran">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 0.85rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 12px; font-weight: 700;">Kode MK <span style="color: #ef4444;">*</span></label>
                            <input type="text" id="upload-pem-kodemk" class="form-input" placeholder="Contoh: MKP-302 / UIN-401">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 12px; font-weight: 700;">Mata Kuliah <span style="color: #ef4444;">*</span></label>
                            <input type="text" id="upload-pem-matkul" class="form-input" placeholder="Contoh: Metodologi Penelitian">
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Judul / Topik Pembelajaran <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="upload-pem-judul" class="form-input" placeholder="Contoh: Pengantar Analisis Data Kuantitatif">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Dosen Pengampu <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="upload-pem-dosen" class="form-input" placeholder="Contoh: Dr. H. Ahmad Subagio, M.Pd">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Link Raw Video (Google Drive) <span style="color: #ef4444;">*</span></label>
                        <input type="url" id="upload-pem-raw" class="form-input" placeholder="https://drive.google.com/drive/folders/...">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Link Storyboard (Google Docs / Drive) <span style="color: #ef4444;">*</span></label>
                        <input type="url" id="upload-pem-storyboard" class="form-input" placeholder="https://docs.google.com/document/d/...">
                    </div>
                </div>

                <!-- Form Fields: Podcast -->
                <div id="form-upload-podcast" style="display: none;">
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Judul Podcast / Episode <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="upload-pod-judul" class="form-input" placeholder="Contoh: Podcast VoLabs Ep. 12 - Transformasi Digital">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Host Podcast <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="upload-pod-host" class="form-input" placeholder="Contoh: Siti Hamidah">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Narasumber <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="upload-pod-narasumber" class="form-input" placeholder="Contoh: Prof. Dr. KH. Syarif, M.Ag">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.85rem;">
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Link Google Drive Raw Video <span style="color: #ef4444;">*</span></label>
                        <input type="url" id="upload-pod-raw" class="form-input" placeholder="https://drive.google.com/drive/folders/...">
                    </div>
                </div>

                <div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 11px; color: var(--text-muted); display: flex; align-items: flex-start; gap: 8px; margin-top: 1rem;">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px; color: #f59e0b; flex-shrink: 0; margin-top: 1px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Setelah submit, sistem otomatis mengalokasikan tugas secara merata (round-robin) ke Editor Video dan menetapkan tenggat deadline 3-6 hari kerja.</span>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn-secondary" onclick="navigateTo('/studio-upload')">Batal</button>
                    <button type="button" class="btn-primary" onclick="submitCreateUploadModal()"
                        style="background: #f59e0b; border-color: #f59e0b; color: #fff;">
                        Submit & Auto-Assign Editor
                    </button>
                </div>
            </div>
        </section>

        <!-- SUB-VIEW 7: TINJAUAN & KELOLA TUGAS EDITOR VIDEO (/studio-editor/tugas) -->
`;

let currentUploadTab = 'pembelajaran';
let uploadViewMode = window.innerWidth <= 850 ? 'cards' : 'table';
let uploadModalType = 'pembelajaran';

export function getStoredEditorTasks() {
    try {
        const stored = localStorage.getItem('volabs_editor_tasks');
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            const clean = Array.isArray(parsed) ? parsed.filter(t => t.id !== 'ET-1001' && t.id !== 'ET-1002' && !String(t.rawVideo || '').includes('sample-raw')) : [];
            if (clean.length !== parsed.length) {
                localStorage.setItem('volabs_editor_tasks', JSON.stringify(clean));
                state.allEditorTasks = clean;
            }
            return clean;
        }
        return [];
    } catch (e) {
        return [];
    }
}

export function saveStoredEditorTasks(tasks) {
    state.allEditorTasks = tasks;
    localStorage.setItem('volabs_editor_tasks', JSON.stringify(tasks));
}

export function switchUploadTab(tab) {
    currentUploadTab = tab;
    state.currentUploadTab = tab;
    const btnPem = document.getElementById('tab-upload-pembelajaran');
    const btnPod = document.getElementById('tab-upload-podcast');

    if (btnPem && btnPod) {
        if (tab === 'pembelajaran') {
            btnPem.classList.add('active');
            btnPem.style.color = '#f59e0b';
            btnPem.style.borderBottom = '2px solid #f59e0b';
            btnPod.classList.remove('active');
            btnPod.style.color = 'var(--text-muted)';
            btnPod.style.borderBottom = '2px solid transparent';
        } else {
            btnPod.classList.add('active');
            btnPod.style.color = '#f59e0b';
            btnPod.style.borderBottom = '2px solid #f59e0b';
            btnPem.classList.remove('active');
            btnPem.style.color = 'var(--text-muted)';
            btnPem.style.borderBottom = '2px solid transparent';
        }
    }
    renderStudioUpload();
}

export function setUploadViewMode(mode) {
    uploadViewMode = mode;
    state.uploadViewMode = mode;
    const cards = document.getElementById('upload-cards-container');
    const table = document.getElementById('upload-table-container');
    const btnCards = document.getElementById('btn-upload-view-cards');
    const btnTable = document.getElementById('btn-upload-view-table');

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

export function renderStudioUpload() {
    const tasks = getStoredEditorTasks();
    const targetTipe = currentUploadTab === 'pembelajaran' ? 'Video Pembelajaran' : 'Video Podcast';
    const searchVal = (document.getElementById('search-upload-input')?.value || document.getElementById('search-upload')?.value || '').toLowerCase().trim();
    const filterStatus = document.getElementById('filter-upload-status')?.value || 'ALL';

    const filtered = tasks.filter(t => {
        if (t.tipe !== targetTipe) return false;
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
        if (searchVal) {
            const matchJudul = (t.judul || '').toLowerCase().includes(searchVal);
            const matchKodeMk = (t.kodeMk || '').toLowerCase().includes(searchVal);
            const matchMatkul = (t.mataKuliah || '').toLowerCase().includes(searchVal);
            const matchDosen = (t.dosen || '').toLowerCase().includes(searchVal);
            const matchHost = (t.host || '').toLowerCase().includes(searchVal);
            const matchNara = (t.narasumber || '').toLowerCase().includes(searchVal);
            const matchEd = (t.editor || t.assignedEditor || '').toLowerCase().includes(searchVal);
            if (!matchJudul && !matchKodeMk && !matchMatkul && !matchDosen && !matchHost && !matchNara && !matchEd) return false;
        }
        return true;
    });

    const countEl = document.getElementById('upload-counter-label');
    if (countEl) countEl.textContent = `Menampilkan ${filtered.length} dari ${tasks.filter(t => t.tipe === targetTipe).length} video (${targetTipe})`;

    const cardsContainer = document.getElementById('upload-cards-container');
    if (cardsContainer) {
        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Belum Ada Video Diupload</div>
                    <div style="font-size: 12px;">Klik tombol "+ Upload Video Baru" di atas untuk menambahkan bahan video.</div>
                </div>
            `;
        } else {
            cardsContainer.innerHTML = filtered.map(t => {
                const statusColor = t.status === 'Selesai' ? '#10b981' : (t.status === 'Perlu Revisi' ? '#ef4444' : '#f59e0b');
                const isPembelajaran = t.tipe === 'Video Pembelajaran';
                const kodeMkBadge = (isPembelajaran && t.kodeMk)
                    ? `<span style="font-family: monospace; font-size: 10.5px; background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 1px 6px; border-radius: 4px; font-weight: 700; margin-right: 4px;">${t.kodeMk}</span>`
                    : '';
                const subInfo = isPembelajaran
                    ? `<span>${kodeMkBadge}Matkul: <b>${t.mataKuliah || '-'}</b></span> &bull; <span>Dosen: <b>${t.dosen || '-'}</b></span>`
                    : `<span>Host: <b>${t.host || '-'}</b></span> &bull; <span>Narasumber: <b>${t.narasumber || '-'}</b></span>`;

                const storyboardBtn = isPembelajaran && t.storyboard ? `
                    <a href="${t.storyboard}" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                        <span>Storyboard</span>
                    </a>
                ` : '';

                const hasilEditBadge = t.hasilEdit ? `
                    <a href="${t.hasilEdit}" target="_blank" style="font-size: 11px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                        <span>Lihat Hasil Edit</span>
                    </a>
                ` : '<span style="font-size: 11px; color: var(--text-muted); font-style: italic;">Belum ada hasil edit</span>';

                return `
                    <div class="content-card">
                        <div class="card-top" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                            <div style="font-weight: 800; font-size: 14px; color: var(--text-main); line-height: 1.3;">${t.judul}</div>
                            <span style="font-size: 10px; background: ${statusColor}18; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 2px 8px; border-radius: 12px; font-weight: 700; white-space: nowrap;">
                                ${t.status || 'Belum Dikerjakan'}
                            </span>
                        </div>
                        <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 10px; line-height: 1.4;">
                            ${subInfo}
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; margin-bottom: 12px;">
                            <span style="background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                                Editor: ${t.editor || t.assignedEditor || '-'}
                            </span>
                            <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                                Deadline: ${formatTanggalIndo(t.deadline)}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: auto;">
                            <div>${hasilEditBadge}</div>
                            <div style="display: flex; gap: 6px;">
                                <a href="${t.rawVideo}" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none; color: var(--primary); border-color: rgba(188, 48, 95, 0.3);">
                                    Raw Video
                                </a>
                                ${storyboardBtn}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const tableHead = document.getElementById('upload-table-head');
    const tableBody = document.getElementById('upload-table-body');
    const isPembelajaran = targetTipe === 'Video Pembelajaran';

    if (tableHead) {
        tableHead.innerHTML = `
            <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Judul Video</th>
                <th>${isPembelajaran ? 'Mata Kuliah & Dosen' : 'Host & Narasumber'}</th>
                <th>Editor Video</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Bahan Mentah</th>
                <th>Hasil Edit</th>
            </tr>
        `;
    }

    if (tableBody) {
        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">Tidak ada video diupload.</td></tr>`;
        } else {
            tableBody.innerHTML = filtered.map((t, idx) => {
                const statusColor = t.status === 'Selesai' ? '#10b981' : (t.status === 'Perlu Revisi' ? '#ef4444' : '#f59e0b');
                const kodeMkTableBadge = (isPembelajaran && t.kodeMk)
                    ? `<span style="font-family: monospace; font-size: 10px; background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 1px 5px; border-radius: 4px; font-weight: 700; margin-right: 4px;">${t.kodeMk}</span>`
                    : '';
                const infoCol = isPembelajaran
                    ? `<div>${kodeMkTableBadge}<strong>${t.mataKuliah || '-'}</strong><div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${t.dosen || '-'}</div></div>`
                    : `<div><strong>Host: ${t.host || '-'}</strong><div style="font-size: 11px; color: var(--text-muted);">Nara: ${t.narasumber || '-'}</div></div>`;

                return `
                    <tr>
                        <td style="text-align: center; font-weight: 600; font-size: 12px;">${idx + 1}</td>
                        <td>
                            <div style="font-weight: 700; font-size: 13px;">${t.judul}</div>
                        </td>
                        <td>${infoCol}</td>
                        <td><span style="font-size: 12px; font-weight: 700; color: #6366f1;">${t.editor || t.assignedEditor || '-'}</span></td>
                        <td style="white-space: nowrap; font-size: 12px; font-weight: 600; color: #ef4444;">${formatTanggalIndo(t.deadline)}</td>
                        <td>
                            <span style="font-size: 11px; background: ${statusColor}18; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 2px 8px; border-radius: 12px; font-weight: 700; white-space: nowrap;">
                                ${t.status || 'Belum Dikerjakan'}
                            </span>
                        </td>
                        <td style="white-space: nowrap;">
                            <div style="display: flex; gap: 4px;">
                                <a href="${t.rawVideo}" target="_blank" class="btn-secondary" style="padding: 2px 6px; font-size: 11px; text-decoration: none;">Raw</a>
                                ${t.storyboard ? `<a href="${t.storyboard}" target="_blank" class="btn-secondary" style="padding: 2px 6px; font-size: 11px; text-decoration: none;">Story</a>` : ''}
                            </div>
                        </td>
                        <td>
                            ${t.hasilEdit ? `<a href="${t.hasilEdit}" target="_blank" style="color: #10b981; font-weight: 700; font-size: 11px; text-decoration: underline;">Buka Link</a>` : '<span style="color: var(--text-muted); font-size: 11px;">-</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

export function setUploadModalType(type) {
    uploadModalType = type;
    state.uploadModalType = type;
    const btnPem = document.getElementById('btn-upload-type-pembelajaran');
    const btnPod = document.getElementById('btn-upload-type-podcast');
    const fPem = document.getElementById('form-upload-pembelajaran');
    const fPod = document.getElementById('form-upload-podcast');
    if (btnPem && btnPod && fPem && fPod) {
        if (type === 'pembelajaran') {
            btnPem.style.borderColor = '#f59e0b';
            btnPem.style.color = '#f59e0b';
            btnPem.style.background = 'rgba(245, 158, 11, 0.08)';
            btnPod.style.borderColor = 'var(--border-color)';
            btnPod.style.color = 'var(--text-muted)';
            btnPod.style.background = 'var(--bg-secondary)';
            fPem.style.display = 'block';
            fPod.style.display = 'none';
        } else {
            btnPod.style.borderColor = '#f59e0b';
            btnPod.style.color = '#f59e0b';
            btnPod.style.background = 'rgba(245, 158, 11, 0.08)';
            btnPem.style.borderColor = 'var(--border-color)';
            btnPem.style.color = 'var(--text-muted)';
            btnPem.style.background = 'var(--bg-secondary)';
            fPem.style.display = 'none';
            fPod.style.display = 'block';
        }
    }
}

export function openCreateUploadModal(tipe) {
    const targetType = tipe || currentUploadTab || 'pembelajaran';
    setUploadModalType(targetType);
    const pemKodeMk = document.getElementById('upload-pem-kodemk');
    const pemMatkul = document.getElementById('upload-pem-matkul');
    const pemJudul = document.getElementById('upload-pem-judul');
    const pemDosen = document.getElementById('upload-pem-dosen');
    const pemRaw = document.getElementById('upload-pem-raw');
    const pemStory = document.getElementById('upload-pem-storyboard');
    const podJudul = document.getElementById('upload-pod-judul');
    const podHost = document.getElementById('upload-pod-host');
    const podNara = document.getElementById('upload-pod-narasumber');
    const podRaw = document.getElementById('upload-pod-raw');

    if (pemKodeMk) pemKodeMk.value = '';
    if (pemMatkul) pemMatkul.value = '';
    if (pemJudul) pemJudul.value = '';
    if (pemDosen) pemDosen.value = '';
    if (pemRaw) pemRaw.value = '';
    if (pemStory) pemStory.value = '';
    if (podJudul) podJudul.value = '';
    if (podHost) podHost.value = '';
    if (podNara) podNara.value = '';
    if (podRaw) podRaw.value = '';

    navigateTo('/studio-upload/tambah');
}
export const openUploadModal = openCreateUploadModal;

export function closeCreateUploadModal() {
    navigateTo('/studio-upload');
}
export const closeUploadModal = closeCreateUploadModal;

export function getVideoEditorsList() {
    const editors = [];
    Object.keys(dataVolunteer).forEach(name => {
        const item = dataVolunteer[name];
        if (item && item.div && item.div.toLowerCase().includes('editor video')) {
            editors.push(name);
        }
    });
    return editors;
}

export function autoAssignVideoEditor() {
    const editors = getVideoEditorsList();
    if (editors.length === 0) return 'Rizki Faturohman';
    const tasks = getStoredEditorTasks();
    const counts = {};
    editors.forEach(e => { counts[e] = 0; });
    tasks.forEach(t => {
        const ed = t.editor || t.assignedEditor;
        if (t.status !== 'Selesai' && counts.hasOwnProperty(ed)) {
            counts[ed]++;
        }
    });
    let minCount = Infinity;
    let chosen = editors[0];
    editors.forEach(e => {
        if (counts[e] < minCount) {
            minCount = counts[e];
            chosen = e;
        }
    });
    return chosen;
}

export function generateRandomWorkingDeadline() {
    const deadline = new Date();
    let addedDays = 0;
    const maxDays = Math.floor(Math.random() * 4) + 3; // 3 - 6 hari kerja acak
    while (addedDays < maxDays) {
        deadline.setDate(deadline.getDate() + 1);
        const dow = deadline.getDay();
        if (dow !== 0 && dow !== 6) addedDays++; // Lewati akhir pekan
    }
    const yyyy = deadline.getFullYear();
    const mm = String(deadline.getMonth() + 1).padStart(2, '0');
    const dd = String(deadline.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export async function submitCreateUploadModal(e) {
    if (e && e.preventDefault) e.preventDefault();

    const tipe = uploadModalType;
    let taskObj = {};
    const uploaderName = state.currentUser ? state.currentUser.namaLengkap : 'Admin';

    if (tipe === 'pembelajaran') {
        const kodeMk = (document.getElementById('upload-pem-kodemk')?.value || '').trim();
        const matkul = (document.getElementById('upload-pem-matkul')?.value || '').trim();
        const judul = (document.getElementById('upload-pem-judul')?.value || '').trim();
        const dosen = (document.getElementById('upload-pem-dosen')?.value || '').trim();
        const raw = (document.getElementById('upload-pem-raw')?.value || '').trim();
        const storyboard = (document.getElementById('upload-pem-storyboard')?.value || '').trim();

        if (!kodeMk || !matkul || !judul || !dosen || !raw || !storyboard) {
            showCustomDialog({
                title: "Validasi Form",
                message: "Mohon lengkapi semua kolom Video Pembelajaran termasuk Kode MK, Mata Kuliah, Link Raw Video dan Storyboard!",
                confirmText: "Mengerti"
            });
            return;
        }

        const assignedEditor = autoAssignVideoEditor();
        const deadline = generateRandomWorkingDeadline();
        const taskId = 'ET-' + Date.now();

        taskObj = {
            id: taskId,
            tipe: 'Video Pembelajaran',
            uploadId: 'UP-' + Date.now(),
            judul: judul,
            kodeMk: kodeMk,
            mataKuliah: matkul,
            dosen: dosen,
            uploader: uploaderName,
            editor: assignedEditor,
            assignedEditor: assignedEditor,
            deadline: deadline,
            status: 'Belum Dikerjakan',
            rawVideo: raw,
            storyboard: storyboard,
            hasilEdit: '',
            revisi: '-',
            note: '',
            createdAt: new Date().toISOString()
        };
    } else {
        const judul = (document.getElementById('upload-pod-judul')?.value || '').trim();
        const host = (document.getElementById('upload-pod-host')?.value || '').trim();
        const narasumber = (document.getElementById('upload-pod-narasumber')?.value || '').trim();
        const raw = (document.getElementById('upload-pod-raw')?.value || '').trim();

        if (!judul || !host || !narasumber || !raw) {
            showCustomDialog({
                title: "Validasi Form",
                message: "Mohon lengkapi semua kolom Video Podcast termasuk Link Raw Video!",
                confirmText: "Mengerti"
            });
            return;
        }

        const assignedEditor = autoAssignVideoEditor();
        const deadline = generateRandomWorkingDeadline();
        const taskId = 'ET-' + Date.now();

        taskObj = {
            id: taskId,
            tipe: 'Video Podcast',
            uploadId: 'UP-' + Date.now(),
            judul: judul,
            host: host,
            narasumber: narasumber,
            uploader: uploaderName,
            editor: assignedEditor,
            assignedEditor: assignedEditor,
            deadline: deadline,
            status: 'Belum Dikerjakan',
            rawVideo: raw,
            storyboard: '',
            hasilEdit: '',
            revisi: '-',
            note: '',
            createdAt: new Date().toISOString()
        };
    }

    const tasks = getStoredEditorTasks();
    tasks.unshift(taskObj);
    saveStoredEditorTasks(tasks);

    closeCreateUploadModal();
    renderStudioUpload();
    if (typeof window.renderStudioEditor === 'function') window.renderStudioEditor();

    await saveStudioTask(taskObj);
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderPelaporan === 'function') window.renderPelaporan();

    showCustomDialog({
        title: "Berhasil Diupload",
        message: `Bahan video "${taskObj.judul}" berhasil diupload dan otomatis ditugaskan kepada ${taskObj.editor} (Deadline: ${formatTanggalIndo(taskObj.deadline)}).`,
        confirmText: "OK"
    });
}
export const submitUploadModal = submitCreateUploadModal;

export function initStudioUpload() {
    window.renderStudioUpload = renderStudioUpload;
    window.switchUploadTab = switchUploadTab;
    window.setUploadViewMode = setUploadViewMode;
    window.setUploadModalType = setUploadModalType;
    window.openCreateUploadModal = openCreateUploadModal;
    window.openUploadModal = openCreateUploadModal;
    window.closeCreateUploadModal = closeCreateUploadModal;
    window.closeUploadModal = closeCreateUploadModal;
    window.submitCreateUploadModal = submitCreateUploadModal;
    window.submitUploadModal = submitCreateUploadModal;
    window.autoAssignVideoEditor = autoAssignVideoEditor;

    const btnPem = document.getElementById('tab-upload-pembelajaran');
    const btnPod = document.getElementById('tab-upload-podcast');
    if (btnPem) btnPem.addEventListener('click', () => switchUploadTab('pembelajaran'));
    if (btnPod) btnPod.addEventListener('click', () => switchUploadTab('podcast'));

    const btnCards = document.getElementById('btn-upload-view-cards');
    const btnTable = document.getElementById('btn-upload-view-table');
    if (btnCards) btnCards.addEventListener('click', () => setUploadViewMode('cards'));
    if (btnTable) btnTable.addEventListener('click', () => setUploadViewMode('table'));

    const defaultMode = window.innerWidth <= 850 ? 'cards' : 'table';
    setUploadViewMode(defaultMode);

    const searchUpload = document.getElementById('search-upload-input');
    if (searchUpload) searchUpload.addEventListener('input', renderStudioUpload);
}
