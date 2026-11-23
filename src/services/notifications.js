// Notification Service for VoLABS PIPD
// Supports:
// 1. Firebase Firestore Real-Time Broadcasts & Announcements (Pengumuman Sistem)
// 2. Studio Task Assignment & Deadline Alerts (Notifikasi Tugas Editor & Upload)
// 3. Web Push API / Service Worker Background Notifications with FCM VAPID Key

import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import { db, FIREBASE_CONFIG } from './firebase.js';
import { state } from '../store/state.js';
import { showCustomDialog } from '../utils/dialog.js';

let notificationSound = null;
let lastKnownTaskIds = new Set();
let broadcastListenerActive = false;
let tasksListenerActive = false;
let messagingInstance = null;

// Play sound safely
export function playNotificationTone() {
    try {
        if (!notificationSound) {
            // Web Audio API beep sound without external audio files
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch (e) {
        // AudioContext may be restricted before user gesture
    }
}

// Show native Android / System notification (muncul di Notification Bar / Tray HP)
export function showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const origin = window.location.origin || '';
        const notifOptions = {
            icon: origin + '/icon-192.png',
            badge: origin + '/icon-192.png',
            image: options.image || undefined,
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            tag: options.tag || 'volabs-notification-' + Date.now(),
            renotify: true,
            silent: false,
            ...options
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                if (reg && reg.showNotification) {
                    reg.showNotification(title, notifOptions).catch(err => {
                        console.warn("SW showNotification fallback to new Notification:", err);
                        try { new Notification(title, notifOptions); } catch (e) { }
                    });
                } else {
                    try { new Notification(title, notifOptions); } catch (e) { }
                }
            }).catch(() => {
                try { new Notification(title, notifOptions); } catch (e) { }
            });
        } else {
            try { new Notification(title, notifOptions); } catch (e) { }
        }
    }
}

// Request Notification Permission & Generate FCM Token
export const FIREBASE_VAPID_KEY = (import.meta.env && import.meta.env.VITE_FIREBASE_VAPID_KEY) || "BJIPx34xou1o0w5WWt20o5P_cnceWg5rc7jHRierjKg7FGcLpTW0eN0ZUC7Y58PwO7VE6JRn6IO8DDnRj9DNyIc";

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showInAppToast('Notifikasi Berhasil Diaktifkan!', 'Anda akan menerima pemberitahuan tugas & pengumuman.', 'success');
            // Ambil token FCM dan simpan ke Firestore
            await initializeFcmToken();
        }
        return permission;
    } catch (e) {
        console.warn("Notification request permission notice:", e);
        return Notification.permission;
    }
}

// Inisialisasi token FCM Web Push
export async function initializeFcmToken() {
    try {
        if (!firebase.messaging.isSupported()) {
            console.log("Firebase messaging is not supported in this browser environment.");
            saveUserDeviceInfo(null);
            return null;
        }

        if (!messagingInstance) {
            messagingInstance = firebase.messaging();
        }

        // Ambil service worker registration yang aktif
        let swRegistration = null;
        if ('serviceWorker' in navigator) {
            swRegistration = await navigator.serviceWorker.ready;
        }

        const token = await messagingInstance.getToken({
            vapidKey: FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: swRegistration
        });

        if (token) {
            console.log("FCM Device Token berhasil diperoleh:", token.substring(0, 15) + "...");
            await saveUserDeviceInfo(token);
        }

        // Handle foreground messages dari FCM
        messagingInstance.onMessage((payload) => {
            console.log("FCM Foreground Message received:", payload);
            const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'VoLABS PIPD';
            const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || 'Pembaruan sistem baru.';
            showInAppToast(title, body, 'info');
        });

        return token;
    } catch (err) {
        console.warn("FCM getToken notice:", err);
        saveUserDeviceInfo(null);
        return null;
    }
}

