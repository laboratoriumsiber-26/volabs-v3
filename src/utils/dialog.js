// Custom Modal Dialog (Alert/Confirm/Prompt) Wrapper

export function showCustomDialog({ title, message, type = 'confirm', confirmText = 'Ya', confirmColor = 'var(--primary)', inputValue = '' }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-dialog');
        if (!modal) {
            console.warn("modal-dialog element not found in DOM");
            resolve(true);
            return;
        }

        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const inputEl = document.getElementById('dialog-input');
        const btnConfirm = document.getElementById('btn-dialog-confirm');
        const btnCancel = document.getElementById('btn-dialog-cancel');
        const btnClose = document.getElementById('btn-close-dialog');

        if (titleEl) titleEl.innerHTML = title;
        if (messageEl) messageEl.innerHTML = message;

        if (inputEl) {
            if (type === 'prompt') {
                inputEl.style.display = 'block';
                inputEl.value = inputValue;
                inputEl.focus();
            } else {
                inputEl.style.display = 'none';
            }
        }

        if (btnConfirm) {
            btnConfirm.textContent = confirmText;
            btnConfirm.style.background = confirmColor;
            btnConfirm.style.borderColor = confirmColor;
        }

        modal.style.display = 'flex';
        modal.classList.add('active');

        const cleanup = () => {
            modal.classList.remove('active');
            modal.style.display = 'none';
            if (btnClose) btnClose.removeEventListener('click', onCancel);
            if (btnCancel) btnCancel.removeEventListener('click', onCancel);
            if (btnConfirm) btnConfirm.removeEventListener('click', onConfirm);
        };

        const onCancel = () => { cleanup(); resolve(null); };
        const onConfirm = () => { cleanup(); resolve(type === 'prompt' && inputEl ? inputEl.value : true); };

        if (btnClose) btnClose.addEventListener('click', onCancel);
        if (btnCancel) btnCancel.addEventListener('click', onCancel);
        if (btnConfirm) btnConfirm.addEventListener('click', onConfirm);
    });
}
