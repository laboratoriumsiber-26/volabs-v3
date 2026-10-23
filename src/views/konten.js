// Konten View Module (Content Plan Management, Cards & Table, Add/Edit Form, Approval)
import { state } from '../store/state.js';
import { CONFIG, dataVolunteer } from '../store/initialData.js';
import { api } from '../services/api.js';
import { db, saveContentPlan, deleteContentPlan } from '../services/firebase.js';
import { showCustomDialog } from '../utils/dialog.js';
import { cleanDate, compressImage, getBulanFromTanggal } from '../utils/helpers.js';
import { navigateTo } from '../router/index.js';
import { getEmptyStateHtml } from './dasbor.js';
import { getSkeletonCards, getSkeletonTableRows } from '../utils/skeleton.js';

export const kontenTemplate = `
        <section id="view-content-plan" class="view-section">
            <!-- Controls & Filter Bar -->
            <div class="control-bar">
                <div class="filters-group" style="flex: 1; flex-wrap: wrap; gap: 8px;">
                    <!-- Filter Bulan -->
                    <select id="filter-month" class="filter-select">
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

                    <!-- Filter Urutan (Default: Terbaru Ditambahkan) -->
                    <select id="filter-sort" class="filter-select">
                        <option value="newest_added">Urut: Terbaru Ditambahkan</option>
                        <option value="oldest_added">Urut: Terlama Ditambahkan</option>
                        <option value="publish_desc">Tanggal Tayang (Terbaru)</option>
                        <option value="publish_asc">Tanggal Tayang (Terlama)</option>
                        <option value="title_asc">Judul Konten (A - Z)</option>
                        <option value="title_desc">Judul Konten (Z - A)</option>
                        <option value="pic_asc">Nama PIC (A - Z)</option>
                    </select>

                    <select id="filter-platform" class="filter-select">
                        <option value="ALL">Semua Platform</option>
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Shorts YouTube">Shorts YouTube</option>
                        <option value="Website">Website</option>
                    </select>

                    <select id="filter-pillar" class="filter-select">
                        <option value="ALL">Semua Pilar</option>
                        <option value="Educational (Edukasi)">Educational</option>
                        <option value="Entertaining (Hiburan)">Entertaining</option>
                        <option value="Inspirational (Inspirasi)">Inspirational</option>
                        <option value="Promotional (Promosi)">Promotional</option>
                        <option value="Behind the Scene (BTS)">Behind the Scene</option>
                    </select>

                    <select id="filter-status" class="filter-select">
                        <option value="ALL">Semua Status</option>
                        <option value="Idea / Konsep">Idea / Konsep</option>
                        <option value="Scripting / Copywriting">Scripting / Copywriting</option>
                        <option value="Desain / Produksi">Desain / Produksi</option>
                        <option value="Review / Approval">Review / Approval</option>
                        <option value="Siap Tayang (Ready)">Siap Tayang (Ready)</option>
                        <option value="Published">Published</option>
                    </select>

                    <select id="filter-pic" class="filter-select">
                        <option value="ALL">Semua PIC</option>
                    </select>
                </div>

                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <!-- Tombol Cetak PDF Laporan -->
                    <button class="btn-secondary" id="btn-print-report"
                        style="color: var(--primary); border-color: var(--primary);" title="Unduh Laporan">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; height:18px;">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z">
                            </path>
                        </svg>
                        <span>Cetak Laporan</span>
                    </button>
                    <button class="btn-secondary" id="btn-approval" style="color: #f59e0b; border-color: #f59e0b;"
                        onclick="openApprovalModal()">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; height:18px;">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9">
                            </path>
                        </svg>
                        <span class="btn-text">Approval Kolaborasi</span>
                        <span id="badge-approval"
                            style="display:none; background: #ef4444; color: white; border-radius: 50%; padding: 2px 6px; font-size: 10px; margin-left: 4px;">0</span>
                    </button>
                    <button class="btn-primary" id="btn-add-content">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>Tambah Konten</span>
                    </button>
                </div>
            </div>

            <!-- View Switcher (Cards vs Table) -->
            <div class="view-switcher-bar">
                <span id="content-count-label"
                    style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Menampilkan 0 konten</span>
                <div class="view-toggle-btns">
                    <button class="toggle-btn active" id="btn-view-cards">Kartu (Mobile)</button>
                    <button class="toggle-btn" id="btn-view-table">Tabel (Desktop)</button>
                </div>
            </div>

            <!-- Container Tampilan Kartu -->
            <div id="content-cards-view" class="cards-container">
                ${getSkeletonCards(4)}
            </div>

            <!-- Container Tampilan Tabel -->
            <div id="content-table-view" class="table-wrapper" style="display: none;">
                <table class="content-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Pilar & Value</th>
                            <th>PIC</th>
                            <th>Judul & Topik</th>
                            <th>Platform</th>
                            <th>Status Produksi</th>
                            <th>Link</th>
                            <th style="width: 170px;">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody id="content-table-body">
                        ${getSkeletonTableRows(8, 5)}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- SECTION 3: KANBAN BOARD VIEW -->

        <section id="view-content-plan-form" class="view-section">
            <div class="subview-header-bar">
                <div class="subview-header-left">
                    <button type="button" class="btn-back-nav" onclick="navigateTo('/konten')">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Kembali ke Rencana Konten</span>
                    </button>
                    <div>
                        <h2 class="subview-title" id="crud-modal-title">Tambah Rencana Konten</h2>
                    </div>
                </div>
            </div>
            <div class="subview-card-form">
                <form id="form-crud" style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="hidden" id="field-id">
                    <!-- Row 1: Tanggal & Platform -->
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="field-tanggal">Tanggal Tayang *</label>
                            <input type="date" id="field-tanggal" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="field-platform">Platform *</label>
                            <select id="field-platform" class="form-select" required>
                                <option value="Instagram">Instagram</option>
                                <option value="TikTok">TikTok</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Shorts YouTube">Shorts YouTube</option>
                                <option value="Website">Website</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 2: Content Pillar & Value -->
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="field-pillar">Content Pillar *</label>
                            <select id="field-pillar" class="form-select" required>
                                <option value="Educational (Edukasi)">Educational (Edukasi)</option>
                                <option value="Entertaining (Hiburan)">Entertaining (Hiburan)</option>
                                <option value="Inspirational (Inspirasi)">Inspirational (Inspirasi)</option>
                                <option value="Promotional (Promosi)">Promotional (Promosi)</option>
                                <option value="Behind the Scene (BTS)">Behind the Scene (BTS)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="field-value">Value Konten *</label>
                            <select id="field-value" class="form-select" required>
                                <option value="Informasi">Informasi</option>
                                <option value="Edukasi">Edukasi</option>
                                <option value="Entertain">Entertain</option>
                                <option value="Promosi">Promosi</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 3: Status -->
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="field-status">Status Alur Kerja *</label>
                            <select id="field-status" class="form-select" required>
                                <option value="Idea / Konsep">Idea / Konsep</option>
                                <option value="Scripting / Copywriting">Scripting / Copywriting</option>
                                <option value="Desain / Produksi">Desain / Produksi</option>
                                <option value="Review / Approval">Review / Approval</option>
                                <option value="Siap Tayang (Ready)">Siap Tayang (Ready)</option>
                                <option value="Published">Published</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row Khusus Super Admin: Pilih Volunteer / Kolaborator Terlibat -->
                    <div class="form-group" id="group-admin-collab"
                        style="display: none; background: rgba(59, 130, 246, 0.05); padding: 14px; border-radius: 8px; border: 1px dashed rgba(59, 130, 246, 0.3); margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="color: #3b82f6; font-weight: 600; display: flex; align-items: center; gap: 6px; font-size: 0.85rem; margin: 0;">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                Pilih Volunteer Terlibat:
                            </label>
                            <span style="font-size: 10px; color: #3b82f6; font-weight: 500;">Checklist Relawan</span>
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px; line-height: 1.4;">
                            Centang nama-nama volunteer yang terlibat dalam konten ini. <b>Catatan:</b> Saat membuat konten baru, nama pertama yang dicentang otomatis menjadi <b>PIC Utama</b>, dan nama lainnya menjadi <b>Kolaborator</b>.
                        </div>
                        <div id="admin-collab-list"
                            style="max-height: 180px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; padding: 8px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; width: 100%; box-sizing: border-box;">
                        </div>
                    </div>

                    <!-- Row 3.5: Kinerja SKP & Foto Bukti -->
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="field-skp">Sasaran Kerja *</label>
                            <select id="field-skp" class="form-select" required onchange="handleSkpChange()">
                                <option value="-">-- Pilih Sasaran Kerja --</option>
                                <option value="Editing Video">Editing Video</option>
                                <option value="Desain Grafis">Desain Grafis</option>
                                <option value="Modul Pembelajaran Digital">Modul Pembelajaran Digital</option>
                                <option value="Produksi Podcast">Produksi Podcast</option>
                                <option value="Video Pembelajaran">Video Pembelajaran</option>
                                <option value="Pembuatan Konten Kreatif">Pembuatan Konten Kreatif</option>
                                <option value="Penulisan Artikel Ilmiah">Penulisan Artikel Ilmiah</option>
                            </select>
                            <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Pilih opsi untuk melihat status lampiran.</div>
                        </div>
                        <div class="form-group" id="group-foto-bukti">
                            <label for="field-foto-bukti" id="label-foto-bukti">Foto Bukti Kegiatan (Opsional)</label>
                            <input type="file" id="field-foto-bukti" class="form-input" accept="image/*" style="padding: 10px;">
                            <div style="font-size:11px; color:#ef4444; margin-top:4px;" id="hint-foto-bukti">*Wajib untuk Podcast & Modul</div>
                        </div>
                    </div>

                    <!-- Row 4: Judul Konten -->
                    <div class="form-group">
                        <label for="field-judul">Judul / Topik Konten *</label>
                        <input type="text" id="field-judul" class="form-input"
                            placeholder="Contoh: Sosialisasi Layanan Permohonan Informasi Publik" required>
                    </div>

                    <!-- Row 5: Isi / Scripting -->
                    <div class="form-group">
                        <label for="field-isi">Isi Konten / Naskah Script</label>
                        <textarea id="field-isi" class="form-textarea"
                            placeholder="Tuliskan ringkasan poin utama, naskah narasi, atau deskripsi visual..."></textarea>
                    </div>

                    <!-- Row 6: CTA & Hashtag -->
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="field-cta">CTA (Call to Action)</label>
                            <input type="text" id="field-cta" class="form-input"
                                placeholder="Contoh: Kunjungi website / klik tautan di bio">
                        </div>
                        <div class="form-group">
                            <label for="field-hashtag">Hashtag</label>
                            <input type="text" id="field-hashtag" class="form-input"
                                placeholder="Contoh: #VoLABS #PIPD #Pendidikan">
                        </div>
                    </div>

                    <!-- Row 7: Caption -->
                    <div class="form-group">
                        <label for="field-caption">Caption Postingan</label>
                        <textarea id="field-caption" class="form-textarea"
                            placeholder="Tuliskan teks caption lengkap untuk publikasi di media sosial..."></textarea>
                    </div>

                    <!-- Row 8: Link Publikasi -->
                    <div class="form-group" id="group-link" style="display: none;">
                        <label for="field-link">Link Publikasi</label>
                        <input type="url" id="field-link" class="form-input"
                            placeholder="Contoh: https://instagram.com/p/...">
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <button type="button" class="btn-secondary" id="btn-cancel-crud" onclick="navigateTo('/konten')">Batal</button>
                        <button type="submit" class="btn-primary" id="btn-save-crud">Simpan Rencana Konten</button>
                    </div>
                </form>
            </div>
        </section>

        <!-- SUB-VIEW 2: FORM TAMBAH / EDIT JURNAL KKN (/jurnal/tambah & /jurnal/edit) -->
`;

