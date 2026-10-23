// Dasbor View Module (Clean, High-Density Analytics for All Volunteer Workstreams)
import { state } from '../store/state.js';
import { CONFIG } from '../store/initialData.js';
import { api } from '../services/api.js';
import { getSkeletonStatNumber, getSkeletonBreakdown } from '../utils/skeleton.js';
import { cleanDate, formatTanggalIndo } from '../utils/helpers.js';

let currentRecentFilter = 'all';

export function getEmptyStateHtml(colSpan = 1) {
    return `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 40px; height: 40px; margin: 0 auto 1rem; display: block; opacity: 0.35;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.35rem;">Belum ada data</div>
            <div style="font-size: 0.8rem;">Coba ubah filter atau tambahkan data baru</div>
        </div>
    `;
}

export const dasborTemplate = `
        <section id="view-dashboard" class="view-section active">

            <!-- Mobile Quick-Service Menu (covers all nav sections, only visible on mobile) -->
            <div class="mobile-service-menu">
                <div class="mobile-service-title">Layanan Cepat</div>
                <div class="mobile-service-grid">
                    <div class="mobile-service-item" onclick="switchView('content-plan')">
                        <div class="mobile-service-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        </div>
                        <span class="mobile-service-label">Konten</span>
                    </div>
                    <div class="mobile-service-item" onclick="switchView('absensi')">
                        <div class="mobile-service-icon" style="background: rgba(16,185,129,0.12); color: #10b981; border-color: rgba(16,185,129,0.25);">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <span class="mobile-service-label">Absensi</span>
                    </div>
                    <div class="mobile-service-item" onclick="switchView('kanban')">
                        <div class="mobile-service-icon" style="background: rgba(59,130,246,0.12); color: #3b82f6; border-color: rgba(59,130,246,0.25);">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
                        </div>
                        <span class="mobile-service-label">Produksi</span>
                    </div>
                    <div class="mobile-service-item" onclick="switchView('jurnal-kkn')">
                        <div class="mobile-service-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b; border-color: rgba(245,158,11,0.25);">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <span class="mobile-service-label">Jurnal</span>
                    </div>
                    <div class="mobile-service-item" id="mobile-service-aset-video" onclick="switchView('aset-video')" style="display: flex;">
                        <div class="mobile-service-icon" style="background: rgba(139,92,246,0.12); color: #8b5cf6; border-color: rgba(139,92,246,0.25);">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
                        </div>
                        <span class="mobile-service-label">Material</span>
                    </div>
                    <div class="mobile-service-item" id="mobile-service-profil-user" onclick="switchView('profil-user')" style="display: flex;">
                        <div class="mobile-service-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <span class="mobile-service-label">Profil</span>
                    </div>
                    <div class="mobile-service-item" id="mobile-service-studio-editor" onclick="switchView('studio-editor')" style="display: none;">
                        <div class="mobile-service-icon" style="background: rgba(99,102,241,0.12); color: #6366f1; border-color: rgba(99,102,241,0.25);">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </div>
                        <span class="mobile-service-label">Editor</span>
                    </div>
                    <div class="mobile-service-item" id="mobile-service-studio-upload" onclick="switchView('studio-upload')" style="display: none;">
                        <div class="mobile-service-icon" style="background: rgba(14,165,233,0.12); color: #0ea5e9; border-color: rgba(14,165,233,0.25);">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        </div>
                        <span class="mobile-service-label">Upload</span>
                    </div>
                </div>
            </div>
            <!-- 4 Stat Cards Utama (Setiap Alur Kerja Relawan) -->
            <div class="dashboard-grid">
                <!-- 1. Rencana Konten -->
                <div class="stat-card" onclick="switchView('content-plan')" style="cursor: pointer;">
                    <div class="stat-header">
                        <span class="stat-title">Rencana Konten</span>
                        <div class="stat-icon" style="color: var(--primary);">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" id="stat-konten-val">${getSkeletonStatNumber()}</div>
                    <div class="stat-desc" id="stat-konten-sub">0 Published · 0 Proses</div>
                </div>

                <!-- 2. Studio Video Editing -->
                <div class="stat-card" onclick="switchView('studio-editor')" style="cursor: pointer;">
                    <div class="stat-header">
                        <span class="stat-title">Editing Video</span>
                        <div class="stat-icon" style="color: #6366f1;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" id="stat-video-val" style="color: #6366f1;">${getSkeletonStatNumber()}</div>
                    <div class="stat-desc" id="stat-video-sub">0 Selesai · 0 Sedang Diedit</div>
                </div>

                <!-- 3. Presensi Kehadiran -->
                <div class="stat-card" onclick="switchView('absensi')" style="cursor: pointer;">
                    <div class="stat-header">
                        <span class="stat-title">Presensi Relawan</span>
                        <div class="stat-icon" style="color: #10b981;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" id="stat-absensi-val" style="color: #10b981;">${getSkeletonStatNumber()}</div>
                    <div class="stat-desc" id="stat-absensi-sub">Total kehadiran terekam</div>
                </div>

                <!-- 4. Jurnal Kegiatan KKN -->
                <div class="stat-card" onclick="switchView('jurnal-kkn')" style="cursor: pointer;">
                    <div class="stat-header">
                        <span class="stat-title">Jurnal KKN</span>
                        <div class="stat-icon" style="color: #f59e0b;">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="stat-value" id="stat-jurnal-val" style="color: #f59e0b;">${getSkeletonStatNumber()}</div>
                    <div class="stat-desc" id="stat-jurnal-sub">Total catatan kegiatan</div>
                </div>
            </div>

            <!-- Analitik Visual 4 Alur Kerja (Donut Charts & Breakdowns) -->
            <div class="distribution-section">
                <!-- 1. Analitik Status Rencana Konten -->
                <div class="box-card">
                    <div class="box-header">
                        <h3 class="box-title">Status Rencana Konten</h3>
                    </div>
                    <div class="chart-breakdown-wrapper">
                        <div class="donut-chart-container" id="donut-content"></div>
                        <div class="breakdown-list" id="content-breakdown-container">
                            ${getSkeletonBreakdown(4)}
                        </div>
                    </div>
                </div>

                <!-- 2. Analitik Status Video Editing Studio -->
                <div class="box-card">
                    <div class="box-header">
                        <h3 class="box-title">Status Video Editing Studio</h3>
                    </div>
                    <div class="chart-breakdown-wrapper">
                        <div class="donut-chart-container" id="donut-editor"></div>
                        <div class="breakdown-list" id="editor-breakdown-container">
                            ${getSkeletonBreakdown(4)}
                        </div>
                    </div>
                </div>

                <!-- 3. Analitik Sasaran Kerja (SKP Relawan) -->
                <div class="box-card">
                    <div class="box-header">
                        <h3 class="box-title">Sasaran Kinerja Relawan (SKP)</h3>
                    </div>
                    <div class="chart-breakdown-wrapper">
                        <div class="donut-chart-container" id="donut-skp"></div>
                        <div class="breakdown-list" id="skp-breakdown-container">
                            ${getSkeletonBreakdown(4)}
                        </div>
                    </div>
                </div>

                <!-- 4. Analitik Media Publikasi -->
                <div class="box-card">
                    <div class="box-header">
                        <h3 class="box-title">Distribusi Media Publikasi</h3>
                    </div>
                    <div class="chart-breakdown-wrapper">
                        <div class="donut-chart-container" id="donut-platform"></div>
                        <div class="breakdown-list" id="platform-breakdown-container">
                            ${getSkeletonBreakdown(4)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ringkasan Pekerjaan Terbaru (Clean Table Layout) -->
            <div class="box-card" style="padding: 1.25rem; margin-top: 1rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                    <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-main);">Daftar Pekerjaan Terbaru</h3>
                    <div class="view-toggle-btns" style="flex-wrap: wrap;">
                        <button class="toggle-btn active" id="tab-recent-all" onclick="window.setDashboardRecentFilter('all')">Semua</button>
                        <button class="toggle-btn" id="tab-recent-konten" onclick="window.setDashboardRecentFilter('konten')">Konten</button>
                        <button class="toggle-btn" id="tab-recent-video" onclick="window.setDashboardRecentFilter('video')">Video</button>
                        <button class="toggle-btn" id="tab-recent-jurnal" onclick="window.setDashboardRecentFilter('jurnal')">Jurnal</button>
                    </div>
                </div>

                <div class="table-wrapper" style="margin: 0;">
                    <table class="content-table">
                        <thead>
                            <tr>
                                <th style="width: 110px;">Tanggal</th>
                                <th style="width: 120px;">Kategori</th>
                                <th>Judul / Penugasan</th>
                                <th style="width: 170px;">PIC / Relawan</th>
                                <th style="width: 140px;">Status</th>
                                <th style="width: 90px; text-align: center;">Tautan</th>
                            </tr>
                        </thead>
                        <tbody id="dashboard-recent-table-body">
                            <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Memuat data pekerjaan...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
`;

