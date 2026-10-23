// HTML5 History Router for VoLABS PIPD (Clean URLs)
import { state } from '../store/state.js';
import { showCustomDialog } from '../utils/dialog.js';

export const ROUTE_MAP = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/konten': 'content-plan',
    '/konten/tambah': 'content-plan-form',
    '/konten/edit': 'content-plan-form',
    '/alur-produksi': 'kanban',
    '/pelaporan': 'pelaporan',
    '/absen': 'absensi',
    '/absensi': 'absensi',
    '/jurnal': 'jurnal-kkn',
    '/jurnal/tambah': 'jurnal-kkn-form',
    '/jurnal/edit': 'jurnal-kkn-form',
    '/jurnal/identitas': 'jurnal-kkn-meta',
    '/jurnal/admin-edit': 'jurnal-admin-edit',
    '/profil': 'profil-user',
    '/profil/detail': 'profil-user-detail',
    '/studio-upload': 'studio-upload',
    '/studio-upload/tambah': 'studio-upload-form',
    '/studio-editor': 'studio-editor',
    '/studio-editor/tugas': 'studio-editor-detail',
    '/aset-video': 'aset-video',
    '/material-video': 'aset-video',
    '/login': 'login'
};

export const VIEW_TO_PATH = {
    'dashboard': '/dashboard',
    'content-plan': '/konten',
    'content-plan-form': '/konten/tambah',
    'kanban': '/alur-produksi',
    'pelaporan': '/pelaporan',
    'absensi': '/absen',
    'jurnal-kkn': '/jurnal',
    'jurnal-kkn-form': '/jurnal/tambah',
    'jurnal-kkn-meta': '/jurnal/identitas',
    'jurnal-admin-edit': '/jurnal/admin-edit',
    'profil-user': '/profil',
    'profil-user-detail': '/profil/detail',
    'studio-upload': '/studio-upload',
    'studio-upload-form': '/studio-upload/tambah',
    'studio-editor': '/studio-editor',
    'studio-editor-detail': '/studio-editor/tugas',
    'aset-video': '/aset-video'
};

export function getViewElements() {
    return {
        'dashboard': document.getElementById('view-dashboard'),
        'content-plan': document.getElementById('view-content-plan'),
        'content-plan-form': document.getElementById('view-content-plan-form'),
        'kanban': document.getElementById('view-kanban'),
        'pelaporan': document.getElementById('view-pelaporan'),
        'absensi': document.getElementById('view-absensi'),
        'jurnal-kkn': document.getElementById('view-jurnal-kkn'),
        'jurnal-kkn-form': document.getElementById('view-jurnal-kkn-form'),
        'jurnal-kkn-meta': document.getElementById('view-jurnal-kkn-meta'),
        'jurnal-admin-edit': document.getElementById('view-jurnal-admin-edit'),
        'profil-user': document.getElementById('view-profil-user'),
        'profil-user-detail': document.getElementById('view-profil-user-detail'),
        'studio-editor': document.getElementById('view-studio-editor'),
        'studio-editor-detail': document.getElementById('view-studio-editor-detail'),
        'studio-upload': document.getElementById('view-studio-upload'),
        'studio-upload-form': document.getElementById('view-studio-upload-form'),
        'aset-video': document.getElementById('view-aset-video')
    };
}

