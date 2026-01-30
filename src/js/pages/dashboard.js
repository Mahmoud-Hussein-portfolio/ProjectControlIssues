/**
 * لوحة التحكم الرئيسية
 * Dashboard - Main Control Panel
 */

class DashboardPage {
  constructor(app) {
    this.app = app;
    this.charts = {};
    this.refreshInterval = null;
  }

  async init() {
    console.log('📊 تهيئة لوحة التحكم...');
    await this.loadData();
    this.renderStatistics();
    this.initCharts();
    this.startAutoRefresh();
  }

  async loadData() {
    this.branches = await this.app.dataManager.getAll('branches');
    this.employees = await this.app.dataManager.getAll('employees');
    this.documents = await this.app.dataManager.getAll('documents');
  }

  renderStatistics() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    const stats = {
      totalBranches: this.branches.length,
      totalEmployees: this.employees.length,
      activeDocuments: this.documents.filter(d => !d.expired).length,
      expiredDocuments: this.documents.filter(d => d.expired).length,
      pendingDocuments: this.documents.filter(d => d.status === 'pending').length
    };

    const statsHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <i class="fas fa-store"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.totalBranches}</div>
            <div class="stat-label">إجمالي الفروع</div>
          </div>
          <div class="stat-trend positive">↑ 12%</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.totalEmployees}</div>
            <div class="stat-label">إجمالي الموظفين</div>
          </div>
          <div class="stat-trend positive">↑ 8%</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <i class="fas fa-file-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.activeDocuments}</div>
            <div class="stat-label">مستندات صالحة</div>
          </div>
          <div class="stat-trend positive">↑ 5%</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">${stats.expiredDocuments}</div>
            <div class="stat-label">مستندات منتهية</div>
          </div>
          <div class="stat-trend negative">↓ 3%</div>
        </div>
      </div>
    `;

    statsContainer.innerHTML = statsHTML;
  }

  initCharts() {
    // الرسم البياني لتوزيع الفروع
    this.initBranchesChart();
    
    // الرسم البياني للموظفين حسب القسم
    this.initEmployeesChart();
    
    // الرسم البياني لحالة المستندات
    this.initDocumentsChart();
    
    // الرسم البياني للنشاط الشهري
    this.initActivityChart();
  }

  initBranchesChart() {
    const canvas = document.getElementById('branchesChart');
    if (!canvas) return;

    const branchNames = this.branches.map(b => b.name);
    const branchEmployees = this.branches.map(b => 
      this.employees.filter(e => e.branchId === b.id).length
    );

    this.charts.branches = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: branchNames,
        datasets: [{
          label: 'عدد الموظفين',
          data: branchEmployees,
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(240, 147, 251, 0.8)',
            'rgba(79, 172, 254, 0.8)',
            'rgba(250, 112, 154, 0.8)'
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(240, 147, 251, 1)',
            'rgba(79, 172, 254, 1)',
            'rgba(250, 112, 154, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top', rtl: true },
          title: { display: true, text: 'توزيع الموظفين على الفروع' }
        },
        scales: {
          y: { beginAtZero: true, grid: { drawBorder: false, color: 'rgba(200, 200, 200, 0.1)' } }
        }
      }
    });
  }

  initEmployeesChart() {
    const canvas = document.getElementById('employeesChart');
    if (!canvas) return;

    const departments = [...new Set(this.employees.map(e => e.department))];
    const deptCounts = departments.map(dept => 
      this.employees.filter(e => e.department === dept).length
    );

    this.charts.employees = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: departments,
        datasets: [{
          data: deptCounts,
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(240, 147, 251, 0.8)',
            'rgba(79, 172, 254, 0.8)',
            'rgba(250, 112, 154, 0.8)',
            'rgba(245, 87, 108, 0.8)'
          ],
          borderColor: '#fff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', rtl: true },
          tooltip: { direction: 'rtl' }
        }
      }
    });
  }

  initDocumentsChart() {
    const canvas = document.getElementById('documentsChart');
    if (!canvas) return;

    const statuses = ['approved', 'pending', 'expired'];
    const statusCounts = [
      this.documents.filter(d => d.status === 'approved').length,
      this.documents.filter(d => d.status === 'pending').length,
      this.documents.filter(d => d.status === 'expired').length
    ];

    this.charts.documents = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['موافق عليها', 'قيد الانتظار', 'منتهية الصلاحية'],
        datasets: [{
          data: statusCounts,
          backgroundColor: [
            'rgba(79, 172, 254, 0.8)',
            'rgba(250, 180, 73, 0.8)',
            'rgba(245, 87, 108, 0.8)'
          ],
          borderColor: '#fff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', rtl: true }
        }
      }
    });
  }

  initActivityChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;

    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    const activityData = [45, 52, 48, 61, 55, 67];
    const documentData = [23, 29, 31, 38, 35, 42];

    this.charts.activity = new Chart(canvas, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'الأنشطة',
            data: activityData,
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgba(102, 126, 234, 1)'
          },
          {
            label: 'المستندات',
            data: documentData,
            borderColor: 'rgba(240, 147, 251, 1)',
            backgroundColor: 'rgba(240, 147, 251, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: 'rgba(240, 147, 251, 1)'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', rtl: true }
        },
        scales: {
          y: { beginAtZero: true, grid: { drawBorder: false, color: 'rgba(200, 200, 200, 0.1)' } }
        }
      }
    });
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadData();
      this.renderStatistics();
      this.updateCharts();
    }, 30000); // تحديث كل 30 ثانية
  }

  updateCharts() {
    // تحديث البيانات في الرسوم البيانية
    if (this.charts.branches) {
      this.charts.branches.data.datasets[0].data = this.branches.map(b => 
        this.employees.filter(e => e.branchId === b.id).length
      );
      this.charts.branches.update();
    }
  }

  destroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    Object.values(this.charts).forEach(chart => chart?.destroy?.());
  }
}

export default DashboardPage;
