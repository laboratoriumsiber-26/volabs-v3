// Universal Skeleton Loading Generators for VoLABS PIPD
import { CONFIG } from '../store/initialData.js';

export function getSkeletonCards(count = 3) {
    const card = `
        <div class="content-card" style="pointer-events: none; opacity: 0.85;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div class="skeleton" style="height: 14px; width: 35%; border-radius: 6px;"></div>
                <div class="skeleton" style="height: 18px; width: 60px; border-radius: 12px;"></div>
            </div>
            <div class="skeleton" style="height: 20px; width: 85%; margin-bottom: 10px; border-radius: 4px;"></div>
            <div class="skeleton" style="height: 13px; width: 95%; margin-bottom: 6px; border-radius: 4px;"></div>
            <div class="skeleton" style="height: 13px; width: 70%; margin-bottom: 14px; border-radius: 4px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-color);">
                <div class="skeleton" style="height: 14px; width: 80px; border-radius: 12px;"></div>
                <div class="skeleton" style="height: 26px; width: 70px; border-radius: 6px;"></div>
            </div>
        </div>
    `;
    return Array(count).fill(card).join('\n');
}

export function getSkeletonTableRows(cols = 7, rows = 4) {
    const widths = ['30%', '50%', '70%', '85%', '60%', '40%', '75%', '55%'];
    return Array(rows).fill(0).map(() => `
        <tr style="border-bottom: 1px solid var(--border-color); pointer-events: none;">
            ${Array(cols).fill(0).map((_, i) => `
                <td style="padding: 12px;">
                    <div class="skeleton" style="height: 14px; width: ${widths[i % widths.length]}; border-radius: 4px;"></div>
                </td>
            `).join('')}
        </tr>
    `).join('\n');
}

export function getSkeletonKanban() {
    const statuses = (CONFIG && CONFIG.STATUSES) ? CONFIG.STATUSES : [
        { value: 'Idea / Konsep' },
        { value: 'Scripting / Copywriting' },
        { value: 'Desain / Produksi' },
        { value: 'Review / Approval' },
        { value: 'Siap Tayang (Ready)' },
        { value: 'Published' }
    ];

    const innerCard = `
        <div class="content-card" style="padding: 12px; margin-bottom: 8px; pointer-events: none; opacity: 0.85;">
            <div class="skeleton" style="height: 12px; width: 45%; margin-bottom: 8px; border-radius: 4px;"></div>
            <div class="skeleton" style="height: 16px; width: 90%; margin-bottom: 8px; border-radius: 4px;"></div>
            <div class="skeleton" style="height: 11px; width: 75%; margin-bottom: 10px; border-radius: 4px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-color);">
                <div class="skeleton" style="height: 18px; width: 60px; border-radius: 10px;"></div>
                <div class="skeleton" style="height: 18px; width: 40px; border-radius: 4px;"></div>
            </div>
        </div>
    `;

    return statuses.map(s => `
        <div class="kanban-column" style="min-width: 275px; flex: 1 1 0;">
            <div class="kanban-col-header" style="padding-bottom: 10px; margin-bottom: 10px;">
                <div style="font-weight: 700; font-size: 13.5px; color: var(--text-main);">${s.value}</div>
                <div class="skeleton" style="height: 18px; width: 26px; border-radius: 12px;"></div>
            </div>
            <div class="kanban-items">
                ${innerCard.repeat(2)}
            </div>
        </div>
    `).join('\n');
}

export function getSkeletonAttendance(count = 3) {
    const item = `
        <div class="att-card" style="display: flex; gap: 12px; align-items: center; padding: 12px; margin-bottom: 10px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-color); pointer-events: none;">
            <div class="skeleton" style="width: 48px; height: 48px; border-radius: 8px; flex-shrink: 0;"></div>
            <div style="flex: 1;">
                <div class="skeleton" style="height: 15px; width: 55%; margin-bottom: 6px; border-radius: 4px;"></div>
                <div class="skeleton" style="height: 12px; width: 35%; margin-bottom: 6px; border-radius: 4px;"></div>
                <div class="skeleton" style="height: 12px; width: 75%; border-radius: 4px;"></div>
            </div>
        </div>
    `;
    return Array(count).fill(item).join('\n');
}

export function getSkeletonProfilCards(count = 4) {
    const card = `
        <div class="profil-card" style="padding: 18px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; flex-direction: column; gap: 12px; pointer-events: none;">
            <div style="display: flex; gap: 12px; align-items: center;">
                <div class="skeleton" style="width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                    <div class="skeleton" style="height: 16px; width: 75%; margin-bottom: 6px; border-radius: 4px;"></div>
                    <div class="skeleton" style="height: 12px; width: 45%; border-radius: 4px;"></div>
                </div>
            </div>
            <div class="skeleton" style="height: 13px; width: 85%; border-radius: 4px;"></div>
            <div style="display: flex; gap: 8px; margin-top: 4px;">
                <div class="skeleton" style="height: 22px; width: 70px; border-radius: 12px;"></div>
                <div class="skeleton" style="height: 22px; width: 90px; border-radius: 12px;"></div>
            </div>
        </div>
    `;
    return Array(count).fill(card).join('\n');
}

