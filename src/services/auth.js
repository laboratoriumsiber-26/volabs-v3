// Authentication & Role Based Access Control (RBAC) Service
import { state } from '../store/state.js';
import { dataVolunteer } from '../store/initialData.js';
import { api } from './api.js';
import { showCustomDialog } from '../utils/dialog.js';

export function checkAuth() {
    const savedUser = localStorage.getItem('volabs_user');
    const loginScreen = document.getElementById('login-screen');
    if (savedUser) {
        document.documentElement.classList.add('user-logged-in');
        state.currentUser = JSON.parse(savedUser);
        state.currentUser.isUploader = state.isCurrentUserUploader();
        state.currentUser.isEditor = state.isCurrentUserEditor();
        if (loginScreen) loginScreen.style.display = 'none';
        applyRBAC();
    } else {
        document.documentElement.classList.remove('user-logged-in');
        if (loginScreen) loginScreen.style.display = 'flex';
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/login', false);
        }
    }
}

export function applyRBAC() {
    if (state.currentUser) {
        const fullName = state.currentUser.namaLengkap || state.currentUser.name || 'User';
        const firstName = fullName.split(' ')[0];
        const uNama = document.getElementById('user-nama');
        const uRole = document.getElementById('user-role');
        const sbNama = document.getElementById('sidebar-user-nama');
        const sbRole = document.getElementById('sidebar-user-role');
        if (uNama) uNama.textContent = firstName;
        if (uRole) uRole.textContent = state.currentUser.role;
        if (sbNama) sbNama.textContent = firstName;
        if (sbRole) sbRole.textContent = state.currentUser.role;

        const absNamaField = document.getElementById("abs-nama");
        if (absNamaField) {
            absNamaField.value = state.currentUser.namaLengkap;
            absNamaField.readOnly = true;
            absNamaField.style.backgroundColor = 'var(--bg-tertiary)';
            if (typeof window.handleAbsensiNama === 'function') window.handleAbsensiNama();
        }
        if (typeof window.initJurnalMetaFromUser === 'function') {
            window.initJurnalMetaFromUser();
        }
    }

    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    const isEditor = state.isCurrentUserEditor();
    const isUploader = state.isCurrentUserUploader();

    // Menu Profil User (Tampil di bottom nav & sidebar untuk semua user; Admin ke direktori, Mahasiswa ke profil sendiri)
    const navProfilUser = document.getElementById('nav-item-profil-user');
    const mobileServiceProfilUser = document.getElementById('mobile-service-profil-user');
    if (navProfilUser) {
        navProfilUser.classList.remove('role-hidden');
        navProfilUser.style.display = 'flex';
    }
    if (mobileServiceProfilUser) {
        mobileServiceProfilUser.classList.remove('role-hidden');
        mobileServiceProfilUser.style.display = 'flex';
    }

    // Menu Bank Material / Aset RAW Video (Universal untuk Seluruh Anggota Tim)
    const navAsetVideo = document.getElementById('nav-item-aset-video');
    const mobileAsetVideo = document.getElementById('mobile-service-aset-video');
    if (navAsetVideo) {
        navAsetVideo.classList.remove('role-hidden');
        navAsetVideo.style.display = 'flex';
    }
    if (mobileAsetVideo) {
        mobileAsetVideo.classList.remove('role-hidden');
        mobileAsetVideo.style.display = 'flex';
    }

    const canAccessEditor = !!(isAdmin || isEditor);
    const canAccessUploader = !!(isAdmin || isUploader);

    // Menu Studio Editor Video (Khusus Editor / Admin)
    const navStudioEditor = document.getElementById('nav-item-studio-editor');
    const mobileStudioEditor = document.getElementById('mobile-service-studio-editor');
    if (navStudioEditor) {
        navStudioEditor.classList.toggle('role-hidden', !canAccessEditor);
        navStudioEditor.style.display = canAccessEditor ? 'flex' : 'none';
        if (!canAccessEditor && (state.currentView === 'studio-editor' || state.currentView === 'studio-editor-detail') && typeof window.switchView === 'function') {
            window.switchView('dashboard');
        }
    }
    if (mobileStudioEditor) {
        mobileStudioEditor.classList.toggle('role-hidden', !canAccessEditor);
        mobileStudioEditor.style.display = canAccessEditor ? 'flex' : 'none';
    }

    // Menu Studio Upload (Khusus Uploader / Admin)
    const navStudioUpload = document.getElementById('nav-item-studio-upload');
    const mobileStudioUpload = document.getElementById('mobile-service-studio-upload');
    if (navStudioUpload) {
        navStudioUpload.classList.toggle('role-hidden', !canAccessUploader);
        navStudioUpload.style.display = canAccessUploader ? 'flex' : 'none';
        if (!canAccessUploader && (state.currentView === 'studio-upload' || state.currentView === 'studio-upload-form') && typeof window.switchView === 'function') {
            window.switchView('dashboard');
        }
    }
    if (mobileStudioUpload) {
        mobileStudioUpload.classList.toggle('role-hidden', !canAccessUploader);
        mobileStudioUpload.style.display = canAccessUploader ? 'flex' : 'none';
    }

    // Jurnal KKN Admin Controls
    const jurnalScopeTabs = document.getElementById('jurnal-admin-scope-tabs');
    const filterJurnalMhs = document.getElementById('filter-jurnal-mahasiswa');
    if (jurnalScopeTabs) {
        jurnalScopeTabs.style.display = isAdmin ? 'block' : 'none';
    }
    if (filterJurnalMhs) {
        filterJurnalMhs.style.display = (isAdmin && state.currentJurnalScope === 'all') ? 'inline-block' : 'none';
    }
    if (isAdmin && typeof window.populateJurnalMahasiswaOptions === 'function') {
        window.populateJurnalMahasiswaOptions();
    }

    const filterLaporPic = document.getElementById('filter-lapor-pic');
    if (filterLaporPic) {
        if (!isAdmin && state.currentUser) {
            if (!Array.from(filterLaporPic.options).some(opt => opt.value === state.currentUser.namaLengkap)) {
                let opt = document.createElement('option');
                opt.value = state.currentUser.namaLengkap;
                opt.textContent = state.currentUser.namaLengkap;
                filterLaporPic.appendChild(opt);
            }
            filterLaporPic.value = state.currentUser.namaLengkap;
            filterLaporPic.disabled = true;
            filterLaporPic.style.backgroundColor = 'var(--bg-tertiary)';
        } else {
            filterLaporPic.disabled = false;
            filterLaporPic.style.backgroundColor = 'var(--bg-secondary)';
        }
        if (typeof window.renderPelaporan === 'function') window.renderPelaporan();
    }

    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderContentPlan === 'function') window.renderContentPlan();
    if (typeof window.renderKanban === 'function') window.renderKanban();
    if (typeof window.renderAbsensi === 'function') window.renderAbsensi();
    if (typeof window.updateApprovalBadge === 'function') window.updateApprovalBadge();
    if (typeof window.renderAsetVideo === 'function') window.renderAsetVideo();
}