// Save device info & FCM token for user / device
async function saveUserDeviceInfo(fcmToken = null) {
    if (!db) return;
    try {
        let deviceKey = '';
        if (state.currentUser) {
            deviceKey = state.currentUser.username || state.currentUser.nim || 'user';
        } else if (fcmToken) {
            // Jika belum login, gunakan potongan token unik sebagai ID perangkat
            deviceKey = 'anon_' + fcmToken.substring(fcmToken.length - 20);
        } else {
            return;
        }

        const payload = {
            username: state.currentUser ? (state.currentUser.username || state.currentUser.nim || 'user') : 'guest',
            nama: state.currentUser ? (state.currentUser.namaLengkap || state.currentUser.nama || '') : 'Guest / Belum Login',
            role: state.currentUser ? (state.currentUser.role || '') : 'guest',
            notificationPermission: Notification.permission || 'default',
            lastActive: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        if (fcmToken) {
            payload.fcmToken = fcmToken;
        }
        await db.collection('user_devices').doc(deviceKey).set(payload, { merge: true });
    } catch (e) {
        console.warn("Save device info notice:", e);
    }
}

// In-App Toast Alert UI
export function showInAppToast(title, message, type = 'info', actionCallback = null) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 380px;
            width: calc(100% - 40px);
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification-card';
    toast.style.cssText = `
        background: var(--bg-primary, #ffffff);
        color: var(--text-primary, #1e293b);
        border: 1px solid var(--border-color, #e2e8f0);
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : type === 'task' ? '#8b5cf6' : '#BC305F'};
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        pointer-events: auto;
        animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: ${actionCallback ? 'pointer' : 'default'};
        font-family: inherit;
    `;

    const iconSvg = type === 'task'
        ? `<svg style="width:20px;height:20px;color:#8b5cf6;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>`
        : `<svg style="width:20px;height:20px;color:#BC305F;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>`;

    toast.innerHTML = `
        ${iconSvg}
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 13.5px; margin-bottom: 2px;">${title}</div>
            <div style="font-size: 12px; color: var(--text-secondary, #64748b); line-height: 1.4;">${message}</div>
        </div>
        <button type="button" style="background:transparent;border:none;color:var(--text-muted,#94a3b8);cursor:pointer;padding:0;display:flex;" onclick="this.parentElement.remove()">
            <svg style="width:14px;height:14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `;

    if (actionCallback) {
        toast.onclick = (e) => {
            if (!e.target.closest('button')) {
                actionCallback();
                toast.remove();
            }
        };
    }

    container.appendChild(toast);
    playNotificationTone();

    // Auto remove after 6 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 6000);
}

// -------------------------------------------------------------
// FITUR 2: BROADCAST & PENGUMUMAN SISTEM DARI ADMIN KE SELURUH RELAWAN
// -------------------------------------------------------------
export async function sendBroadcastAnnouncement({ judul, pesan, tipe = 'info', target = 'all' }) {
    if (!db) return false;
    const adminUser = state.currentUser ? (state.currentUser.namaLengkap || state.currentUser.username || 'Admin') : 'Admin';
    const docId = `BC-${Date.now()}`;
    const payload = {
        id: docId,
        judul: judul.trim(),
        pesan: pesan.trim(),
        tipe: tipe, // 'info', 'penting', 'agenda'
        target: target, // 'all', 'editor', 'volunteer'
        pengirim: adminUser,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection('broadcasts').doc(docId).set(payload);

        // Ambil semua token FCM relawan yang terdaftar di Firestore user_devices
        try {
            const devSnap = await db.collection('user_devices').get();
            const fcmTokens = [];
            devSnap.forEach(doc => {
                const d = doc.data();
                if (d && d.fcmToken && String(d.fcmToken).length > 20) {
                    fcmTokens.push(String(d.fcmToken).trim());
                }
            });

            // Tembak FCM via Google Apps Script (GAS) agar HP tertutup langsung berdering
            if (fcmTokens.length > 0) {
                dispatchPushViaGas({
                    title: `Pengumuman: ${judul.trim()}`,
                    body: pesan.trim(),
                    url: '/',
                    tokens: fcmTokens
                });
            }
        } catch (fcmErr) {
            console.warn("Notice collecting FCM tokens:", fcmErr);
        }

        return true;
    } catch (err) {
        console.error("Gagal mengirim broadcast:", err);
        throw err;
    }
}

