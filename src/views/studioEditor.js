// Studio Editor View Module (Editor Tasks Kanban/Table, Progress Status, Revision Notes & Review)
import { state } from '../store/state.js';
import { db, saveStudioTask, deleteStudioTask } from '../services/firebase.js';
import { showCustomDialog } from '../utils/dialog.js';
import { formatTanggalIndo } from '../utils/helpers.js';
import { navigateTo } from '../router/index.js';
import { getStoredEditorTasks, saveStoredEditorTasks } from './studioUpload.js';
import { getSkeletonCards, getSkeletonTableRows } from '../utils/skeleton.js';

export const studioEditorTemplate = `
        <section id="view-studio-editor" class="view-section">
            <div
                style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-main); font-weight: 700;">Studio Editor</h3>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                    <div id="editor-info-badge"
                        style="background: var(--bg-tertiary); padding: 5px 12px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; color: var(--text-muted); border: 1px solid var(--border-color);">
                        Editor: <span id="editor-info-name" style="color: #6366f1; font-weight: 700;">-</span>
                    </div>
                </div>
            </div>

            <!-- Tabs Nav: Pembelajaran vs Podcast -->
            <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 1.25rem;">
                <button type="button" class="tab-btn active" id="tab-editor-pembelajaran"
                    onclick="switchEditorTab('pembelajaran')"
                    style="padding: 10px 16px; font-weight: 700; font-size: 13px; border: none; background: none; cursor: pointer; color: #6366f1; border-bottom: 2px solid #6366f1;">
                    Video Pembelajaran
                </button>
                <button type="button" class="tab-btn" id="tab-editor-podcast" onclick="switchEditorTab('podcast')"
                    style="padding: 10px 16px; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent;">
                    Video Podcast
                </button>
            </div>

            <!-- Controls bar -->
            <div class="control-bar" style="margin-bottom: 1rem;">
                <div class="filters-group" style="flex: 1; flex-wrap: wrap; gap: 8px;">
                    <input type="text" id="search-editor-input" class="filter-select"
                        placeholder="Cari judul, dosen, host, matkul..." oninput="renderStudioEditor()"
                        style="flex: 1 1 180px; min-width: 0;">
                    <select id="filter-editor-status" class="filter-select" onchange="renderStudioEditor()"
                        style="flex: 1 1 140px; min-width: 0;">
                        <option value="ALL">Semua Status</option>
                        <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                        <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                        <option value="Menunggu Review Admin">Menunggu Review Admin</option>
                        <option value="Perlu Revisi">Perlu Revisi</option>
                        <option value="Selesai">Selesai</option>
                    </select>
                </div>
                <div class="view-toggle-btns">
                    <button class="toggle-btn active" id="btn-editor-view-cards"
                        onclick="setEditorViewMode('cards')">Kartu (Mobile)</button>
                    <button class="toggle-btn" id="btn-editor-view-table"
                        onclick="setEditorViewMode('table')">Tabel (Desktop)</button>
                </div>
            </div>

            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.75rem;">
                <span id="editor-counter-label">Menampilkan 0 tugas</span>
            </div>

            <!-- Container Kartu & Tabel -->
            <div id="editor-cards-container" class="cards-container">
                ${getSkeletonCards(3)}
            </div>
            <div id="editor-table-container" class="table-wrapper" style="display: none;">
                <table class="content-table">
                    <thead id="editor-table-head"></thead>
                    <tbody id="editor-table-body">
                        ${getSkeletonTableRows(7, 4)}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- SUB-VIEW 1: FORM TAMBAH / EDIT RENCANA KONTEN (/konten/tambah & /konten/edit) -->

        <section id="view-studio-editor-detail" class="view-section">
            <div class="subview-header-bar">
                <div class="subview-header-left">
                    <button type="button" class="btn-back-nav" onclick="navigateTo('/studio-editor')">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Kembali ke Studio Editor</span>
                    </button>
                    <div>
                        <h2 class="subview-title" id="modal-editor-title">Kelola Tugas Editor</h2>
                    </div>
                </div>
            </div>
            <div class="subview-card-form">
                <input type="hidden" id="modal-editor-task-id">
                <input type="hidden" id="modal-editor-task-tipe">

                <!-- Task Details Summary Card -->
                <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 1rem;">
                    <div style="font-weight: 800; font-size: 14px; color: var(--text-main); margin-bottom: 4px;" id="modal-editor-display-judul">-</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;" id="modal-editor-display-sub">-</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px;">
                        <span id="modal-editor-display-deadline" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Deadline: -</span>
                        <span id="modal-editor-display-status" style="background: var(--bg-secondary); color: var(--text-main); padding: 2px 8px; border-radius: 12px; font-weight: 600;">Status: -</span>
                        <span id="modal-editor-display-assigned" style="background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Editor: -</span>
                    </div>
                </div>

                <!-- Bahan Mentah Links -->
                <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
                    <a id="modal-editor-link-raw" href="#" target="_blank" class="btn-secondary"
                        style="flex: 1; padding: 8px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: var(--primary); border-color: rgba(188, 48, 95, 0.3);">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Buka Raw Video (Drive)</span>
                    </a>
                    <a id="modal-editor-link-storyboard" href="#" target="_blank" class="btn-secondary"
                        style="flex: 1; padding: 8px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Buka Storyboard</span>
                    </a>
                </div>

                <!-- Alert Revisi Note (Muncul jika ada revisi) -->
                <div id="modal-editor-revisi-alert"
                    style="display: none; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 1rem;">
                    <div style="font-weight: 700; font-size: 12px; color: #b45309; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span id="modal-editor-revisi-title">Catatan Revisi</span>
                    </div>
                    <div id="modal-editor-revisi-content" style="font-size: 12px; color: var(--text-main); line-height: 1.4;">-</div>
                </div>

                <!-- Input Hasil Edit -->
                <div class="form-group" style="margin-bottom: 0.85rem;">
                    <label class="form-label" style="font-size: 12px; font-weight: 700;">Link Hasil Edit Video (Google Drive / YouTube Unlisted) <span style="color: #ef4444;">*</span></label>
                    <input type="url" id="modal-editor-input-hasil" class="form-input" placeholder="https://drive.google.com/file/d/...">
                </div>

                <!-- Admin Only Fields -->
                <div id="modal-editor-admin-fields"
                    style="display: none; border-top: 1px dashed var(--border-color); padding-top: 0.85rem; margin-top: 0.85rem;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">
                        Kontrol Status Editor
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 0.85rem;">
                        <div class="form-group">
                            <label class="form-label" style="font-size: 11px; font-weight: 700;">Status Task</label>
                            <select id="modal-editor-admin-status" class="form-select" style="font-size: 12px;">
                                <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                                <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                                <option value="Menunggu Review Admin">Menunggu Review Admin</option>
                                <option value="Perlu Revisi">Perlu Revisi</option>
                                <option value="Selesai">Selesai</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="font-size: 11px; font-weight: 700;">Status Revisi</label>
                            <input type="text" id="modal-editor-admin-revisi" class="form-input" style="font-size: 12px;" placeholder="Contoh: Revisi 1, Revisi 2, atau -">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-size: 11px; font-weight: 700;">Catatan / Note Revisi</label>
                        <textarea id="modal-editor-admin-note" class="form-input" rows="2" style="font-size: 12px;" placeholder="Tuliskan catatan perbaikan atau instruksi revisi..."></textarea>
                    </div>
                </div>

                <div style="padding: 0.85rem 0 0; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); margin-top: 1rem;">
                    <button type="button" class="btn-secondary" id="modal-editor-btn-delete" onclick="handleDeleteEditorTask()"
                        style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); display: none;">
                        Hapus Tugas
                    </button>
                    <div style="display: flex; gap: 8px; margin-left: auto;">
                        <button type="button" class="btn-secondary" onclick="navigateTo('/studio-editor')">Batal</button>
                        <button type="button" class="btn-primary" onclick="submitEditorTaskModal()"
                            style="background: #6366f1; border-color: #6366f1; color: #fff;">
                            Simpan & Update
                        </button>
                    </div>
                </div>
            </div>
        </section>
`;

