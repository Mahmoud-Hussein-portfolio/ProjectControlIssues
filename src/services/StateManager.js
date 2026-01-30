// نظام إدارة الحالة (State Management)
class StateManager {
  constructor() {
    this.state = {
      user: {
        name: 'MAHMOUD HUSSEIN',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'export'],
        theme: 'dark',
        language: 'ar'
      },
      ui: {
        sidebarOpen: true,
        notification: null,
        loading: false,
        currentPage: 'dashboard'
      },
      data: {
        branches: [],
        employees: [],
        documents: [],
        notifications: []
      }
    };
    
    this.subscribers = new Map();
  }

  // الاشتراك في تغييرات الحالة
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);
    return () => this.unsubscribe(key, callback);
  }

  // إلغاء الاشتراك
  unsubscribe(key, callback) {
    if (this.subscribers.has(key)) {
      const callbacks = this.subscribers.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // تحديث الحالة
  setState(key, value) {
    const keys = key.split('.');
    let current = this.state;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    this.notifySubscribers(key);
  }

  // الحصول على الحالة
  getState(key) {
    const keys = key.split('.');
    let current = this.state;
    
    for (const k of keys) {
      current = current[k];
    }
    
    return current;
  }

  // إخطار المشتركين
  notifySubscribers(key) {
    if (this.subscribers.has(key)) {
      const value = this.getState(key);
      this.subscribers.get(key).forEach(callback => callback(value));
    }
  }

  // إضافة إشعار
  addNotification(message, type = 'info', duration = 3000) {
    const notification = {
      id: `notif_${Date.now()}`,
      message,
      type,
      createdAt: new Date()
    };
    
    this.setState('ui.notification', notification);
    
    setTimeout(() => {
      this.setState('ui.notification', null);
    }, duration);
    
    return notification;
  }

  // تبديل الثيم
  toggleTheme() {
    const currentTheme = this.getState('user.theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setState('user.theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('user_theme', newTheme);
  }
}

window.StateManager = StateManager;