export function buildDonutChartHtml(items, totalCount, centerLabel = "Total") {
    if (totalCount === 0) {
        return `
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="var(--bg-tertiary)" stroke-width="14"></circle>
          </svg>
          <div class="donut-center-text">
            <div class="donut-center-num">0</div>
            <div class="donut-center-lbl">${centerLabel}</div>
          </div>
        `;
    }

    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    const circles = items.map(item => {
        if (item.count === 0) return "";
        const segmentLen = (item.count / totalCount) * circumference;
        const strokeDasharray = `${segmentLen} ${circumference - segmentLen}`;
        const strokeDashoffset = -currentOffset;
        currentOffset += segmentLen;

        return `<circle cx="50" cy="50" r="${radius}" fill="none" stroke="${item.color}" stroke-width="14" stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}" style="transition: stroke-dasharray 0.4s ease;"></circle>`;
    }).join("");

    return `
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="var(--bg-tertiary)" stroke-width="14"></circle>
          ${circles}
        </svg>
        <div class="donut-center-text">
          <div class="donut-center-num">${totalCount}</div>
          <div class="donut-center-lbl">${centerLabel}</div>
        </div>
    `;
}

export function setDashboardRecentFilter(filter) {
    currentRecentFilter = filter;
    ['tab-recent-all', 'tab-recent-konten', 'tab-recent-video', 'tab-recent-jurnal'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`tab-recent-${filter}`);
    if (activeBtn) activeBtn.classList.add('active');

    renderRecentTable();
}

