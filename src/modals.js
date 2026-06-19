// Modals module - Modal system functions
// Export functions for use in main.js

let modalStack = [];

function showModal({ title, body, buttons = [{ label: 'OK', class: '' }], onClose }) {
    // Create modal if not exists
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:10000;';

    const dialog = document.createElement('div');
    dialog.style.cssText = 'background:var(--panel-bg);border:1px solid var(--border-color);border-radius:12px;padding:20px;max-width:400px;width:90%;';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin:0 0 12px 0;font-size:16px;color:var(--text-color);';
    dialog.appendChild(titleEl);

    const bodyEl = document.createElement('div');
    if (typeof body === 'string') {
        bodyEl.innerHTML = body;
    } else {
        bodyEl.appendChild(body);
    }
    bodyEl.style.cssText = 'margin-bottom:16px;color:var(--text-color);';
    dialog.appendChild(bodyEl);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

    let resolveValue;
    buttons.forEach(btn => {
        const btnEl = document.createElement('button');
        btnEl.className = `tool-btn ${btn.class || ''}`;
        btnEl.textContent = btn.label;
        btnEl.onclick = () => {
            if (onClose) onClose(btn.value);
            document.body.removeChild(modal);
            modalStack.pop();
            resolveValue = btn.value;
        };
        btnRow.appendChild(btnEl);
    });

    dialog.appendChild(btnRow);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    modalStack.push(modal);

    // Trap focus
    setTimeout(() => {
        const firstFocusable = dialog.querySelector('button, input, select, textarea');
        if (firstFocusable) firstFocusable.focus();
    }, 50);
}

function showAlert(title, message) {
    showModal({ title, body: `<p>${String(message).replace(/\n/g, '<br>')}</p>`, buttons: [{ label: 'Aceptar', class: 'primary' }] });
}

function showConfirm(message, defaultValue = false) {
    return new Promise(resolve => {
        showModal({
            title: 'Confirmar',
            body: `<p>${String(message).replace(/\n/g, '<br>')}</p>`,
            buttons: [
                { label: 'Cancelar', value: defaultValue },
                { label: 'Aceptar', class: 'primary', value: true }
            ],
            onClose: (v) => resolve(v)
        });
    });
}

function showToast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:8px 16px;border-radius:12px;z-index:10001;font-size:12px;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}