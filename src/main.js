// Main Application Bootstrap (VoLABS PIPD Single Page Application)
import './styles/main.css';

import { state } from './store/state.js';
import { CONFIG, dataVolunteer } from './store/initialData.js';
import { api } from './services/api.js';
import { initFirebase, db } from './services/firebase.js';
import { checkAuth, applyRBAC, togglePassword, handleLogin, logout, showBannerAlert } from './services/auth.js';
import { initRouter, navigateTo, switchView, handleRouteFromUrl } from './router/index.js';
import { setRefreshLoading, cleanDate, formatTanggalIndo, getBulanFromTanggal, compressImage } from './utils/helpers.js';
import { showCustomDialog } from './utils/dialog.js';
import { renderAllSkeletons } from './utils/skeleton.js';

// Views
import { dasborTemplate, initDasbor, renderDashboard } from './views/dasbor.js';
import { kontenTemplate, initKonten, renderContentPlan } from './views/konten.js';
import { alurProduksiTemplate, initAlurProduksi, renderKanban } from './views/alurProduksi.js';
import { pelaporanTemplate, initPelaporan, renderPelaporan } from './views/pelaporan.js';
import { absensiTemplate, initAbsensi, renderAbsensi } from './views/absensi.js';
import { jurnalTemplate, initJurnal, renderJurnalKkn } from './views/jurnal.js';
import { profilTemplate, initProfil, renderProfilUser } from './views/profil.js';
import { studioUploadTemplate, initStudioUpload, renderStudioUpload } from './views/studioUpload.js';
import { studioEditorTemplate, initStudioEditor, renderStudioEditor } from './views/studioEditor.js';
import { asetVideoTemplate, initAsetVideo, renderAsetVideo } from './views/asetVideo.js';

// Expose Core Objects on Window for Legacy Hooks & Inline HTML Handlers
window.state = state;
window.CONFIG = CONFIG;
window.dataVolunteer = dataVolunteer;
window.api = api;
window.showCustomDialog = showCustomDialog;
window.togglePassword = togglePassword;
window.handleLogin = handleLogin;
window.logout = logout;
window.applyRBAC = applyRBAC;
window.checkAuth = checkAuth;
window.showBannerAlert = showBannerAlert;
window.cleanDate = cleanDate;
window.formatTanggalIndo = formatTanggalIndo;
window.getBulanFromTanggal = getBulanFromTanggal;
window.compressImage = compressImage;
window.switchView = switchView;
window.navigateTo = navigateTo;

// PWA Install Prompt State
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btns = document.querySelectorAll('.install-pwa-btn');
    btns.forEach(btn => {
        if (btn.id === 'btn-install-pwa') btn.style.display = 'inline-flex';
        else btn.style.display = 'flex';
    });
});

export async function triggerPwaInstall() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            const btns = document.querySelectorAll('.install-pwa-btn');
            btns.forEach(btn => btn.style.display = 'none');
        }
        deferredPrompt = null;
    }
}
window.triggerPwaInstall = triggerPwaInstall;

// Render Skeleton Placeholder across all menus
export function renderSkeleton() {
    renderAllSkeletons();
}