function renderRecentTable() {
    const tbody = document.getElementById('dashboard-recent-table-body');
    if (!tbody) return;

    let items = [];

    if (currentRecentFilter === 'all' || currentRecentFilter === 'konten') {
        (state.contentPlans || []).forEach(c => {
            items.push({
                type: 'Konten',
                date: c.Tanggal || c.createdAt || '',
                cleanDate: cleanDate(c.Tanggal) || '-',
                title: c.Judul || 'Tanpa Judul',
                pic: c.PIC || '-',
                status: c.Status || 'Idea / Konsep',
                link: c["Link Publikasi"] || ''
            });
        });
    }

    if (currentRecentFilter === 'all' || currentRecentFilter === 'video') {
        (state.allEditorTasks || []).forEach(t => {
            const taskDate = t.deadline || (t.createdAt ? t.createdAt.split('T')[0] : '');
            items.push({
                type: t.tipe || 'Video Editing',
                date: taskDate,
                cleanDate: t.deadline ? formatTanggalIndo(t.deadline) : cleanDate(taskDate),
                title: t.judul || 'Tanpa Judul Video',
                pic: t.editor || t.assignedEditor || '-',
                status: t.status || 'Belum Dikerjakan',
                link: t.hasilEdit || t.rawVideo || ''
            });
        });
    }

    if (currentRecentFilter === 'all' || currentRecentFilter === 'jurnal') {
        (state.allJurnalDataAdmin || []).forEach(j => {
            items.push({
                type: 'Jurnal KKN',
                date: j.tanggal || j.createdAt || '',
                cleanDate: cleanDate(j.tanggal) || '-',
                title: j.uraian ? (j.uraian.length > 70 ? j.uraian.substring(0, 70) + '...' : j.uraian) : 'Catatan Jurnal',
                pic: j.nama || '-',
                status: 'Tercatat',
                link: ''
            });
        });
    }

    // Urutkan dari tanggal terbaru
    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const displayItems = items.slice(0, 8);

    if (displayItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">Belum ada data pekerjaan pada kategori ini.</td></tr>`;
        return;
    }

    tbody.innerHTML = displayItems.map(row => {
        let statusColor = '#64748b';
        if (row.status === 'Published' || row.status === 'Selesai' || row.status === 'Tercatat') statusColor = '#10b981';
        else if (row.status === 'Sedang Diedit' || row.status === 'Desain / Produksi') statusColor = '#3b82f6';
        else if (row.status === 'Siap Direview' || row.status === 'Review / Approval') statusColor = '#f59e0b';
        else if (row.status === 'Perlu Revisi') statusColor = '#ef4444';

        const linkHtml = row.link
            ? `<a href="${row.link}" target="_blank" style="color: var(--primary); font-weight: 600; text-decoration: underline; font-size: 0.8rem;">Buka</a>`
            : '<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>';

        return `
            <tr>
                <td style="font-weight: 600; white-space: nowrap; font-size: 0.82rem;">${row.cleanDate}</td>
                <td><span class="badge" style="font-size: 0.72rem;">${row.type}</span></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-main); line-height: 1.4;">${row.title}</div>
                </td>
                <td style="font-size: 0.82rem;">${row.pic}</td>
                <td>
                    <span class="status-badge" style="background: ${statusColor}18; color: ${statusColor}; border: 1px solid ${statusColor}35; font-size: 0.72rem; padding: 2px 8px;">
                        ${row.status}
                    </span>
                </td>
                <td style="text-align: center;">${linkHtml}</td>
            </tr>
        `;
    }).join('');
}

