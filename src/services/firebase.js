// Firebase Cloud Firestore Service for VoLABS PIPD
import { state } from '../store/state.js';

// Default Firebase Configuration
// Dapat disesuaikan langsung di sini atau melalui localStorage 'volabs_firebase_config'
export const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBgYq7GQi_T8faQlHDTwiPbu--AXWmtQHE",
    authDomain: "volabs-3540a.firebaseapp.com",
    projectId: "volabs-3540a",
    storageBucket: "volabs-3540a.firebasestorage.app",
    messagingSenderId: "443981213348",
    appId: "1:443981213348:web:8ec75ee3755aa9eebfc031",
    measurementId: "G-9KY2PQV5RR"
};

export function getActiveFirebaseConfig() {
    try {
        const stored = localStorage.getItem('volabs_firebase_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.projectId && parsed.projectId !== "YOUR_PROJECT_ID") {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Notice parsing stored firebase config:", e);
    }
    return DEFAULT_FIREBASE_CONFIG;
}

export const FIREBASE_CONFIG = getActiveFirebaseConfig();

export let db = null;
let listenersInitialized = false;

export function initFirebase() {
    try {
        const activeConfig = getActiveFirebaseConfig();
        if (typeof firebase !== 'undefined' && activeConfig.apiKey && activeConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
            if (!firebase.apps.length) {
                firebase.initializeApp(activeConfig);
            }
            db = firebase.firestore();
            if (typeof firebase.analytics === 'function' && activeConfig.measurementId) {
                try {
                    firebase.analytics();
                } catch (anErr) {
                    console.log("Firebase Analytics notice:", anErr);
                }
            }
            console.log("Firebase Cloud Firestore berhasil terhubung ke project:", activeConfig.projectId);
            setupFirebaseListeners();
            return true;
        } else {
            console.log("Firebase Firestore belum dikonfigurasi. Menggunakan penyimpanan lokal cepat (Offline/Local Cache Ready).");
            return false;
        }
    } catch (err) {
        console.warn("Firebase Init Notice:", err);
        return false;
    }
}

// Global Helper untuk Menyimpan & Merestart Firebase Config secara dinamis
export function setFirebaseConfig(newConfig) {
    if (!newConfig || !newConfig.projectId) return false;
    localStorage.setItem('volabs_firebase_config', JSON.stringify(newConfig));
    window.location.reload();
    return true;
}
window.setFirebaseConfig = setFirebaseConfig;

// =========================================================================
// Real-time Firestore Listeners
// =========================================================================
export function setupFirebaseListeners() {
    if (!db || listenersInitialized) return;
    listenersInitialized = true;

    try {
        // 1. Sinkronisasi Global Peran Uploader
        db.collection('app_settings').doc('uploaders').onSnapshot((doc) => {
            if (doc.exists && doc.data() && Array.isArray(doc.data().list)) {
                const list = doc.data().list;
                localStorage.setItem('volabs_uploaders_list', JSON.stringify(list));
                if (state.currentUser) {
                    state.currentUser.isUploader = state.isCurrentUserUploader();
                    localStorage.setItem('volabs_user', JSON.stringify(state.currentUser));
                    if (typeof window.applyRBAC === 'function') window.applyRBAC();
                }
                if (state.currentView === 'profil-user' && typeof window.renderProfilUser === 'function') {
                    window.renderProfilUser();
                }
            }
        }, (err) => console.log("Firestore uploader listener notice:", err));

        // 2. Sinkronisasi Global Peran Editor
        db.collection('app_settings').doc('editors').onSnapshot((doc) => {
            if (doc.exists && doc.data() && Array.isArray(doc.data().list)) {
                const list = doc.data().list;
                localStorage.setItem('volabs_editors_list', JSON.stringify(list));
                if (state.currentUser) {
                    state.currentUser.isEditor = state.isCurrentUserEditor();
                    localStorage.setItem('volabs_user', JSON.stringify(state.currentUser));
                    if (typeof window.applyRBAC === 'function') window.applyRBAC();
                }
                if (state.currentView === 'profil-user' && typeof window.renderProfilUser === 'function') {
                    window.renderProfilUser();
                }
            }
        }, (err) => console.log("Firestore editor listener notice:", err));

        // 3. Sinkronisasi Real-time Konten Plan
        db.collection('content_plans').onSnapshot((snapshot) => {
            const remotePlans = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!String(doc.id).toLowerCase().includes('dummy') && !String(data.Judul || '').toLowerCase().includes('dummy sample')) {
                    remotePlans.push({ ID: doc.id, ...data });
                }
            });
            state.contentPlans = remotePlans;
            localStorage.setItem('volabs_cached_content_plans', JSON.stringify(remotePlans));
            if (typeof window.renderFilteredContent === 'function') window.renderFilteredContent();
            if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
            if (typeof window.renderKanban === 'function') window.renderKanban();
            if (typeof window.renderPelaporan === 'function') window.renderPelaporan();
            if (typeof window.updateApprovalBadge === 'function') window.updateApprovalBadge();
        }, (err) => console.log("Firestore content plans notice:", err));

        // 4. Sinkronisasi Real-time Tugas Studio Video & Editing
        db.collection('studio_tasks').onSnapshot((snapshot) => {
            const remoteTasks = [];
            snapshot.forEach(doc => {
                if (doc.id !== 'ET-1001' && doc.id !== 'ET-1002') {
                    remoteTasks.push({ id: doc.id, ...doc.data() });
                }
            });
            state.allEditorTasks = remoteTasks;
            localStorage.setItem('volabs_editor_tasks', JSON.stringify(remoteTasks));
            if (state.currentView === 'studio-editor' && typeof window.renderStudioEditor === 'function') window.renderStudioEditor();
            if (state.currentView === 'studio-upload' && typeof window.renderStudioUpload === 'function') window.renderStudioUpload();
            if (state.currentView === 'pelaporan' && typeof window.renderPelaporan === 'function') window.renderPelaporan();
        }, (err) => console.log("Firestore studio tasks notice:", err));

        // 5. Sinkronisasi Real-time Absensi
        db.collection('absensi').orderBy('timestamp', 'desc').limit(100).onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!String(doc.id).toLowerCase().includes('dummy') && !String(data.nama || '').toLowerCase().includes('dummy')) {
                    list.push({ id: doc.id, ...data });
                }
            });
            state.absensiList = list;
            window.todayAbsensiList = list;
            localStorage.setItem('volabs_cached_absensi', JSON.stringify(list));
            if (typeof window.renderTodayAbsensiList === 'function') {
                window.renderTodayAbsensiList(list);
            }
        }, (err) => console.log("Firestore absensi notice:", err));

        // 6. Sinkronisasi Real-time Jurnal KKN
        db.collection('jurnal_kkn').onSnapshot((snapshot) => {
            const jurnals = [];
            snapshot.forEach(doc => {
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
            if (typeof window.syncJurnalFromFirestore === 'function') {
                window.syncJurnalFromFirestore(jurnals);
            }
        }, (err) => console.log("Firestore jurnal notice:", err));

        // 7. Sinkronisasi Real-time Bank Material & Aset RAW Video
        db.collection('app_settings').doc('aset_video').onSnapshot((doc) => {
            const dummyIds = ['ASET-101', 'ASET-102', 'ASET-103', 'ASET-104', 'ASET-105'];
            let list = (doc.exists && doc.data() && Array.isArray(doc.data().list)) ? doc.data().list : [];
            list = list.filter(a => !dummyIds.includes(a.id) && !String(a.driveUrl || '').includes('sample-'));
            localStorage.setItem('volabs_aset_video_list', JSON.stringify(list));
            state.asetVideoList = list;
            if (state.currentView === 'aset-video' && typeof window.renderAsetVideo === 'function') {
                window.renderAsetVideo();
            }
        }, (err) => console.log("Firestore aset video notice:", err));

        // Proactive purge of legacy dummy documents in Firestore
        try {
            db.collection('studio_tasks').doc('ET-1001').delete().catch(() => {});
            db.collection('studio_tasks').doc('ET-1002').delete().catch(() => {});
        } catch (e) {}
    } catch (e) {
        console.warn("Firestore listeners error:", e);
    }
}