// Helper untuk memanggil Google Apps Script FCM Dispatcher di latar belakang
export function dispatchPushViaGas({ title, body, url = '/', tokens = [] }) {
    try {
        const gasUrl = (import.meta.env && import.meta.env.VITE_APPS_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbz-sejP6KGFlssbss1npzZbS_6at7l-ddx4YclcJai-fFbHGZaxG81CKYXYRcwuH7x0/exec";
        if (!gasUrl || !tokens || tokens.length === 0) return;

        fetch(gasUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "send_fcm_push",
                title: title,
                body: body,
                url: url,
                tokens: tokens
            })
        }).then(() => {
            console.log("FCM Push dispatched to GAS for", tokens.length, "devices.");
        }).catch(e => console.warn("GAS FCM Push dispatch notice:", e));
    } catch (e) {
        console.warn("dispatchPushViaGas error:", e);
    }
}

export function listenToBroadcastAnnouncements() {
    if (!db || broadcastListenerActive) return;
    broadcastListenerActive = true;

    // Listen only to broadcasts created after session start or within last 24h
    const sessionStart = Date.now() - (60 * 1000); // 1 min buffer
    const seenBroadcasts = new Set(JSON.parse(localStorage.getItem('volabs_seen_broadcasts') || '[]'));

    db.collection('broadcasts')
        .orderBy('timestamp', 'desc')
        .limit(15)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const bId = change.doc.id;
                    if (!seenBroadcasts.has(bId)) {
                        seenBroadcasts.add(bId);
                        localStorage.setItem('volabs_seen_broadcasts', JSON.stringify([...seenBroadcasts].slice(-50)));

                        // Only notify actively if reasonably recent
                        if (data.timestamp && data.timestamp > sessionStart) {
                            showInAppToast(
                                `Pengumuman: ${data.judul || 'Informasi Penting'}`,
                                `${data.pesan || ''}`,
                                data.tipe === 'penting' ? 'warning' : 'info',
                                () => showBroadcastModalDetail(data)
                            );
                            showBrowserNotification(`Pengumuman: ${data.judul || 'VoLabs PIPD'}`, {
                                body: data.pesan || 'Buka aplikasi untuk melihat informasi lengkap.',
                                data: { url: '/' }
                            });
                        }
                    }
                }
            });
        }, (err) => console.log("Broadcast listener notice:", err));
}

