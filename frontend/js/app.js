const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://expense-management-560d.onrender.com';

const API_URL = `${BASE_URL}/api/expenses`;

// DOM Elements
const views = document.querySelectorAll('.app-view');
const navLinks = document.querySelectorAll('.nav-link');
const expenseList = document.getElementById('expenseList');
const transactionsTableBody = document.getElementById('transactionsTableBody');
const txnSearch = document.getElementById('txnSearch');
const filterBtns = document.querySelectorAll('.filter-btn');
const expenseForm = document.getElementById('expenseForm');
const expenseModal = document.getElementById('expenseModal');
const totalBalance = document.getElementById('totalBalance');
const monthlyExpense = document.getElementById('monthlyExpense');
const totalSavings = document.getElementById('totalSavings');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const monthlyIncomeEl = document.getElementById('monthlyIncome');

// State
let expenses = [];
let dbCategories = [];
let isEditing = false;
let currentView = 'dashboard';
let charts = {};
let monthlyBudget = 30000;
let isLocked = false;

// Indian Currency Formatter
const rupeeFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
});

// Category Icons and Colors
const categories = {
    Food: { icon: 'fa-utensils', color: 'bg-orange-100 text-orange-600' },
    Transport: { icon: 'fa-car', color: 'bg-blue-100 text-blue-600' },
    Shopping: { icon: 'fa-bag-shopping', color: 'bg-purple-100 text-purple-600' },
    Entertainment: { icon: 'fa-film', color: 'bg-pink-100 text-pink-600' },
    Health: { icon: 'fa-heart-pulse', color: 'bg-red-100 text-red-600' },
    Utilities: { icon: 'fa-bolt', color: 'bg-yellow-100 text-yellow-600' },
    Salary: { icon: 'fa-wallet', color: 'bg-green-100 text-green-600' },
    Freelance: { icon: 'fa-laptop-code', color: 'bg-teal-100 text-teal-600' },
    Other: { icon: 'fa-layer-group', color: 'bg-gray-100 text-gray-600' }
};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c My Buddy Initializing... ', 'background: #4f46e5; color: #fff; font-weight: bold;');
    checkAppLock();
    fetchCategories();
    fetchExpenses();
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.getAttribute('data-view');
            switchView(viewId);
        });
    });

    // Add Buttons
    const addBtns = [
        document.getElementById('addExpenseBtnDesktop'),
        document.getElementById('addExpenseBtnMobile'),
        document.getElementById('fabAdd')
    ];
    addBtns.forEach(btn => { if (btn) btn.addEventListener('click', openAddModal); });

    // Close Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    expenseForm.addEventListener('submit', handleFormSubmit);

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.replace('bg-indigo-600', 'bg-white'));
            filterBtns.forEach(b => b.classList.replace('text-white', 'text-gray-600'));
            btn.classList.replace('bg-white', 'bg-indigo-600');
            btn.classList.replace('text-gray-600', 'text-white');
            renderDashboardList(btn.getAttribute('data-category'));
        });
    });

    // Search
    txnSearch.addEventListener('input', (e) => renderTransactionsTable(e.target.value));

    // Export
    document.getElementById('exportCsv').addEventListener('click', exportToCsv);

    // Modal Background Click
    expenseModal.addEventListener('click', (e) => { if (e.target === expenseModal) closeModal(); });

    // Budget Setting
    const budgetRange = document.getElementById('budgetRange');
    const budgetIndicator = document.getElementById('budgetValueIndicator');
    budgetRange.addEventListener('input', (e) => {
        monthlyBudget = parseInt(e.target.value);
        budgetIndicator.textContent = rupeeFormatter.format(monthlyBudget);
        updateDashboard(); // Refresh progress bar
    });

    // Custom Category Toggle
    const categorySelect = document.getElementById('category');
    const customCatGroup = document.getElementById('customCategoryGroup');
    categorySelect.addEventListener('change', (e) => {
        if (e.target.value === 'Other') {
            customCatGroup.classList.remove('hidden');
        } else {
            customCatGroup.classList.add('hidden');
        }
    });

    // App Lock Toggle
    const lockToggle = document.getElementById('appLockToggle');
    lockToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        if (enabled) {
            if (confirm('Enable biometric/device lock for extra security?')) {
                localStorage.setItem('expenseProLock', 'true');
                showToast('Device lock enabled');
            } else {
                e.target.checked = false;
            }
        } else {
            localStorage.removeItem('expenseProLock');
            showToast('Device lock disabled');
        }
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    themeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });

    // Initial Theme
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        themeIcon.className = 'fas fa-sun';
    }

    // Unlock Button
    document.getElementById('unlockBtn').addEventListener('click', unlockApp);

    // Delete in Modal
    document.getElementById('deleteTxnBtn').addEventListener('click', () => {
        const id = document.getElementById('expenseId').value;
        if (id) deleteExpense(parseInt(id));
        closeModal();
    });
}

