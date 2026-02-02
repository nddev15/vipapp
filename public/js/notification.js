// notification.js - Modern Toast Notification System

// Toast container
let toastContainer;

// Initialize toast container
function initToast() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    initToast();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    
    // Icons for different types
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    
    // Colors for different types
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const icon = icons[type] || icons.info;
    const color = colors[type] || colors.info;
    
    toast.innerHTML = `
        <div class="toast-icon" style="background: ${color}">
            <i data-lucide="${icon}" class="w-5 h-5 text-white"></i>
        </div>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close" onclick="closeToast(this)">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Trigger enter animation
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-show');
    }, 10);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
}

// Remove toast
function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    
    toast.classList.remove('toast-show');
    toast.classList.add('toast-exit');
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
}

// Close toast by button
function closeToast(button) {
    const toast = button.closest('.toast');
    removeToast(toast);
}

// Helper functions
window.toast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration)
};

// Override alert for modern toast
const originalAlert = window.alert;
window.alert = function(message) {
    if (typeof message === 'string' && message.length > 0) {
        showToast(message, 'info', 4000);
    } else {
        originalAlert(message);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', initToast);