export function showBroadcastModalDetail(data) {
    if (!window.showCustomDialog) return;
    const tgl = data.createdAt ? new Date(data.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : 'Hari ini';
    window.showCustomDialog({
        title: `Pengumuman: ${data.judul || 'Informasi'}`,
        message: `
            <div style="font-size: 13.5px; line-height: 1.6; color: var(--text-primary);">
                <div style="margin-bottom: 8px; font-size: 11.5px; color: var(--text-muted);">
                    Pengirim: <b>${data.pengirim || 'Admin'}</b> • ${tgl}
                </div>
                <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; border-left: 3px solid var(--primary); white-space: pre-wrap;">${data.pesan}</div>
            </div>
        `,
        confirmText: "Tutup"
    });
}

// -------------------------------------------------------------
// FITUR 3: NOTIFIKASI PENUGASAN STUDIO VIDEO & EDITING
// -------------------------------------------------------------
export function listenToStudioTaskAssignments() {
    if (!db || tasksListenerActive) return;
    tasksListenerActive = true;

    // Cache initial tasks to only detect new assignments or deadline alerts
    const stored = JSON.parse(localStorage.getItem('volabs_notified_task_ids') || '[]');
    lastKnownTaskIds = new Set(stored);

    db.collection('studio_tasks').onSnapshot((snapshot) => {
        const currentUser = state.currentUser;
        if (!currentUser) return;
        const currentName = (currentUser.namaLengkap || currentUser.nama || currentUser.username || '').toLowerCase().trim();
        const currentRole = currentUser.role || '';

        snapshot.docChanges().forEach((change) => {
            const task = change.doc.data();
            const taskId = change.doc.id;

            if (taskId === 'ET-1001' || taskId === 'ET-1002') return;

            const assignedTo = (task.editorName || task.editor || task.assignedTo || '').toLowerCase().trim();
            const isForMe = assignedTo && (assignedTo === currentName || currentName.includes(assignedTo) || assignedTo.includes(currentName));

            if (change.type === 'added' && !lastKnownTaskIds.has(taskId)) {
                lastKnownTaskIds.add(taskId);
                localStorage.setItem('volabs_notified_task_ids', JSON.stringify([...lastKnownTaskIds].slice(-100)));

                // If added task is assigned to current logged-in editor/volunteer
                if (isForMe || currentRole === 'Super Admin' || currentRole === 'Admin') {
                    const prefix = isForMe ? 'Penugasan Video Baru' : `Penugasan Editor: ${task.editorName || 'Belum ada PIC'}`;
                    const deadlineStr = task.deadline ? ` (Tenggat: ${task.deadline})` : '';

                    showInAppToast(
                        prefix,
                        `${task.judul || task.title || 'Materi Video'}${deadlineStr}`,
                        'task',
                        () => {
                            if (window.switchView) window.switchView('studio-editor');
                        }
                    );

                    showBrowserNotification(prefix, {
                        body: `${task.judul || 'Materi Video Baru'}${deadlineStr}`,
                        data: { url: '/studio-editor' }
                    });
                }
            } else if (change.type === 'modified' && isForMe) {
                // If status changed or updated
                if (task.status === 'Revisi' || task.status === 'Review') {
                    showInAppToast(
                        `Pembaruan Status Tugas: ${task.status}`,
                        `Materi video "${task.judul || 'Video'}" telah diperbarui statusnya menjadi ${task.status}.`,
                        'warning',
                        () => {
                            if (window.switchView) window.switchView('studio-editor');
                        }
                    );
                    showBrowserNotification(`Pembaruan Status: ${task.status}`, {
                        body: `Tugas "${task.judul || 'Video'}" memerlukan perhatian Anda.`,
                        data: { url: '/studio-editor' }
                    });
                }
            }
        });
    }, (err) => console.log("Studio task notification notice:", err));
}

// -------------------------------------------------------------
// MODAL DIALOG PENGIRIMAN BROADCAST OLEH ADMIN
// -------------------------------------------------------------
export function openBroadcastModal() {
    const isUserAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');
    if (!isUserAdmin) {
        if (window.showCustomDialog) {
            window.showCustomDialog({
                title: "Akses Dibatasi",
                message: "Hanya Administrator Sistem dan DPL yang dapat mengirim pengumuman siaran ke relawan.",
                confirmText: "Mengerti"
            });
        }
        return;
    }

    let modal = document.getElementById('modal-broadcast');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-broadcast';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '99998';
        modal.innerHTML = `
            <div class="modal-box" style="max-width: 480px;">
                <div class="modal-header">
                    <h3 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                        <svg style="width:20px;height:20px;color:var(--primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                        Kirim Pengumuman / Broadcast
                    </h3>
                    <button class="btn-close" onclick="closeBroadcastModal()" title="Tutup">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="modal-body" style="padding-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.85rem;">
                    <div>
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Judul Pengumuman <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="bc-input-title" class="form-input" placeholder="Contoh: Rapat Koordinasi Mingguan / Deadline Konten" autocomplete="off">
                    </div>
                    <div>
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Prioritas / Tipe</label>
                        <select id="bc-select-type" class="form-select">
                            <option value="info">Info Umum</option>
                            <option value="penting">Penting / Mendesak</option>
                            <option value="agenda">Agenda Kegiatan</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label" style="font-size: 12px; font-weight: 700;">Isi Pesan Siaran <span style="color: #ef4444;">*</span></label>
                        <textarea id="bc-input-message" class="form-textarea" rows="4" placeholder="Tuliskan pesan lengkap yang akan diterima oleh seluruh relawan di semua perangkat..."></textarea>
                    </div>
                </div>
                <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px;">
                    <button type="button" class="btn-secondary" onclick="closeBroadcastModal()">Batal</button>
                    <button type="button" class="btn-primary" id="btn-submit-broadcast" onclick="handleSubmitBroadcast()">Kirim Sekarang</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const titleInput = document.getElementById('bc-input-title');
    const msgInput = document.getElementById('bc-input-message');
    if (titleInput) titleInput.value = '';
    if (msgInput) msgInput.value = '';

    modal.style.display = 'flex';
    modal.classList.add('active');
}

export function closeBroadcastModal() {
    const modal = document.getElementById('modal-broadcast');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

export async function handleSubmitBroadcast() {
    const titleInput = document.getElementById('bc-input-title');
    const typeSelect = document.getElementById('bc-select-type');
    const msgInput = document.getElementById('bc-input-message');
    const btn = document.getElementById('btn-submit-broadcast');

    if (!titleInput || !titleInput.value.trim() || !msgInput || !msgInput.value.trim()) {
        if (window.showCustomDialog) {
            window.showCustomDialog({
                title: "Peringatan",
                message: "Judul dan Isi pesan pengumuman wajib diisi!",
                confirmText: "Mengerti"
            });
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Mengirim...";
    }

    try {
        await sendBroadcastAnnouncement({
            judul: titleInput.value.trim(),
            tipe: typeSelect ? typeSelect.value : 'info',
            pesan: msgInput.value.trim()
        });

        closeBroadcastModal();
        if (window.showCustomDialog) {
            window.showCustomDialog({
                title: "Berhasil",
                message: "Pengumuman berhasil disiarkan! Notifikasi akan langsung muncul di perangkat relawan.",
                confirmText: "Tutup"
            });
        }
    } catch (err) {
        if (window.showCustomDialog) {
            window.showCustomDialog({
                title: "Gagal Mengirim",
                message: "Terjadi kendala saat mengirim pengumuman. Periksa koneksi internet Anda.",
                confirmText: "Tutup"
            });
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Kirim Sekarang";
        }
    }
}

// -------------------------------------------------------------
// FITUR PUSAT NOTIFIKASI (INSTAGRAM STYLE NOTIFICATION CENTER)
// -------------------------------------------------------------
let currentNotifCenterTab = 'all';

export function openNotificationCenterModal() {
    const modal = document.getElementById('modal-notif-center');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.add('active');

    // Sembunyikan badge merah header & nav setelah dibuka
    const badge = document.getElementById('header-notif-badge');
    if (badge) badge.style.display = 'none';
    const navDot = document.getElementById('nav-notif-dot');
    if (navDot) navDot.style.display = 'none';
    const mobDot = document.getElementById('mobile-notif-dot');
    if (mobDot) mobDot.style.display = 'none';

    renderNotificationCenter();
}

export function closeNotificationCenterModal() {
    const modal = document.getElementById('modal-notif-center');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

export function switchNotifTab(tab) {
    currentNotifCenterTab = tab;
    ['all', 'personal', 'broadcast'].forEach(t => {
        const btn = document.getElementById(`notif-tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.classList.add('active');
                btn.style.color = 'var(--primary)';
                btn.style.borderBottom = '2px solid var(--primary)';
            } else {
                btn.classList.remove('active');
                btn.style.color = 'var(--text-muted)';
                btn.style.borderBottom = '2px solid transparent';
            }
        }
    });
    renderNotificationCenter();
}

