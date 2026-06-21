// State Management
let assignments = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'due-asc';
let editId = null;

// DOM Elements
const elements = {
    clock: document.getElementById('live-clock'),
    themeToggle: document.getElementById('theme-toggle'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    assignmentGrid: document.getElementById('assignment-grid'),
    emptyState: document.getElementById('empty-state'),
    
    // Stats
    statTotal: document.getElementById('stat-total'),
    statTodo: document.getElementById('stat-todo'),
    statDoing: document.getElementById('stat-doing'),
    statDone: document.getElementById('stat-done'),
    progressPercent: document.getElementById('progress-percent'),
    progressFill: document.getElementById('progress-fill'),
    
    // Modal & Form
    modal: document.getElementById('assignment-modal'),
    form: document.getElementById('assignment-form'),
    formId: document.getElementById('assignment-id'),
    formSubject: document.getElementById('form-subject'),
    formTitle: document.getElementById('form-title'),
    formDueDate: document.getElementById('form-due-date'),
    formStatus: document.getElementById('form-status'),
    formStatusGroup: document.getElementById('form-status-group'),
    modalTitle: document.getElementById('modal-title'),
    
    // Buttons
    btnOpenModal: document.getElementById('btn-open-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    btnAddShortcut: document.getElementById('btn-add-shortcut'),
    menuDashboard: document.getElementById('menu-dashboard')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initTheme();
    loadData();
    setupEventListeners();
    render();
});

// 1. Clock functionality
function initClock() {
    const updateClock = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const sec = String(now.getSeconds()).padStart(2, '0');
        elements.clock.textContent = `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
}

// 2. Theme functionality
function initTheme() {
    const savedTheme = localStorage.getItem('edu_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    elements.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('edu_theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// 3. Data Storage
function loadData() {
    const saved = localStorage.getItem('edu_assignments');
    if (saved) {
        try {
            assignments = JSON.parse(saved);
        } catch (e) {
            console.error('데이터 파싱 에러:', e);
            assignments = [];
        }
    } else {
        // 샘플 데이터 제공 (기초 화면 구성 확인용)
        assignments = [
            {
                id: 1,
                subject: "서어서문학개론",
                title: "스페인 문학가 돈키호테 감상문 제출",
                dueDate: getRelativeDateString(3),
                status: "시작 전"
            },
            {
                id: 2,
                subject: "웹프로그래밍",
                title: "바닐라 자바스크립트 기반 ToDo 프로그램 제작",
                dueDate: getRelativeDateString(1),
                status: "진행 중"
            },
            {
                id: 3,
                subject: "대학영어",
                title: "영문 에세이 Draft 1 제출",
                dueDate: getRelativeDateString(-2),
                status: "완료"
            }
        ];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('edu_assignments', JSON.stringify(assignments));
}

// Helper to get date relative to today
function getRelativeDateString(daysFromToday) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// 4. Calculations & D-Day
function calculateDDay(dueDateStr) {
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return { text: 'D-Day', class: 'urgent', value: 0 };
    } else if (diffDays > 0) {
        let tagClass = 'safe';
        if (diffDays <= 3) tagClass = 'urgent';
        else if (diffDays <= 7) tagClass = 'warning';
        return { text: `D-${diffDays}`, class: tagClass, value: diffDays };
    } else {
        return { text: `D+${Math.abs(diffDays)} (마감 경과)`, class: 'urgent', value: diffDays };
    }
}

// 5. Event Listeners Setup
function setupEventListeners() {
    // Open modal
    const openModalForAdd = () => {
        editId = null;
        elements.form.reset();
        elements.formId.value = '';
        elements.modalTitle.textContent = '새로운 과제 등록';
        elements.formStatusGroup.style.display = 'none';
        
        // 마감일 기본값을 오늘 날짜로 세팅
        elements.formDueDate.value = getRelativeDateString(0);
        
        elements.modal.classList.add('open');
    };

    elements.btnOpenModal.addEventListener('click', openModalForAdd);
    elements.btnAddShortcut.addEventListener('click', (e) => {
        e.preventDefault();
        openModalForAdd();
    });

    elements.menuDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        elements.searchInput.value = '';
        currentSearch = '';
        currentFilter = 'all';
        elements.filterTabs.forEach(t => {
            if (t.getAttribute('data-filter') === 'all') t.classList.add('active');
            else t.classList.remove('active');
        });
        render();
    });

    // Close modal
    const closeModal = () => {
        elements.modal.classList.remove('open');
    };
    elements.btnCloseModal.addEventListener('click', closeModal);
    elements.btnCancelModal.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    // Handle Form Submit
    elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const subject = elements.formSubject.value.trim();
        const title = elements.formTitle.value.trim();
        const dueDate = elements.formDueDate.value;
        
        if (!subject || !title || !dueDate) return;

        if (editId) {
            // Update
            const idx = assignments.findIndex(item => item.id === editId);
            if (idx !== -1) {
                assignments[idx].subject = subject;
                assignments[idx].title = title;
                assignments[idx].dueDate = dueDate;
                assignments[idx].status = elements.formStatus.value;
            }
        } else {
            // Create
            const newAssignment = {
                id: Date.now(),
                subject,
                title,
                dueDate,
                status: '시작 전'
            };
            assignments.push(newAssignment);
        }

        saveData();
        closeModal();
        render();
    });

    // Search input event
    elements.searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim().toLowerCase();
        render();
    });

    // Sort selection
    elements.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        render();
    });

    // Filter tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            render();
        });
    });
}

// 6. Edit & Delete Action handlers
function handleEdit(id) {
    const item = assignments.find(a => a.id === id);
    if (!item) return;

    editId = id;
    elements.formId.value = item.id;
    elements.formSubject.value = item.subject;
    elements.formTitle.value = item.title;
    elements.formDueDate.value = item.dueDate;
    elements.formStatus.value = item.status;
    
    elements.modalTitle.textContent = '과제 정보 수정';
    elements.formStatusGroup.style.display = 'block';
    
    elements.modal.classList.add('open');
}

function handleDelete(id) {
    const item = assignments.find(a => a.id === id);
    if (!item) return;

    if (confirm(`⚠️ 정말로 [${item.subject}] "${item.title}" 과제를 삭제하시겠습니까?`)) {
        assignments = assignments.filter(a => a.id !== id);
        saveData();
        render();
    }
}

function handleStatusChange(id, newStatus) {
    const item = assignments.find(a => a.id === id);
    if (!item) return;
    
    item.status = newStatus;
    saveData();
    render();
}

// 7. Render UI
function render() {
    renderStats();
    renderGrid();
}

function renderStats() {
    const total = assignments.length;
    const todo = assignments.filter(a => a.status === '시작 전').length;
    const doing = assignments.filter(a => a.status === '진행 중').length;
    const done = assignments.filter(a => a.status === '완료').length;
    
    elements.statTotal.textContent = total;
    elements.statTodo.textContent = todo;
    elements.statDoing.textContent = doing;
    elements.statDone.textContent = done;
    
    // Progress
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
}

function renderGrid() {
    // 1. Filter
    let filtered = assignments.filter(item => {
        // Status filter
        const matchStatus = currentFilter === 'all' || item.status === currentFilter;
        // Search filter
        const matchSearch = currentSearch === '' || 
            item.subject.toLowerCase().includes(currentSearch) || 
            item.title.toLowerCase().includes(currentSearch);
        
        return matchStatus && matchSearch;
    });

    // 2. Sort
    filtered.sort((a, b) => {
        if (currentSort === 'due-asc') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (currentSort === 'due-desc') {
            return new Date(b.dueDate) - new Date(a.dueDate);
        } else if (currentSort === 'subject-asc') {
            return a.subject.localeCompare(b.subject, 'ko');
        } else if (currentSort === 'title-asc') {
            return a.title.localeCompare(b.title, 'ko');
        }
        return 0;
    });

    // 3. Clear existing cards (except empty state)
    const cards = elements.assignmentGrid.querySelectorAll('.assignment-card');
    cards.forEach(card => card.remove());

    if (filtered.length === 0) {
        elements.emptyState.style.display = 'flex';
        return;
    }

    elements.emptyState.style.display = 'none';

    // 4. Inject cards
    filtered.forEach(item => {
        const dday = calculateDDay(item.dueDate);
        
        const card = document.createElement('article');
        // Set state class for border coloring
        let statusClass = 'todo';
        if (item.status === '진행 중') statusClass = 'doing';
        else if (item.status === '완료') statusClass = 'done';
        
        card.className = `assignment-card ${statusClass}`;
        
        // Define dday badge UI
        let ddayBadgeHtml = '';
        if (item.status === '완료') {
            ddayBadgeHtml = `<span class="dday-badge completed"><i class="fa-solid fa-circle-check"></i> 완료</span>`;
        } else {
            let clockIcon = dday.class === 'urgent' ? '<i class="fa-solid fa-triangle-exclamation"></i> ' : '<i class="fa-regular fa-clock"></i> ';
            ddayBadgeHtml = `<span class="dday-badge ${dday.class}">${clockIcon}${dday.text}</span>`;
        }

        // Dropdown status HTML
        const statusSelectHtml = `
            <select class="status-pill-select" onchange="handleStatusChange(${item.id}, this.value)">
                <option value="시작 전" ${item.status === '시작 전' ? 'selected' : ''}>⚪ 시작 전</option>
                <option value="진행 중" ${item.status === '진행 중' ? 'selected' : ''}>🔵 진행 중</option>
                <option value="완료" ${item.status === '완료' ? 'selected' : ''}>🟢 완료</option>
            </select>
        `;

        card.innerHTML = `
            <div class="card-header">
                <span class="subject-badge" title="${item.subject}">${item.subject}</span>
                ${ddayBadgeHtml}
            </div>
            <h3 class="card-title">${item.title}</h3>
            <div class="card-footer">
                <div class="due-date-info">
                    <span class="label">마감 기한</span>
                    <span class="date">${item.dueDate}</span>
                </div>
                <div class="card-actions">
                    ${statusSelectHtml}
                    <button class="action-btn edit" onclick="handleEdit(${item.id})" aria-label="수정">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="handleDelete(${item.id})" aria-label="삭제">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        elements.assignmentGrid.appendChild(card);
    });
}