// =========================================================================
// Firestore CRUD Helpers
// =========================================================================

// --- Content Plans ---
export async function saveContentPlan(item) {
    if (!item) return false;
    const docId = String(item.ID || `CP-${Date.now()}`);
    item.ID = docId;
    item.updatedAt = new Date().toISOString();
    if (!item.createdAt) item.createdAt = new Date().toISOString();

    // Update local state immediately for 0ms latency
    const idx = state.contentPlans.findIndex(c => String(c.ID) === docId);
    if (idx !== -1) {
        state.contentPlans[idx] = { ...state.contentPlans[idx], ...item };
    } else {
        state.contentPlans.unshift(item);
    }
    localStorage.setItem('volabs_cached_content_plans', JSON.stringify(state.contentPlans));

    if (db) {
        try {
            await db.collection('content_plans').doc(docId).set(item, { merge: true });
            return true;
        } catch (err) {
            console.error("Firestore saveContentPlan error:", err);
        }
    }
    return true;
}

export async function deleteContentPlan(id) {
    if (!id) return false;
    const docId = String(id);
    const idx = state.contentPlans.findIndex(c => String(c.ID) === docId);
    if (idx !== -1) {
        state.contentPlans.splice(idx, 1);
        localStorage.setItem('volabs_cached_content_plans', JSON.stringify(state.contentPlans));
    }
    if (db) {
        try {
            await db.collection('content_plans').doc(docId).delete();
            return true;
        } catch (err) {
            console.error("Firestore deleteContentPlan error:", err);
        }
    }
    return true;
}

