// Central State Management for VoLABS PIPD
import { dataVolunteer } from './initialData.js';

export const state = {
    currentUser: null,
    contentPlans: (() => {
        try {
            const raw = JSON.parse(localStorage.getItem('volabs_cached_content_plans') || '[]');
            return Array.isArray(raw) ? raw.filter(p => !String(p.ID || '').toLowerCase().includes('dummy') && !String(p.ID || '').toLowerCase().includes('sample')) : [];
        } catch (e) { return []; }
    })(),
    currentFilteredPlans: [],
    allEditorTasks: (() => {
        try {
            const raw = JSON.parse(localStorage.getItem('volabs_editor_tasks') || '[]');
            return Array.isArray(raw) ? raw.filter(t => t.id !== 'ET-1001' && t.id !== 'ET-1002' && !String(t.rawVideo || '').includes('sample-raw')) : [];
        } catch (e) { return []; }
    })(),
    absensiList: (() => {
        try {
            const raw = JSON.parse(localStorage.getItem('volabs_cached_absensi') || '[]');
            return Array.isArray(raw) ? raw.filter(a => !String(a.id || '').toLowerCase().includes('dummy') && !String(a.nama || '').toLowerCase().includes('dummy') && !String(a.nama || '').toLowerCase().includes('test')) : [];
        } catch (e) { return []; }
    })(),
    currentView: 'dashboard',
    isTableView: typeof window !== 'undefined' && window.innerWidth > 850,

    // Studio Upload & Editor state
    currentUploadTab: 'pembelajaran',
    uploadViewMode: typeof window !== 'undefined' && window.innerWidth <= 850 ? 'cards' : 'table',
    uploadModalType: 'pembelajaran',
    currentEditorTab: 'pembelajaran',
    editorViewMode: typeof window !== 'undefined' && window.innerWidth <= 850 ? 'cards' : 'table',

    // Profil state
    currentProfilViewMode: typeof window !== 'undefined' && window.innerWidth <= 850 ? 'cards' : 'table',
    currentActiveProfilDetail: null,
    isModalPassVisible: false,

    // Jurnal state
    currentJurnalScope: 'mine',
    jurnalViewMode: typeof window !== 'undefined' && window.innerWidth <= 850 ? 'cards' : 'table',
    jurnalList: [],
    allJurnalDataAdmin: (() => {
        try {
            const raw = JSON.parse(localStorage.getItem('volabs_cached_jurnal') || '[]');
            return Array.isArray(raw) ? raw.filter(j => !String(j.id || '').toLowerCase().includes('dummy') && !String(j.kegiatan || '').toLowerCase().includes('test dummy')) : [];
        } catch (e) { return []; }
    })(),

    // Bank Material state
    asetViewMode: typeof window !== 'undefined' && window.innerWidth <= 850 ? 'cards' : 'table',
    asetVideoList: (() => {
        try {
            const raw = JSON.parse(localStorage.getItem('volabs_aset_video_list') || '[]');
            const dummyIds = ['ASET-101', 'ASET-102', 'ASET-103', 'ASET-104', 'ASET-105'];
            return Array.isArray(raw) ? raw.filter(a => !dummyIds.includes(a.id) && !String(a.driveUrl || '').includes('sample-')) : [];
        } catch (e) { return []; }
    })(),

    // Helpers
    getUploaderList() {
        try {
            return JSON.parse(localStorage.getItem('volabs_uploaders_list') || '[]');
        } catch (e) {
            return [];
        }
    },

    isUserUploader(userName) {
        if (!userName) return false;
        const norm = s => (s || '').toLowerCase().replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim();
        const normStrip = s => (s || '').toLowerCase().replace(/['’`\s]/g, '');
        const targetNorm = norm(userName);
        const targetStrip = normStrip(userName);
        const list = this.getUploaderList();
        return list.some(n => {
            const itemNorm = norm(n);
            return itemNorm === targetNorm || normStrip(n) === targetStrip;
        });
    },

    isCurrentUserUploader() {
        if (!this.currentUser) return false;
        if (this.currentUser.role === 'Super Admin' || this.currentUser.role === 'Admin' || this.currentUser.role === 'DPL') return true;
        const name = this.currentUser.namaLengkap || this.currentUser.name || '';
        const nim = this.currentUser.nim || this.currentUser.username || '';
        if (this.isUserUploader(name) || (nim && this.isUserUploader(nim))) return true;
        return this.currentUser.isUploader === true;
    },

    getEditorList() {
        try {
            const stored = localStorage.getItem('volabs_editors_list');
            if (stored !== null) {
                return JSON.parse(stored);
            }
            // Seed with default editors from dataVolunteer
            const defaultEditors = Object.keys(dataVolunteer).filter(name => {
                const v = dataVolunteer[name];
                return v && v.div && v.div.toLowerCase().includes('editor');
            });
            localStorage.setItem('volabs_editors_list', JSON.stringify(defaultEditors));
            return defaultEditors;
        } catch (e) {
            return [];
        }
    },

    isUserEditor(userName) {
        if (!userName) return false;
        const norm = s => (s || '').toLowerCase().replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim();
        const normStrip = s => (s || '').toLowerCase().replace(/['’`\s]/g, '');
        const targetNorm = norm(userName);
        const targetStrip = normStrip(userName);
        const list = this.getEditorList();
        return list.some(n => {
            const itemNorm = norm(n);
            return itemNorm === targetNorm || normStrip(n) === targetStrip;
        });
    },

    isCurrentUserEditor() {
        if (!this.currentUser) return false;
        if (this.currentUser.role === 'Super Admin' || this.currentUser.role === 'Admin' || this.currentUser.role === 'DPL') return true;
        const name = this.currentUser.namaLengkap || this.currentUser.name || '';
        const nim = this.currentUser.nim || this.currentUser.username || '';
        if (this.isUserEditor(name) || (nim && this.isUserEditor(nim))) return true;
        return this.currentUser.isEditor === true;
    }
};
