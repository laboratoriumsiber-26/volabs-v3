// Pelaporan View Module (Reporting, Analytics, Evidence Table, Export PDF & DOC)
import { state } from '../store/state.js';
import { dataVolunteer } from '../store/initialData.js';
import { api } from '../services/api.js';
import { cleanDate, getBulanFromTanggal } from '../utils/helpers.js';
import { showCustomDialog } from '../utils/dialog.js';
import { renderPersonsHtml } from './konten.js';
import { navigateTo } from '../router/index.js';

export const pelaporanTemplate = `
        <section id="view-pelaporan" class="view-section">
            <div
                style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                <h3>Laporan Kinerja Volunteer PIPD</h3>
                <button class="btn-primary" id="btn-print-pelaporan"
                    onclick="document.getElementById('btn-print-report').click()"
                    style="background:#10b981; border-color:#10b981;">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        style="width:16px; height:16px; margin-right:4px;">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z">
                        </path>
                    </svg>
                    <span>Unduh PDF</span>
                </button>
            </div>

            <!-- Filters -->
            <div class="box-card" style="margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="form-group">
                        <label for="filter-lapor-pic">PIC (Volunteer)</label>
                        <select id="filter-lapor-pic" class="form-select" onchange="renderPelaporan()">
                            <option value="Semua PIC">-- Semua PIC --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="filter-lapor-bulan">Bulan</label>
                        <select id="filter-lapor-bulan" class="form-select" onchange="renderPelaporan()">
                            <option value="Semua Bulan">Semua Bulan</option>
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
                    </div>
                    <div class="form-group">
                        <label for="filter-lapor-skp">Sasaran Kerja</label>
                        <select id="filter-lapor-skp" class="form-select" onchange="renderPelaporan()">
                            <option value="Semua SKP">Semua Sasaran Kerja</option>
                            <option value="Editing Video">Editing Video</option>
                            <option value="Desain Grafis">Desain Grafis</option>
                            <option value="Modul Pembelajaran Digital">Modul Pembelajaran Digital</option>
                            <option value="Produksi Podcast">Produksi Podcast</option>
                            <option value="Video Pembelajaran">Video Pembelajaran</option>
                            <option value="Pembuatan Konten Kreatif">Pembuatan Konten Kreatif</option>
                            <option value="Penulisan Artikel Ilmiah">Penulisan Artikel Ilmiah</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Table UI -->
            <div class="box-card" style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                    <thead>
                        <tr style="background: var(--bg-tertiary); border-bottom: 2px solid var(--border-color);">
                            <th style="padding: 10px; text-align: left;">Tanggal</th>
                            <th style="padding: 10px; text-align: left;">PIC</th>
                            <th style="padding: 10px; text-align: left;">Bulan</th>
                            <th style="padding: 10px; text-align: left;">Sasaran Kerja</th>
                            <th style="padding: 10px; text-align: left;">Deskripsi Konten / Pekerjaan</th>
                            <th style="padding: 10px; text-align: center;">Evidence / Hasil</th>
                            <th style="padding: 10px; text-align: center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="pelaporan-tbody">
                        <tr><td colspan="7" style="text-align:center; padding: 20px;">Memuat data laporan...</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
`;