// --- Studio Tasks (Video Editing & Upload) ---
export async function saveStudioTask(task) {
    if (!task) return false;
    const taskId = String(task.id || `ET-${Date.now()}`);
    task.id = taskId;
    task.updatedAt = new Date().toISOString();
    if (!task.createdAt) task.createdAt = new Date().toISOString();

    const tasks = state.allEditorTasks || [];
    const idx = tasks.findIndex(t => String(t.id) === taskId);
    if (idx !== -1) tasks[idx] = { ...tasks[idx], ...task };
    else tasks.unshift(task);

    state.allEditorTasks = tasks;
    localStorage.setItem('volabs_editor_tasks', JSON.stringify(tasks));

    if (db) {
        try {
            await db.collection('studio_tasks').doc(taskId).set(task, { merge: true });
            return true;
        } catch (err) {
            console.error("Firestore saveStudioTask error:", err);
        }
    }
    return true;
}

export async function deleteStudioTask(id) {
    if (!id) return false;
    const taskId = String(id);
    state.allEditorTasks = (state.allEditorTasks || []).filter(t => String(t.id) !== taskId);
    localStorage.setItem('volabs_editor_tasks', JSON.stringify(state.allEditorTasks));

    if (db) {
        try {
            await db.collection('studio_tasks').doc(taskId).delete();
            return true;
        } catch (err) {
            console.error("Firestore deleteStudioTask error:", err);
        }
    }
    return true;
}

// --- Absensi ---
export async function saveAbsensiEntry(data) {
    if (!data) return false;
    const now = new Date();
    const entryId = `ABS-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;
    const fullEntry = {
        id: entryId,
        nama: data.nama || '',
        nim: data.nim || '',
        jabatan: data.jabatan || '',
        divisi: data.divisi || data.jabatan || '',
        semester: data.semester || '',
        fakultas: data.fakultas || '',
        jurusan: data.jurusan || '',
        wa: data.wa || '',
        foto: data.foto || '',
        lat: data.lat || '-',
        lon: data.lon || '-',
        lokasi: data.lokasi || '-',
        notulensi: data.notulensi || '',
        waktu: data.waktu || now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        tanggal: data.tanggal || now.toISOString().split('T')[0],
        timestamp: firebase?.firestore?.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : now.getTime(),
        createdAt: now.toISOString()
    };

    // Update local cache
    const currentList = state.absensiList || [];
    currentList.unshift(fullEntry);
    state.absensiList = currentList;
    window.todayAbsensiList = currentList;
    localStorage.setItem('volabs_cached_absensi', JSON.stringify(currentList));

    if (db) {
        try {
            await db.collection('absensi').doc(entryId).set(fullEntry);
            return fullEntry;
        } catch (err) {
            console.error("Firestore saveAbsensiEntry error:", err);
        }
    }
    return fullEntry;
}

export async function getAbsensiList() {
    if (state.absensiList && state.absensiList.length > 0) {
        return state.absensiList;
    }
    if (db) {
        try {
            const snap = await db.collection('absensi').orderBy('timestamp', 'desc').limit(100).get();
            if (!snap.empty) {
                const list = [];
                snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
                state.absensiList = list;
                window.todayAbsensiList = list;
                localStorage.setItem('volabs_cached_absensi', JSON.stringify(list));
                return list;
            }
        } catch (err) {
            console.warn("Firestore getAbsensiList warning:", err);
        }
    }
    try {
        const cached = JSON.parse(localStorage.getItem('volabs_cached_absensi') || '[]');
        state.absensiList = cached;
        window.todayAbsensiList = cached;
        return cached;
    } catch (e) {
        return [];
    }
}

// --- Jurnal KKN ---
export async function saveJurnalEntry(entry) {
    if (!entry) return false;
    const entryId = String(entry.id || `JRN-${Date.now()}`);
    entry.id = entryId;
    entry.updatedAt = new Date().toISOString();
    if (!entry.createdAt) entry.createdAt = new Date().toISOString();

    if (db) {
        try {
            await db.collection('jurnal_kkn').doc(entryId).set(entry, { merge: true });
            return true;
        } catch (err) {
            console.error("Firestore saveJurnalEntry error:", err);
        }
    }
    return true;
}

export async function deleteJurnalEntry(id) {
    if (!id) return false;
    const docId = String(id);
    if (db) {
        try {
            await db.collection('jurnal_kkn').doc(docId).delete();
            return true;
        } catch (err) {
            console.error("Firestore deleteJurnalEntry error:", err);
        }
    }
    return true;
}

// --- App Settings (Uploaders, Editors, Aset Video) ---
export async function saveAsetVideoList(list) {
    if (!Array.isArray(list)) return false;
    state.asetVideoList = list;
    localStorage.setItem('volabs_aset_video_list', JSON.stringify(list));
    if (db) {
        try {
            await db.collection('app_settings').doc('aset_video').set({ list: list, updatedAt: new Date().toISOString() });
            return true;
        } catch (err) {
            console.error("Firestore saveAsetVideoList error:", err);
        }
    }
    return true;
}
