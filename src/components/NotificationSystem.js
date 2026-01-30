// نظام الإشعارات والتنبيهات
class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  notify(message, type = 'info', duration = 3000) {
    const notification = {
      id: `notif_${Date.now()}`,
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    this.notifications.push(notification);
    this.listeners.forEach(listener => listener(notification));

    if (duration > 0) {
      setTimeout(() => this.dismiss(notification.id), duration);
    }

    return notification;
  }

  dismiss(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.listeners.forEach(listener => listener({ action: 'dismiss', id }));
  }

  success(message, duration) {
    return this.notify(message, 'success', duration);
  }

  error(message, duration) {
    return this.notify(message, 'error', duration);
  }

  warning(message, duration) {
    return this.notify(message, 'warning', duration);
  }

  info(message, duration) {
    return this.notify(message, 'info', duration);
  }

  getAll() {
    return [...this.notifications];
  }

  getUnread() {
    return this.notifications.filter(n => !n.read);
  }

  markAsRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.listeners.forEach(listener => listener({ action: 'read', id }));
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  clear() {
    this.notifications = [];
    this.listeners.forEach(listener => listener({ action: 'clear' }));
  }
}

// مكون عرض الإشعارات
class NotificationToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const notification = this.getAttribute('notification');
    const type = this.getAttribute('type') || 'info';
    const message = this.getAttribute('message') || '';

    const colors = {
      success: '#00d084',
      error: '#ff4444',
      warning: '#ffaa00',
      info: '#0088ff'
    };

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast {
          background: rgba(20, 20, 20, 0.95);
          border: 2px solid ${colors[type]};
          border-radius: 8px;
          padding: 16px;
          color: white;
          font-family: 'Cairo', sans-serif;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .icon {
          font-weight: bold;
          font-size: 20px;
          color: ${colors[type]};
          flex-shrink: 0;
        }

        .content {
          flex: 1;
        }

        .close-btn {
          background: none;
          border: none;
          color: ${colors[type]};
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          margin: 0;
        }
      </style>

      <div class="toast">
        <div class="icon">${icons[type]}</div>
        <div class="content">${message}</div>
        <button class="close-btn">×</button>
      </div>
    `;

    this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => {
      this.remove();
    });
  }
}

customElements.define('notification-toast', NotificationToast);

window.NotificationSystem = NotificationSystem;
window.NotificationToast = NotificationToast;