// Helper untuk Menggabungkan Semua Pekerjaan Volunteer (Konten Plan + Video Editing)
export function getAllVolunteerActivities() {
    const activities = [];

    // 1. Dari Rencana Konten (Desain, Copywriting, Video, Podcast, Modul, dll)
    (state.contentPlans || []).forEach(c => {
        const cleanTgl = cleanDate(c.Tanggal);
        activities.push({
            sourceType: 'content_plan',
            id: c.ID,
            tanggal: c.Tanggal,
            cleanTgl: cleanTgl,
            bulan: getBulanFromTanggal(c.Tanggal) || '-',
            pic: c.PIC || '',
            kolaborator: c["Kolaborator"] || '',
            skp: (c["SKP/KKN"] && c["SKP/KKN"] !== "-") ? c["SKP/KKN"] : "Pembuatan Konten Kreatif",
            judul: c.Judul || 'Tanpa Judul',
            deskripsi: c.Isi || '',
            status: c.Status || '-',
            platform: c.Platform || '-',
            linkPublikasi: c["Link Publikasi"] || '',
            fotoBukti: c["Foto Bukti"] || '',
            rawItem: c
        });
    });

    // 2. Dari Tugas Studio Video / Editing Deliverables
    (state.allEditorTasks || []).forEach(t => {
        const taskDate = t.createdAt ? t.createdAt.split('T')[0] : (t.deadline || '');
        const cleanTgl = cleanDate(taskDate);
        const subDesc = t.tipe === 'Video Pembelajaran'
            ? `Mata Kuliah: ${t.mataKuliah || '-'} (Kode: ${t.kodeMk || '-'}) | Dosen: ${t.dosen || '-'}`
            : `Episode: ${t.episode || '-'} | Narasumber: ${t.narasumber || '-'} | Host: ${t.host || '-'}`;
        const fullDesc = `${subDesc} [Status: ${t.status || '-'}]${t.note ? ' | Catatan: ' + t.note : ''}`;

        activities.push({
            sourceType: 'studio_task',
            id: t.id,
            tanggal: taskDate,
            cleanTgl: cleanTgl,
            bulan: getBulanFromTanggal(taskDate) || '-',
            pic: t.editor || t.assignedEditor || '',
            kolaborator: t.uploader || '',
            skp: 'Editing Video',
            judul: `[${t.tipe || 'Editing Video'}] ${t.judul || 'Tanpa Judul'}`,
            deskripsi: fullDesc,
            status: t.status || 'Belum Dikerjakan',
            platform: 'Studio Video',
            linkPublikasi: t.hasilEdit || '',
            linkRaw: t.rawVideo || '',
            linkStoryboard: t.storyboard || '',
            fotoBukti: '',
            rawItem: t
        });
    });

    // Urutkan dari tanggal terbaru
    activities.sort((a, b) => {
        const da = a.tanggal || '';
        const db = b.tanggal || '';
        return db.localeCompare(da);
    });

    return activities;
}

export function populateLaporPicFilter() {
    const sel = document.getElementById('filter-lapor-pic');
    const printSel = document.getElementById('print-pic');
    const names = Object.keys(dataVolunteer).sort((a, b) => a.localeCompare(b));

    if (sel && sel.options.length <= 1) {
        const curVal = sel.value || 'Semua PIC';
        sel.innerHTML = '<option value="Semua PIC">-- Semua PIC --</option>' +
            names.map(n => `<option value="${n}">${n}</option>`).join('');
        sel.value = curVal;
    }
    if (printSel && printSel.options.length <= 1) {
        const curVal = printSel.value || 'Semua PIC';
        printSel.innerHTML = '<option value="Semua PIC">-- Seluruh Volunteer (Kompilasi) --</option>' +
            names.map(n => `<option value="${n}">${n}</option>`).join('');
        printSel.value = curVal;
    }
}