export function getSkeletonStatNumber() {
    return `<div class="skeleton" style="height: 28px; width: 60px; border-radius: 6px; display: inline-block;"></div>`;
}

export function getSkeletonBreakdown(count = 4) {
    const row = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div class="skeleton" style="height: 13px; width: 45%; border-radius: 4px;"></div>
            <div class="skeleton" style="height: 13px; width: 25%; border-radius: 4px;"></div>
        </div>
        <div class="skeleton" style="height: 6px; width: 100%; border-radius: 4px; margin-bottom: 12px;"></div>
    `;
    return Array(count).fill(row).join('\n');
}

// Master function to render skeleton in all views
export function renderAllSkeletons() {
    // 1. Dasbor
    const dashCards = document.getElementById('dashboard-recent-cards');
    if (dashCards) dashCards.innerHTML = getSkeletonCards(3);

    const statK = document.getElementById('stat-konten-val');
    if (statK && statK.textContent === '0') statK.innerHTML = getSkeletonStatNumber();
    const statV = document.getElementById('stat-video-val');
    if (statV && statV.textContent === '0') statV.innerHTML = getSkeletonStatNumber();
    const statA = document.getElementById('stat-absensi-val');
    if (statA && statA.textContent === '0') statA.innerHTML = getSkeletonStatNumber();
    const statJ = document.getElementById('stat-jurnal-val');
    if (statJ && statJ.textContent === '0') statJ.innerHTML = getSkeletonStatNumber();

    const contentBreakdown = document.getElementById('content-breakdown-container');
    if (contentBreakdown && !contentBreakdown.children.length) contentBreakdown.innerHTML = getSkeletonBreakdown(4);
    const editorBreakdown = document.getElementById('editor-breakdown-container');
    if (editorBreakdown && !editorBreakdown.children.length) editorBreakdown.innerHTML = getSkeletonBreakdown(4);
    const skpBreakdown = document.getElementById('skp-breakdown-container');
    if (skpBreakdown && !skpBreakdown.children.length) skpBreakdown.innerHTML = getSkeletonBreakdown(4);
    const platBreakdown = document.getElementById('platform-breakdown-container');
    if (platBreakdown && !platBreakdown.children.length) platBreakdown.innerHTML = getSkeletonBreakdown(4);

    // 2. Konten Plan
    const contentCards = document.getElementById('content-cards-view');
    if (contentCards) contentCards.innerHTML = getSkeletonCards(4);
    const contentTable = document.getElementById('content-table-body');
    if (contentTable) contentTable.innerHTML = getSkeletonTableRows(8, 5);

    // 3. Kanban (Alur Produksi)
    const kanbanCont = document.getElementById('kanban-columns-container');
    if (kanbanCont) kanbanCont.innerHTML = getSkeletonKanban();

    // 4. Pelaporan
    const pelaporanTbody = document.getElementById('pelaporan-tbody');
    if (pelaporanTbody) pelaporanTbody.innerHTML = getSkeletonTableRows(8, 5);

    // 5. Presensi / Absensi
    const absensiList = document.getElementById('absensi-list-container');
    if (absensiList) absensiList.innerHTML = getSkeletonAttendance(3);

    // 6. Jurnal KKN
    const jurnalCards = document.getElementById('jurnal-cards-view');
    if (jurnalCards) jurnalCards.innerHTML = getSkeletonCards(3);
    const jurnalTable = document.getElementById('jurnal-table-body');
    if (jurnalTable) jurnalTable.innerHTML = getSkeletonTableRows(7, 4);

    // 7. Studio Editor
    const editorCards = document.getElementById('editor-cards-container');
    if (editorCards) editorCards.innerHTML = getSkeletonCards(3);
    const editorTable = document.getElementById('editor-table-body');
    if (editorTable) editorTable.innerHTML = getSkeletonTableRows(7, 4);

    // 8. Studio Upload
    const uploadCards = document.getElementById('upload-cards-container');
    if (uploadCards) uploadCards.innerHTML = getSkeletonCards(3);
    const uploadTable = document.getElementById('upload-table-body');
    if (uploadTable) uploadTable.innerHTML = getSkeletonTableRows(7, 4);

    // 9. Bank Material Video
    const asetCards = document.getElementById('aset-cards-container');
    if (asetCards) asetCards.innerHTML = getSkeletonCards(3);
    const asetTable = document.getElementById('aset-table-body');
    if (asetTable) asetTable.innerHTML = getSkeletonTableRows(8, 4);

    // 10. Profil User
    const profilCards = document.getElementById('profil-cards-container');
    if (profilCards) profilCards.innerHTML = getSkeletonProfilCards(4);
    const profilTable = document.getElementById('profil-table-body');
    if (profilTable) profilTable.innerHTML = getSkeletonTableRows(7, 5);
}