// Purge legacy dummy caches
export function purgeLegacyDummyData() {
    try {
        const storedTasks = JSON.parse(localStorage.getItem('volabs_editor_tasks') || '[]');
        const cleanTasks = Array.isArray(storedTasks) ? storedTasks.filter(t => t.id !== 'ET-1001' && t.id !== 'ET-1002' && !String(t.rawVideo || '').includes('sample-raw')) : [];
        localStorage.setItem('volabs_editor_tasks', JSON.stringify(cleanTasks));
        state.allEditorTasks = cleanTasks;

        const dummyAsetIds = ['ASET-101', 'ASET-102', 'ASET-103', 'ASET-104', 'ASET-105'];
        const storedAsets = JSON.parse(localStorage.getItem('volabs_aset_video_list') || '[]');
        const cleanAsets = Array.isArray(storedAsets) ? storedAsets.filter(a => !dummyAsetIds.includes(a.id) && !String(a.driveUrl || '').includes('sample-')) : [];
        localStorage.setItem('volabs_aset_video_list', JSON.stringify(cleanAsets));
        state.asetVideoList = cleanAsets;

        const storedPlans = JSON.parse(localStorage.getItem('volabs_cached_content_plans') || '[]');
        const cleanPlans = Array.isArray(storedPlans) ? storedPlans.filter(p => !String(p.ID || '').toLowerCase().includes('dummy') && !String(p.ID || '').toLowerCase().includes('sample')) : [];
        localStorage.setItem('volabs_cached_content_plans', JSON.stringify(cleanPlans));
        state.contentPlans = cleanPlans;

        const storedAbs = JSON.parse(localStorage.getItem('volabs_cached_absensi') || '[]');
        const cleanAbs = Array.isArray(storedAbs) ? storedAbs.filter(a => !String(a.id || '').toLowerCase().includes('dummy') && !String(a.nama || '').toLowerCase().includes('dummy') && !String(a.nama || '').toLowerCase().includes('test')) : [];
        localStorage.setItem('volabs_cached_absensi', JSON.stringify(cleanAbs));
        state.absensiList = cleanAbs;
        window.todayAbsensiList = cleanAbs;

        const storedJur = JSON.parse(localStorage.getItem('volabs_cached_jurnal') || '[]');
        const cleanJur = Array.isArray(storedJur) ? storedJur.filter(j => !String(j.id || '').toLowerCase().includes('dummy') && !String(j.kegiatan || '').toLowerCase().includes('test dummy')) : [];
        localStorage.setItem('volabs_cached_jurnal', JSON.stringify(cleanJur));
        state.allJurnalDataAdmin = cleanJur;
        if (state.currentUser) {
            const myName = (state.currentUser.namaLengkap || '').trim().toLowerCase();
            state.jurnalList = cleanJur.filter(j => (j.nama || '').trim().toLowerCase() === myName);
        } else {
            state.jurnalList = [];
        }
    } catch (e) {
        console.warn("Purge dummy data notice:", e);
    }
}
window.purgeLegacyDummyData = purgeLegacyDummyData;

// Refresh Data from Remote/Backend (Firebase Firestore)
export async function refreshData() {
    setRefreshLoading(true);
    try {
        if (db) {
            try {
                // 1. Sync Content Plans
                const snap = await db.collection('content_plans').get();
                const fbData = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    if (!String(doc.id).toLowerCase().includes('dummy') && !String(data.Judul || '').toLowerCase().includes('dummy sample')) {
                        fbData.push({ ID: doc.id, ...data });
                    }
                });
                state.contentPlans = fbData;
                localStorage.setItem('volabs_cached_content_plans', JSON.stringify(fbData));

                // 2. Sync Studio Tasks
                const taskSnap = await db.collection('studio_tasks').get();
                const tasks = [];
                taskSnap.forEach(doc => {
                    if (doc.id !== 'ET-1001' && doc.id !== 'ET-1002') {
                        tasks.push({ id: doc.id, ...doc.data() });
                    }
                });
                state.allEditorTasks = tasks;
                localStorage.setItem('volabs_editor_tasks', JSON.stringify(tasks));

                // 3. Sync Aset Video
                const asetDoc = await db.collection('app_settings').doc('aset_video').get();
                const dummyAsetIds = ['ASET-101', 'ASET-102', 'ASET-103', 'ASET-104', 'ASET-105'];
                let asets = (asetDoc.exists && asetDoc.data() && Array.isArray(asetDoc.data().list)) ? asetDoc.data().list : [];
                asets = asets.filter(a => !dummyAsetIds.includes(a.id) && !String(a.driveUrl || '').includes('sample-'));
                state.asetVideoList = asets;
                localStorage.setItem('volabs_aset_video_list', JSON.stringify(asets));

                // 4. Sync Absensi
                const absSnap = await db.collection('absensi').orderBy('timestamp', 'desc').limit(100).get();
                const absList = [];
                absSnap.forEach(doc => {
                    const data = doc.data();
                    if (!String(doc.id).toLowerCase().includes('dummy') && !String(data.nama || '').toLowerCase().includes('dummy')) {
                        absList.push({ id: doc.id, ...data });
                    }
                });
                state.absensiList = absList;
                window.todayAbsensiList = absList;
                localStorage.setItem('volabs_cached_absensi', JSON.stringify(absList));

                // 5. Sync Jurnal
                const jurSnap = await db.collection('jurnal_kkn').get();
                const jurnals = [];
                jurSnap.forEach(doc => {
                    const data = doc.data();
                    if (!String(doc.id).toLowerCase().includes('dummy')) {
                        jurnals.push({ id: doc.id, ...data });
                    }
                });
                state.allJurnalDataAdmin = jurnals;
                if (state.currentUser) {
                    const myName = (state.currentUser.namaLengkap || '').trim().toLowerCase();
                    state.jurnalList = jurnals.filter(j => (j.nama || '').trim().toLowerCase() === myName);
                } else {
                    state.jurnalList = [];
                }
                localStorage.setItem('volabs_cached_jurnal', JSON.stringify(jurnals));
            } catch (fbErr) {
                console.warn("Firestore fetch error:", fbErr);
            }
        }

        renderDashboard();
        renderContentPlan();
        renderKanban();
        renderPelaporan();
        if (typeof renderAbsensi === 'function') renderAbsensi();
        if (typeof window.updateApprovalBadge === 'function') window.updateApprovalBadge();
        if (typeof renderAsetVideo === 'function') renderAsetVideo();
        if (typeof renderStudioEditor === 'function') renderStudioEditor();
        if (typeof renderStudioUpload === 'function') renderStudioUpload();
        if (typeof renderJurnalKkn === 'function') renderJurnalKkn();
    } catch (e) {
        console.error("Koneksi ke data sumber:", e.message);
    } finally {
        setRefreshLoading(false);
    }
}
window.refreshData = refreshData;

