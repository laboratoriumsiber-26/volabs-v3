// Google Apps Script API Service
import { CONFIG } from '../store/initialData.js';

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1LzNKCIS4fdkHWgl78hRVQ8_MLzuYn6n_4XPJv7RHBDy_noRIeFHZUV1QzBzrKAaz/exec";

export class ApiService {
    constructor() {
        this.apiUrl = APPS_SCRIPT_URL.trim();
        const currentMonthIndex = new Date().getMonth();
        const indonesianMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const defaultName = "Content Plan " + indonesianMonths[currentMonthIndex] + " " + new Date().getFullYear();

        const currentMonthTracker = new Date().getFullYear() + "-" + currentMonthIndex;
        const lastSeenMonth = localStorage.getItem("VOLABS_LAST_SEEN_MONTH");

        let savedName = localStorage.getItem(CONFIG.STORAGE_KEYS.SHEET_NAME);
        if (!savedName || !savedName.includes("Content Plan") || lastSeenMonth !== currentMonthTracker) {
            savedName = defaultName;
            localStorage.setItem("VOLABS_LAST_SEEN_MONTH", currentMonthTracker);
        }

        this.sheetName = savedName;
        localStorage.setItem(CONFIG.STORAGE_KEYS.SHEET_NAME, this.sheetName);
    }

    getSheetName() { return this.sheetName; }
    
    setSheetName(name) {
        if (!name) {
            const currentMonthIndex = new Date().getMonth();
            const indonesianMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            name = "Content Plan " + indonesianMonths[currentMonthIndex] + " " + new Date().getFullYear();
        } else if (!name.includes("Content Plan")) {
            name = "Content Plan " + name.trim() + " " + new Date().getFullYear();
        }
        this.sheetName = name.trim();
        localStorage.setItem(CONFIG.STORAGE_KEYS.SHEET_NAME, this.sheetName);
    }

    isConfigured() {
        return this.apiUrl.length > 10 && this.apiUrl.includes("script.google.com");
    }

    async getContentPlans() {
        if (!this.isConfigured()) {
            return {
                mode: "unconfigured",
                sheetName: this.sheetName,
                sheets: [this.sheetName],
                data: []
            };
        }

        const url = `${this.apiUrl}?action=read&sheetName=${encodeURIComponent(this.sheetName)}&t=${new Date().getTime()}`;
        const response = await fetch(url, { cache: "no-store" });
        const result = await response.json();
        if (result.status === "success") {
            return {
                mode: "live",
                sheetName: result.sheetName || this.sheetName,
                sheets: result.sheets || [this.sheetName],
                data: result.data || []
            };
        } else {
            throw new Error(result.message || "Gagal mengambil data dari Google Sheets");
        }
    }

    async _sendPost(payload) {
        if (!this.isConfigured()) throw new Error("URL Web App Google Apps Script belum diisi");
        try {
            await fetch(this.apiUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            return true;
        } catch (err) {
            throw new Error("Gagal mengirim data. Periksa koneksi internet.");
        }
    }

    async createContentPlan(item) {
        return this._sendPost({ action: "create", sheetName: this.sheetName, data: item });
    }

    async updateContentPlan(item) {
        return this._sendPost({ action: "update", sheetName: this.sheetName, data: item });
    }

    async deleteContentPlan(id) {
        return this._sendPost({ action: "delete", sheetName: this.sheetName, data: { ID: id } });
    }

    async createNewSheet(newSheetName) {
        const success = await this._sendPost({ action: "create_sheet", sheetName: newSheetName });
        if (success) this.setSheetName(newSheetName);
        return success;
    }
}

export const api = new ApiService();