export function renderPersonsHtml(c, customStyle = "") {
    const pics = (c.PIC || "").split(',').map(s => s.trim()).filter(Boolean);
    const collabs = (c["Kolaborator"] || "").split(',').map(s => s.trim()).filter(Boolean);
    const allPersons = [...new Set([...pics, ...collabs])];

    if (allPersons.length === 0) return `<span class="pic-tag" style="${customStyle}">-</span>`;

    return allPersons.map(p => {
        const isPic = pics.includes(p);
        if (isPic) {
            return `<span class="pic-tag" style="${customStyle}" title="PIC (Pemilik)">${p}</span>`;
        } else {
            return `<span class="pic-tag" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); ${customStyle}" title="Kolaborator">${p}</span>`;
        }
    }).join('');
}

export function getActionButtons(c, isSmall = false, isKanban = false) {
    const picArray = (c.PIC || "").split(',').map(s => s.trim()).filter(Boolean);
    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    const isOwner = isAdmin || (state.currentUser && picArray.includes(state.currentUser.namaLengkap));
    const collabs = (c["Kolaborator"] || "").split(',').map(s => s.trim());
    const requests = (c["Request Kolaborasi"] || "").split(',').map(s => s.trim());

    const isCollab = state.currentUser && collabs.includes(state.currentUser.namaLengkap);
    const hasRequested = state.currentUser && requests.includes(state.currentUser.namaLengkap);

    let buttonsHtml = '';

    if (isOwner || isCollab) {
        buttonsHtml += `
          <button class="btn-card-action btn-edit-action" style="${isKanban ? 'padding: 0.25rem; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px;' : (isSmall ? 'padding: 0.35rem 0.65rem; font-size: 0.75rem;' : '')}" onclick="window.openModal('edit', '${c.ID}')" title="Edit Rencana Konten">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="${isKanban ? 'width:13px; height:13px;' : (isSmall ? 'width:13px; height:13px;' : '')}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            ${isKanban ? '' : (isSmall ? '<span>Edit</span>' : '<span>Edit</span>')}
          </button>
        `;
        if (isOwner) {
            buttonsHtml += `
              <button class="btn-card-action btn-del-action" style="${isKanban ? 'padding: 0.25rem; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px;' : (isSmall ? 'padding: 0.35rem 0.65rem; font-size: 0.75rem;' : '')}" onclick="window.deleteContent('${c.ID}')" title="Hapus Rencana Konten">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="${isKanban ? 'width:13px; height:13px;' : (isSmall ? 'width:13px; height:13px;' : '')}"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                ${isKanban ? '' : (isSmall ? '' : '<span>Hapus</span>')}
              </button>
            `;
        }
    } else if (hasRequested) {
        buttonsHtml += `
          <button class="btn-card-action" style="opacity: 0.6; cursor: not-allowed; background: var(--bg-secondary); color: var(--text-muted); ${isKanban ? 'padding: 0.25rem; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px;' : (isSmall ? 'padding: 0.35rem 0.65rem; font-size: 0.75rem;' : '')}" disabled title="Menunggu Persetujuan PIC">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="${isKanban ? 'width:13px; height:13px;' : (isSmall ? 'width:13px; height:13px;' : '')}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ${isKanban ? '' : '<span>Pending</span>'}
          </button>
        `;
    } else {
        buttonsHtml += `
          <button class="btn-card-action" style="background: var(--bg-tertiary); color: var(--primary); border: 1px solid var(--border-color); ${isKanban ? 'padding: 0.25rem; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px;' : (isSmall ? 'padding: 0.35rem 0.65rem; font-size: 0.75rem;' : '')}" onclick="window.requestCollab('${c.ID}')" title="Ajukan Kolaborasi">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="${isKanban ? 'width:13px; height:13px;' : (isSmall ? 'width:13px; height:13px;' : '')}"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            ${isKanban ? '' : '<span>Ajukan Kolaborasi</span>'}
          </button>
        `;
    }
    return buttonsHtml;
}

