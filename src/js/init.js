// تهيئة البيانات الأولية والاختبار
async function initializeSampleData() {
  try {
    const app = window.app;
    
    // فروع العينة
    const sampleBranches = [
      {
        name: 'الرياض - الرئيسي',
        org: '',
        manager: 'محمد السعود',
        phone: '+966501234567',
        email: 'riyadh@grocery.com',
        address: 'حي العليا، الرياض'
      },
      {
        name: 'جدة - الشمال',
        org: '',
        manager: 'أحمد الغامدي',
        phone: '+966502345678',
        email: 'jeddah@grocery.com',
        address: 'حي البلد، جدة'
      },
      {
        name: 'الدمام',
        org: '',
        manager: 'علي القحطاني',
        phone: '+966503456789',
        email: 'dammam@grocery.com',
        address: 'حي الدفان، الدمام'
      }
    ];

    // موظفو العينة
    const sampleEmployees = [
      {
        name: 'محمد أحمد',
        nationality: 'سعودي',
        position: 'مدير الفرع',
        branchId: sampleBranches[0].id || 'B1',
        phone: '+966501111111',
        email: 'mohammed@grocery.com',
        iqama: '2123456789',
        status: 'active'
      },
      {
        name: 'فاطمة علي',
        nationality: 'سعودية',
        position: 'أمينة الصندوق',
        branchId: sampleBranches[0].id || 'B1',
        phone: '+966502222222',
        email: 'fatima@grocery.com',
        iqama: '2234567890',
        status: 'active'
      },
      {
        name: 'خالد محمود',
        nationality: 'مصري',
        position: 'عامل متجر',
        branchId: sampleBranches[1].id || 'B2',
        phone: '+966503333333',
        email: 'khaled@grocery.com',
        iqama: '2345678901',
        status: 'active'
      }
    ];

    // مستندات العينة
    const sampleDocuments = [
      {
        ownerType: 'branch',
        ownerId: sampleBranches[0].id || 'B1',
        documentType: 'السجل التجاري',
        documentNumber: 'CR-2023-001234',
        issueDate: '2023-01-15',
        expireDate: '2026-01-14',
        status: 'active'
      },
      {
        ownerType: 'employee',
        ownerId: sampleEmployees[0].id || 'E1',
        documentType: 'الإقامة',
        documentNumber: '2123456789',
        issueDate: '2022-06-20',
        expireDate: '2025-06-19',
        status: 'active'
      },
      {
        ownerType: 'employee',
        ownerId: sampleEmployees[2].id || 'E3',
        documentType: 'رخصة العمل',
        documentNumber: 'WP-2023-005678',
        issueDate: '2023-03-01',
        expireDate: '2024-12-31',
        status: 'expiring'
      }
    ];

    // إدراج البيانات
    console.log('📥 جاري إضافة بيانات العينة...');
    
    for (const branch of sampleBranches) {
      await app.dataManager.add('branches', branch);
    }
    
    for (const employee of sampleEmployees) {
      await app.dataManager.add('employees', employee);
    }
    
    for (const document of sampleDocuments) {
      await app.dataManager.add('documents', document);
    }
    
    console.log('✅ تم إضافة بيانات العينة بنجاح');
    
    // إعادة تحميل البيانات
    await app.loadData();
    app.updateStatistics();
    
    app.showNotification('تم تحميل بيانات العينة بنجاح', 'success');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة بيانات العينة:', error);
  }
}

// تهيئة إضافية عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 تم تحميل الصفحة');
  
  // يمكن إضافة بيانات العينة تلقائياً إذا لم تكن موجودة
  setTimeout(() => {
    if (window.app && window.app.stateManager) {
      const branches = window.app.stateManager.getState('data.branches');
      if (branches.length === 0) {
        console.log('📌 البيانات فارغة، سيتم إضافة بيانات العينة');
        initializeSampleData();
      }
    }
  }, 1000);
});

// معالجات الخطأ العام
window.addEventListener('error', (event) => {
  console.error('❌ خطأ في التطبيق:', event.error);
  if (window.app) {
    window.app.showNotification('حدث خطأ في التطبيق', 'error');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise مرفوضة:', event.reason);
  if (window.app) {
    window.app.showNotification('حدث خطأ في العملية', 'error');
  }
});

// تصدير الدوال للاستخدام العام
window.GroceryApp = {
  initializeSampleData,
  getApp: () => window.app,
  getDataManager: () => window.app?.dataManager,
  getStateManager: () => window.app?.stateManager,
  getNotificationSystem: () => window.app?.notificationSystem
};

console.log('✨ نظام إدارة البقالات جاهز للاستخدام');
console.log('استخدم: GroceryApp.initializeSampleData() لإضافة بيانات تجريبية');
