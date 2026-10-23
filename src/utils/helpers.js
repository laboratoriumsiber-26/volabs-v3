// Utility & Helper Functions for VoLABS PIPD

export function cleanDate(d) {
    if (!d) return "-";
    if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
    return d;
}

export function formatTanggalIndo(dateStr) {
    if (!dateStr) return "-";
    let dObj;
    if (typeof dateStr === 'string') {
        const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanStr.split('-');
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const mIdx = parseInt(parts[1], 10) - 1;
            return `${parseInt(parts[2], 10)} ${months[mIdx] || parts[1]} ${parts[0]}`;
        }
        dObj = new Date(dateStr);
    } else if (dateStr instanceof Date) {
        dObj = dateStr;
    }
    if (dObj && !isNaN(dObj.getTime())) {
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return `${dObj.getDate()} ${months[dObj.getMonth()]} ${dObj.getFullYear()}`;
    }
    return String(dateStr);
}

export function getBulanFromTanggal(dateStr) {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
    const parts = cleanStr.split('-');
    if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return months[m] || '';
    }
    return '';
}

export function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
        };
    });
}

export function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/).filter(p => !p.startsWith('('));
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatWaNumber(wa) {
    let s = String(wa || '').trim();
    if (s.startsWith('62')) return '+62 ' + s.substring(2);
    if (s.startsWith('0')) return '+62 ' + s.substring(1);
    return s;
}

export function cleanWaForUrl(wa) {
    let s = String(wa || '').replace(/[^0-9]/g, '');
    if (s.startsWith('0')) s = '62' + s.substring(1);
    return s;
}

export function getDivisiMeta(div) {
    div = div || '';
    if (div.includes('Mentor')) {
        return {
            color: '#BC305F',
            bg: 'rgba(188, 48, 95, 0.12)',
            border: 'rgba(188, 48, 95, 0.3)',
            gradient: 'linear-gradient(135deg, #BC305F, #F8A734)'
        };
    }
    if (div.includes('Editor')) {
        return {
            color: '#8b5cf6',
            bg: 'rgba(139, 92, 246, 0.12)',
            border: 'rgba(139, 92, 246, 0.3)',
            gradient: 'linear-gradient(135deg, #6366f1, #a855f7)'
        };
    }
    if (div.includes('Fotografer')) {
        return {
            color: '#0284c7',
            bg: 'rgba(2, 132, 199, 0.12)',
            border: 'rgba(2, 132, 199, 0.3)',
            gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)'
        };
    }
    if (div.includes('Desain')) {
        return {
            color: '#059669',
            bg: 'rgba(5, 150, 105, 0.12)',
            border: 'rgba(5, 150, 105, 0.3)',
            gradient: 'linear-gradient(135deg, #059669, #34d399)'
        };
    }
    if (div.includes('Podcast')) {
        return {
            color: '#d97706',
            bg: 'rgba(217, 119, 6, 0.12)',
            border: 'rgba(217, 119, 6, 0.3)',
            gradient: 'linear-gradient(135deg, #d97706, #fbbf24)'
        };
    }
    return {
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.12)',
        border: 'rgba(100, 116, 139, 0.3)',
        gradient: 'linear-gradient(135deg, #64748b, #94a3b8)'
    };
}

export function setRefreshLoading(active) {
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
        if (active) btnRefresh.classList.add('spinning');
        else btnRefresh.classList.remove('spinning');
    }
}
