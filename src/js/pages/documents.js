/**
 * صفحة إدارة المستندات
 * Documents Management Page
 */

class DocumentsPage {
  constructor(app) {
    this.app = app;
    this.documents = [];
    this.branches = [];
    this.selectedDocument = null;
    this.formMode = 'add';
  }

  async init() {
    console.log('📄 تهيئة صفحة المستندات...');
    await this.loadData();
    this.setupEventListeners();
    this.renderTable();
    this.checkExpiringDocuments();
  }

  async loadData() {
    this.documents = await this.app.dataManager.getAll('documents');
    this.branches = await this.app.dataManager.getAll('branches');
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addDocumentBtn');
    const searchInput = document.getElementById('searchDocuments');
    const filterSelect = document.getElementById('filterDocType');

    if (addBtn) addBtn.addEventListener('click', () => this.openAddModal());
    if (searchInput) searchInput.addEventListener('input', (e) => this.filterDocuments(e.target.value));
    if (filterSelect) filterSelect.addEventListener('change', (e) => this.filterByType(e.target.value));
  }

  renderTable() {
    const container = document.getElementById('documentsTable');
    if (!container) return;

    const tableHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>نوع المستند</th>
              <th>الفرع</th>
              <th>رقم المستند</th>
              <th>تاريخ الإصدار</th>
              <th>تاريخ الانتهاء</th>
              <th>الحالة</th>
              <th>المسؤول</th>
              <th>الملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${this.documents.map(doc => this.renderDocumentRow(doc)).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHTML;
  }

  renderDocumentRow(document) {
    const branch = this.branches.find(b => b.id === document.branchId);
    const issueDate = new Date(document.issueDate);
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

    let statusClass = 'active';
    let statusLabel = 'صالحة';

    if (daysLeft < 0) {
      statusClass = 'expired';
      statusLabel = 'منتهية';
    } else if (daysLeft < 30) {
      statusClass = 'warning';
      statusLabel = `${daysLeft} يوم`;
    } else if (daysLeft < 90) {
      statusClass = 'attention';
      statusLabel = `${daysLeft} يوم`;
    }

    return `
      <tr data-document-id="${document.id}">
        <td><strong>${document.type}</strong></td>
        <td>${branch?.name || 'غير محدد'}</td>
        <td>${document.number}</td>
        <td>${issueDate.toLocaleDateString('ar-SA')}</td>
        <td>${expiryDate.toLocaleDateString('ar-SA')}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>${document.responsible}</td>
        <td>${document.notes || '-'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-small btn-primary" onclick="app.pages.documents.openEditModal('${document.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-small btn-danger" onclick="app.pages.documents.deleteDocument('${document.id}')">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-small btn-secondary" onclick="app.pages.documents.viewDetails('${document.id}')">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  checkExpiringDocuments() {
    const today = new Date();
    const expiringDocs = this.documents.filter(doc => {
      const expiryDate = new Date(doc.expiryDate);
      const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 30;
    });

    if (expiringDocs.length > 0) {
      this.app.notify(
        `⚠️ يوجد ${expiringDocs.length} مستند قيد الانتهاء قريباً`,
        'warning'
      );
    }

    const expiredDocs = this.documents.filter(doc => {
      const expiryDate = new Date(doc.expiryDate);
      return expiryDate < today;
    });

    if (expiredDocs.length > 0) {
      this.app.notify(
        `❌ يوجد ${expiredDocs.length} مستند منتهي الصلاحية`,
        'error'
      );
    }
  }

  openAddModal() {
    this.formMode = 'add';
    this.selectedDocument = null;
    this.showModal();
  }

  async openEditModal(documentId) {
    this.formMode = 'edit';
    this.selectedDocument = await this.app.dataManager.get('documents', documentId);
    this.showModal();
  }

  showModal() {
    const modal = document.getElementById('documentModal');
    if (!modal) {
      this.createModal();
      return;
    }

    const form = modal.querySelector('form');
    if (this.formMode === 'add') {
      form.reset();
      modal.querySelector('h2').textContent = 'إضافة مستند جديد';
    } else {
      this.fillForm(this.selectedDocument);
      modal.querySelector('h2').textContent = 'تعديل المستند';
    }

    modal.style.display = 'flex';
  }

  fillForm(document) {
    const form = document.getElementById('documentForm');
    if (form) {
      form.elements['docType'].value = document.type || '';
      form.elements['docNumber'].value = document.number || '';
      form.elements['branchId'].value = document.branchId || '';
      form.elements['issueDate'].value = document.issueDate?.split('T')[0] || '';
      form.elements['expiryDate'].value = document.expiryDate?.split('T')[0] || '';
      form.elements['responsible'].value = document.responsible || '';
      form.elements['notes'].value = document.notes || '';
      form.elements['status'].value = document.status || 'approved';
    }
  }

  async saveDocument() {
    const form = document.getElementById('documentForm');
    if (!form || !form.checkValidity()) {
      this.app.notify('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      if (this.formMode === 'add') {
        await this.app.dataManager.add('documents', data);
        this.app.notify('تم إضافة المستند بنجاح', 'success');
      } else {
        data.id = this.selectedDocument.id;
        await this.app.dataManager.update('documents', data);
        this.app.notify('تم تحديث المستند بنجاح', 'success');
      }

      this.closeModal();
      await this.loadData();
      this.renderTable();
      this.checkExpiringDocuments();
    } catch (error) {
      console.error('خطأ في حفظ المستند:', error);
      this.app.notify('حدث خطأ في حفظ المستند', 'error');
    }
  }

  async deleteDocument(documentId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

    try {
      await this.app.dataManager.delete('documents', documentId);
      this.app.notify('تم حذف المستند بنجاح', 'success');
      await this.loadData();
      this.renderTable();
    } catch (error) {
      console.error('خطأ في حذف المستند:', error);
      this.app.notify('حدث خطأ في حذف المستند', 'error');
    }
  }

  async viewDetails(documentId) {
    const document = await this.app.dataManager.get('documents', documentId);
    const branch = this.branches.find(b => b.id === document.branchId);
    const issueDate = new Date(document.issueDate);
    const expiryDate = new Date(document.expiryDate);
    const daysLeft = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    const detailsHTML = `
      <div class="details-modal">
        <div class="details-content">
          <h2>${document.type}</h2>
          <div class="details-grid">
            <div class="detail-item">
              <label>نوع المستند:</label>
              <span>${document.type}</span>
            </div>
            <div class="detail-item">
              <label>رقم المستند:</label>
              <span>${document.number}</span>
            </div>
            <div class="detail-item">
              <label>الفرع:</label>
              <span>${branch?.name || 'غير محدد'}</span>
            </div>
            <div class="detail-item">
              <label>تاريخ الإصدار:</label>
              <span>${issueDate.toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="detail-item">
              <label>تاريخ الانتهاء:</label>
              <span>${expiryDate.toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="detail-item">
              <label>الأيام المتبقية:</label>
              <span>${daysLeft >= 0 ? daysLeft + ' يوم' : 'منتهي الصلاحية'}</span>
            </div>
            <div class="detail-item">
              <label>المسؤول:</label>
              <span>${document.responsible}</span>
            </div>
            <div class="detail-item full-width">
              <label>الملاحظات:</label>
              <span>${document.notes || 'لا توجد ملاحظات'}</span>
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

  filterDocuments(searchTerm) {
    const filtered = this.documents.filter(doc =>
      doc.type.includes(searchTerm) ||
      doc.number.includes(searchTerm) ||
      doc.responsible.includes(searchTerm)
    );

    this.renderFilteredTable(filtered);
  }

  filterByType(docType) {
    const filtered = docType ? 
      this.documents.filter(doc => doc.type === docType) : 
      this.documents;

    this.renderFilteredTable(filtered);
  }

  renderFilteredTable(filtered) {
    const container = document.getElementById('documentsTable');
    if (!container) return;

    const tableHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>نوع المستند</th>
              <th>الفرع</th>
              <th>رقم المستند</th>
              <th>تاريخ الإصدار</th>
              <th>تاريخ الانتهاء</th>
              <th>الحالة</th>
              <th>المسؤول</th>
              <th>الملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(doc => this.renderDocumentRow(doc)).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHTML;
  }

  closeModal() {
    const modal = document.getElementById('documentModal');
    if (modal) modal.style.display = 'none';
  }

  createModal() {
    const branchOptions = this.branches
      .map(b => `<option value="${b.id}">${b.name}</option>`)
      .join('');

    const modal = document.createElement('div');
    modal.id = 'documentModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>إضافة مستند جديد</h2>
          <button class="btn-close" onclick="app.pages.documents.closeModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="documentForm">
            <div class="form-row">
              <div class="form-group">
                <label>نوع المستند *</label>
                <select name="docType" required>
                  <option value="">اختر نوع المستند</option>
                  <option value="رخصة البلدية">رخصة البلدية</option>
                  <option value="السجل التجاري">السجل التجاري</option>
                  <option value="السجل الضريبي">السجل الضريبي</option>
                  <option value="تصريح التشغيل">تصريح التشغيل</option>
                  <option value="التأمينات الاجتماعية">التأمينات الاجتماعية</option>
                  <option value="التصاريح الصحية">التصاريح الصحية</option>
                </select>
              </div>
              <div class="form-group">
                <label>رقم المستند *</label>
                <input type="text" name="docNumber" required>
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
                <label>المسؤول *</label>
                <input type="text" name="responsible" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>تاريخ الإصدار *</label>
                <input type="date" name="issueDate" required>
              </div>
              <div class="form-group">
                <label>تاريخ الانتهاء *</label>
                <input type="date" name="expiryDate" required>
              </div>
            </div>
            <div class="form-group full-width">
              <label>الحالة</label>
              <select name="status">
                <option value="approved">موافق عليه</option>
                <option value="pending">قيد الانتظار</option>
                <option value="expired">منتهي الصلاحية</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>الملاحظات</label>
              <textarea name="notes" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="app.pages.documents.closeModal()">إلغاء</button>
          <button class="btn btn-primary" onclick="app.pages.documents.saveDocument()">حفظ</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
}

export default DocumentsPage;
