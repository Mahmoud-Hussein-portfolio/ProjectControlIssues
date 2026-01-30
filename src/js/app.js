// تطبيق إدارة البقالات - الملف الرئيسي
class GroceryManagementApp {
  constructor() {
    this.dataManager = null;
    this.apiService = null;
    this.stateManager = null;
    this.notificationSystem = null;
    this.currentPage = 'dashboard';
    this.charts = {};
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 جاري تهيئة التطبيق...');
      
      // تهيئة الخدمات
      this.dataManager = new DataManager();
      await this.dataManager.initDB();
      
      this.apiService = new APIService();
      this.stateManager = new StateManager();
      this.notificationSystem = new NotificationSystem();
      
      // تحضير الـ DOM
      this.setupEventListeners();
      this.setupNavigation();
      this.loadTheme();
      
      // تحميل البيانات
      await this.loadData();
      
      // تهيئة لوحة القيادة
      this.initDashboard();
      
      console.log('✅ تم تهيئة التطبيق بنجاح');
      this.notificationSystem.success('مرحباً بك في نظام إدارة البقالات!', 2000);
      
    } catch (error) {
      console.error('❌ خطأ في التهيئة:', error);
      this.notificationSystem.error('حدث خطأ في تحميل التطبيق');
    }
  }

  setupEventListeners() {
    // تبديل الشريط الجانبي
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar?.classList.toggle('mobile-hidden');
    });

    // تبديل الثيم
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // البحث الشامل
    document.getElementById('globalSearch')?.addEventListener('input', (e) => {
      this.globalSearch(e.target.value);
    });

    // زر الإشعارات
    document.getElementById('notificationBtn')?.addEventListener('click', () => {
      this.showNotifications();
    });
  }

  setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.style.display = 'none';
    });

    // إزالة الحالة النشطة من الأزرار
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.classList.remove('active');
    });

    // إظهار الصفحة المختارة
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
      pageElement.classList.add('active');
      pageElement.style.display = 'block';
      
      // تفعيل الزر
      document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
      
      // استدعاء دالة التهيئة الخاصة بالصفحة
      const initMethod = `init${page.charAt(0).toUpperCase() + page.slice(1)}`;
      if (typeof this[initMethod] === 'function') {
        this[initMethod]();
      }
      
      this.currentPage = page;
      this.stateManager.setState('ui.currentPage', page);
    }
  }

  async loadData() {
    try {
      // تحميل البيانات من قاعدة البيانات
      const branches = await this.dataManager.getAll('branches');
      const employees = await this.dataManager.getAll('employees');
      const documents = await this.dataManager.getAll('documents');
      const notifications = await this.dataManager.getAll('notifications');
      
      this.stateManager.setState('data.branches', branches);
      this.stateManager.setState('data.employees', employees);
      this.stateManager.setState('data.documents', documents);
      this.stateManager.setState('data.notifications', notifications);
      
      console.log('📊 تم تحميل البيانات:', {
        branches: branches.length,
        employees: employees.length,
        documents: documents.length
      });
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات:', error);
    }
  }

  initDashboard() {
    // تحديث الإحصائيات
    this.updateStatistics();

    // تهيئة الرسوم البيانية
    this.initCharts();

    // تحميل آخر النشاطات
    this.loadRecentActivity();
  }

  updateStatistics() {
    const branches = this.stateManager.getState('data.branches');
    const employees = this.stateManager.getState('data.employees');
    const documents = this.stateManager.getState('data.documents');
    const notifications = this.stateManager.getState('data.notifications');

    document.getElementById('statBranches').textContent = branches.length;
    document.getElementById('statEmployees').textContent = employees.length;
    document.getElementById('statDocuments').textContent = documents.length;
    document.getElementById('statAlerts').textContent = notifications.filter(n => !n.read).length;
    document.getElementById('notificationBadge').textContent = 
      notifications.filter(n => !n.read).length;
  }

  initCharts() {
    // رسم توزيع الموظفين حسب الفروع
    const branchChartCanvas = document.getElementById('branchChart');
    if (branchChartCanvas) {
      const branches = this.stateManager.getState('data.branches');
      const employees = this.stateManager.getState('data.employees');

      const branchNames = branches.map(b => b.name);
      const branchCounts = branches.map(b => 
        employees.filter(e => e.branchId === b.id).length
      );

      this.charts.branch = new Chart(branchChartCanvas, {
        type: 'doughnut',
        data: {
          labels: branchNames,
          datasets: [{
            data: branchCounts,
            backgroundColor: [
              'rgba(0, 208, 132, 0.8)',
              'rgba(0, 136, 255, 0.8)',
              'rgba(255, 170, 0, 0.8)',
              'rgba(255, 68, 68, 0.8)',
              'rgba(197, 160, 89, 0.8)',
              'rgba(100, 150, 255, 0.8)',
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'rgba(255, 255, 255, 0.8)',
                font: { family: "'Cairo', sans-serif" }
              }
            }
          }
        }
      });
    }

    // رسم حالة المستندات
    const docsChartCanvas = document.getElementById('documentsChart');
    if (docsChartCanvas) {
      const documents = this.stateManager.getState('data.documents');
      const now = new Date();
      
      let active = 0, expiring = 0, expired = 0;
      
      documents.forEach(doc => {
        if (!doc.expireDate) {
          active++;
        } else {
          const days = Math.ceil((new Date(doc.expireDate) - now) / 86400000);
          if (days < 0) expired++;
          else if (days < 30) expiring++;
          else active++;
        }
      });

      this.charts.documents = new Chart(docsChartCanvas, {
        type: 'bar',
        data: {
          labels: ['ساري', 'قريب الانتهاء', 'منتهي'],
          datasets: [{
            label: 'عدد المستندات',
            data: [active, expiring, expired],
            backgroundColor: [
              'rgba(0, 208, 132, 0.8)',
              'rgba(255, 170, 0, 0.8)',
              'rgba(255, 68, 68, 0.8)'
            ],
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              ticks: { color: 'rgba(255, 255, 255, 0.8)' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
              ticks: { color: 'rgba(255, 255, 255, 0.8)' },
              grid: { display: false }
            }
          }
        }
      });
    }
  }

  loadRecentActivity() {
    const logs = [];
    // هنا يمكن تحميل السجلات الفعلية
    
    const activityContainer = document.getElementById('recentActivity');
    if (activityContainer) {
      if (logs.length === 0) {
        activityContainer.innerHTML = `
          <div class="activity-item">
            <i class="fas fa-info-circle text-blue-400"></i>
            <span>لا توجد نشاطات حتى الآن</span>
          </div>
        `;
      } else {
        activityContainer.innerHTML = logs.map(log => `
          <div class="activity-item">
            <i class="fas fa-${log.icon}"></i>
            <div>
              <div class="activity-title">${log.title}</div>
              <div class="activity-time">${log.time}</div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  toggleTheme() {
    this.stateManager.toggleTheme();
    const theme = this.stateManager.getState('user.theme');
    localStorage.setItem('user_theme', theme);
    
    const icon = document.getElementById('themeToggle')?.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('user_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.stateManager.setState('user.theme', savedTheme);
    
    const icon = document.getElementById('themeToggle')?.querySelector('i');
    if (icon) {
      icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  globalSearch(query) {
    console.log('🔍 البحث عن:', query);
    // سيتم تطبيق البحث في كل الصفحات
  }

  showNotifications() {
    const notifications = this.notificationSystem.getAll();
    console.log('📬 الإشعارات:', notifications);
    // سيتم عرض نافذة الإشعارات
  }

  showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const toast = document.createElement('notification-toast');
    toast.setAttribute('message', message);
    toast.setAttribute('type', type);
    document.getElementById('notificationContainer').appendChild(toast);

    // إزالة تلقائية بعد الرسوم المتحركة
    setTimeout(() => toast.remove(), 4000);
  }
}

// تشغيل التطبيق
window.app = new GroceryManagementApp();