export function switchView(viewName, updateUrl = true) {
    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');

    // Profil Routing: Jika user bukan Admin, akses profil langsung menampilkan profil pribadi mereka sendiri
    if (viewName === 'profil-user' && !isAdmin) {
        viewName = 'profil-user-detail';
        if (state.currentUser && typeof window.openDetailProfilModal === 'function') {
            window.openDetailProfilModal(state.currentUser.namaLengkap, false);
        }
    } else if (viewName === 'profil-user-detail' && !isAdmin) {
        if (state.currentUser && typeof window.openDetailProfilModal === 'function') {
            window.openDetailProfilModal(state.currentUser.namaLengkap, false);
        }
    }

    // Role Guard: Studio Editor khusus Editor Video / Admin
    if (viewName === 'studio-editor' || viewName === 'studio-editor-detail') {
        const isEditor = state.isCurrentUserEditor();
        if (!isAdmin && !isEditor) {
            showCustomDialog({
                title: "Akses Dibatasi",
                message: "Menu Studio Editor hanya dapat diakses oleh Editor Video dan Administrator Sistem.",
                confirmText: "Mengerti"
            });
            return;
        }
    }

    // Role Guard: Studio Upload khusus Uploader / Admin
    if (viewName === 'studio-upload' || viewName === 'studio-upload-form') {
        const isUploader = state.isCurrentUserUploader();
        if (!isAdmin && !isUploader) {
            showCustomDialog({
                title: "Akses Dibatasi",
                message: "Menu Studio Upload hanya dapat diakses oleh Uploader dan Administrator Sistem.",
                confirmText: "Mengerti"
            });
            return;
        }
    }

    state.currentView = viewName;
    const views = getViewElements();
    Object.keys(views).forEach(k => {
        if (views[k]) {
            if (k === viewName) views[k].classList.add('active');
            else views[k].classList.remove('active');
        }
    });

    // Map sub-views to parent nav items
    const navViewMapping = {
        'content-plan-form': 'content-plan',
        'jurnal-kkn-form': 'jurnal-kkn',
        'jurnal-kkn-meta': 'jurnal-kkn',
        'jurnal-admin-edit': 'jurnal-kkn',
        'profil-user-detail': 'profil-user',
        'studio-upload-form': 'studio-upload',
        'studio-editor-detail': 'studio-editor'
    };
    const activeNav = navViewMapping[viewName] || viewName;

    document.querySelectorAll('.nav-item').forEach(el => {
        if (el.getAttribute('data-view') === activeNav) {
            el.classList.add('active');
            if (window.innerWidth <= 850 && typeof el.scrollIntoView === 'function') {
                const navContainer = el.closest('.bottom-nav');
                if (navContainer && navContainer.scrollWidth > navContainer.clientWidth) {
                    try {
                        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    } catch (err) {}
                }
            }
        } else {
            el.classList.remove('active');
        }
    });

    // Update browser URL if requested (Clean URL without /#/)
    if (updateUrl && VIEW_TO_PATH[viewName]) {
        try {
            const path = VIEW_TO_PATH[viewName];
            const isLocalFile = window.location.protocol === 'file:';
            const newUrl = isLocalFile ? ('#' + path) : path;
            if (window.location.pathname !== path && window.location.hash !== ('#' + path)) {
                window.history.pushState({ path, viewName }, '', newUrl);
            }
        } catch (e) {
            console.warn("history pushState error:", e);
        }
    }

    if (viewName === 'jurnal-kkn' && typeof window.renderJurnalKkn === 'function') {
        window.renderJurnalKkn();
    }

    if (viewName === 'profil-user' && typeof window.renderProfilUser === 'function') {
        window.renderProfilUser();
    }

    if (viewName === 'studio-editor' && typeof window.renderStudioEditor === 'function') {
        window.renderStudioEditor();
    }

    if (viewName === 'studio-upload' && typeof window.renderStudioUpload === 'function') {
        window.renderStudioUpload();
    }

    if (viewName === 'aset-video' && typeof window.renderAsetVideo === 'function') {
        window.renderAsetVideo();
    }

    // Matikan kamera jika pindah dari tab absensi
    if (viewName !== 'absensi' && typeof window.stopKamera === 'function') {
        window.stopKamera();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function navigateTo(target, replace = false) {
    if (!target) return;
    let path = target;
    let viewName = target;

    if (target.startsWith('/')) {
        path = target;
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        viewName = ROUTE_MAP[path] || 'dashboard';
    } else {
        viewName = target;
        path = VIEW_TO_PATH[viewName] || ('/' + viewName);
    }

    try {
        const isLocalFile = window.location.protocol === 'file:';
        const newUrl = isLocalFile ? ('#' + path) : path;
        if (replace) {
            window.history.replaceState({ path, viewName }, '', newUrl);
        } else if (window.location.pathname !== path && window.location.hash !== ('#' + path)) {
            window.history.pushState({ path, viewName }, '', newUrl);
        }
    } catch (e) {
        try { window.location.hash = '#' + path; } catch (err) {}
    }

    switchView(viewName, false);
}

export function handleRouteFromUrl() {
    let path = window.location.hash ? window.location.hash.replace(/^#/, '') : window.location.pathname;
    if (!path || path === '/' || path === '/index.html' || path.endsWith('.html')) path = '/dashboard';
    const cleanPath = path.split('?')[0];
    const targetView = ROUTE_MAP[cleanPath] || 'dashboard';
    if (state.currentUser) {
        switchView(targetView, false);
    }
}

export function initRouter() {
    window.switchView = switchView;
    window.navigateTo = navigateTo;
    window.handleRouteFromUrl = handleRouteFromUrl;

    window.addEventListener('popstate', handleRouteFromUrl);
    window.addEventListener('hashchange', handleRouteFromUrl);

    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.getAttribute('data-view')));
    });
}
