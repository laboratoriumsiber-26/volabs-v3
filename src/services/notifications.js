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

// Show native browser notification if granted
export function showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, {
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        vibrate: [200, 100, 200],
                        ...options
                    });
                });
            } else {
                new Notification(title, {
                    icon: '/icon-192.png',
                    ...options
                });
            }
        } catch (e) {
            console.warn("Browser notification error:", e);
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

// Save device info & FCM token for logged in user
async function saveUserDeviceInfo(fcmToken = null) {
    if (!db || !state.currentUser) return;
    try {
        const username = state.currentUser.username || state.currentUser.nim || 'user';
        const payload = {
            username: username,
            nama: state.currentUser.namaLengkap || state.currentUser.nama || '',
            role: state.currentUser.role || '',
            notificationPermission: Notification.permission || 'default',
            lastActive: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        if (fcmToken) {
            payload.fcmToken = fcmToken;
        }
        await db.collection('user_devices').doc(username).set(payload, { merge: true });
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
        return true;
    } catch (err) {
        console.error("Gagal mengirim broadcast:", err);
        throw err;
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
                                `📢 Pengumuman: ${data.judul || 'Info Penting'}`,
                                `${data.pesan || ''}`,
                                data.tipe === 'penting' ? 'warning' : 'info',
                                () => showBroadcastModalDetail(data)
                            );
                            showBrowserNotification(`📢 ${data.judul || 'Pengumuman Baru VoLABS'}`, {
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
        title: `📢 ${data.judul || 'Pengumuman'}`,
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
                    const prefix = isForMe ? '🎯 Tugas Baru untuk Anda' : `🎬 Tugas Editor Baru: ${task.editorName || 'Belum ada PIC'}`;
                    const deadlineStr = task.deadline ? ` (Deadline: ${task.deadline})` : '';

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
                        `🔄 Status Tugas Berubah: ${task.status}`,
                        `Tugas "${task.judul || 'Video'}" telah diupdate menjadi ${task.status}.`,
                        'warning',
                        () => {
                            if (window.switchView) window.switchView('studio-editor');
                        }
                    );
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

// Global initialization
export function initNotifications() {
    window.requestNotificationPermission = requestNotificationPermission;
    window.openBroadcastModal = openBroadcastModal;
    window.closeBroadcastModal = closeBroadcastModal;
    window.handleSubmitBroadcast = handleSubmitBroadcast;

    // Start background listeners
    listenToBroadcastAnnouncements();
    listenToStudioTaskAssignments();

    // Auto-prompt permission politely after login if supported
    if ('Notification' in window && state.currentUser) {
        if (Notification.permission === 'granted') {
            initializeFcmToken();
        } else if (Notification.permission === 'default') {
            setTimeout(() => {
                requestNotificationPermission();
            }, 3000);
        }
    }
}