export function renderPelaporan() {
    populateLaporPicFilter();

    const filterPic = document.getElementById('filter-lapor-pic')?.value || 'Semua PIC';
    const filterBulan = document.getElementById('filter-lapor-bulan')?.value || 'Semua Bulan';
    const filterSkp = document.getElementById('filter-lapor-skp')?.value || 'Semua SKP';

    const allActivities = getAllVolunteerActivities();

    const filtered = allActivities.filter(c => {
        let matchPic = (filterPic === "Semua PIC" || ((c.pic || "").includes(filterPic)) || ((c.kolaborator || "").includes(filterPic)));
        let matchBulan = (filterBulan === "Semua Bulan" || c.bulan === filterBulan);

        let cSkp = c.skp || "Lainnya";
        if (cSkp === "-") cSkp = "Lainnya";
        let matchSkp = (filterSkp === "Semua SKP" || cSkp === filterSkp);

        return matchPic && matchBulan && matchSkp;
    });

    window.currentFilteredReport = filtered;

    const tbody = document.getElementById('pelaporan-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color: var(--text-muted);">Tidak ada data pekerjaan yang sesuai dengan filter.</td></tr>`;
        return;
    }

    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');

    let html = "";
    filtered.forEach(c => {
        let btnEvidence = "-";
        let evidenceLinks = [];

        if (c.sourceType === 'content_plan') {
            if (c.linkPublikasi) {
                evidenceLinks.push(`<a href="${c.linkPublikasi}" target="_blank" class="btn-primary" style="padding:4px 8px; font-size:11px; text-decoration:none; display:inline-block; margin-bottom:4px;">Buka Link</a>`);
            }
            if (c.fotoBukti && c.fotoBukti !== "-" && c.fotoBukti !== "Mengunggah..." && c.fotoBukti.startsWith("http")) {
                evidenceLinks.push(`<a href="${c.fotoBukti}" target="_blank" class="btn-primary" style="background:#10b981; padding:4px 8px; font-size:11px; text-decoration:none; display:inline-block;">Lihat Foto</a>`);
            } else if (c.fotoBukti === "Mengunggah...") {
                evidenceLinks.push(`<span style="font-size:10px; color:var(--text-muted);">Mengunggah...</span>`);
            }
        } else {
            // Studio task
            if (c.linkPublikasi) {
                evidenceLinks.push(`<a href="${c.linkPublikasi}" target="_blank" class="btn-primary" style="background:#10b981; padding:4px 8px; font-size:11px; text-decoration:none; display:inline-block; margin-bottom:4px;">Hasil Video</a>`);
            }
            if (c.linkRaw) {
                evidenceLinks.push(`<a href="${c.linkRaw}" target="_blank" class="btn-secondary" style="padding:3px 7px; font-size:10px; text-decoration:none; display:inline-block;">Bahan RAW</a>`);
            }
            if (!c.linkPublikasi && !c.linkRaw) {
                evidenceLinks.push(`<span style="font-size:11px; color:var(--text-muted);">${c.status}</span>`);
            }
        }

        if (evidenceLinks.length > 0) {
            btnEvidence = evidenceLinks.join("<br>");
        }

        let picTagHtml = "";
        if (c.sourceType === 'content_plan') {
            picTagHtml = renderPersonsHtml(c.rawItem);
        } else {
            picTagHtml = `<span class="pic-tag" title="Editor Video">${c.pic || '-'}</span>`;
            if (c.kolaborator && c.kolaborator !== c.pic) {
                picTagHtml += ` <span class="pic-tag" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);" title="Uploader Bahan">${c.kolaborator}</span>`;
            }
        }

        const picArray = (c.pic || "").split(',').map(s => s.trim()).filter(Boolean);
        const isOwner = isAdmin || (state.currentUser && picArray.includes(state.currentUser.namaLengkap));
        let actionBtns = `<span style="color:var(--text-muted); font-size:12px;">-</span>`;

        if (c.sourceType === 'content_plan' && isOwner) {
            actionBtns = `
                <div style="display:inline-flex; gap:6px; align-items:center; justify-content:center;">
                    <button class="btn-card-action btn-edit-action" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; display:inline-flex; align-items:center; gap:3px;" onclick="window.openModal('edit', '${c.id}')" title="Edit Konten">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px; height:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        <span>Edit</span>
                    </button>
                    <button class="btn-card-action btn-del-action" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; display:inline-flex; align-items:center; gap:3px;" onclick="window.deleteContent('${c.id}')" title="Hapus Konten">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px; height:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        <span>Hapus</span>
                    </button>
                </div>
            `;
        } else if (c.sourceType === 'studio_task') {
            actionBtns = `
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; border-radius: 6px; color: #6366f1; border-color: #6366f1;" onclick="navigateTo('/studio-editor')" title="Buka di Studio Editor">
                    Buka Studio
                </button>
            `;
        }

        html += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 10px; font-size: 0.85rem; white-space: nowrap;">${c.cleanTgl}</td>
            <td style="padding: 10px; font-size: 0.85rem;">${picTagHtml}</td>
            <td style="padding: 10px; font-size: 0.85rem;">${c.bulan || "-"}</td>
            <td style="padding: 10px; font-size: 0.85rem; font-weight:600;">
              <span class="badge ${c.sourceType === 'studio_task' ? 'badge-pillar' : ''}">${c.skp || "-"}</span>
            </td>
            <td style="padding: 10px; font-size: 0.85rem;">
              <strong>${c.judul || "-"}</strong><br>
              <span style="color: var(--text-muted); font-size:0.75rem;">${c.deskripsi || "-"}</span>
            </td>
            <td style="padding: 10px; text-align: center;">${btnEvidence}</td>
            <td style="padding: 10px; text-align: center;">${actionBtns}</td>
          </tr>
        `;
    });
    tbody.innerHTML = html;
}

export function autoFillPrintFields(picName) {
    if (picName && dataVolunteer[picName]) {
        const d = dataVolunteer[picName];
        const printNim = document.getElementById('print-nim');
        const printProdi = document.getElementById('print-prodi');
        const printFakultas = document.getElementById('print-fakultas');
        if (printNim) printNim.value = d.nim || '';
        if (printProdi) printProdi.value = d.jur || '';
        if (printFakultas) printFakultas.value = d.fak || '';
    } else {
        const printNim = document.getElementById('print-nim');
        const printProdi = document.getElementById('print-prodi');
        const printFakultas = document.getElementById('print-fakultas');
        if (printNim) printNim.value = '';
        if (printProdi) printProdi.value = '';
        if (printFakultas) printFakultas.value = '';
    }
}

export function handleExport(type) {
    const pic = document.getElementById('print-pic').value;
    const nim = document.getElementById('print-nim').value;
    const prodi = document.getElementById('print-prodi').value;
    const fak = document.getElementById('print-fakultas').value;
    const periode = document.getElementById('print-periode').value;

    localStorage.setItem('volabs_pipd_print_nim', nim);
    localStorage.setItem('volabs_pipd_print_prodi', prodi);
    localStorage.setItem('volabs_pipd_print_fak', fak);
    localStorage.setItem('volabs_pipd_print_periode', periode);

    const modalPrint = document.getElementById('modal-print');
    if (modalPrint) {
        modalPrint.classList.remove('active');
        modalPrint.style.display = 'none';
    }

    generateAndExportReport(pic, nim, prodi, fak, periode, type);
}

export function generateAndExportReport(pic, nim, prodi, fak, periode, type) {
    const displayPic = pic === 'Semua PIC' ? 'Seluruh Volunteer PIPD (Kompilasi)' : pic;

    document.getElementById('out-nama').textContent = displayPic;
    document.getElementById('out-nim').textContent = nim;
    document.getElementById('out-prodi').textContent = prodi;
    document.getElementById('out-fakultas').textContent = fak;
    document.getElementById('out-periode').textContent = periode;

    document.getElementById('out-ttd-nama').textContent = displayPic;
    document.getElementById('out-ttd-nim').textContent = nim;

    const filterBulan = document.getElementById('filter-lapor-bulan')?.value || "Semua Bulan";
    const filterSkp = document.getElementById('filter-lapor-skp')?.value || "Semua SKP";

    const allActivities = getAllVolunteerActivities();

    const filtered = allActivities.filter(c => {
        let matchPic = (pic === "Semua PIC" || ((c.pic || "").includes(pic)) || ((c.kolaborator || "").includes(pic)));
        let matchBulan = (filterBulan === "Semua Bulan" || c.bulan === filterBulan);
        let cSkp = c.skp || "Lainnya";
        if (cSkp === "-") cSkp = "Lainnya";
        let matchSkp = (filterSkp === "Semua SKP" || cSkp === filterSkp);
        return matchPic && matchBulan && matchSkp;
    });

    const tbody = document.querySelector('#print-data-table tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        showCustomDialog({
            title: "Informasi",
            message: "Data kosong! Silakan pastikan ada data pada tabel sebelum mencetak.",
            confirmText: "Mengerti"
        });
        return;
    }

    let html = "";
    filtered.forEach((c, idx) => {
        let skp = c.skp || "Tugas Lainnya";
        let taskDesc = `<strong>${c.judul || "-"}</strong>`;
        if (c.deskripsi) taskDesc += `<br><span style="font-size:10px; color:#555;">${c.deskripsi}</span>`;

        let evidenceText = "-";
        if (c.linkPublikasi) {
            evidenceText = `<a href="${c.linkPublikasi}" style="color:blue; text-decoration:underline;">Tautan Hasil / Publikasi</a>`;
        } else if (c.linkRaw) {
            evidenceText = `<a href="${c.linkRaw}" style="color:blue; text-decoration:underline;">Tautan Bahan Video</a>`;
        }

        html += `
          <tr>
            <td>${idx + 1}</td>
            <td style="white-space:nowrap;">${c.cleanTgl}</td>
            <td><strong>${skp}</strong></td>
            <td style="text-align:left; padding-left:10px;">${taskDesc}</td>
            <td>${evidenceText}</td>
          </tr>
        `;
    });

    tbody.innerHTML = html;

    const printArea = document.getElementById('print-area');
    const btnPdf = document.getElementById('btn-download-pdf');
    const btnDoc = document.getElementById('btn-download-doc');
    const originalPdfText = btnPdf?.innerHTML || 'Cetak / Preview PDF';
    const originalDocText = btnDoc?.innerHTML || 'Download DOC';

    if (type === 'doc') {
        printArea.classList.add('export-active');
        if (btnDoc) btnDoc.innerHTML = 'Menyiapkan DOC...';

        setTimeout(() => {
            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Laporan KKN</title></" + "head><" + "body>";
            const footer = "</" + "body></" + "html>";
            const styles = "<style>#print-area { font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.15; padding: 0; } table { border-collapse: collapse; width: 100%; font-size: 11pt; } .print-data-table th, .print-data-table td { border: 1px solid #000; padding: 4px; text-align: center; } .print-data-table th { font-weight: bold; } .print-title { text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 15px; } .print-subtitle { font-weight: bold; text-transform: uppercase; margin-bottom: 5px; } .print-info-table td { padding: 2px 0; border: none; } </style>";
            const htmlContent = header + styles + "<div id='print-area'>" + printArea.innerHTML + "</div>" + footer;

            const blob = new Blob(['\ufeff', htmlContent], {
                type: 'application/msword'
            });

            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = `Laporan_Volunteer_${pic.replace(/ /g, '_')}.doc`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);

            printArea.classList.remove('export-active');
            if (btnDoc) btnDoc.innerHTML = originalDocText;
        }, 500);
    } else if (type === 'pdf') {
        document.body.classList.add('is-printing');
        let parent = document.getElementById('print-area').parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
            parent.classList.add('print-ancestor');
            parent = parent.parentElement;
        }

        setTimeout(() => {
            window.print();
            document.body.classList.remove('is-printing');
            let p = document.getElementById('print-area').parentElement;
            while (p && p !== document.body && p !== document.documentElement) {
                p.classList.remove('print-ancestor');
                p = p.parentElement;
            }
            if (btnPdf) btnPdf.innerHTML = originalPdfText;
        }, 300);
    }
}

export function initPelaporan() {
    window.renderPelaporan = renderPelaporan;
    window.autoFillPrintFields = autoFillPrintFields;
    window.handleExport = handleExport;
    window.generateAndExportReport = generateAndExportReport;
    window.getAllVolunteerActivities = getAllVolunteerActivities;
    window.populateLaporPicFilter = populateLaporPicFilter;

    populateLaporPicFilter();

    ['filter-lapor-pic', 'filter-lapor-bulan', 'filter-lapor-skp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', renderPelaporan);
    });

    const modalPrint = document.getElementById('modal-print');
    const btnPrint = document.getElementById('btn-print-report');
    if (btnPrint && modalPrint) {
        btnPrint.addEventListener('click', () => {
            const pPer = localStorage.getItem('volabs_pipd_print_periode') || `1 ${api.getSheetName()} s.d. 31 ${api.getSheetName()} 2026`;
            const elPer = document.getElementById('print-periode');
            if (elPer) elPer.value = pPer;

            const filterPic = document.getElementById('filter-lapor-pic')?.value;
            const targetPic = (filterPic && filterPic !== 'Semua PIC') ? filterPic : (state.currentUser ? state.currentUser.namaLengkap : '');

            const printPicEl = document.getElementById('print-pic');
            if (targetPic && dataVolunteer[targetPic]) {
                if (printPicEl) printPicEl.value = targetPic;
                autoFillPrintFields(targetPic);
            } else if (filterPic) {
                if (printPicEl) printPicEl.value = filterPic;
                autoFillPrintFields(filterPic);
            } else {
                if (printPicEl) printPicEl.value = 'Semua PIC';
                autoFillPrintFields('Semua PIC');
            }

            modalPrint.style.display = 'flex';
            modalPrint.classList.add('active');
        });
    }

    const btnClosePrint = document.getElementById('btn-close-print');
    if (btnClosePrint && modalPrint) btnClosePrint.addEventListener('click', () => {
        modalPrint.classList.remove('active');
        modalPrint.style.display = 'none';
    });
    const btnCancelPrint = document.getElementById('btn-cancel-print');
    if (btnCancelPrint && modalPrint) btnCancelPrint.addEventListener('click', () => {
        modalPrint.classList.remove('active');
        modalPrint.style.display = 'none';
    });

    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) btnPdf.addEventListener('click', (e) => { e.preventDefault(); handleExport('pdf'); });
    const btnDoc = document.getElementById('btn-download-doc');
    if (btnDoc) btnDoc.addEventListener('click', (e) => { e.preventDefault(); handleExport('doc'); });
}
