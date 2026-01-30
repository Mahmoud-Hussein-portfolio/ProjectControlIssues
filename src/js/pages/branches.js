/**
 * صفحة إدارة الفروع
 * Branches Management Page
 */

class BranchesPage {
  constructor(app) {
    this.app = app;
    this.branches = [];
    this.selectedBranch = null;
    this.modal = null;
    this.formMode = 'add'; // 'add' or 'edit'
  }

  async init() {
    console.log('🏢 تهيئة صفحة الفروع...');
    await this.loadBranches();
    this.setupEventListeners();
    this.renderTable();
  }

  async loadBranches() {
    this.branches = await this.app.dataManager.getAll('branches');
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addBranchBtn');
    const searchInput = document.getElementById('searchBranches');
    
    if (addBtn) addBtn.addEventListener('click', () => this.openAddModal());
    if (searchInput) searchInput.addEventListener('input', (e) => this.filterBranches(e.target.value));
  }

  renderTable() {
    const container = document.getElementById('branchesTable');
    if (!container) return;

    const tableHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>اسم الفرع</th>
              <th>المؤسسة</th>
              <th>المدير</th>
              <th>الموقع</th>
              <th>الهاتف</th>
              <th>البريد الإلكتروني</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${this.branches.map(branch => this.renderBranchRow(branch)).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHTML;
    this.attachRowListeners();
  }

  renderBranchRow(branch) {
    const statusClass = branch.active ? 'active' : 'inactive';
    const statusLabel = branch.active ? 'نشط' : 'غير نشط';

    return `
      <tr data-branch-id="${branch.id}">
        <td><strong>${branch.name}</strong></td>
        <td>${branch.organization}</td>
        <td>${branch.manager}</td>
        <td>${branch.location}</td>
        <td>${branch.phone}</td>
        <td>${branch.email}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-small btn-primary" onclick="app.pages.branches.openEditModal('${branch.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-small btn-danger" onclick="app.pages.branches.deleteBranch('${branch.id}')">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-small btn-secondary" onclick="app.pages.branches.viewDetails('${branch.id}')">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  attachRowListeners() {
    // يمكن إضافة معالجات إضافية هنا
  }

  openAddModal() {
    this.formMode = 'add';
    this.selectedBranch = null;
    this.showModal();
  }

  async openEditModal(branchId) {
    this.formMode = 'edit';
    this.selectedBranch = await this.app.dataManager.get('branches', branchId);
    this.showModal();
  }

  showModal() {
    const modal = document.getElementById('branchModal');
    if (!modal) {
      this.createModal();
      return;
    }

    const form = modal.querySelector('form');
    if (this.formMode === 'add') {
      form.reset();
      modal.querySelector('h2').textContent = 'إضافة فرع جديد';
    } else {
      this.fillForm(this.selectedBranch);
      modal.querySelector('h2').textContent = 'تعديل الفرع';
    }

    modal.style.display = 'flex';
  }

  fillForm(branch) {
    const form = document.getElementById('branchForm');
    if (form) {
      form.elements['branchName'].value = branch.name || '';
      form.elements['organization'].value = branch.organization || '';
      form.elements['manager'].value = branch.manager || '';
      form.elements['location'].value = branch.location || '';
      form.elements['phone'].value = branch.phone || '';
      form.elements['email'].value = branch.email || '';
      form.elements['active'].checked = branch.active || false;
    }
  }

  async saveBranch() {
    const form = document.getElementById('branchForm');
    if (!form || !form.checkValidity()) {
      this.app.notify('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.active = form.elements['active'].checked;

    try {
      if (this.formMode === 'add') {
        await this.app.dataManager.add('branches', data);
        this.app.notify('تم إضافة الفرع بنجاح', 'success');
      } else {
        data.id = this.selectedBranch.id;
        await this.app.dataManager.update('branches', data);
        this.app.notify('تم تحديث الفرع بنجاح', 'success');
      }

      this.closeModal();
      await this.loadBranches();
      this.renderTable();
    } catch (error) {
      console.error('خطأ في حفظ الفرع:', error);
      this.app.notify('حدث خطأ في حفظ الفرع', 'error');
    }
  }

  async deleteBranch(branchId) {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;

    try {
      await this.app.dataManager.delete('branches', branchId);
      this.app.notify('تم حذف الفرع بنجاح', 'success');
      await this.loadBranches();
      this.renderTable();
    } catch (error) {
      console.error('خطأ في حذف الفرع:', error);
      this.app.notify('حدث خطأ في حذف الفرع', 'error');
    }
  }

  async viewDetails(branchId) {
    const branch = await this.app.dataManager.get('branches', branchId);
    const employees = await this.app.dataManager.query('employees', 'branchId', branchId);
    const documents = await this.app.dataManager.query('documents', 'branchId', branchId);

    const detailsHTML = `
      <div class="details-modal">
        <div class="details-content">
          <h2>${branch.name}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <label>المؤسسة:</label>
              <span>${branch.organization}</span>
            </div>
            <div class="detail-item">
              <label>المدير:</label>
              <span>${branch.manager}</span>
            </div>
            <div class="detail-item">
              <label>الموقع:</label>
              <span>${branch.location}</span>
            </div>
            <div class="detail-item">
              <label>الهاتف:</label>
              <span>${branch.phone}</span>
            </div>
            <div class="detail-item">
              <label>البريد الإلكتروني:</label>
              <span>${branch.email}</span>
            </div>
            <div class="detail-item">
              <label>الحالة:</label>
              <span class="status-badge ${branch.active ? 'active' : 'inactive'}">
                ${branch.active ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div class="detail-item full-width">
              <label>الموظفون: ${employees.length}</label>
              <span>المستندات: ${documents.length}</span>
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
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  filterBranches(searchTerm) {
    const filtered = this.branches.filter(branch =>
      branch.name.includes(searchTerm) ||
      branch.organization.includes(searchTerm) ||
      branch.manager.includes(searchTerm)
    );

    const container = document.getElementById('branchesTable');
    if (!container) return;

    const tableHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>اسم الفرع</th>
              <th>المؤسسة</th>
              <th>المدير</th>
              <th>الموقع</th>
              <th>الهاتف</th>
              <th>البريد الإلكتروني</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(branch => this.renderBranchRow(branch)).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHTML;
  }

  closeModal() {
    const modal = document.getElementById('branchModal');
    if (modal) modal.style.display = 'none';
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'branchModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>إضافة فرع جديد</h2>
          <button class="btn-close" onclick="app.pages.branches.closeModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="branchForm">
            <div class="form-group">
              <label>اسم الفرع *</label>
              <input type="text" name="branchName" required>
            </div>
            <div class="form-group">
              <label>المؤسسة *</label>
              <input type="text" name="organization" required>
            </div>
            <div class="form-group">
              <label>المدير *</label>
              <input type="text" name="manager" required>
            </div>
            <div class="form-group">
              <label>الموقع *</label>
              <input type="text" name="location" required>
            </div>
            <div class="form-group">
              <label>الهاتف *</label>
              <input type="tel" name="phone" required>
            </div>
            <div class="form-group">
              <label>البريد الإلكتروني *</label>
              <input type="email" name="email" required>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="active">
                نشط
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="app.pages.branches.closeModal()">إلغاء</button>
          <button class="btn btn-primary" onclick="app.pages.branches.saveBranch()">حفظ</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
}

export default BranchesPage;