export function buildCardHtml(c) {
    const st = CONFIG.STATUSES.find(s => s.value === c.Status) || { badgeClass: "status-idea" };
    return `
    <div class="content-card">
      <div class="card-top">
        <span class="card-date">${cleanDate(c.Tanggal) || "Tanpa Tanggal"}</span>
        <span class="status-badge ${st.badgeClass}">${c.Status || "-"}</span>
      </div>
      <h4 class="card-title">${c.Judul || "Tanpa Judul"}</h4>
      ${c.Isi ? `<p class="card-desc">${c.Isi}</p>` : ''}
      <div class="card-meta">
        ${c["Content Pillar"] ? `<span class="badge badge-pillar">${c["Content Pillar"]}</span>` : ''}
        ${c.Value && c.Value !== '-' ? `<span class="badge badge-pillar">${c.Value}</span>` : ''}
        ${c.Platform ? `<span class="badge">${c.Platform}</span>` : ''}
      </div>
      ${c["Link Publikasi"] ? `<div style="margin-top:0.35rem;"><a href="${c["Link Publikasi"]}" target="_blank" style="color:var(--primary); font-weight:600; font-size:0.85rem; display:inline-flex; align-items:center; gap:0.25rem;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg> Lihat Publikasi</a></div>` : ''}
      ${c["Foto Bukti"] && c["Foto Bukti"] !== "-" && c["Foto Bukti"] !== "Mengunggah..." && c["Foto Bukti"].startsWith("http") ? `<div style="margin-top:0.35rem;"><a href="${c["Foto Bukti"]}" target="_blank" style="color:#10b981; font-weight:600; font-size:0.85rem; display:inline-flex; align-items:center; gap:0.25rem;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Foto Bukti</a></div>` : (c["Foto Bukti"] === "Mengunggah..." ? `<div style="margin-top:0.35rem; color:var(--text-muted); font-size:0.85rem;">Mengunggah foto...</div>` : '')}
      <div class="card-footer">
        <div class="pic-tags-wrapper" style="display:flex; flex-wrap:wrap; gap:4px;">
          ${renderPersonsHtml(c, "margin:0;")}
        </div>
        <div class="card-actions">
          ${getActionButtons(c, false)}
        </div>
      </div>
    </div>
  `;
}

export function renderContentPlan() {
    updateApprovalBadge();
    const searchInput = document.getElementById('search-input');
    const q = searchInput ? searchInput.value.toLowerCase() : '';
    const fMonth = document.getElementById('filter-month')?.value || 'ALL';
    const fSort = document.getElementById('filter-sort')?.value || 'newest_added';
    const fPlat = document.getElementById('filter-platform')?.value || 'ALL';
    const fPillar = document.getElementById('filter-pillar')?.value || 'ALL';
    const fStatus = document.getElementById('filter-status')?.value || 'ALL';
    const fPic = document.getElementById('filter-pic')?.value || 'ALL';

    let filtered = state.contentPlans.filter(c => {
        const matchQ = !q || (
            (c.Judul || "").toLowerCase().includes(q) ||
            (c.Caption || "").toLowerCase().includes(q) ||
            (c.PIC || "").toLowerCase().includes(q) ||
            (c["Kolaborator"] || "").toLowerCase().includes(q) ||
            (c.Hashtag || "").toLowerCase().includes(q)
        );
        const matchPlat = fPlat === "ALL" || c.Platform === fPlat;
        const matchPillar = fPillar === "ALL" || c["Content Pillar"] === fPillar;
        const matchStatus = fStatus === "ALL" || c.Status === fStatus;
        const matchPic = fPic === "ALL" || ((c.PIC || "").includes(fPic)) || ((c["Kolaborator"] || "").includes(fPic));

        let matchMonth = true;
        if (fMonth !== "ALL") {
            const cMonth = getBulanFromTanggal(c.Tanggal);
            matchMonth = (cMonth === fMonth);
        }

        return matchQ && matchPlat && matchPillar && matchStatus && matchPic && matchMonth;
    });

    // Sorting (Default: Terbaru Ditambahkan)
    filtered.sort((a, b) => {
        if (fSort === 'newest_added') {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseInt(String(a.ID).replace(/[^0-9]/g, '')) || 0);
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseInt(String(b.ID).replace(/[^0-9]/g, '')) || 0);
            return timeB - timeA;
        } else if (fSort === 'oldest_added') {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseInt(String(a.ID).replace(/[^0-9]/g, '')) || 0);
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseInt(String(b.ID).replace(/[^0-9]/g, '')) || 0);
            return timeA - timeB;
        } else if (fSort === 'publish_desc') {
            const tglA = a.Tanggal || '';
            const tglB = b.Tanggal || '';
            return tglB.localeCompare(tglA);
        } else if (fSort === 'publish_asc') {
            const tglA = a.Tanggal || '';
            const tglB = b.Tanggal || '';
            return tglA.localeCompare(tglB);
        } else if (fSort === 'title_asc') {
            return (a.Judul || '').localeCompare(b.Judul || '');
        } else if (fSort === 'title_desc') {
            return (b.Judul || '').localeCompare(a.Judul || '');
        } else if (fSort === 'pic_asc') {
            return (a.PIC || '').localeCompare(b.PIC || '');
        }
        return 0;
    });

    state.currentFilteredPlans = filtered;

    const countLabel = document.getElementById('content-count-label');
    if (countLabel) countLabel.textContent = `Menampilkan ${filtered.length} dari ${state.contentPlans.length} konten`;

    // Render Cards
    const cardsCont = document.getElementById('content-cards-view');
    if (cardsCont) {
        if (filtered.length === 0) {
            cardsCont.innerHTML = getEmptyStateHtml(2);
        } else {
            cardsCont.innerHTML = filtered.map(c => buildCardHtml(c)).join("");
        }
    }

    // Render Table
    const tbody = document.getElementById('content-table-body');
    if (tbody) {
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2.5rem 1rem;">Tidak ada data konten yang sesuai.</td></tr>`;
        } else {
            tbody.innerHTML = filtered.map(c => {
                const st = CONFIG.STATUSES.find(s => s.value === c.Status) || { badgeClass: "status-idea" };
                return `
                <tr>
                  <td style="font-weight: 600; white-space: nowrap;">${cleanDate(c.Tanggal)}</td>
                  <td>
                    <div style="font-weight: 600; color: var(--text-main);">${c["Content Pillar"] || "-"}</div>
                    ${c.Value && c.Value !== '-' ? `<span class="badge badge-pillar" style="margin-top: 0.25rem;">${c.Value}</span>` : ''}
                  </td>
                  <td>${renderPersonsHtml(c)}</td>
                  <td>
                    <div style="font-weight: 600; color: var(--text-main); margin-bottom: 0.35rem; line-height: 1.4;">${c.Judul || "-"}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">${c.CTA ? 'CTA: ' + c.CTA : ''}</div>
                  </td>
                  <td><span class="badge">${c.Platform || "-"}</span></td>
                  <td><span class="status-badge ${st.badgeClass}">${c.Status || "-"}</span></td>
                  <td>${c["Link Publikasi"] ? `<a href="${c["Link Publikasi"]}" target="_blank" style="color:var(--primary); font-weight:600; text-decoration:underline; font-size:0.8rem;">Buka</a>` : '-'}</td>
                  <td>
                    <div class="card-actions">
                      ${getActionButtons(c, false)}
                    </div>
                  </td>
                </tr>
              `;
            }).join("");
        }
    }

    if (typeof window.renderKanban === 'function') {
        window.renderKanban(filtered);
    }
}

