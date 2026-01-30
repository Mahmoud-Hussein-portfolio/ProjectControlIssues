/**
 * تطبيق إدارة مجموعة البقالات الرئيسي المحدّث
 * Updated Main Grocery Management Application
 */

class GroceryManagementApp {
  constructor() {
    this.dataManager = null;
    this.apiService = null;
    this.stateManager = null;
    this.notificationSystem = null;
    this.currentPage = 'dashboard';
    this.pages = {};
    this.charts = {};
  }

  async init() {
    try {
      console.log('🚀 جاري تهيئة التطبيق...');
      
      // تهيئة الخدمات
      this.dataManager = new DataManager();
      await this.dataManager.initDB();
      
      this.apiService = new APIService();
      this.stateManager = new StateManager();
      
      // تحضير الـ DOM
      this.setupEventListeners();
      this.setupNavigation();
      this.loadTheme();
      
      // تهيئة الصفحات
      await this.initPages();
      
      // تحميل البيانات الأولية
      await this.initializeSampleData();
      
      // الذهاب لصفحة التحكم
      this.navigateTo('dashboard');
      
      console.log('✅ تم تهيئة التطبيق بنجاح');
      this.notify('مرحباً بك في نظام إدارة البقالات الموحد!', 'success');
      
    } catch (error) {
      console.error('❌ خطأ في التهيئة:', error);
      this.notify('حدث خطأ في تحميل التطبيق', 'error');
    }
  }

  async initPages() {
    console.log('📄 تهيئة الصفحات...');
    
    this.pages = {
      dashboard: new DashboardPage(this),
      branches: new BranchesPage(this),
      employees: new EmployeesPage(this),
      documents: new DocumentsPage(this),
      reports: new ReportsPage(this)
    };

    // تهيئة جميع الصفحات
    for (const [name, page] of Object.entries(this.pages)) {
      try {
        await page.init();
        console.log(`✓ تم تهيئة صفحة: ${name}`);
      } catch (error) {
        console.error(`✗ خطأ في تهيئة صفحة ${name}:`, error);
      }
    }
  }