let currentEditorTab = 'pembelajaran';
let editorViewMode = window.innerWidth <= 850 ? 'cards' : 'table';

export function switchEditorTab(tab) {
    currentEditorTab = tab;
    state.currentEditorTab = tab;
    const btnPem = document.getElementById('tab-editor-pembelajaran');
    const btnPod = document.getElementById('tab-editor-podcast');

    if (btnPem && btnPod) {
        if (tab === 'pembelajaran') {
            btnPem.classList.add('active');
            btnPem.style.color = '#6366f1';
            btnPem.style.borderBottom = '2px solid #6366f1';
            btnPod.classList.remove('active');
            btnPod.style.color = 'var(--text-muted)';
            btnPod.style.borderBottom = '2px solid transparent';
        } else {
            btnPod.classList.add('active');
            btnPod.style.color = '#6366f1';
            btnPod.style.borderBottom = '2px solid #6366f1';
            btnPem.classList.remove('active');
            btnPem.style.color = 'var(--text-muted)';
            btnPem.style.borderBottom = '2px solid transparent';
        }
    }
    renderStudioEditor();
}

export function setEditorViewMode(mode) {
    editorViewMode = mode;
    state.editorViewMode = mode;
    const cards = document.getElementById('editor-cards-container');
    const table = document.getElementById('editor-table-container');
    const btnCards = document.getElementById('btn-editor-view-cards');
    const btnTable = document.getElementById('btn-editor-view-table');

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

export function renderStudioEditor() {
    const tasks = getStoredEditorTasks();
    const targetTipe = currentEditorTab === 'pembelajaran' ? 'Video Pembelajaran' : 'Video Podcast';
    const searchVal = (document.getElementById('search-editor-input')?.value || document.getElementById('search-editor')?.value || '').toLowerCase().trim();
    const filterStatus = document.getElementById('filter-editor-status')?.value || 'ALL';
    const filterEditor = document.getElementById('filter-editor-person')?.value || 'ALL';

    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');

    const filtered = tasks.filter(t => {
        if (t.tipe !== targetTipe) return false;
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;

        if (!isAdmin && state.currentUser) {
            const myName = state.currentUser.namaLengkap.toLowerCase().trim();
            const ed = (t.editor || t.assignedEditor || '').toLowerCase().trim();
            if (ed !== myName) return false;
        } else if (filterEditor !== 'ALL') {
            const ed = (t.editor || t.assignedEditor || '').trim();
            if (ed !== filterEditor) return false;
        }

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

    const countEl = document.getElementById('editor-counter-label');
    if (countEl) countEl.textContent = `Menampilkan ${filtered.length} tugas (${targetTipe})`;

    const cardsContainer = document.getElementById('editor-cards-container');
    if (cardsContainer) {
        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">Tidak Ada Tugas Editing</div>
                    <div style="font-size: 12px;">Belum ada penugasan video yang cocok dengan kriteria filter saat ini.</div>
                </div>
            `;
        } else {
            cardsContainer.innerHTML = filtered.map(t => {
                const statusColor = t.status === 'Selesai' ? '#10b981' : (t.status === 'Perlu Revisi' ? '#ef4444' : '#f59e0b');
                const isPembelajaran = t.tipe === 'Video Pembelajaran';
                const kodeMkBadge = (isPembelajaran && t.kodeMk)
                    ? `<span style="font-family: monospace; font-size: 10.5px; background: rgba(99, 102, 241, 0.15); color: #6366f1; padding: 1px 6px; border-radius: 4px; font-weight: 700; margin-right: 4px;">${t.kodeMk}</span>`
                    : '';
                const info1 = isPembelajaran
                    ? `<span>${kodeMkBadge}Mata Kuliah: <b>${t.mataKuliah || '-'}</b></span> &bull; <span>Dosen: <b>${t.dosen || '-'}</b></span>`
                    : `<span>Host: <b>${t.host || '-'}</b></span> &bull; <span>Narasumber: <b>${t.narasumber || '-'}</b></span>`;

                const hasRevision = t.revisi && t.revisi !== '-' && t.revisi.trim() !== '';
                const revisiBadge = hasRevision ? `
                    <span style="font-size: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 1px 6px; border-radius: 6px; font-weight: 700;">
                        ${t.revisi}
                    </span>
                ` : '';

                const revisiNoteBlock = (hasRevision && t.note) ? `
                    <div style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 6px 10px; border-radius: 4px; font-size: 11.5px; margin-bottom: 10px; color: var(--text-main);">
                        <strong style="color: #b45309;">Catatan Revisi:</strong> ${t.note}
                    </div>
                ` : '';

                const storyboardLink = (isPembelajaran && t.storyboard) ? `
                    <a href="${t.storyboard}" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">
                        Storyboard
                    </a>
                ` : '';

                return `
                    <div class="content-card">
                        <div class="card-top" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                            <div style="font-weight: 800; font-size: 14px; color: var(--text-main); line-height: 1.3;">${t.judul}</div>
                            <div style="display: flex; gap: 4px; align-items: center;">
                                ${revisiBadge}
                                <span style="font-size: 10px; background: ${statusColor}18; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 2px 8px; border-radius: 12px; font-weight: 700; white-space: nowrap;">
                                    ${t.status || 'Belum Dikerjakan'}
                                </span>
                            </div>
                        </div>
                        <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">
                            ${info1}
                        </div>
                        ${revisiNoteBlock}
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; margin-bottom: 12px;">
                            <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                                Deadline: ${formatTanggalIndo(t.deadline)}
                            </span>
                            <span style="background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                                Editor: ${t.editor || t.assignedEditor || '-'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: auto;">
                            <div style="display: flex; gap: 6px;">
                                <a href="${t.rawVideo}" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none; color: var(--primary); border-color: rgba(188, 48, 95, 0.3);">
                                    Raw Video
                                </a>
                                ${storyboardLink}
                            </div>
                            <button type="button" class="btn-primary" style="background: #6366f1; border-color: #6366f1; color: #fff; padding: 5px 12px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px;" onclick="window.openEditorTaskModal('${t.id}')">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                <span>${isAdmin ? 'Review / Edit' : 'Kerjakan / Edit'}</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const tableHead = document.getElementById('editor-table-head');
    const tableBody = document.getElementById('editor-table-body');
    const isPembelajaran = targetTipe === 'Video Pembelajaran';

    if (tableHead) {
        tableHead.innerHTML = `
            <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Judul</th>
                <th>${isPembelajaran ? 'Mata Kuliah & Dosen' : 'Host & Narasumber'}</th>
                <th>Editor</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Revisi & Note</th>
                <th>Bahan Mentah</th>
                <th style="text-align: center;">Aksi</th>
            </tr>
        `;
    }

    if (tableBody) {
        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">Tidak ada penugasan editing.</td></tr>`;
        } else {
            tableBody.innerHTML = filtered.map((t, idx) => {
                const statusColor = t.status === 'Selesai' ? '#10b981' : (t.status === 'Perlu Revisi' ? '#ef4444' : '#f59e0b');
                const kodeMkTableBadge = (isPembelajaran && t.kodeMk)
                    ? `<span style="font-family: monospace; font-size: 10px; background: rgba(99, 102, 241, 0.15); color: #6366f1; padding: 1px 5px; border-radius: 4px; font-weight: 700; margin-right: 4px;">${t.kodeMk}</span>`
                    : '';
                const infoCol = isPembelajaran
                    ? `<div>${kodeMkTableBadge}<strong>${t.mataKuliah || '-'}</strong><div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${t.dosen || '-'}</div></div>`
                    : `<div><strong>Host: ${t.host || '-'}</strong><div style="font-size: 11px; color: var(--text-muted);">Nara: ${t.narasumber || '-'}</div></div>`;

                const hasRev = t.revisi && t.revisi !== '-' && t.revisi.trim() !== '';
                const revCell = hasRev
                    ? `<span style="color: #ef4444; font-weight: 700; font-size: 11px;">${t.revisi}</span><div style="font-size: 10px; color: var(--text-muted);">${t.note || ''}</div>`
                    : '<span style="color: var(--text-muted); font-size: 11px;">-</span>';

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
                        <td>${revCell}</td>
                        <td style="white-space: nowrap;">
                            <div style="display: flex; gap: 4px;">
                                <a href="${t.rawVideo}" target="_blank" class="btn-secondary" style="padding: 2px 6px; font-size: 11px; text-decoration: none;">Raw</a>
                                ${t.storyboard ? `<a href="${t.storyboard}" target="_blank" class="btn-secondary" style="padding: 2px 6px; font-size: 11px; text-decoration: none;">Story</a>` : ''}
                            </div>
                        </td>
                        <td style="text-align: center;">
                            <button type="button" class="btn-primary" style="background: #6366f1; border-color: #6366f1; color: #fff; padding: 4px 8px; font-size: 11px;" onclick="window.openEditorTaskModal('${t.id}')">
                                Edit
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

export function openEditorTaskModal(taskId) {
    const tasks = getStoredEditorTasks();
    const t = tasks.find(x => String(x.id) === String(taskId));
    if (!t) return;

    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');

    document.getElementById('modal-editor-task-id').value = t.id;
    document.getElementById('modal-editor-task-tipe').value = t.tipe || 'Video Pembelajaran';

    document.getElementById('modal-editor-display-judul').textContent = t.judul || '-';
    const isPembelajaran = t.tipe === 'Video Pembelajaran';
    document.getElementById('modal-editor-display-sub').textContent = isPembelajaran
        ? `${t.kodeMk ? '[' + t.kodeMk + '] ' : ''}Mata Kuliah: ${t.mataKuliah || '-'} | Dosen: ${t.dosen || '-'}`
        : `Host: ${t.host || '-'} | Narasumber: ${t.narasumber || '-'}`;

    document.getElementById('modal-editor-display-deadline').textContent = `Deadline: ${formatTanggalIndo(t.deadline)}`;
    document.getElementById('modal-editor-display-status').textContent = `Status: ${t.status || 'Belum Dikerjakan'}`;
    document.getElementById('modal-editor-display-assigned').textContent = `Editor: ${t.editor || t.assignedEditor || '-'}`;

    const linkRaw = document.getElementById('modal-editor-link-raw');
    if (linkRaw) linkRaw.href = t.rawVideo || '#';

    const linkStory = document.getElementById('modal-editor-link-storyboard');
    if (linkStory) {
        if (isPembelajaran && t.storyboard) {
            linkStory.href = t.storyboard;
            linkStory.style.display = 'inline-flex';
        } else {
            linkStory.style.display = 'none';
        }
    }

    const alertRev = document.getElementById('modal-editor-revisi-alert');
    const hasRev = t.revisi && t.revisi !== '-' && t.revisi.trim() !== '';
    if (alertRev) {
        if (hasRev) {
            alertRev.style.display = 'block';
            document.getElementById('modal-editor-revisi-title').textContent = `Catatan ${t.revisi} dari Admin:`;
            document.getElementById('modal-editor-revisi-content').textContent = t.note || 'Silakan cek dan sesuaikan kembali hasil video editing.';
        } else {
            alertRev.style.display = 'none';
        }
    }

    document.getElementById('modal-editor-input-hasil').value = t.hasilEdit || '';

    const adminFields = document.getElementById('modal-editor-admin-fields');
    const btnDel = document.getElementById('modal-editor-btn-delete');
    if (adminFields) {
        if (isAdmin) {
            adminFields.style.display = 'block';
            document.getElementById('modal-editor-admin-status').value = t.status || 'Belum Dikerjakan';
            document.getElementById('modal-editor-admin-revisi').value = t.revisi || '-';
            document.getElementById('modal-editor-admin-note').value = t.note || '';
        } else {
            adminFields.style.display = 'none';
        }
    }
    if (btnDel) {
        btnDel.style.display = isAdmin ? 'inline-block' : 'none';
    }

    document.getElementById('modal-editor-task').classList.add('active');
    navigateTo('/studio-editor/tugas');
}

export function closeEditorTaskModal() {
    document.getElementById('modal-editor-task').classList.remove('active');
    navigateTo('/studio-editor');
}

export async function submitEditorTaskModal() {
    const taskId = document.getElementById('modal-editor-task-id').value;
    const tasks = getStoredEditorTasks();
    const t = tasks.find(x => String(x.id) === String(taskId));
    if (!t) return;

    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    const hasilEditVal = document.getElementById('modal-editor-input-hasil').value.trim();

    t.hasilEdit = hasilEditVal;

    if (isAdmin) {
        t.status = document.getElementById('modal-editor-admin-status').value;
        t.revisi = document.getElementById('modal-editor-admin-revisi').value.trim() || '-';
        t.note = document.getElementById('modal-editor-admin-note').value.trim();
    } else {
        if (hasilEditVal && (t.status === 'Belum Dikerjakan' || t.status === 'Perlu Revisi')) {
            t.status = 'Menunggu Review Admin';
        }
    }

    saveStoredEditorTasks(tasks);
    closeEditorTaskModal();
    renderStudioEditor();

    await saveStudioTask(t);
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderPelaporan === 'function') window.renderPelaporan();

    showCustomDialog({
        title: "Perubahan Disimpan",
        message: "Data tugas video editor berhasil diperbarui!",
        confirmText: "OK"
    });
}

export async function deleteEditorTask() {
    const taskId = document.getElementById('modal-editor-task-id').value;
    const confirmed = await showCustomDialog({
        title: "Hapus Penugasan",
        message: "Apakah Anda yakin ingin menghapus penugasan video ini?",
        confirmText: "Hapus",
        confirmColor: "#ef4444"
    });
    if (!confirmed) return;

    closeEditorTaskModal();
    await deleteStudioTask(taskId);
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderPelaporan === 'function') window.renderPelaporan();
    renderStudioEditor();
}

export const handleDeleteEditorTask = deleteEditorTask;

export function initStudioEditor() {
    window.renderStudioEditor = renderStudioEditor;
    window.switchEditorTab = switchEditorTab;
    window.setEditorViewMode = setEditorViewMode;
    window.openEditorTaskModal = openEditorTaskModal;
    window.closeEditorTaskModal = closeEditorTaskModal;
    window.submitEditorTaskModal = submitEditorTaskModal;
    window.deleteEditorTask = deleteEditorTask;
    window.handleDeleteEditorTask = handleDeleteEditorTask;

    const btnPem = document.getElementById('tab-editor-pembelajaran');
    const btnPod = document.getElementById('tab-editor-podcast');
    if (btnPem) btnPem.addEventListener('click', () => switchEditorTab('pembelajaran'));
    if (btnPod) btnPod.addEventListener('click', () => switchEditorTab('podcast'));

    const btnCards = document.getElementById('btn-editor-view-cards');
    const btnTable = document.getElementById('btn-editor-view-table');
    if (btnCards) btnCards.addEventListener('click', () => setEditorViewMode('cards'));
    if (btnTable) btnTable.addEventListener('click', () => setEditorViewMode('table'));

    const defaultMode = window.innerWidth <= 850 ? 'cards' : 'table';
    setEditorViewMode(defaultMode);

    const searchEditor = document.getElementById('search-editor-input');
    if (searchEditor) searchEditor.addEventListener('input', renderStudioEditor);

    const filterStatus = document.getElementById('filter-editor-status');
    if (filterStatus) filterStatus.addEventListener('change', renderStudioEditor);
}
