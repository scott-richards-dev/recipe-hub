// Toast Notification System - Reusable across all pages

const Toast = {
  container: null,

  // Initialize toast container
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  },

  // Show a toast notification
  show(options) {
    const {
      type = 'info', // success, error, info, warning
      title = '',
      message = '',
      duration = 5000, // ms, set to 0 for no auto-dismiss
      closable = true
    } = options;

    this.init();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Get icon based on type
    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ',
      warning: '⚠'
    };

    // Build toast content
    let html = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
    `;

    if (closable) {
      html += `<button class="toast-close" aria-label="Close">&times;</button>`;
    }

    if (duration > 0) {
      html += `<div class="toast-progress"></div>`;
    }

    toast.innerHTML = html;

    // Add close functionality
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.remove(toast));
    }

    // Add to container
    this.container.appendChild(toast);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  },

  // Remove a toast
  remove(toast) {
    if (!toast) return;
    
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300); // Match animation duration
  },

  // Convenience methods
  success(message, title = 'Success', options = {}) {
    return this.show({ type: 'success', title, message, ...options });
  },

  error(message, title = 'Error', options = {}) {
    return this.show({ type: 'error', title, message, ...options });
  },

  info(message, title = 'Info', options = {}) {
    return this.show({ type: 'info', title, message, ...options });
  },

  warning(message, title = 'Warning', options = {}) {
    return this.show({ type: 'warning', title, message, ...options });
  }
};

// Make Toast globally available
window.Toast = Toast;