export function openApprovalModal() {
    const container = document.getElementById('approval-list-container');
    if (!container) return;
    let html = '';

    const pendingContents = state.contentPlans.filter(c => {
        const picArray = (c.PIC || "").split(',').map(s => s.trim()).filter(Boolean);
        return picArray.includes(state.currentUser?.namaLengkap) &&
            c["Request Kolaborasi"] && c["Request Kolaborasi"].trim().length > 0;
    });

    if (pendingContents.length === 0) {
        html = `<div style="text-align:center; padding: 2rem 1rem; color: var(--text-muted);">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 48px; height: 48px; margin: 0 auto 1rem auto; opacity: 0.5;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>Tidak ada permintaan kolaborasi baru saat ini.</p>
                </div>`;
    } else {
        pendingContents.forEach(c => {
            const requests = c["Request Kolaborasi"].split(',').map(s => s.trim()).filter(Boolean);
            requests.forEach(reqName => {
                html += `
                <div class="content-card" style="margin-bottom: 1rem; padding: 1rem; border-left: 4px solid #f59e0b; display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Minta akses kolaborasi pada:</div>
                    <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-main); font-weight: 600; line-height: 1.3;">${c.Judul || 'Tanpa Judul'}</h4>
                    <div style="display: flex; gap: 0.75rem; align-items: center; margin-top: 0.25rem; padding-top: 0.75rem; border-top: 1px dashed var(--border-color);">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(reqName)}&background=random&color=fff&rounded=true" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
                        <div style="flex: 1;">
                            <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 600;">${reqName}</div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 50px; background: #10b981; border-color: #10b981;" onclick="window.handleCollabRequest('${c.ID}', '${reqName}', 'approve')">
                                Setujui
                            </button>
                            <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 50px; color: #ef4444; border-color: #ef4444;" onclick="window.handleCollabRequest('${c.ID}', '${reqName}', 'deny')">
                                Tolak
                            </button>
                        </div>
                    </div>
                </div>
                `;
            });
        });
    }
    container.innerHTML = html;

    const modal = document.getElementById('modal-approval');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

export function closeApprovalModal() {
    const modal = document.getElementById('modal-approval');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

export async function handleCollabRequest(contentId, reqName, action) {
    const idx = state.contentPlans.findIndex(c => c.ID === contentId);
    if (idx === -1) return;

    const c = state.contentPlans[idx];
    let reqs = (c["Request Kolaborasi"] || "").split(',').map(s => s.trim()).filter(Boolean);
    reqs = reqs.filter(r => r !== reqName);
    c["Request Kolaborasi"] = reqs.join(', ');

    if (action === 'approve') {
        let collabs = (c["Kolaborator"] || "").split(',').map(s => s.trim()).filter(Boolean);
        if (!collabs.includes(reqName)) {
            collabs.push(reqName);
            c["Kolaborator"] = collabs.join(', ');
        }
    }

    openApprovalModal();
    updateApprovalBadge();
    renderContentPlan();

    try {
        await saveContentPlan(c);
    } catch (err) {
        console.error("Gagal sinkronisasi approval/penolakan:", err);
    }
}

export function updateApprovalBadge() {
    if (!state.currentUser) return;
    const badge = document.getElementById('badge-approval');
    if (!badge) return;

    let count = 0;
    state.contentPlans.forEach(c => {
        const picArray = (c.PIC || "").split(',').map(s => s.trim()).filter(Boolean);
        if (picArray.includes(state.currentUser.namaLengkap) && c["Request Kolaborasi"]) {
            const reqs = c["Request Kolaborasi"].split(',').map(s => s.trim()).filter(Boolean);
            count += reqs.length;
        }
    });

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        if (window.lastNotifiedCollabCount !== count) {
            window.lastNotifiedCollabCount = count;
            setTimeout(async () => {
                const res = await showCustomDialog({
                    title: "Permintaan Kolaborasi Baru",
                    message: `Terdapat ${count} permintaan kolaborasi dari rekan volunteer yang menunggu persetujuan Anda. Klik tombol "Buka Approval" untuk menyetujui.`,
                    confirmText: "Buka Approval"
                });
                if (res) openApprovalModal();
            }, 1200);
        }
    } else {
        badge.style.display = 'none';
        window.lastNotifiedCollabCount = 0;
    }
}

export function openModal(mode, id = null) {
    const form = document.getElementById('form-crud');
    if (form) form.reset();

    if (mode === 'add') {
        document.getElementById('crud-modal-title').textContent = "Tambah Rencana Konten Baru";
        document.getElementById('field-id').value = "";
        document.getElementById('field-tanggal').value = "";
        document.getElementById('field-platform').value = "Instagram";
        document.getElementById('field-pillar').value = "Educational (Edukasi)";
        document.getElementById('field-value').value = "Informasi";
        document.getElementById('field-skp').value = "-";
        document.getElementById('field-status').value = "Idea / Konsep";
        document.getElementById('field-judul').value = "";
        document.getElementById('field-isi').value = "";
        document.getElementById('field-cta').value = "";
        document.getElementById('field-hashtag').value = "";
        document.getElementById('field-caption').value = "";
        document.getElementById('field-link').value = "";
        document.getElementById('group-link').style.display = 'none';
    } else if (mode === 'edit' && id) {
        document.getElementById('crud-modal-title').textContent = "Edit Rencana Konten";
        const item = state.contentPlans.find(c => c.ID === id);
        if (item) {
            document.getElementById('field-id').value = item.ID || "";
            let rawTgl = item.Tanggal || "";
            if (typeof rawTgl === 'string' && rawTgl.includes("T")) rawTgl = rawTgl.split("T")[0];
            if (rawTgl === "-") rawTgl = "";
            document.getElementById('field-tanggal').value = rawTgl;
            document.getElementById('field-platform').value = item.Platform || "Instagram";
            document.getElementById('field-pillar').value = item["Content Pillar"] || "Educational (Edukasi)";
            document.getElementById('field-value').value = item.Value || "Informasi";
            document.getElementById('field-skp').value = item["SKP/KKN"] || "-";
            document.getElementById('field-status').value = item.Status || "Idea / Konsep";
            document.getElementById('field-judul').value = item.Judul || "";
            document.getElementById('field-isi').value = item.Isi || "";
            document.getElementById('field-cta').value = item.CTA || "";
            document.getElementById('field-hashtag').value = item.Hashtag || "";
            document.getElementById('field-caption').value = item.Caption || "";
            document.getElementById('field-link').value = item["Link Publikasi"] || "";
            document.getElementById('group-link').style.display = (item.Status === 'Published') ? 'flex' : 'none';
        }
    }

    handleSkpChange();
    document.getElementById('field-foto-bukti').value = "";

    const groupAdminCollab = document.getElementById('group-admin-collab');
    const collabContainer = document.getElementById('admin-collab-list');
    if (groupAdminCollab && collabContainer) {
        const isSuperOrAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin');
        if (isSuperOrAdmin) {
            groupAdminCollab.style.display = 'block';
            collabContainer.innerHTML = "";
            const currentCollabs = (mode === 'edit' && id) ?
                ((state.contentPlans.find(c => c.ID === id) || {})["Kolaborator"] || "").split(',').map(s => s.trim()) : [];
            const currentPics = (mode === 'edit' && id) ?
                ((state.contentPlans.find(c => c.ID === id) || {}).PIC || "").split(',').map(s => s.trim()) : [];
            const allSelected = [...new Set([...currentPics, ...currentCollabs])];

            Object.keys(dataVolunteer).sort().forEach(vName => {
                const isChecked = allSelected.includes(vName) ? 'checked' : '';
                const label = document.createElement('label');
                label.style.cssText = "display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 6px; cursor: pointer; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary);";
                label.innerHTML = `<input type="checkbox" name="admin_collab_check" value="${vName}" ${isChecked} style="cursor: pointer;"> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${vName}</span>`;
                collabContainer.appendChild(label);
            });
        } else {
            groupAdminCollab.style.display = 'none';
            collabContainer.innerHTML = "";
        }
    }

    navigateTo(mode === 'edit' ? '/konten/edit' : '/konten/tambah');
}

export function handleSkpChange() {
    const skp = document.getElementById("field-skp").value;
    const fotoInput = document.getElementById("field-foto-bukti");
    const labelFoto = document.getElementById("label-foto-bukti");
    if (skp === "Produksi Podcast" || skp === "Modul Pembelajaran Digital") {
        fotoInput.required = true;
        labelFoto.innerHTML = "Foto Bukti Kegiatan *";
    } else {
        fotoInput.required = false;
        labelFoto.innerHTML = "Foto Bukti Kegiatan (Opsional)";
    }
}

export async function requestCollab(id) {
    const confirmed = await showCustomDialog({
        title: "Ajukan Keterlibatan",
        message: "Apakah Anda yakin ingin mengajukan diri sebagai Kolaborator untuk konten ini? PIC konten harus menyetujui permintaan Anda sebelum Anda bisa mengeditnya.",
        type: "confirm",
        confirmText: "Ajukan",
        confirmColor: "var(--primary)"
    });
    if (confirmed) {
        const idx = state.contentPlans.findIndex(c => c.ID === id);
        if (idx !== -1) {
            let reqs = (state.contentPlans[idx]["Request Kolaborasi"] || "").split(',').map(s => s.trim()).filter(Boolean);
            if (!reqs.includes(state.currentUser.namaLengkap)) {
                reqs.push(state.currentUser.namaLengkap);
                state.contentPlans[idx]["Request Kolaborasi"] = reqs.join(', ');

                if (typeof window.renderDashboard === 'function') window.renderDashboard();
                renderContentPlan();

                try {
                    await saveContentPlan(state.contentPlans[idx]);
                } catch (err) {
                    console.error("Gagal sinkronisasi request kolaborasi:", err);
                }
            }
        }
    }
}

export async function deleteContent(id) {
    const confirmed = await showCustomDialog({
        title: "Hapus Rencana Konten",
        message: "Apakah Anda yakin ingin menghapus rencana konten ini secara permanen?",
        type: "confirm",
        confirmText: "Hapus",
        confirmColor: "#ef4444"
    });
    if (confirmed) {
        await deleteContentPlan(id);
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
        renderContentPlan();
        if (typeof window.renderKanban === 'function') window.renderKanban();
        if (typeof window.renderPelaporan === 'function') window.renderPelaporan();
    }
}

export function setContentPlanViewMode(mode, isManual = true) {
    state.isTableView = (mode === 'table');
    const btnCards = document.getElementById('btn-view-cards');
    const btnTable = document.getElementById('btn-view-table');
    const cards = document.getElementById('content-cards-view');
    const table = document.getElementById('content-table-view');

    if (mode === 'cards') {
        if (btnCards) btnCards.classList.add('active');
        if (btnTable) btnTable.classList.remove('active');
        if (cards) cards.style.display = 'grid';
        if (table) table.style.display = 'none';
    } else {
        if (btnTable) btnTable.classList.add('active');
        if (btnCards) btnCards.classList.remove('active');
        if (cards) cards.style.display = 'none';
        if (table) table.style.display = 'block';
    }
}

export function initKonten() {
    window.renderContentPlan = renderContentPlan;
    window.renderFilteredContent = renderContentPlan;
    window.buildCardHtml = buildCardHtml;
    window.getActionButtons = getActionButtons;
    window.renderPersonsHtml = renderPersonsHtml;
    window.openApprovalModal = openApprovalModal;
    window.closeApprovalModal = closeApprovalModal;
    window.handleCollabRequest = handleCollabRequest;
    window.updateApprovalBadge = updateApprovalBadge;
    window.openModal = openModal;
    window.handleSkpChange = handleSkpChange;
    window.requestCollab = requestCollab;
    window.deleteContent = deleteContent;
    window.setContentPlanViewMode = setContentPlanViewMode;

    const defaultMode = window.innerWidth <= 850 ? 'cards' : 'table';
    setContentPlanViewMode(defaultMode, false);

    const btnCards = document.getElementById('btn-view-cards');
    const btnTable = document.getElementById('btn-view-table');
    if (btnCards && btnTable) {
        btnCards.addEventListener('click', () => setContentPlanViewMode('cards', true));
        btnTable.addEventListener('click', () => setContentPlanViewMode('table', true));
    }

    const btnAdd = document.getElementById('btn-add-content');
    if (btnAdd) btnAdd.addEventListener('click', () => openModal('add'));
    const btnClose = document.getElementById('btn-close-crud');
    if (btnClose) btnClose.addEventListener('click', () => navigateTo('/konten'));
    const btnCancel = document.getElementById('btn-cancel-crud');
    if (btnCancel) btnCancel.addEventListener('click', () => navigateTo('/konten'));

    const fieldStatus = document.getElementById('field-status');
    if (fieldStatus) {
        fieldStatus.addEventListener('change', function () {
            document.getElementById('group-link').style.display = (this.value === 'Published') ? 'flex' : 'none';
        });
    }

    const formCrud = document.getElementById('form-crud');
    if (formCrud) {
        formCrud.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('field-id').value;
            const itemData = {
                Tanggal: document.getElementById('field-tanggal').value,
                Platform: document.getElementById('field-platform').value,
                "Content Pillar": document.getElementById('field-pillar').value,
                Value: document.getElementById('field-value').value,
                "SKP/KKN": document.getElementById('field-skp').value,
                Status: document.getElementById('field-status').value,
                Judul: document.getElementById('field-judul').value,
                Isi: document.getElementById('field-isi').value,
                CTA: document.getElementById('field-cta').value,
                Hashtag: document.getElementById('field-hashtag').value,
                Caption: document.getElementById('field-caption').value,
                "Link Publikasi": document.getElementById('field-link').value
            };

            const fotoInput = document.getElementById("field-foto-bukti");
            if (fotoInput && fotoInput.files.length > 0) {
                const file = fotoInput.files[0];
                itemData.FotoBuktiBase64 = await compressImage(file, 1000, 0.7);
                itemData["Foto Bukti"] = "Mengunggah...";
            }

            navigateTo('/konten');

            const isEdit = !!id;
            const isSuperOrAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin');

            if (isSuperOrAdmin) {
                const checkedVolunteers = Array.from(document.querySelectorAll('input[name="admin_collab_check"]:checked')).map(cb => cb.value);
                if (checkedVolunteers.length > 0) {
                    if (!isEdit) {
                        itemData.PIC = checkedVolunteers[0];
                        itemData["Kolaborator"] = checkedVolunteers.slice(1).join(', ');
                    } else {
                        const existingPic = (state.contentPlans.find(c => c.ID === id) || {}).PIC || "";
                        const onlyCollabs = checkedVolunteers.filter(v => !existingPic.includes(v));
                        itemData["Kolaborator"] = onlyCollabs.join(', ');
                    }
                } else if (!isEdit) {
                    itemData.PIC = state.currentUser.namaLengkap;
                    itemData["Kolaborator"] = "";
                }
            } else if (!isEdit) {
                itemData.PIC = state.currentUser.namaLengkap;
            }

            if (isEdit) {
                itemData.ID = id;
                const idx = state.contentPlans.findIndex(c => c.ID === id);
                if (idx !== -1) {
                    itemData.createdAt = state.contentPlans[idx].createdAt || new Date().toISOString();
                }
            } else {
                itemData.ID = "CP-" + Date.now();
                if (!itemData.PIC) itemData.PIC = state.currentUser.namaLengkap;
                itemData.createdAt = new Date().toISOString();
            }
            itemData.updatedAt = new Date().toISOString();

            await saveContentPlan(itemData);

            if (typeof window.renderDashboard === 'function') window.renderDashboard();
            renderContentPlan();
            if (typeof window.renderKanban === 'function') window.renderKanban();
            if (typeof window.renderPelaporan === 'function') window.renderPelaporan();
        });
    }

    // Populate PIC filter dropdown with all volunteers alphabetically
    const picSelect = document.getElementById('filter-pic');
    if (picSelect) {
        picSelect.innerHTML = '<option value="ALL">Semua PIC</option>';
        Object.keys(dataVolunteer).sort((a, b) => a.localeCompare(b)).forEach(vName => {
            const opt = document.createElement('option');
            opt.value = vName;
            opt.textContent = vName;
            picSelect.appendChild(opt);
        });
    }

    ['filter-month', 'filter-sort', 'filter-platform', 'filter-pillar', 'filter-status', 'filter-pic'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', renderContentPlan);
            el.addEventListener('change', renderContentPlan);
        }
    });

    const searchEl = document.getElementById('search-input');
    if (searchEl) {
        searchEl.addEventListener('input', () => {
            if (state.currentView !== 'content-plan' && searchEl.value.trim() !== '') {
                if (typeof window.switchView === 'function') window.switchView('content-plan');
            }
            renderContentPlan();
        });
    }

    renderContentPlan();
}