// App Lock Logic
function checkAppLock() {
    const lockEnabled = localStorage.getItem('expenseProLock') === 'true';
    const lockScreen = document.getElementById('lockScreen');
    const lockToggle = document.getElementById('appLockToggle');

    if (lockEnabled) {
        lockScreen.classList.remove('hidden');
        lockToggle.checked = true;
        isLocked = true;
    }
}

async function unlockApp() {
    // In a real mobile environment, we'd use WebAuthn or a Capacitor/Cordova plugin
    // Here we simulate the device biometric check with a simple confirmation 
    // to mimic the "confirmation required" part of the user request.
    try {
        // Simple mock of Biometric Prompt
        const success = confirm('Confirm identity with device lock?');
        if (success) {
            document.getElementById('lockScreen').classList.add('hidden');
            isLocked = false;
            showToast('Welcome back!', 'success');
        }
    } catch (err) {
        showToast('Authentication failed', 'error');
    }
}

// Categories Logic
async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const result = await res.json();
        if (result.success) {
            dbCategories = result.data;
            populateCategoryDropdown();
        }
    } catch (err) {
        console.error('Failed to fetch categories');
    }
}

function populateCategoryDropdown() {
    const select = document.getElementById('category');
    const currentVal = select.value;
    
    let html = dbCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
    html += '<option value="Other">Other (Add New)</option>';
    select.innerHTML = html;
    if (currentVal) select.value = currentVal;
}

// View Controller
function switchView(viewId) {
    currentView = viewId;
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');

    // Update Nav UI
    navLinks.forEach(link => {
        const isSelected = link.getAttribute('data-view') === viewId;
        if (isSelected) {
            link.classList.add('text-indigo-600', 'font-semibold');
            // Only add background if it's a desktop sidebar link (heuristic: check if md:flex is parent or similar)
            if (window.innerWidth >= 768) {
                link.classList.add('bg-indigo-50', 'dark:bg-indigo-900', 'dark:bg-opacity-20');
            }
            link.classList.remove('text-gray-400', 'text-gray-500');
        } else {
            link.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-semibold', 'dark:bg-indigo-900', 'dark:bg-opacity-20');
            link.classList.add('text-gray-400');
        }
    });

    // Refresh View Specific Data
    if (viewId === 'stats') initCharts();
    if (viewId === 'transactions') renderTransactionsTable();
}

// Fetch Data
async function fetchExpenses() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        if (result.success) {
            expenses = result.data;
            updateDashboard();
            renderDashboardList();
            if (currentView === 'stats') initCharts();
            if (currentView === 'transactions') renderTransactionsTable();
        }
    } catch (error) {
        showToast('Error connecting to server', 'error');
    }
}

// Dashboard List (Recent)
function renderDashboardList(filter = 'All') {
    let filtered = expenses;
    if (filter !== 'All') {
        if (filter === 'Expense' || filter === 'Income') {
            filtered = expenses.filter(e => e.type.toLowerCase() === filter.toLowerCase());
        } else {
            filtered = expenses.filter(e => e.category === filter);
        }
    }

    if (filtered.length === 0) {
        expenseList.innerHTML = `<div class="py-10 text-center text-gray-400">No transactions in this category</div>`;
        return;
    }

    expenseList.innerHTML = filtered.slice(0, 10).map(exp => renderExpenseItem(exp)).join('');
}

function renderExpenseItem(exp) {
    const cat = categories[exp.category] || categories.Other;
    const isIncome = exp.type === 'income';
    return `
        <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 transition-all">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center text-md"><i class="fas ${cat.icon}"></i></div>
                <div>
                    <h4 class="font-bold text-gray-800 text-sm">${exp.title}</h4>
                    <p class="text-[10px] text-gray-400">${new Date(exp.date).toLocaleDateString('en-IN')}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-bold ${isIncome ? 'text-green-600' : 'text-gray-900'} text-sm">
                    ${isIncome ? '+' : '-'} ${rupeeFormatter.format(exp.amount)}
                </span>
                <button onclick="deleteExpense(${exp.id})" class="text-gray-200 hover:text-red-500 transition-colors"><i class="fas fa-trash text-xs"></i></button>
            </div>
        </div>
    `;
}