export function renderDashboard() {
    // 1. DATA COUNTS
    const totalKonten = state.contentPlans.length;
    const pubKonten = state.contentPlans.filter(c => c.Status === "Published").length;
    const processKonten = totalKonten - pubKonten;

    const totalEditorTasks = (state.allEditorTasks || []).length;
    const doneEditorTasks = (state.allEditorTasks || []).filter(t => t.status === "Selesai").length;
    const processEditorTasks = (state.allEditorTasks || []).filter(t => t.status === "Sedang Diedit" || t.status === "Siap Direview" || t.status === "Perlu Revisi").length;

    const totalAbsensi = (state.absensiList || []).length;
    const totalJurnal = (state.allJurnalDataAdmin || []).length;

    // 2. UPDATE TOP 4 STAT CARDS
    const elKontenVal = document.getElementById('stat-konten-val');
    const elKontenSub = document.getElementById('stat-konten-sub');
    const elVideoVal = document.getElementById('stat-video-val');
    const elVideoSub = document.getElementById('stat-video-sub');
    const elAbsensiVal = document.getElementById('stat-absensi-val');
    const elAbsensiSub = document.getElementById('stat-absensi-sub');
    const elJurnalVal = document.getElementById('stat-jurnal-val');
    const elJurnalSub = document.getElementById('stat-jurnal-sub');

    if (elKontenVal) elKontenVal.textContent = totalKonten;
    if (elKontenSub) elKontenSub.textContent = `${pubKonten} Published · ${processKonten} Proses`;

    if (elVideoVal) elVideoVal.textContent = totalEditorTasks;
    if (elVideoSub) elVideoSub.textContent = `${doneEditorTasks} Selesai · ${processEditorTasks} Sedang Diedit`;

    if (elAbsensiVal) elAbsensiVal.textContent = totalAbsensi;
    if (elAbsensiSub) elAbsensiSub.textContent = `Total kehadiran relawan`;

    if (elJurnalVal) elJurnalVal.textContent = totalJurnal;
    if (elJurnalSub) elJurnalSub.textContent = `Total logbook terisi`;

    // ==========================================
    // CHART 1: ALUR KERJA RENCANA KONTEN
    // ==========================================
    const contentStatusCounts = {};
    (CONFIG.STATUSES || []).forEach(s => { contentStatusCounts[s.value] = 0; });
    state.contentPlans.forEach(c => {
        if (c.Status && contentStatusCounts[c.Status] !== undefined) {
            contentStatusCounts[c.Status]++;
        } else if (c.Status) {
            contentStatusCounts[c.Status] = (contentStatusCounts[c.Status] || 0) + 1;
        }
    });

    const contentStatusColors = {
        "Idea / Konsep": "#94a3b8",
        "Scripting / Copywriting": "#38bdf8",
        "Desain / Produksi": "#3b82f6",
        "Review / Approval": "#f59e0b",
        "Siap Tayang (Ready)": "#8b5cf6",
        "Published": "#10b981"
    };

    const contentChartItems = Object.keys(contentStatusCounts).map(k => ({
        label: k,
        count: contentStatusCounts[k],
        color: contentStatusColors[k] || "#64748b"
    }));

    const donutContent = document.getElementById('donut-content');
    if (donutContent) donutContent.innerHTML = buildDonutChartHtml(contentChartItems, totalKonten, "Konten");

    const contentContainer = document.getElementById('content-breakdown-container');
    if (contentContainer) {
        contentContainer.innerHTML = contentChartItems.map(item => {
            const pct = totalKonten > 0 ? Math.round((item.count / totalKonten) * 100) : 0;
            return `
              <div class="breakdown-item">
                <div class="breakdown-info">
                  <span><span class="breakdown-legend-dot" style="background: ${item.color};"></span>${item.label}</span>
                  <span><strong>${item.count}</strong> (${pct}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" style="width: ${pct}%; background: ${item.color};"></div>
                </div>
              </div>
            `;
        }).join("");
    }

    // ==========================================
    // CHART 2: STATUS VIDEO EDITING STUDIO
    // ==========================================
    const editorCounts = {
        "Selesai": doneEditorTasks,
        "Sedang Diedit": (state.allEditorTasks || []).filter(t => t.status === "Sedang Diedit").length,
        "Siap Direview": (state.allEditorTasks || []).filter(t => t.status === "Siap Direview").length,
        "Perlu Revisi": (state.allEditorTasks || []).filter(t => t.status === "Perlu Revisi").length,
        "Belum Dikerjakan": (state.allEditorTasks || []).filter(t => t.status === "Belum Dikerjakan" || !t.status).length
    };

    const editorStatusColors = {
        "Selesai": "#10b981",
        "Sedang Diedit": "#3b82f6",
        "Siap Direview": "#f59e0b",
        "Perlu Revisi": "#ef4444",
        "Belum Dikerjakan": "#64748b"
    };

    const editorChartItems = Object.keys(editorCounts).map(k => ({
        label: k,
        count: editorCounts[k],
        color: editorStatusColors[k]
    }));

    const donutEditor = document.getElementById('donut-editor');
    if (donutEditor) donutEditor.innerHTML = buildDonutChartHtml(editorChartItems, totalEditorTasks, "Video");

    const editorContainer = document.getElementById('editor-breakdown-container');
    if (editorContainer) {
        editorContainer.innerHTML = editorChartItems.map(item => {
            const pct = totalEditorTasks > 0 ? Math.round((item.count / totalEditorTasks) * 100) : 0;
            return `
              <div class="breakdown-item">
                <div class="breakdown-info">
                  <span><span class="breakdown-legend-dot" style="background: ${item.color};"></span>${item.label}</span>
                  <span><strong>${item.count}</strong> (${pct}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" style="width: ${pct}%; background: ${item.color};"></div>
                </div>
              </div>
            `;
        }).join("");
    }

    // ==========================================
    // CHART 3: SASARAN KERJA (SKP RELAWAN)
    // ==========================================
    const skpCounts = {
        "Editing Video": totalEditorTasks,
        "Desain Grafis": 0,
        "Produksi Podcast": 0,
        "Video Pembelajaran": 0,
        "Modul Pembelajaran Digital": 0,
        "Pembuatan Konten Kreatif": 0
    };

    state.contentPlans.forEach(c => {
        const skp = c["SKP/KKN"];
        if (skp && skpCounts[skp] !== undefined) skpCounts[skp]++;
        else if (skp === "Editing Video") skpCounts["Editing Video"]++;
        else skpCounts["Pembuatan Konten Kreatif"]++;
    });

    (state.allEditorTasks || []).forEach(t => {
        if (t.tipe === 'Video Pembelajaran') skpCounts["Video Pembelajaran"]++;
        else if (t.tipe === 'Produksi Podcast') skpCounts["Produksi Podcast"]++;
    });

    const skpColors = {
        "Editing Video": "#6366f1",
        "Desain Grafis": "#ec4899",
        "Produksi Podcast": "#f59e0b",
        "Video Pembelajaran": "#3b82f6",
        "Modul Pembelajaran Digital": "#8b5cf6",
        "Pembuatan Konten Kreatif": "#10b981"
    };

    const skpList = Object.keys(skpCounts);
    const totalSkp = skpList.reduce((acc, k) => acc + skpCounts[k], 0);
    const skpChartItems = skpList.map(k => ({
        label: k,
        count: skpCounts[k],
        color: skpColors[k] || "#6366f1"
    }));

    const donutSkp = document.getElementById('donut-skp');
    if (donutSkp) donutSkp.innerHTML = buildDonutChartHtml(skpChartItems, totalSkp, "SKP");

    const skpContainer = document.getElementById('skp-breakdown-container');
    if (skpContainer) {
        skpContainer.innerHTML = skpChartItems.map(item => {
            const pct = totalSkp > 0 ? Math.round((item.count / totalSkp) * 100) : 0;
            return `
              <div class="breakdown-item">
                <div class="breakdown-info">
                  <span><span class="breakdown-legend-dot" style="background: ${item.color};"></span>${item.label}</span>
                  <span><strong>${item.count}</strong> (${pct}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" style="width: ${pct}%; background: ${item.color};"></div>
                </div>
              </div>
            `;
        }).join("");
    }

    // ==========================================
    // CHART 4: DISTRIBUSI MEDIA PUBLIKASI
    // ==========================================
    const platCounts = {
        "Instagram": 0,
        "TikTok": 0,
        "YouTube": 0,
        "Shorts YouTube": 0,
        "Studio Video": totalEditorTasks
    };

    state.contentPlans.forEach(c => {
        if (c.Platform && platCounts[c.Platform] !== undefined) platCounts[c.Platform]++;
        else if (c.Platform) platCounts[c.Platform] = (platCounts[c.Platform] || 0) + 1;
    });

    const platColors = {
        "Instagram": "#e1306c",
        "TikTok": "#06b6d4",
        "YouTube": "#ef4444",
        "Shorts YouTube": "#f59e0b",
        "Studio Video": "#6366f1"
    };

    const platformsList = ["Instagram", "TikTok", "YouTube", "Shorts YouTube", "Studio Video"];
    const totalPlatforms = platformsList.reduce((acc, p) => acc + (platCounts[p] || 0), 0);
    const platChartItems = platformsList.map(plat => ({
        label: plat,
        count: platCounts[plat] || 0,
        color: platColors[plat] || "#6366f1"
    }));

    const donutPlat = document.getElementById('donut-platform');
    if (donutPlat) donutPlat.innerHTML = buildDonutChartHtml(platChartItems, totalPlatforms, "Media");

    const platContainer = document.getElementById('platform-breakdown-container');
    if (platContainer) {
        platContainer.innerHTML = platChartItems.map(item => {
            const pPct = totalPlatforms > 0 ? Math.round((item.count / totalPlatforms) * 100) : 0;
            return `
              <div class="breakdown-item">
                <div class="breakdown-info">
                  <span><span class="breakdown-legend-dot" style="background: ${item.color};"></span>${item.label}</span>
                  <span><strong>${item.count}</strong> (${pPct}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" style="width: ${pPct}%; background: ${item.color};"></div>
                </div>
              </div>
            `;
        }).join("");
    }

    // 3. RENDER RECENT TABLE
    renderRecentTable();
}

export function initDasbor() {
    window.renderDashboard = renderDashboard;
    window.updateDashboardStats = renderDashboard;
    window.setDashboardRecentFilter = setDashboardRecentFilter;
    renderDashboard();
}