  setupEventListeners() {
    // تبديل الشريط الجانبي
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar?.classList.toggle('mobile-hidden');
      });
    }

    // تبديل المظهر (Dark/Light)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // البحث في لوحة التحكم
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.globalSearch(e.target.value));
    }

    // تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('[data-page]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = item.getAttribute('data-page');
        this.navigateTo(pageId);
      });
    });
  }

  async navigateTo(pageId) {
    console.log(`🔄 الانتقال إلى الصفحة: ${pageId}`);
    
    this.currentPage = pageId;
    
    // تحديث الملاحة النشطة
    document.querySelectorAll('[data-page]').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      }
    });

    // إخفاء جميع الأقسام
    document.querySelectorAll('[data-section]').forEach(section => {
      section.style.display = 'none';
    });

    // عرض القسم المناسب
    const section = document.querySelector(`[data-section="${pageId}"]`);
    if (section) {
      section.style.display = 'block';
      
      // تحديث الصفحة
      const page = this.pages[pageId];
      if (page && page.init) {
        try {
          await page.init();
        } catch (error) {
          console.error(`خطأ في تحميل صفحة ${pageId}:`, error);
          this.notify('حدث خطأ في تحميل الصفحة', 'error');
        }
      }
    }
  }

  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    this.notify(`تم تبديل المظهر إلى ${newTheme === 'dark' ? 'المظهر الداكن' : 'المظهر الفاتح'}`, 'info');
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  notify(message, type = 'info') {
    // إنشاء إشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // إزالة الإشعار بعد 3 ثواني
    const timeout = setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);

    // إزالة عند النقر على الإغلاق
    notification.querySelector('.notification-close').addEventListener('click', () => {
      clearTimeout(timeout);
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    });
  }

  globalSearch(query) {
    if (query.length < 2) return;
    
    console.log(`🔍 بحث: ${query}`);
    
    // يمكن تطويره لاحقاً للبحث الشامل
  }

  async logout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
      this.notify('تم تسجيل الخروج بنجاح', 'success');
      // إعادة توجيه لصفحة تسجيل الدخول
      window.location.href = '/login';
    }
  }

  async initializeSampleData() {
    try {
      const branches = await this.dataManager.getAll('branches');
      
      // إذا كانت البيانات موجودة بالفعل، لا تضف بيانات جديدة
      if (branches.length > 0) {
        console.log('📊 البيانات موجودة بالفعل');
        return;
      }

      console.log('📝 جاري إضافة البيانات الأولية...');

      // إضافة فروع
      const branchesData = [
        {
          id: 'branch_1',
          name: 'فرع الرياض',
          organization: 'مؤسسة البقالة الموحدة',
          manager: 'محمد أحمد',
          location: 'الرياض - حي الملز',
          phone: '+966501234567',
          email: 'riyadh@grocery.sa',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'branch_2',
          name: 'فرع جدة',
          organization: 'مؤسسة البقالة الموحدة',
          manager: 'علي محمود',
          location: 'جدة - حي الشاطئ',
          phone: '+966502345678',
          email: 'jeddah@grocery.sa',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'branch_3',
          name: 'فرع الدمام',
          organization: 'مؤسسة البقالة الموحدة',
          manager: 'فهد علي',
          location: 'الدمام - حي الخليج',
          phone: '+966503456789',
          email: 'dammam@grocery.sa',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      for (const branch of branchesData) {
        await this.dataManager.add('branches', branch);
      }

      // إضافة موظفين
      const employeesData = [
        {
          name: 'أحمد حسن',
          position: 'مدير عام',
          department: 'الإدارة',
          branchId: 'branch_1',
          phone: '+966501111111',
          email: 'ahmed@grocery.sa',
          hireDate: new Date('2022-01-15').toISOString(),
          salary: 8000,
          idNumber: '1234567890',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          name: 'فاطمة محمد',
          position: 'مسؤول المستودع',
          department: 'المستودع',
          branchId: 'branch_1',
          phone: '+966502222222',
          email: 'fatima@grocery.sa',
          hireDate: new Date('2021-06-20').toISOString(),
          salary: 5500,
          idNumber: '0987654321',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          name: 'سارة علي',
          position: 'أمين صندوق',
          department: 'المبيعات',
          branchId: 'branch_2',
          phone: '+966503333333',
          email: 'sarah@grocery.sa',
          hireDate: new Date('2022-03-10').toISOString(),
          salary: 4500,
          idNumber: '5555555555',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      for (const employee of employeesData) {
        await this.dataManager.add('employees', employee);
      }

      // إضافة مستندات
      const documentsData = [
        {
          type: 'رخصة البلدية',
          number: 'BM-2024-001',
          branchId: 'branch_1',
          issueDate: new Date('2023-01-01').toISOString(),
          expiryDate: new Date('2024-12-31').toISOString(),
          responsible: 'محمد أحمد',
          status: 'approved',
          notes: 'رخصة البلدية صالحة',
          createdAt: new Date().toISOString()
        },
        {
          type: 'السجل التجاري',
          number: 'TC-2024-001',
          branchId: 'branch_1',
          issueDate: new Date('2022-01-15').toISOString(),
          expiryDate: new Date('2025-01-14').toISOString(),
          responsible: 'محمد أحمد',
          status: 'approved',
          notes: 'السجل التجاري نشط',
          createdAt: new Date().toISOString()
        },
        {
          type: 'التأمينات الاجتماعية',
          number: 'GOSI-2024-001',
          branchId: 'branch_2',
          issueDate: new Date('2023-06-01').toISOString(),
          expiryDate: new Date('2024-05-31').toISOString(),
          responsible: 'علي محمود',
          status: 'pending',
          notes: 'قيد التحديث',
          createdAt: new Date().toISOString()
        }
      ];

      for (const document of documentsData) {
        await this.dataManager.add('documents', document);
      }

      console.log('✅ تم إضافة البيانات الأولية بنجاح');
      this.notify('تم تحميل البيانات الأولية', 'success');

    } catch (error) {
      console.error('خطأ في إضافة البيانات الأولية:', error);
    }
  }
}

// تصدير التطبيق
window.GroceryApp = GroceryManagementApp;