// Transactions Table
function renderTransactionsTable(search = '') {
    const filtered = expenses.filter(e => 
        e.title.toLowerCase().includes(search.toLowerCase()) || 
        e.category.toLowerCase().includes(search.toLowerCase())
    );

    transactionsTableBody.innerHTML = filtered.map(exp => {
        const cat = categories[exp.category] || categories.Other;
        const isIncome = exp.type === 'income';
        return `
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-semibold text-gray-800">${exp.title}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-bold ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} uppercase">
                        ${exp.type}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-bold ${cat.color} whitespace-nowrap">${exp.category}</span>
                </td>
                <td class="px-6 py-4 text-gray-400 text-xs">${new Date(exp.date).toLocaleDateString('en-IN')}</td>
                <td class="px-6 py-4 font-bold ${isIncome ? 'text-green-600' : 'text-gray-900'}">${rupeeFormatter.format(exp.amount)}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex gap-3">
                        <button onclick="editExpense(${exp.id})" class="text-indigo-600 hover:text-indigo-900"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteExpense(${exp.id})" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Dashboard Stats
function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Net Balance (Incomes - Expenses)
    const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalExpense = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netBalance = totalIncome - totalExpense;
    
    // Monthly Calculation
    const thisMonthData = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const monthlyIncome = thisMonthData.filter(e => e.type === 'income').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const monthlyExpenseTotal = thisMonthData.filter(e => e.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const monthlySavings = monthlyIncome - monthlyExpenseTotal;
    
    // Last Month Calculation (for trend)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && exp.type === 'expense';
    }).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Trend Calculation
    const trendPercentage = document.getElementById('trendPercentage');
    const trendIcon = document.getElementById('trendIcon');
    const balanceTrend = document.getElementById('balanceTrend');
    
    if (lastMonthExpenses > 0) {
        const diff = ((monthlyExpenseTotal - lastMonthExpenses) / lastMonthExpenses) * 100;
        const absDiff = Math.abs(diff).toFixed(1);
        balanceTrend.classList.remove('bg-indigo-500', 'bg-red-500', 'bg-green-500');
        if (diff > 0) {
            trendPercentage.textContent = `${absDiff}% more spending`;
            trendIcon.className = 'fas fa-arrow-up';
            balanceTrend.classList.add('bg-red-500');
        } else {
            trendPercentage.textContent = `${absDiff}% less spending`;
            trendIcon.className = 'fas fa-arrow-down';
            balanceTrend.classList.add('bg-green-500');
        }
    } else {
        trendPercentage.textContent = 'No previous data';
        trendIcon.className = 'fas fa-info-circle';
    }

    // Progress Bar & Budget Alert
    const progressPercent = Math.min((monthlyExpenseTotal / monthlyBudget) * 100, 100);
    const progressBar = document.getElementById('expenseProgressBar');
    progressBar.style.width = `${progressPercent}%`;
    
    if (progressPercent >= 100) {
        progressBar.classList.replace('bg-red-500', 'bg-gray-900');
        showToast(`Budget Alert: You exceeded your ₹${monthlyBudget} limit!`, 'error');
    } else if (progressPercent > 80) {
        progressBar.classList.add('bg-orange-500');
    }

    // Update UI
    totalBalance.textContent = rupeeFormatter.format(netBalance);
    monthlyIncomeEl.textContent = rupeeFormatter.format(monthlyIncome);
    document.getElementById('monthlyExpense').textContent = rupeeFormatter.format(monthlyExpenseTotal);
    totalSavings.textContent = rupeeFormatter.format(monthlySavings);
    
    const savingsMsg = document.getElementById('savingsMessage');
    if (monthlySavings > 0) {
        savingsMsg.textContent = "Positive Saving";
        savingsMsg.className = "text-[10px] text-green-600 font-medium mt-1";
    } else {
        savingsMsg.textContent = "Negative Saving";
        savingsMsg.className = "text-[10px] text-red-600 font-medium mt-1";
    }
}

// Charts
function initCharts() {
    // Only show expenses in category chart
    const expenseData = expenses.filter(e => e.type === 'expense');
    const catData = {};
    expenseData.forEach(e => {
        catData[e.category] = (catData[e.category] || 0) + parseFloat(e.amount);
    });

    if (charts.category) charts.category.destroy();
    charts.category = new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(catData),
            datasets: [{
                data: Object.values(catData),
                backgroundColor: ['#6366f1', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#ef4444', '#94a3b8']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } }, cutout: '70%'}
    });

    // Trend Chart (Income vs Expense)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySpending = new Array(12).fill(0);
    const monthlyIncome = new Array(12).fill(0);
    
    expenses.forEach(e => {
        const m = new Date(e.date).getMonth();
        if (e.type === 'income') monthlyIncome[m] += parseFloat(e.amount);
        else monthlySpending[m] += parseFloat(e.amount);
    });

    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyIncome,
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    tension: 0.4
                },
                {
                    label: 'Spending',
                    data: monthlySpending,
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    tension: 0.4
                }
            ]
        }
    });
}

// CRUD Operations
async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('expenseId').value;
    const type = document.querySelector('input[name="type"]:checked').value;
    let category = document.getElementById('category').value;

    // Handle Adding New Category
    if (category === 'Other') {
        const customCatName = document.getElementById('customCategoryName').value.trim();
        if (!customCatName) {
            showToast('Please enter a category name', 'error');
            return;
        }
        
        try {
            const catRes = await fetch('http://localhost:5000/api/expenses/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: customCatName, type: type })
            });
            const catResult = await catRes.json();
            if (catResult.success) {
                category = customCatName;
                await fetchCategories(); // Refresh local category list
            }
        } catch (err) {
            console.error('Failed to add custom category');
        }
    }

    const data = {
        title: document.getElementById('title').value,
        amount: document.getElementById('amount').value,
        category: category,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        type: type
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.message);
            closeModal();
            fetchExpenses();
        }
    } catch (err) {
        showToast('Error saving data', 'error');
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showToast(result.message);
            fetchExpenses();
        }
    } catch (err) {
        showToast('Error deleting', 'error');
    }
}

function editExpense(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;
    isEditing = true;
    document.getElementById('expenseId').value = exp.id;
    document.getElementById('title').value = exp.title;
    document.getElementById('amount').value = exp.amount;
    
    // Set category (ensure it exists in list first)
    const select = document.getElementById('category');
    if (![...select.options].some(opt => opt.value === exp.category)) {
        const opt = document.createElement('option');
        opt.value = exp.category;
        opt.textContent = exp.category;
        select.add(opt, select.options[select.options.length - 1]);
    }
    select.value = exp.category;
    document.getElementById('customCategoryGroup').classList.add('hidden');

    document.getElementById('date').value = exp.date.split('T')[0];
    document.getElementById('description').value = exp.description;
    
    // Set type radio
    const typeRadio = document.querySelector(`input[name="type"][value="${exp.type}"]`);
    if(typeRadio) typeRadio.checked = true;

    expenseModal.classList.remove('hidden');
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('deleteTxnBtn').classList.remove('hidden');
    setTimeout(() => expenseModal.classList.add('opacity-100'), 10);
}

// Helpers
function openAddModal() {
    isEditing = false;
    expenseForm.reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('modalTitle').textContent = 'New Transaction';
    document.getElementById('deleteTxnBtn').classList.add('hidden');
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    expenseModal.classList.remove('hidden');
    setTimeout(() => expenseModal.classList.add('opacity-100'), 10);
}

function closeModal() {
    expenseModal.classList.remove('opacity-100');
    setTimeout(() => expenseModal.classList.add('hidden'), 300);
}

// Toast Notification Helper (Advanced Version)
function showToast(msg, type = 'success', duration = 4000) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastSub = document.getElementById('toastSubMessage');
    const progress = document.getElementById('toastProgress');
    const iconContainer = document.getElementById('toastIconContainer');
    
    toastMsg.textContent = msg;
    toastSub.textContent = type === 'error' ? 'Error Alert' : 'Success Notification';

    // Set colors based on type
    if (type === 'error') {
        iconContainer.innerHTML = '<i class="fas fa-exclamation-circle text-red-400 text-xl"></i>';
        progress.className = 'absolute bottom-0 left-0 h-1 bg-red-500 w-full';
    } else {
        iconContainer.innerHTML = '<i class="fas fa-check-circle text-green-400 text-xl"></i>';
        progress.className = 'absolute bottom-0 left-0 h-1 bg-indigo-500 w-full';
    }

    // Reset Progress
    progress.style.transition = 'none';
    progress.style.width = '100%';

    // Show Toast
    toast.classList.remove('translate-y-40', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    // Start Progress Bar Animation
    setTimeout(() => {
        progress.style.transition = `width ${duration}ms linear`;
        progress.style.width = '0%';
    }, 50);

    // Hide Toast after duration
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-40', 'opacity-0');
    }, duration);
}

function exportToCsv() {
    const headers = ['Title', 'Amount', 'Category', 'Date', 'Description'];
    const rows = expenses.map(e => [e.title, e.amount, e.category, e.date, e.description]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
}