export function togglePassword() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('eye-icon');
    if (!input || !icon) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';
    } else {
        input.type = 'password';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
    }
}

export function showBannerAlert(message) {
    let banner = document.getElementById('login-banner-alert');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'login-banner-alert';
        banner.className = 'banner-alert';
        banner.innerHTML = `
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
            <span></span>
        `;
        document.body.appendChild(banner);
    }
    banner.querySelector('span').innerText = message;
    setTimeout(() => banner.classList.add('show'), 10);
    setTimeout(() => banner.classList.remove('show'), 3000);
}

export async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.getElementById('btn-login');
    const userEl = document.getElementById('login-username');
    const passEl = document.getElementById('login-password');
    const userVal = userEl ? userEl.value.trim() : '';
    const passVal = passEl ? passEl.value.trim() : '';

    if (!userVal) {
        showCustomDialog({ title: "Peringatan", message: "Kolom Username masih kosong!", confirmText: "Mengerti" });
        if (userEl) userEl.focus();
        return;
    }
    if (!passVal) {
        showCustomDialog({ title: "Peringatan", message: "Kolom Password masih kosong!", confirmText: "Mengerti" });
        if (passEl) passEl.focus();
        return;
    }

    if (btn) {
        btn.innerHTML = '<span class="spinner" style="border-color:#fff; border-bottom-color:transparent; width:16px; height:16px;"></span> Memverifikasi...';
        btn.disabled = true;
    }

    // 1. Validasi Akun Instan (Zero Latency)
    const lowerUser = userVal.toLowerCase();
    let matchedUser = null;
    if (lowerUser === 'admin' && passVal === 'admin123') {
        matchedUser = {
            id: 'U-001',
            username: 'admin',
            role: 'Super Admin',
            namaLengkap: 'Administrator Sistem',
            kelompok: '-',
            nim: '-',
            fakultas: '-',
            jurusan: '-',
            smt: '-',
            wa: '-',
            divisi: 'Administrator',
            isUploader: true,
            isEditor: true
        };
    } else {
        const normalize = s => (s || '').toLowerCase().replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim();
        const normUser = normalize(userVal);
        for (const [name, d] of Object.entries(dataVolunteer)) {
            const matchNim = d.nim && String(d.nim).trim() === userVal;
            const matchName = normalize(name) === normUser;
            if ((matchNim || matchName) && (passVal === `${d.nim}pipd` || passVal === 'pipd123' || passVal === 'volabs123')) {
                matchedUser = {
                    id: `U-${d.nim}`,
                    username: d.nim,
                    role: 'Mahasiswa',
                    namaLengkap: name,
                    kelompok: 'PIPD',
                    nim: d.nim,
                    fakultas: d.fak || '-',
                    jurusan: d.jur || '-',
                    smt: d.smt || '-',
                    wa: d.wa || '-',
                    divisi: d.div || '',
                    isUploader: state.isUserUploader(name),
                    isEditor: state.isUserEditor(name)
                };
                break;
            }
        }
    }

    if (matchedUser) {
        state.currentUser = matchedUser;
        matchedUser.isUploader = state.isCurrentUserUploader();
        matchedUser.isEditor = state.isCurrentUserEditor();
        localStorage.setItem('volabs_user', JSON.stringify(matchedUser));
        checkAuth();
        if (btn) {
            btn.innerHTML = 'Masuk Sekarang';
            btn.disabled = false;
        }
        showBannerAlert('Selamat datang, ' + matchedUser.namaLengkap);
        if (typeof window.navigateTo === 'function') window.navigateTo('/dashboard');
        if (typeof window.refreshData === 'function') window.refreshData();
        return;
    }

    // 2. Fallback ke Google Apps Script API jika akun tidak ada di dataVolunteer
    try {
        if (api && api.isConfigured()) {
            const loginUrl = `${api.apiUrl}?action=login&username=${encodeURIComponent(userVal)}&password=${encodeURIComponent(passVal)}&t=${Date.now()}`;
            const response = await fetch(loginUrl, { cache: "no-store" });
            const result = await response.json();
            if (result.status === "success") {
                if (state.isUserUploader(result.user.namaLengkap)) {
                    result.user.isUploader = true;
                }
                if (state.isUserEditor(result.user.namaLengkap)) {
                    result.user.isEditor = true;
                }
                localStorage.setItem('volabs_user', JSON.stringify(result.user));
                state.currentUser = result.user;
                checkAuth();
                if (btn) {
                    btn.innerHTML = 'Masuk Sekarang';
                    btn.disabled = false;
                }
                showBannerAlert('Selamat datang, ' + result.user.namaLengkap);
                if (typeof window.navigateTo === 'function') window.navigateTo('/dashboard');
                if (typeof window.refreshData === 'function') window.refreshData();
                return;
            }
        }
        if (btn) {
            btn.innerHTML = 'Masuk Sekarang';
            btn.disabled = false;
        }
        showCustomDialog({ title: "Login Gagal", message: 'Username atau password salah!', confirmText: "Tutup" });
    } catch (err) {
        if (btn) {
            btn.innerHTML = 'Masuk Sekarang';
            btn.disabled = false;
        }
        showCustomDialog({ title: "Login Gagal", message: 'Username atau password salah!', confirmText: "Tutup" });
    }
}

export function logout() {
    localStorage.removeItem('volabs_user');
    document.documentElement.classList.remove('user-logged-in');
    state.currentUser = null;
    window.lastNotifiedCollabCount = 0;
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (typeof window.navigateTo === 'function') window.navigateTo('/login');
    showCustomDialog({ title: "Logout", message: 'Anda telah keluar dari sesi.', confirmText: "Tutup" });
}
