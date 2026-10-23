// Alur Produksi View Module (Kanban Board by Production Status)
import { state } from '../store/state.js';
import { CONFIG } from '../store/initialData.js';
import { cleanDate } from '../utils/helpers.js';
import { getActionButtons } from './konten.js';
import { getSkeletonKanban } from '../utils/skeleton.js';

export const alurProduksiTemplate = `
        <section id="view-kanban" class="view-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3>Alur Kerja Produksi Konten</h3>
                <button class="btn-primary" onclick="openModal('add')">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span>Tambah Konten</span>
                </button>
            </div>
            <div class="kanban-board" id="kanban-columns-container">
                ${getSkeletonKanban()}
            </div>
        </section>

        <!-- SECTION 4: PELAPORAN VIEW -->
`;

export function renderKanban(filteredPlans = state.contentPlans) {
    const kanbanCont = document.getElementById('kanban-columns-container');
    if (!kanbanCont) return;

    kanbanCont.innerHTML = CONFIG.STATUSES.map(s => {
        const items = filteredPlans.filter(c => (c.Status || '').trim().toLowerCase() === (s.value || '').trim().toLowerCase());
        return `
          <div class="kanban-column">
            <div class="kanban-col-header">
              <span>${s.label}</span>
              <span class="kanban-count">${items.length}</span>
            </div>
            <div class="kanban-items">
              ${items.length === 0 ? `<div style="text-align:center; padding:1.5rem 0; font-size:0.78rem; color:var(--text-light);">Kosong</div>` : items.map(c => {
                    const picName = (c.PIC || '-').split(',')[0].trim();
                    const collabCount = (c["Kolaborator"] || '').split(',').filter(Boolean).length;
                    return `
                <div class="content-card" style="padding: 0.75rem 0.85rem; gap: 0.45rem; border-radius: 10px;">
                  <div class="card-top" style="margin-bottom: 0.1rem;">
                    <span class="badge" style="font-size:0.65rem; padding: 0.15rem 0.45rem;">${c.Platform}</span>
                    <span class="card-date" style="font-size:0.68rem; color: var(--text-muted);">${cleanDate(c.Tanggal)}</span>
                  </div>
                  <h5 style="font-size: 0.85rem; margin: 0; line-height: 1.35; color: var(--text-main); font-weight: 600;">${c.Judul}</h5>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem; padding-top: 0.45rem; border-top: 1px dashed var(--border-color);">
                    <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="PIC: ${c.PIC || '-'}">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:13px; height:13px; flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <span style="overflow: hidden; text-overflow: ellipsis;">${picName}</span>
                      ${collabCount > 0 ? `<span style="font-size:0.65rem; background:var(--bg-tertiary); padding:1px 4px; border-radius:4px; color:var(--primary); font-weight:600;">+${collabCount}</span>` : ''}
                    </div>
                    <div class="card-actions" style="gap: 4px;">
                      ${getActionButtons(c, true, true)}
                      ${c["Link Publikasi"] ? `<a href="${c["Link Publikasi"]}" target="_blank" class="btn-card-action" style="background:var(--bg-tertiary); color:var(--text-main); padding: 0.25rem; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid var(--border-color); text-decoration:none;" title="Buka Link Publikasi">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:13px; height:13px;"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>` : ''}
                      ${c["Foto Bukti"] && c["Foto Bukti"].startsWith("http") ? `<a href="${c["Foto Bukti"]}" target="_blank" class="btn-card-action" style="background:#d1fae5; color:#065f46; padding: 0.25rem; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid #34d399; text-decoration:none;" title="Lihat Foto Bukti">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:13px; height:13px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </a>` : ''}
                    </div>
                  </div>
                </div>
              `;
                }).join("")}
            </div>
          </div>
        `;
    }).join("");
}

export function initAlurProduksi() {
    window.renderKanban = renderKanban;
    renderKanban();
}
