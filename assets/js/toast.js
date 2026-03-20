/**
 * Toast Notification System
 * Usage: showToast('Mensaje', 'success' | 'error' | 'info')
 */

// Inject styles for the toast
const style = document.createElement('style');
style.textContent = `
    .toast-container {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        z-index: 9999;
    }
    .toast {
        min-width: 280px;
        max-width: 400px;
        padding: 1rem 1.25rem;
        border-radius: 1rem;
        background: white;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transform: translateY(1rem);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border-left: 4px solid #cbd5e1;
    }
    .toast.show {
        transform: translateY(0);
        opacity: 1;
    }
    .toast-success { border-left-color: #10b981; }
    .toast-error { border-left-color: #ef4444; }
    .toast-info { border-left-color: #3b82f6; }
    
    .toast-icon {
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
    }
    .toast-success .toast-icon { background: #d1fae5; color: #065f46; }
    .toast-error .toast-icon { background: #fee2e2; color: #991b1b; }
    .toast-info .toast-icon { background: #dbeafe; color: #1e40af; }

    /* Loading Skeleton for Tables */
    .loading tr {
        pointer-events: none;
    }
    .loading td div {
        height: 1rem;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 0.25rem;
    }
    @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
`;
document.head.appendChild(style);

// Create container
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <span class="material-symbols-outlined text-[20px]">${icons[type]}</span>
        </div>
        <div class="toast-content">
            <p class="text-sm font-semibold text-slate-800">${message}</p>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Initial trigger for animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Global expose
window.showToast = showToast;
