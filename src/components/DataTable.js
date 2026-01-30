// مكون جدول البيانات المتقدم
class DataTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.data = [];
    this.columns = [];
    this.filteredData = [];
    this.sortBy = null;
    this.sortOrder = 'asc';
    this.currentPage = 1;
    this.pageSize = 10;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setData(data, columns) {
    this.data = data;
    this.columns = columns;
    this.filteredData = [...data];
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Cairo', sans-serif;
          color: #fff;
        }
        
        .table-container {
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid rgba(197, 160, 89, 0.2);
          border-radius: 12px;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .table-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 200px;
        }

        .search-box input {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-family: inherit;
        }

        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .toolbar-actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 12px;
          background: rgba(197, 160, 89, 0.2);
          border: 1px solid rgba(197, 160, 89, 0.5);
          color: #C5A059;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .btn:hover {
          background: rgba(197, 160, 89, 0.3);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 2px solid rgba(197, 160, 89, 0.3);
        }

        th {
          padding: 12px;
          text-align: right;
          font-weight: 600;
          color: #C5A059;
          cursor: pointer;
          user-select: none;
          transition: background 0.3s ease;
        }

        th:hover {
          background: rgba(197, 160, 89, 0.1);
        }

        th.sortable::after {
          content: ' ⇅';
          opacity: 0.5;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        tbody tr {
          transition: background 0.3s ease;
        }

        tbody tr:hover {
          background: rgba(197, 160, 89, 0.1);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pagination button {
          padding: 6px 10px;
          background: rgba(197, 160, 89, 0.2);
          border: 1px solid rgba(197, 160, 89, 0.3);
          color: #C5A059;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination button:hover {
          background: rgba(197, 160, 89, 0.3);
        }

        .pagination button.active {
          background: #C5A059;
          color: #000;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }
      </style>

      <div class="table-container">
        <div class="table-toolbar">
          <div class="search-box">
            <input type="text" id="search" placeholder="بحث...">
          </div>
          <div class="toolbar-actions">
            <button class="btn" id="exportBtn">📊 تصدير</button>
            <button class="btn" id="settingsBtn">⚙️ إعدادات</button>
          </div>
        </div>

        <div id="tableWrapper">
          <table id="dataTable">
            <thead id="tableHead"></thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>

        <div class="pagination" id="pagination"></div>
      </div>
    `;

    this.renderTable();
  }

  renderTable() {
    const thead = this.shadowRoot.getElementById('tableHead');
    const tbody = this.shadowRoot.getElementById('tableBody');

    // رؤوس الجدول
    thead.innerHTML = this.columns.map(col => 
      `<th class="sortable" data-field="${col.field}">${col.label}</th>`
    ).join('');

    // صفوف البيانات
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageData = this.filteredData.slice(start, end);

    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${this.columns.length}" class="empty-state">
            لا توجد بيانات
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = pageData.map(row => 
        `<tr>
          ${this.columns.map(col => 
            `<td>${this.formatCellValue(row[col.field], col)}</td>`
          ).join('')}
        </tr>`
      ).join('');
    }

    this.renderPagination();
  }

  formatCellValue(value, column) {
    if (column.format) {
      return column.format(value);
    }
    return value || '-';
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    const pagination = this.shadowRoot.getElementById('pagination');
    
    let html = '<button id="prevBtn">← السابق</button>';
    
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    html += '<button id="nextBtn">التالي →</button>';
    pagination.innerHTML = html;
  }

  setupEventListeners() {
    const shadow = this.shadowRoot;

    // البحث
    shadow.getElementById('search').addEventListener('input', (e) => {
      this.filterData(e.target.value);
    });

    // الفرز
    shadow.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        this.sortData(field);
      });
    });

    // الترقيم
    shadow.addEventListener('click', (e) => {
      if (e.target.classList.contains('page-btn')) {
        this.currentPage = parseInt(e.target.dataset.page);
        this.renderTable();
      }
      if (e.target.id === 'prevBtn' && this.currentPage > 1) {
        this.currentPage--;
        this.renderTable();
      }
      if (e.target.id === 'nextBtn') {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderTable();
        }
      }
    });
  }

  filterData(searchTerm) {
    this.filteredData = this.data.filter(item =>
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.currentPage = 1;
    this.renderTable();
  }

  sortData(field) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.renderTable();
  }
}

customElements.define('data-table', DataTable);
