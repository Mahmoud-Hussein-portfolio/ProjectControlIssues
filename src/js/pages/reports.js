/**
 * صفحة التقارير المتقدمة
 * Advanced Reports Page
 */

class ReportsPage {
  constructor(app) {
    this.app = app;
    this.data = {
      branches: [],
      employees: [],
      documents: []
    };
  }

  async init() {
    console.log('📊 تهيئة صفحة التقارير...');
    await this.loadData();
    this.setupEventListeners();
    this.renderReportsList();
  }

  async loadData() {
    this.data.branches = await this.app.dataManager.getAll('branches');
    this.data.employees = await this.app.dataManager.getAll('employees');
    this.data.documents = await this.app.dataManager.getAll('documents');
  }

  setupEventListeners() {
    const generateBtn = document.getElementById('generateReportBtn');
    const reportTypeSelect = document.getElementById('reportType');
    const exportBtn = document.getElementById('exportReportBtn');

    if (generateBtn) generateBtn.addEventListener('click', () => this.generateReport());
    if (reportTypeSelect) reportTypeSelect.addEventListener('change', (e) => this.onReportTypeChange(e.target.value));
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportCurrentReport());
  }

  renderReportsList() {
    const container = document.getElementById('reportsList');
    if (!container) return;

    const reportsHTML = `
      <div class="reports-grid">
        <div class="report-card" onclick="app.pages.reports.showReport('branches-summary')">
          <div class="report-icon">📍</div>
          <h3>ملخص الفروع</h3>
          <p>إحصائيات شاملة عن جميع الفروع</p>
          <button class="btn btn-primary btn-small">عرض التقرير</button>
        </div>

        <div class="report-card" onclick="app.pages.reports.showReport('employees-summary')">
          <div class="report-icon">👥</div>
          <h3>ملخص الموظفين</h3>
          <p>بيانات الموظفين والأقسام والرواتب</p>
          <button class="btn btn-primary btn-small">عرض التقرير</button>
        </div>

        <div class="report-card" onclick="app.pages.reports.showReport('documents-status')">
          <div class="report-icon">📄</div>
          <h3>حالة المستندات</h3>
          <p>تفاصيل المستندات والصلاحيات</p>
          <button class="btn btn-primary btn-small">عرض التقرير</button>
        </div>

        <div class="report-card" onclick="app.pages.reports.showReport('expiring-documents')">
          <div class="report-icon">⚠️</div>
          <h3>المستندات قيد الانتهاء</h3>
          <p>المستندات منتهية أو قريبة الانتهاء</p>
          <button class="btn btn-primary btn-small">عرض التقرير</button>
        </div>

        <div class="report-card" onclick="app.pages.reports.showReport('payroll-report')">
          <div class="report-icon">💰</div>
          <h3>تقرير الرواتب</h3>
          <p>حساب الرواتب الإجمالية والبيانات المالية</p>
          <button class="btn btn-primary btn-small">عرض التقرير</button>
        </div>

        <div class="report-card" onclick="app.pages.reports.showReport('custom-report')">
          <div class="report-icon">⚙️</div>
          <h3>تقرير مخصص</h3>
          <p>إنشاء تقرير حسب احتياجاتك</p>
          <button class="btn btn-primary btn-small">إنشاء تقرير</button>
        </div>
      </div>
    `;

    container.innerHTML = reportsHTML;
  }

  async showReport(reportType) {
    console.log(`📋 عرض التقرير: ${reportType}`);
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;

    let html = '';

    switch (reportType) {
      case 'branches-summary':
        html = this.generateBranchesSummary();
        break;
      case 'employees-summary':
        html = this.generateEmployeesSummary();
        break;
      case 'documents-status':
        html = this.generateDocumentsStatus();
        break;
      case 'expiring-documents':
        html = this.generateExpiringDocuments();
        break;
      case 'payroll-report':
        html = this.generatePayrollReport();
        break;
      default:
        html = '<p>اختر تقرير</p>';
    }

    reportContent.innerHTML = html;
  }

  generateBranchesSummary() {
    const totalBranches = this.data.branches.length;
    const activeBranches = this.data.branches.filter(b => b.active).length;
    const totalEmployees = this.data.employees.length;

    const branchDetails = this.data.branches.map(branch => {
      const branchEmployees = this.data.employees.filter(e => e.branchId === branch.id);
      return `
        <tr>
          <td>${branch.name}</td>
          <td>${branch.manager}</td>
          <td>${branchEmployees.length}</td>
          <td>${branch.location}</td>
          <td><span class="status-badge ${branch.active ? 'active' : 'inactive'}">${branch.active ? 'نشط' : 'معطل'}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div class="report-header">
        <h2>ملخص الفروع</h2>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
      <div class="report-stats">
        <div class="stat">
          <span class="stat-label">إجمالي الفروع</span>
          <span class="stat-value">${totalBranches}</span>
        </div>
        <div class="stat">
          <span class="stat-label">الفروع النشطة</span>
          <span class="stat-value">${activeBranches}</span>
        </div>
        <div class="stat">
          <span class="stat-label">إجمالي الموظفين</span>
          <span class="stat-value">${totalEmployees}</span>
        </div>
      </div>
      <div class="report-table">
        <table>
          <thead>
            <tr>
              <th>اسم الفرع</th>
              <th>المدير</th>
              <th>عدد الموظفين</th>
              <th>الموقع</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${branchDetails}
          </tbody>
        </table>
      </div>
    `;
  }

  generateEmployeesSummary() {
    const totalEmployees = this.data.employees.length;
    const departments = [...new Set(this.data.employees.map(e => e.department))];
    const totalSalaries = this.data.employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const avgSalary = totalSalaries / totalEmployees;

    const deptDetails = departments.map(dept => {
      const deptEmployees = this.data.employees.filter(e => e.department === dept);
      const deptSalaries = deptEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
      return `
        <tr>
          <td>${dept}</td>
          <td>${deptEmployees.length}</td>
          <td>${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(deptSalaries)}</td>
          <td>${(deptSalaries / deptEmployees.length).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="report-header">
        <h2>ملخص الموظفين</h2>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
      <div class="report-stats">
        <div class="stat">
          <span class="stat-label">إجمالي الموظفين</span>
          <span class="stat-value">${totalEmployees}</span>
        </div>
        <div class="stat">
          <span class="stat-label">عدد الأقسام</span>
          <span class="stat-value">${departments.length}</span>
        </div>
        <div class="stat">
          <span class="stat-label">إجمالي الرواتب الشهرية</span>
          <span class="stat-value">${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(totalSalaries)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">متوسط الراتب</span>
          <span class="stat-value">${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(avgSalary)}</span>
        </div>
      </div>
      <div class="report-table">
        <table>
          <thead>
            <tr>
              <th>القسم</th>
              <th>عدد الموظفين</th>
              <th>إجمالي الرواتب</th>
              <th>متوسط الراتب</th>
            </tr>
          </thead>
          <tbody>
            ${deptDetails}
          </tbody>
        </table>
      </div>
    `;
  }

  generateDocumentsStatus() {
    const totalDocs = this.data.documents.length;
    const approvedDocs = this.data.documents.filter(d => d.status === 'approved').length;
    const pendingDocs = this.data.documents.filter(d => d.status === 'pending').length;
    const expiredDocs = this.data.documents.filter(d => d.status === 'expired').length;

    const docDetails = this.data.documents.map(doc => {
      const expiryDate = new Date(doc.expiryDate);
      const daysLeft = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      const statusLabel = daysLeft < 0 ? 'منتهي' : daysLeft < 30 ? 'قيد الانتهاء' : 'صالح';
      
      return `
        <tr>
          <td>${doc.type}</td>
          <td>${doc.number}</td>
          <td>${expiryDate.toLocaleDateString('ar-SA')}</td>
          <td>${daysLeft >= 0 ? daysLeft + ' يوم' : 'منتهي'}</td>
          <td><span class="status-badge ${statusLabel === 'صالح' ? 'active' : statusLabel === 'قيد الانتهاء' ? 'warning' : 'expired'}">${statusLabel}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div class="report-header">
        <h2>حالة المستندات</h2>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
      <div class="report-stats">
        <div class="stat">
          <span class="stat-label">إجمالي المستندات</span>
          <span class="stat-value">${totalDocs}</span>
        </div>
        <div class="stat">
          <span class="stat-label">موافق عليها</span>
          <span class="stat-value">${approvedDocs}</span>
        </div>
        <div class="stat">
          <span class="stat-label">قيد الانتظار</span>
          <span class="stat-value">${pendingDocs}</span>
        </div>
        <div class="stat">
          <span class="stat-label">منتهية الصلاحية</span>
          <span class="stat-value">${expiredDocs}</span>
        </div>
      </div>
      <div class="report-table">
        <table>
          <thead>
            <tr>
              <th>نوع المستند</th>
              <th>الرقم</th>
              <th>تاريخ الانتهاء</th>
              <th>الأيام المتبقية</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${docDetails}
          </tbody>
        </table>
      </div>
    `;
  }

  generateExpiringDocuments() {
    const today = new Date();
    const expiringDocs = this.data.documents.filter(doc => {
      const expiryDate = new Date(doc.expiryDate);
      const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 90;
    }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const docDetails = expiringDocs.map(doc => {
      const expiryDate = new Date(doc.expiryDate);
      const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      const urgency = daysLeft < 30 ? 'عاجل' : daysLeft < 60 ? 'مهم' : 'عادي';
      
      return `
        <tr>
          <td>${doc.type}</td>
          <td>${doc.number}</td>
          <td>${expiryDate.toLocaleDateString('ar-SA')}</td>
          <td>${daysLeft} يوم</td>
          <td>${doc.responsible}</td>
          <td><span class="status-badge ${daysLeft < 30 ? 'expired' : 'warning'}">${urgency}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div class="report-header">
        <h2>المستندات قيد الانتهاء (90 يوم القادمة)</h2>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
      <div class="report-stats">
        <div class="stat">
          <span class="stat-label">إجمالي المستندات</span>
          <span class="stat-value">${expiringDocs.length}</span>
        </div>
        <div class="stat">
          <span class="stat-label">عاجلة (أقل من 30 يوم)</span>
          <span class="stat-value">${expiringDocs.filter(d => {
            const daysLeft = Math.floor((new Date(d.expiryDate) - today) / (1000 * 60 * 60 * 24));
            return daysLeft < 30;
          }).length}</span>
        </div>
      </div>
      <div class="report-table">
        <table>
          <thead>
            <tr>
              <th>نوع المستند</th>
              <th>الرقم</th>
              <th>تاريخ الانتهاء</th>
              <th>الأيام المتبقية</th>
              <th>المسؤول</th>
              <th>الأولوية</th>
            </tr>
          </thead>
          <tbody>
            ${docDetails}
          </tbody>
        </table>
      </div>
    `;
  }

  generatePayrollReport() {
    const totalSalaries = this.data.employees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const avgSalary = totalSalaries / this.data.employees.length;
    const maxSalary = Math.max(...this.data.employees.map(e => e.salary || 0));
    const minSalary = Math.min(...this.data.employees.map(e => e.salary || 0));

    const branches = this.data.branches.map(branch => {
      const branchEmployees = this.data.employees.filter(e => e.branchId === branch.id);
      const branchSalaries = branchEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
      return `
        <tr>
          <td>${branch.name}</td>
          <td>${branchEmployees.length}</td>
          <td>${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(branchSalaries)}</td>
          <td>${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(branchSalaries / branchEmployees.length)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="report-header">
        <h2>تقرير الرواتب الشهرية</h2>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
      <div class="report-stats">
        <div class="stat">
          <span class="stat-label">إجمالي الرواتب</span>
          <span class="stat-value">${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(totalSalaries)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">متوسط الراتب</span>
          <span class="stat-value">${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(avgSalary)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">أعلى راتب</span>
          <span class="stat-value">${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(maxSalary)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">أقل راتب</span>
          <span class="stat-value">${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(minSalary)}</span>
        </div>
      </div>
      <div class="report-table">
        <table>
          <thead>
            <tr>
              <th>الفرع</th>
              <th>عدد الموظفين</th>
              <th>إجمالي الرواتب</th>
              <th>متوسط الراتب</th>
            </tr>
          </thead>
          <tbody>
            ${branches}
          </tbody>
        </table>
      </div>
    `;
  }

  async exportCurrentReport() {
    // سيتم تطويره لاحقاً للتصدير إلى Excel و PDF
    this.app.notify('سيتم تطوير خاصية التصدير قريباً', 'info');
  }

  onReportTypeChange(reportType) {
    if (reportType) {
      this.showReport(reportType);
    }
  }

  generateReport() {
    const reportType = document.getElementById('reportType')?.value;
    if (reportType) {
      this.showReport(reportType);
    }
  }
}

export default ReportsPage;