// Sheet Popover Handlers
export async function changeSheetFromPopover(newSheet) {
    const popover = document.getElementById('sheet-popover');
    if (popover) popover.classList.remove('show');
    if (newSheet && !newSheet.includes("Content Plan")) {
        newSheet = "Content Plan " + newSheet.trim() + " " + new Date().getFullYear();
    }
    if (newSheet && newSheet.trim() !== api.getSheetName()) {
        setRefreshLoading(true);
        api.setSheetName(newSheet.trim());
        if (api.isConfigured()) {
            try {
                await api.createNewSheet(newSheet.trim());
            } catch (e) {
                console.warn("Info pembuatan sheet:", e.message);
            }
        }
        await refreshData();
    }
}
window.changeSheetFromPopover = changeSheetFromPopover;

export async function promptNewSheet() {
    const popover = document.getElementById('sheet-popover');
    if (popover) popover.classList.remove('show');
    const newSheet = await showCustomDialog({
        title: "Ganti Bulan / Sheet",
        message: "Masukkan nama Bulan atau Sheet yang ingin dibuat:",
        type: "prompt",
        inputValue: api.getSheetName(),
        confirmText: "Simpan",
        confirmColor: "var(--primary)"
    });
    if (newSheet && newSheet.trim() && newSheet.trim() !== api.getSheetName()) {
        changeSheetFromPopover(newSheet);
    }
}
window.promptNewSheet = promptNewSheet;

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 0. Purge any legacy dummy data from localStorage cache immediately
    purgeLegacyDummyData();

    // 1. Mount Modular View Templates into #main-content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = [
            dasborTemplate,
            kontenTemplate,
            alurProduksiTemplate,
            pelaporanTemplate,
            absensiTemplate,
            jurnalTemplate,
            profilTemplate,
            studioUploadTemplate,
            studioEditorTemplate,
            asetVideoTemplate
        ].join('\n');
    }

    // 2. Initialize Router & Views
    initRouter();
    initDasbor();
    initKonten();
    initAlurProduksi();
    initPelaporan();
    initAbsensi();
    initJurnal();
    initProfil();
    initStudioUpload();
    initStudioEditor();
    initAsetVideo();
    renderDashboard();

    // 3. Bind Refresh Button
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => refreshData());
    }

    // 4. Bind Sheet Popover Toggle & Click Outside
    const activeSheetBadge = document.getElementById('active-sheet-badge');
    const sheetPopover = document.getElementById('sheet-popover');
    if (activeSheetBadge && sheetPopover) {
        activeSheetBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            sheetPopover.classList.toggle('show');
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.popover-container')) {
            if (sheetPopover && sheetPopover.classList.contains('show')) {
                sheetPopover.classList.remove('show');
            }
        }
    });

    // 5. Theme Toggle (Default Light Mode jika belum diatur)
    const btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) {
        let savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        let isDark = savedTheme === 'dark';
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            btnTheme.checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            btnTheme.checked = false;
        }

        btnTheme.addEventListener('change', (e) => {
            isDark = e.target.checked;
            if (isDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, 'light');
            }
        });
    }

    // 6. Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 7. Initialize Firebase Real-time listeners
    initFirebase();

    // 8. Authentication Check & Initial Route
    checkAuth();
    handleRouteFromUrl();

    // 9. Initial Data Fetch
    refreshData();

    // 10. Register Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('SW registration notice:', err);
        });
    }
});
