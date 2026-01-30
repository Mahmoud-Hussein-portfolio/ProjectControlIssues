/**
 * صفحة إدارة الموظفين
 * Employees Management Page
 */

class EmployeesPage {
  constructor(app) {
    this.app = app;
    this.employees = [];
    this.branches = [];
    this.selectedEmployee = null;
    this.formMode = 'add';
  }

  async init() {
    console.log('👥 تهيئة صفحة الموظفين...');
    await this.loadData();
    this.setupEventListeners();
    this.renderTable();
  }

  async loadData() {
    this.employees = await this.app.dataManager.getAll('employees');
    this.branches = await this.app.dataManager.getAll('branches');
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addEmployeeBtn');
    const searchInput = document.getElementById('searchEmployees');
    const filterSelect = document.getElementById('filterDepartment');

    if (addBtn) addBtn.addEventListener('click', () => this.openAddModal());
    if (searchInput) searchInput.addEventListener('input', (e) => this.filterEmployees(e.target.value));
    if (filterSelect) filterSelect.addEventListener('change', (e) => this.filterByDepartment(e.target.value));
  }

  renderTable() {
    const container = document.getElementById('employeesTable');
    if (!container) return;

    const tableHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الوظيفة</th>
              <th>القسم</th>
              <th>الفرع</th>
              <th>الهاتف</th>
              <th>البريد الإلكتروني</th>
              <th>تاريخ التعيين</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${this.employees.map(emp => this.renderEmployeeRow(emp)).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHTML;
  }

  renderEmployeeRow(employee) {
    const branch = this.branches.find(b => b.id === employee.branchId);
    const statusClass = employee.active ? 'active' : 'inactive';
    const statusLabel = employee.active ? 'نشط' : 'معطل';

    return `
      <tr data-employee-id="${employee.id}">
        <td><strong>${employee.name}</strong></td>
        <td>${employee.position}</td>
        <td>${employee.department}</td>
        <td>${branch?.name || 'غير محدد'}</td>
        <td>${employee.phone}</td>
        <td>${employee.email}</td>
        <td>${new Date(employee.hireDate).toLocaleDateString('ar-SA')}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-small btn-primary" onclick="app.pages.employees.openEditModal('${employee.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-small btn-danger" onclick="app.pages.employees.deleteEmployee('${employee.id}')">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-small btn-secondary" onclick="app.pages.employees.viewDetails('${employee.id}')">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  openAddModal() {
    this.formMode = 'add';
    this.selectedEmployee = null;
    this.showModal();
  }

  async openEditModal(employeeId) {
    this.formMode = 'edit';
    this.selectedEmployee = await this.app.dataManager.get('employees', employeeId);
    this.showModal();
  }

  showModal() {
    const modal = document.getElementById('employeeModal');
    if (!modal) {
      this.createModal();
      return;
    }

    const form = modal.querySelector('form');
    if (this.formMode === 'add') {
      form.reset();
      modal.querySelector('h2').textContent = 'إضافة موظف جديد';
    } else {
      this.fillForm(this.selectedEmployee);
      modal.querySelector('h2').textContent = 'تعديل بيانات الموظف';
    }

    modal.style.display = 'flex';
  }

  fillForm(employee) {
    const form = document.getElementById('employeeForm');
    if (form) {
      form.elements['employeeName'].value = employee.name || '';
      form.elements['position'].value = employee.position || '';
      form.elements['department'].value = employee.department || '';
      form.elements['branchId'].value = employee.branchId || '';
      form.elements['phone'].value = employee.phone || '';
      form.elements['email'].value = employee.email || '';
      form.elements['hireDate'].value = employee.hireDate?.split('T')[0] || '';
      form.elements['salary'].value = employee.salary || '';
      form.elements['idNumber'].value = employee.idNumber || '';
      form.elements['active'].checked = employee.active !== false;
    }
  }

  async saveEmployee() {
    const form = document.getElementById('employeeForm');
    if (!form || !form.checkValidity()) {
      this.app.notify('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.active = form.elements['active'].checked;
    data.salary = parseFloat(data.salary) || 0;

    try {
      if (this.formMode === 'add') {
        await this.app.dataManager.add('employees', data);
        this.app.notify('تم إضافة الموظف بنجاح', 'success');
      } else {
        data.id = this.selectedEmployee.id;
        await this.app.dataManager.update('employees', data);
        this.app.notify('تم تحديث بيانات الموظف بنجاح', 'success');
      }

      this.closeModal();
      await this.loadData();
      this.renderTable();
    } catch (error) {
      console.error('خطأ في حفظ الموظف:', error);
      this.app.notify('حدث خطأ في حفظ بيانات الموظف', 'error');
    }
  }

  async deleteEmployee(employeeId) {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;

    try {
      await this.app.dataManager.delete('employees', employeeId);
      this.app.notify('تم حذف الموظف بنجاح', 'success');
      await this.loadData();
      this.renderTable();
    } catch (error) {
      console.error('خطأ في حذف الموظف:', error);
      this.app.notify('حدث خطأ في حذف الموظف', 'error');
    }
  }

  async viewDetails(employeeId) {
    const employee = await this.app.dataManager.get('employees', employeeId);
    const branch = this.branches.find(b => b.id === employee.branchId);

    const detailsHTML = `
      <div class="details-modal">
        <div class="details-content">
          <h2>${employee.name}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <label>الوظيفة:</label>
              <span>${employee.position}</span>
            </div>
            <div class="detail-item">
              <label>القسم:</label>
              <span>${employee.department}</span>
            </div>
            <div class="detail-item">
              <label>الفرع:</label>
              <span>${branch?.name || 'غير محدد'}</span>
            </div>
            <div class="detail-item">
              <label>رقم الهوية:</label>
              <span>${employee.idNumber}</span>
            </div>
            <div class="detail-item">
              <label>الهاتف:</label>
              <span>${employee.phone}</span>
            </div>
            <div class="detail-item">
              <label>البريد الإلكتروني:</label>
              <span>${employee.email}</span>
            </div>
            <div class="detail-item">
              <label>تاريخ التعيين:</label>
              <span>${new Date(employee.hireDate).toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="detail-item">
              <label>الراتب:</label>
              <span>${new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(employee.salary)}</span>
            </div>
            <div class="detail-item">
              <label>الحالة:</label>
              <span class="status-badge ${employee.active ? 'active' : 'inactive'}">
                ${employee.active ? 'نشط' : 'معطل'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = detailsHTML;
    document.body.appendChild(modal);

    setTimeout(() => modal.style.display = 'flex');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  filterEmployees(searchTerm) {
    const filtered = this.employees.filter(emp =>
      emp.name.includes(searchTerm) ||
      emp.position.includes(searchTerm) ||
      emp.email.includes(searchTerm)
    );

    this.renderFilteredTable(filtered);
  }

  filterByDepartment(department) {
    const filtered = department ? 
      this.employees.filter(emp => emp.department === department) : 
      this.employees;

    this.renderFilteredTable(filtered);
  }

  renderFilteredTable(filtered) {
    const container = document.getElementById('employeesTable');
    if (!container) return;

    const tableHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الوظيفة</th>
              <th>القسم</th>
              <th>الفرع</th>
              <th>الهاتف</th>
              <th>البريد الإلكتروني</th>
              <th>تاريخ التعيين</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(emp => this.renderEmployeeRow(emp)).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHTML;
  }

  closeModal() {
    const modal = document.getElementById('employeeModal');
    if (modal) modal.style.display = 'none';
  }

  createModal() {
    const branchOptions = this.branches
      .map(b => `<option value="${b.id}">${b.name}</option>`)
      .join('');

    const modal = document.createElement('div');
    modal.id = 'employeeModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>إضافة موظف جديد</h2>
          <button class="btn-close" onclick="app.pages.employees.closeModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="employeeForm">
            <div class="form-row">
              <div class="form-group">
                <label>الاسم الكامل *</label>
                <input type="text" name="employeeName" required>
              </div>
              <div class="form-group">
                <label>رقم الهوية *</label>
                <input type="text" name="idNumber" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>الوظيفة *</label>
                <input type="text" name="position" required>
              </div>
              <div class="form-group">
                <label>القسم *</label>
                <input type="text" name="department" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>الفرع *</label>
                <select name="branchId" required>
                  <option value="">اختر فرع</option>
                  ${branchOptions}
                </select>
              </div>
              <div class="form-group">
                <label>تاريخ التعيين *</label>
                <input type="date" name="hireDate" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>الهاتف *</label>
                <input type="tel" name="phone" required>
              </div>
              <div class="form-group">
                <label>البريد الإلكتروني *</label>
                <input type="email" name="email" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>الراتب الشهري (ريال) *</label>
                <input type="number" name="salary" min="0" required>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" name="active">
                  نشط
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="app.pages.employees.closeModal()">إلغاء</button>
          <button class="btn btn-primary" onclick="app.pages.employees.saveEmployee()">حفظ</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
}

export default EmployeesPage;