export async function renderNotificationCenter() {
    const container = document.getElementById('notif-center-list');
    if (!container) return;

    container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">Memuat riwayat pemberitahuan...</div>';

    const currentUser = state.currentUser;
    const currentName = currentUser ? (currentUser.namaLengkap || currentUser.nama || currentUser.username || '').toLowerCase().trim() : '';
    const isAdmin = currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'DPL');

    // Ambil daftar notifikasi lokal yang di-dismiss oleh user
    const dismissedLocal = new Set(JSON.parse(localStorage.getItem('volabs_dismissed_notifs') || '[]'));
    const dismissedTime = parseInt(localStorage.getItem('volabs_dismissed_notifs_time') || '0', 10);

    let notifItems = [];

    // 1. Ambil Broadcast dari Firestore
    if (db) {
        try {
            const bcSnap = await db.collection('broadcasts').orderBy('timestamp', 'desc').limit(25).get();
            bcSnap.forEach(doc => {
                const b = doc.data();
                const bId = doc.id;
                const bTime = b.timestamp || 0;
                if (!dismissedLocal.has(bId) && bTime > dismissedTime) {
                    notifItems.push({
                        id: bId,
                        type: 'broadcast',
                        tipe: b.tipe || 'info',
                        title: b.judul || 'Pengumuman Resmi',
                        body: b.pesan || '',
                        author: b.pengirim || 'Admin VoLabs',
                        timestamp: b.timestamp || Date.now(),
                        createdAt: b.createdAt || new Date().toISOString(),
                        canAdminDelete: true,
                        url: '/'
                    });
                }
            });
        } catch (e) {
            console.warn("Notice loading broadcasts for notif center:", e);
        }
    }

    // 2. Ambil Penugasan & Revisi Studio Video dari state/localStorage
    const tasks = state.allEditorTasks || JSON.parse(localStorage.getItem('volabs_editor_tasks') || '[]');
    tasks.forEach(task => {
        const assignedTo = (task.editor || task.assignedEditor || task.editorName || task.assignedTo || '').trim();
        const assignedLower = assignedTo.toLowerCase();
        const isForMe = currentName && (assignedLower === currentName || currentName.includes(assignedLower) || assignedLower.includes(currentName));

        if (isForMe || isAdmin) {
            const taskId = `task_${task.id}_${task.status}`;
            const taskTime = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
            if (!dismissedLocal.has(taskId) && taskTime > dismissedTime) {
                let taskTitle = `Penugasan Video: ${assignedTo || 'Volunteer'}`;
                let taskBody = `Tugas "${task.judul || 'Materi Video'}" sedang berstatus ${task.status}.`;
                let badgeType = 'info';

                if (task.status === 'Perlu Revisi' || task.status === 'Revisi') {
                    taskTitle = `Revisi Video: ${assignedTo || 'Volunteer'}`;
                    taskBody = `Catatan revisi: ${task.note || task.revisi || 'Silakan cek perbaikan video.'}`;
                    badgeType = 'warning';
                } else if (task.status === 'Menunggu Review Admin') {
                    taskTitle = `Hasil Video: ${assignedTo || 'Volunteer'}`;
                    taskBody = `Editor telah mengunggah hasil edit untuk "${task.judul || 'Video'}".`;
                    badgeType = 'info';
                } else if (task.status === 'Selesai') {
                    taskTitle = `Video Disetujui: ${assignedTo || 'Volunteer'}`;
                    taskBody = `Materi video "${task.judul || 'Video'}" telah disetujui.`;
                    badgeType = 'success';
                }

                notifItems.push({
                    id: taskId,
                    type: 'task',
                    tipe: badgeType,
                    title: taskTitle,
                    body: taskBody,
                    author: task.tipe || 'Studio Video',
                    timestamp: task.updatedAt ? new Date(task.updatedAt).getTime() : Date.now(),
                    createdAt: task.updatedAt || new Date().toISOString(),
                    canAdminDelete: false,
                    url: '/studio-editor'
                });
            }
        }
    });

    // Urutkan dari yang paling baru
    notifItems.sort((a, b) => b.timestamp - a.timestamp);

    // Filter berdasarkan Tab
    if (currentNotifCenterTab === 'personal') {
        notifItems = notifItems.filter(x => x.type === 'task');
    } else if (currentNotifCenterTab === 'broadcast') {
        notifItems = notifItems.filter(x => x.type === 'broadcast');
    }

    if (notifItems.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                </div>
                <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 4px;">Tidak Ada Notifikasi</div>
                <div style="font-size: 12px; color: var(--text-muted);">Semua pemberitahuan tugas dan pengumuman terbaru telah dibaca.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = notifItems.map(item => {
        const timeAgo = formatTimeAgo(item.timestamp);
        const isBc = item.type === 'broadcast';
        const iconBg = item.tipe === 'warning' ? 'rgba(245, 158, 11, 0.12)' : (item.tipe === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(188, 48, 95, 0.12)');
        const iconColor = item.tipe === 'warning' ? '#f59e0b' : (item.tipe === 'success' ? '#10b981' : '#BC305F');

        return `
            <div class="notif-item-card" style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: 12px; background: var(--bg-primary); border: 1px solid var(--border-color); transition: all 0.2s ease; position: relative;">
                <div style="width: 38px; height: 38px; border-radius: 50%; background: ${iconBg}; color: ${iconColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                    <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${isBc
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>'
            }
                    </svg>
                </div>
                <div style="flex: 1; min-width: 0; cursor: pointer;" onclick="handleNotifItemClick('${item.url}')">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 6px; margin-bottom: 2px;">
                        <span style="font-weight: 700; font-size: 13px; color: var(--text-primary); line-height: 1.3;">${item.title}</span>
                        <span style="font-size: 11px; color: var(--text-muted); flex-shrink: 0;">${timeAgo}</span>
                    </div>
                    <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45; word-break: break-word; margin-bottom: 4px;">
                        ${item.body}
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted);">
                        ${(item.author && !item.author.toLowerCase().includes('admin')) ? (item.author + ' • ') : ''}${isBc ? 'Siaran Pengumuman' : 'Pembaruan Tugas'}
                    </div>
                </div>
                <div style="display: flex; gap: 4px; flex-shrink: 0;">
                    ${isAdmin && item.canAdminDelete ? `
                        <button type="button" class="icon-btn" title="Hapus Pengumuman Global (Admin)" onclick="deleteBroadcastGlobal('${item.id}', event)" style="width: 26px; height: 26px; color: #ef4444; padding: 0;">
                            <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    ` : ''}
                    <button type="button" class="icon-btn" title="Hapus dari tampilan saya" onclick="dismissUserNotif('${item.id}', event)" style="width: 26px; height: 26px; color: var(--text-muted); padding: 0;">
                        <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

export function handleNotifItemClick(url) {
    closeNotificationCenterModal();
    if (url && typeof window.switchView === 'function') {
        const view = url.replace('/', '');
        window.switchView(view || 'dasbor');
    }
}

// User menghapus notifikasi dari tampilannya sendiri
export function dismissUserNotif(notifId, event) {
    if (event) event.stopPropagation();
    const dismissed = new Set(JSON.parse(localStorage.getItem('volabs_dismissed_notifs') || '[]'));
    dismissed.add(notifId);
    localStorage.setItem('volabs_dismissed_notifs', JSON.stringify([...dismissed].slice(-200)));
    renderNotificationCenter();
}

// Bersihkan semua tampilan notifikasi (Bagi Admin: Pilihan Hapus Global dari Server atau Bersihkan Tampilan)
export async function clearAllUserLocalNotifs() {
    const isAdmin = state.currentUser && (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin' || state.currentUser.role === 'DPL');

    if (window.showCustomDialog) {
        const dialogTitle = isAdmin ? "Hapus Seluruh Notifikasi" : "Bersihkan Riwayat Notifikasi";
        const dialogMsg = isAdmin
            ? "Sebagai Admin, Anda dapat menghapus seluruh pengumuman dari database (terhapus di semua relawan) sekaligus membersihkan riwayat tugas dari tampilan. Lanjutkan?"
            : "Apakah Anda yakin ingin membersihkan seluruh riwayat notifikasi dari tampilan perangkat Anda?";

        const confirmed = await window.showCustomDialog({
            title: dialogTitle,
            message: dialogMsg,
            confirmText: isAdmin ? "Hapus Semua" : "Bersihkan",
            confirmColor: "#ef4444"
        });
        if (!confirmed) return;
    }

    // Jika Admin: Hapus semua dokumen di Firestore collection broadcasts
    if (isAdmin && db) {
        try {
            const snap = await db.collection('broadcasts').get();
            const batch = db.batch();
            snap.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (e) {
            console.warn("Notice deleting all broadcasts from Firestore:", e);
        }
    }

    // Dismiss semua ID yang ada di layar ke localStorage
    const dismissed = new Set(JSON.parse(localStorage.getItem('volabs_dismissed_notifs') || '[]'));
    const dismissedTime = Date.now();
    localStorage.setItem('volabs_dismissed_notifs_time', String(dismissedTime));
    localStorage.setItem('volabs_dismissed_notifs', JSON.stringify([...dismissed].slice(-300)));

    renderNotificationCenter();

    if (window.showInAppToast) {
        window.showInAppToast(
            "Berhasil Dibersihkan",
            isAdmin ? "Seluruh pengumuman sistem dan riwayat notifikasi telah dihapus." : "Riwayat notifikasi berhasil dibersihkan dari tampilan.",
            "success"
        );
    }
}

// Admin menghapus pengumuman secara global (Terhapus dari semua volunteer)
export async function deleteBroadcastGlobal(broadcastId, event) {
    if (event) event.stopPropagation();
    if (!window.showCustomDialog) return;

    const confirmed = await window.showCustomDialog({
        title: "Hapus Pengumuman Global",
        message: "Pengumuman ini akan dihapus secara permanen dari Firestore dan hilang dari seluruh perangkat relawan. Lanjutkan?",
        confirmText: "Hapus Permanen",
        confirmColor: "#ef4444"
    });

    if (!confirmed) return;

    if (db) {
        try {
            await db.collection('broadcasts').doc(broadcastId).delete();
            renderNotificationCenter();
            showInAppToast('Pengumuman Dihapus', 'Pengumuman telah berhasil dihapus dari sistem untuk seluruh relawan.', 'info');
        } catch (err) {
            console.error("Gagal menghapus broadcast:", err);
            window.showCustomDialog({
                title: "Gagal Menghapus",
                message: "Terjadi kesalahan saat menghapus pengumuman: " + err.toString(),
                confirmText: "Tutup"
            });
        }
    }
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Baru saja';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
}

// Helper Tes Langsung Notifikasi Push ke Perangkat Ini (Bisa Dites Saat Ditutup)
export async function testSendSelfPush() {
    try {
        let token = await initializeFcmToken();
        if (!token && db && state.currentUser) {
            const username = state.currentUser.username || state.currentUser.nim || 'user';
            const doc = await db.collection('user_devices').doc(username).get();
            if (doc.exists && doc.data().fcmToken) {
                token = doc.data().fcmToken;
            }
        }

        if (!token) {
            if (window.showCustomDialog) {
                window.showCustomDialog({
                    title: "Token Belum Siap",
                    message: "Izin notifikasi belum diizinkan atau token perangkat belum terbentuk. Pastikan telah menekan Izinkan saat Chrome meminta izin.",
                    confirmText: "Mengerti"
                });
            }
            return;
        }

        if (window.showCustomDialog) {
            window.showCustomDialog({
                title: "Uji Notifikasi Dimulai",
                message: "Notifikasi akan dikirim dalam 5 detik. Segera tutup aplikasi / kunci layar HP Anda sekarang untuk menguji!",
                confirmText: "Siap, Kunci Layar Sekarang"
            });
        }

        // Beri jeda 5 detik agar user sempat menutup aplikasi atau mengunci HP
        setTimeout(() => {
            dispatchPushViaGas({
                title: "Uji Notifikasi VoLabs",
                body: "Notifikasi latar belakang berhasil diterima saat aplikasi ditutup!",
                url: "/",
                tokens: [token]
            });
        }, 5000);
    } catch (e) {
        console.error("testSendSelfPush error:", e);
    }
}

// Global initialization
export function initNotifications() {
    window.testSendSelfPush = testSendSelfPush;
    window.requestNotificationPermission = requestNotificationPermission;
    window.openBroadcastModal = openBroadcastModal;
    window.closeBroadcastModal = closeBroadcastModal;
    window.handleSubmitBroadcast = handleSubmitBroadcast;
    window.dispatchPushViaGas = dispatchPushViaGas;
    window.openNotificationCenterModal = openNotificationCenterModal;
    window.closeNotificationCenterModal = closeNotificationCenterModal;
    window.switchNotifTab = switchNotifTab;
    window.renderNotificationCenter = renderNotificationCenter;
    window.handleNotifItemClick = handleNotifItemClick;
    window.dismissUserNotif = dismissUserNotif;
    window.clearAllUserLocalNotifs = clearAllUserLocalNotifs;
    window.deleteBroadcastGlobal = deleteBroadcastGlobal;

    // Start background listeners
    listenToBroadcastAnnouncements();
    listenToStudioTaskAssignments();

    // Auto-prompt permission politely saat pertama kali web dibuka di Chrome/HP (sebelum install / login)
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            initializeFcmToken();
        } else if (Notification.permission === 'default') {
            // Munculkan izin browser 1.5 detik setelah web dimuat
            setTimeout(() => {
                requestNotificationPermission();
            }, 1500);
        }
    }
}
