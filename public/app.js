// ==================== STATE MANAGEMENT ====================
let state = {
  currentUser: null,
  menuItems: [],
  cart: [],
  activeTab: 'pos',
  selectedReportDate: null,
  reportsSummary: [],
  ordersForSelectedDate: [],
  activeCategory: 'all',
  searchQuery: '',
  users: []
};

// ==================== DOM ELEMENTS ====================
const el = {
  appContainer: document.getElementById('app-container'),
  loginScreen: document.getElementById('login-screen'),
  dashboardScreen: document.getElementById('dashboard-screen'),
  loginForm: document.getElementById('login-form'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
  loginError: document.getElementById('login-error'),
  errorText: document.getElementById('error-text'),
  
  headerDateTime: document.getElementById('header-datetime'),
  userDisplayName: document.getElementById('user-display-name'),
  userDisplayRole: document.getElementById('user-display-role'),
  logoutBtn: document.getElementById('logout-btn'),
  navTabs: document.querySelectorAll('.nav-tab'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  
  // POS Elements
  filterBtns: document.querySelectorAll('.filter-btn'),
  posSearch: document.getElementById('pos-search'),
  posMenuGrid: document.getElementById('pos-menu-grid'),
  cartItemsList: document.getElementById('cart-items-list'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  cartDiscountInput: document.getElementById('cart-discount-input'),
  cartTax: document.getElementById('cart-tax'),
  cartTotal: document.getElementById('cart-total'),
  checkoutBtn: document.getElementById('checkout-btn'),
  clearCartBtn: document.getElementById('clear-cart-btn'),
  
  // Inventory Elements
  menuItemForm: document.getElementById('menu-item-form'),
  inventoryFormTitle: document.getElementById('inventory-form-title'),
  itemEditId: document.getElementById('item-edit-id'),
  itemName: document.getElementById('item-name'),
  itemPrice: document.getElementById('item-price'),
  itemCategory: document.getElementById('item-category'),
  itemAvailable: document.getElementById('item-available'),
  itemAvailabilityWrapper: document.getElementById('item-availability-wrapper'),
  saveItemBtn: document.getElementById('save-item-btn'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  menuItemsCount: document.getElementById('menu-items-count'),
  inventoryTableBody: document.getElementById('inventory-table-body'),
  
  // Reports Elements
  statNetSales: document.getElementById('stat-net-sales'),
  statTotalOrders: document.getElementById('stat-total-orders'),
  statAvgTicket: document.getElementById('stat-avg-ticket'),
  statTotalDiscounts: document.getElementById('stat-total-discounts'),
  reportDatesList: document.getElementById('report-dates-list'),
  reportsDateTitle: document.getElementById('reports-date-title'),
  reportsDateSubtitle: document.getElementById('reports-date-subtitle'),
  reportOrdersTbody: document.getElementById('report-orders-tbody'),
  exportLedgerBtn: document.getElementById('export-ledger-btn'),
  
  // Receipt Modal
  receiptModal: document.getElementById('receipt-modal'),
  closeReceiptBtn: document.getElementById('close-receipt-btn'),
  printReceiptBtn: document.getElementById('print-receipt-btn'),
  receiptDate: document.getElementById('receipt-date'),
  receiptId: document.getElementById('receipt-id'),
  receiptCashier: document.getElementById('receipt-cashier'),
  receiptItemsTbody: document.getElementById('receipt-items-tbody'),
  receiptSubtotal: document.getElementById('receipt-subtotal'),
  receiptDiscount: document.getElementById('receipt-discount'),
  receiptTax: document.getElementById('receipt-tax'),
  receiptTotal: document.getElementById('receipt-total'),
  receiptPayment: document.getElementById('receipt-payment'),

  // User Management Elements
  createUserForm: document.getElementById('create-user-form'),
  newUserFullName: document.getElementById('new-user-fullname'),
  newUsername: document.getElementById('new-username'),
  newPassword: document.getElementById('new-password'),
  newUserRole: document.getElementById('new-user-role'),
  registeredUsersCount: document.getElementById('registered-users-count'),
  usersTableBody: document.getElementById('users-table-body'),
  
  // Password Modal
  passwordModal: document.getElementById('password-modal'),
  passwordModalUserId: document.getElementById('password-modal-user-id'),
  passwordModalSubtitle: document.getElementById('password-modal-subtitle'),
  newModalPassword: document.getElementById('new-modal-password'),
  changePasswordForm: document.getElementById('change-password-form'),
  closePasswordBtn: document.getElementById('close-password-btn')
};

// ==================== INITIALIZATION & UTILITIES ====================
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  setupEventListeners();
  checkSession();
});

// Realtime Header Clock
function initClock() {
  const updateClock = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    };
    el.headerDateTime.textContent = now.toLocaleDateString('en-US', options);
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// Currency Formatter Utility
function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value);
}

// Date Formatter for Receipts/Tables
function formatDateString(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Check session in sessionStorage to allow persistence across refreshes
function checkSession() {
  const storedUser = sessionStorage.getItem('cafe_user');
  if (storedUser) {
    try {
      state.currentUser = JSON.parse(storedUser);
      loginSuccess();
    } catch(e) {
      sessionStorage.removeItem('cafe_user');
    }
  }
  lucide.createIcons();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Login Form
  el.loginForm.addEventListener('submit', handleLogin);
  
  // Logout Button
  el.logoutBtn.addEventListener('click', handleLogout);
  
  // Navigation Tabs
  el.navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // POS Category Filters
  el.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.category;
      renderPOSMenu();
    });
  });

  // POS Search Input
  el.posSearch.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderPOSMenu();
  });

  // POS Cart Discount Input
  el.cartDiscountInput.addEventListener('input', () => {
    if (el.cartDiscountInput.value < 0) el.cartDiscountInput.value = 0;
    updateCartSummary();
  });

  // POS Clear Cart
  el.clearCartBtn.addEventListener('click', clearCart);

  // POS Checkout Button
  el.checkoutBtn.addEventListener('click', handleCheckout);

  // Inventory Form Submit (Add / Edit)
  el.menuItemForm.addEventListener('submit', handleMenuItemSubmit);

  // Inventory Cancel Edit
  el.cancelEditBtn.addEventListener('click', resetInventoryForm);

  // Receipt Modal Actions
  el.closeReceiptBtn.addEventListener('click', () => el.receiptModal.classList.remove('active'));
  el.printReceiptBtn.addEventListener('click', () => window.print());

  // Export Daily Detailed Ledger
  el.exportLedgerBtn.addEventListener('click', exportLedgerCSV);

  // User Management
  if (el.createUserForm) {
    el.createUserForm.addEventListener('submit', handleCreateUser);
  }
  if (el.changePasswordForm) {
    el.changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
  }
  if (el.closePasswordBtn) {
    el.closePasswordBtn.addEventListener('click', () => el.passwordModal.classList.remove('active'));
  }
}

// ==================== AUTHENTICATION ====================
async function handleLogin(e) {
  e.preventDefault();
  const username = el.usernameInput.value.trim();
  const password = el.passwordInput.value;
  
  el.loginError.classList.add('hidden');
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      state.currentUser = data.user;
      sessionStorage.setItem('cafe_user', JSON.stringify(data.user));
      loginSuccess();
    } else {
      showLoginError(data.error || 'Login failed.');
    }
  } catch (err) {
    showLoginError('Unable to connect to server backend.');
  }
}

function showLoginError(msg) {
  el.errorText.textContent = msg;
  el.loginError.classList.remove('hidden');
}

function loginSuccess() {
  // Clear form inputs
  el.usernameInput.value = '';
  el.passwordInput.value = '';
  
  // Show/Hide Role-Based UI elements
  const isAdmin = state.currentUser.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(element => {
    if (isAdmin) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  });

  // Update header user profiles
  el.userDisplayName.textContent = state.currentUser.name;
  el.userDisplayRole.textContent = state.currentUser.role;

  // Switch screens
  el.loginScreen.classList.remove('active');
  el.dashboardScreen.classList.add('active');

  // Trigger data loading
  loadMenuItems();
  if (isAdmin) {
    loadDailyReports();
  }

  switchTab('pos');
}

function handleLogout() {
  sessionStorage.removeItem('cafe_user');
  state.currentUser = null;
  state.cart = [];
  
  el.dashboardScreen.classList.remove('active');
  el.loginScreen.classList.add('active');
  lucide.createIcons();
}

// ==================== TAB SWITCHER ====================
function switchTab(tabName) {
  state.activeTab = tabName;

  // Update Nav visual active states
  el.navTabs.forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update Display Pane active states
  el.tabPanes.forEach(pane => {
    if (pane.id === `tab-content-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Trigger contextual fetches or UI refreshes
  if (tabName === 'pos') {
    loadMenuItems();
  } else if (tabName === 'inventory') {
    renderInventoryTable();
    resetInventoryForm();
  } else if (tabName === 'reports') {
    loadDailyReports();
  } else if (tabName === 'users') {
    loadUsers();
  }
}

// ==================== DATA API CALLS ====================
async function loadMenuItems() {
  try {
    const response = await fetch('/api/menu');
    state.menuItems = await response.ok ? await response.json() : [];
    
    renderPOSMenu();
    if (state.activeTab === 'inventory') {
      renderInventoryTable();
    }
  } catch (err) {
    console.error('Failed to load menu items:', err);
  }
}

// ==================== POS SYSTEM (BILLING) ====================
function renderPOSMenu() {
  el.posMenuGrid.innerHTML = '';
  
  // Filter menu items by active category & search query
  const filtered = state.menuItems.filter(item => {
    const matchesCategory = state.activeCategory === 'all' || item.category === state.activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(state.searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    el.posMenuGrid.innerHTML = `
      <div class="empty-state text-center text-muted" style="grid-column: 1/-1; padding: 40px 0;">
        <i data-lucide="search" style="width: 40px; height: 40px; margin-bottom: 12px; stroke-width: 1.5;"></i>
        <p>No products found matching criteria.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(item => {
    const isAvailable = item.available === 1;
    const card = document.createElement('div');
    card.className = `menu-card ${isAvailable ? '' : 'unavailable'}`;
    
    card.innerHTML = `
      <div>
        <span class="card-category">${item.category}</span>
        <h4 class="card-name">${item.name}</h4>
      </div>
      <div class="card-bottom">
        <span class="card-price">${formatCurrency(item.price)}</span>
        <div class="add-badge">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
        </div>
      </div>
    `;

    if (isAvailable) {
      card.addEventListener('click', () => addToCart(item));
    }
    
    el.posMenuGrid.appendChild(card);
  });

  lucide.createIcons();
}

// Cart Mechanics
function addToCart(item) {
  const existing = state.cart.find(ci => ci.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  }
  renderCart();
}

function updateQuantity(itemId, delta) {
  const item = state.cart.find(ci => ci.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(itemId);
  } else {
    renderCart();
  }
}

function removeFromCart(itemId) {
  state.cart = state.cart.filter(ci => ci.id !== itemId);
  renderCart();
}

function clearCart() {
  state.cart = [];
  el.cartDiscountInput.value = 0;
  renderCart();
}

function renderCart() {
  el.cartItemsList.innerHTML = '';
  
  if (state.cart.length === 0) {
    el.cartItemsList.innerHTML = `
      <div class="empty-cart-state">
        <i data-lucide="shopping-bag"></i>
        <p>Cart is empty. Select items from the menu.</p>
      </div>
    `;
    el.checkoutBtn.disabled = true;
    updateCartSummary();
    lucide.createIcons();
    return;
  }

  state.cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    const row = document.createElement('div');
    row.className = 'cart-item';
    
    row.innerHTML = `
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatCurrency(item.price)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
      </div>
      <div class="cart-item-subtotal">${formatCurrency(subtotal)}</div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    el.cartItemsList.appendChild(row);
  });

  el.checkoutBtn.disabled = false;
  updateCartSummary();
  lucide.createIcons();
}

function updateCartSummary() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = Number(el.cartDiscountInput.value) || 0;
  
  // Tax rate: 5%
  const taxRate = 0.05;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;

  el.cartSubtotal.textContent = formatCurrency(subtotal);
  el.cartTax.textContent = formatCurrency(tax);
  el.cartTotal.textContent = formatCurrency(total);
}

// Checkout and Save to DB
async function handleCheckout() {
  if (state.cart.length === 0) return;

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = Number(el.cartDiscountInput.value) || 0;
  const taxRate = 0.05;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * taxRate;
  const finalAmount = taxableAmount + tax;
  
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

  const orderData = {
    items: state.cart,
    total_amount: subtotal,
    discount: discount,
    tax: tax,
    final_amount: finalAmount,
    payment_method: paymentMethod,
    created_by: state.currentUser.username
  };

  el.checkoutBtn.disabled = true;

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Open digital receipt pop-up
      showReceipt(result.orderId, result.orderDate, orderData);
      
      // Reset POS cart
      clearCart();
    } else {
      alert('Order checkout failed: ' + (result.error || 'Unknown error'));
      el.checkoutBtn.disabled = false;
    }
  } catch (err) {
    alert('Server communication error during checkout.');
    el.checkoutBtn.disabled = false;
  }
}

// ==================== RECEIPT PRINT POPUP ====================
function showReceipt(orderId, dateStr, orderData) {
  el.receiptId.textContent = orderId;
  el.receiptDate.textContent = formatDateString(dateStr);
  el.receiptCashier.textContent = state.currentUser.name;
  el.receiptPayment.textContent = orderData.payment_method;

  el.receiptItemsTbody.innerHTML = '';
  orderData.items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="text-left">${item.name}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${formatCurrency(item.price * item.quantity)}</td>
    `;
    el.receiptItemsTbody.appendChild(row);
  });

  el.receiptSubtotal.textContent = formatCurrency(orderData.total_amount);
  el.receiptDiscount.textContent = `-${formatCurrency(orderData.discount)}`;
  el.receiptTax.textContent = formatCurrency(orderData.tax);
  el.receiptTotal.textContent = formatCurrency(orderData.final_amount);

  el.receiptModal.classList.add('active');
  lucide.createIcons();
}

// ==================== INVENTORY MANAGEMENT (ADMIN) ====================
function renderInventoryTable() {
  el.inventoryTableBody.innerHTML = '';
  el.menuItemsCount.textContent = `${state.menuItems.length} Items`;

  if (state.menuItems.length === 0) {
    el.inventoryTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No items in the menu. Add some items on the left!</td>
      </tr>
    `;
    return;
  }

  state.menuItems.forEach(item => {
    const row = document.createElement('tr');
    const availableBadge = item.available === 1 
      ? '<span class="badge badge-success">Available</span>' 
      : '<span class="badge badge-danger">Sold Out</span>';
      
    row.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${availableBadge}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary btn-sm" onclick="editMenuItem(${item.id})" title="Edit Price / Details">
            <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i> Edit
          </button>
          <button class="btn btn-danger-soft btn-sm" onclick="deleteMenuItem(${item.id})" title="Delete Item">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
          </button>
        </div>
      </td>
    `;
    el.inventoryTableBody.appendChild(row);
  });

  lucide.createIcons();
}

// Edit Mode setup
window.editMenuItem = function(id) {
  const item = state.menuItems.find(mi => mi.id === id);
  if (!item) return;

  el.inventoryFormTitle.textContent = 'Edit Menu Item';
  el.itemEditId.value = item.id;
  el.itemName.value = item.name;
  el.itemPrice.value = item.price;
  el.itemCategory.value = item.category;
  el.itemAvailable.checked = item.available === 1;
  el.itemAvailabilityWrapper.classList.remove('hidden');
  el.saveItemBtn.innerHTML = '<i data-lucide="check"></i> Update Item';
  el.cancelEditBtn.classList.remove('hidden');
  
  el.itemName.scrollIntoView({ behavior: 'smooth' });
  lucide.createIcons();
};

function resetInventoryForm() {
  el.inventoryFormTitle.textContent = 'Add New Menu Item';
  el.itemEditId.value = '';
  el.itemName.value = '';
  el.itemPrice.value = '';
  el.itemCategory.value = '';
  el.itemAvailable.checked = true;
  el.itemAvailabilityWrapper.classList.add('hidden');
  el.saveItemBtn.innerHTML = '<i data-lucide="plus"></i> Add Item';
  el.cancelEditBtn.classList.add('hidden');
  lucide.createIcons();
}

async function handleMenuItemSubmit(e) {
  e.preventDefault();
  
  const editId = el.itemEditId.value;
  const name = el.itemName.value.trim();
  const price = Number(el.itemPrice.value);
  const category = el.itemCategory.value;
  const available = el.itemAvailable.checked;

  const payload = { name, price, category, available };
  const method = editId ? 'PUT' : 'POST';
  const url = editId ? `/api/menu/${editId}` : '/api/menu';

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      alert(editId ? 'Item updated successfully!' : 'Item added successfully!');
      resetInventoryForm();
      loadMenuItems(); // Re-fetch menu items to update state
    } else {
      alert('Error saving menu item: ' + (result.error || 'Server error'));
    }
  } catch (err) {
    alert('Communication error with the server database.');
  }
}

window.deleteMenuItem = async function(id) {
  if (!confirm('Are you sure you want to delete this menu item? This will remove it from the POS catalog.')) {
    return;
  }

  try {
    const response = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    const result = await response.json();

    if (response.ok && result.success) {
      loadMenuItems();
    } else {
      alert('Failed to delete item: ' + (result.error || 'Server error'));
    }
  } catch (err) {
    alert('Communication error with the server database.');
  }
};

// ==================== REPORTS & ANALYTICS (ADMIN) ====================
async function loadDailyReports() {
  try {
    const response = await fetch('/api/reports/daily');
    if (!response.ok) throw new Error('Daily report load failed');
    
    state.reportsSummary = await response.json();
    renderDailyReportsSummary();
    renderDailyLedger();
  } catch (err) {
    console.error('Failed to load reports ledger:', err);
  }
}

// Calculate summary numbers across all orders
function renderDailyReportsSummary() {
  let totalNet = 0;
  let totalOrders = 0;
  let totalDiscount = 0;

  state.reportsSummary.forEach(day => {
    totalNet += day.total_net;
    totalOrders += day.total_orders;
    totalDiscount += day.total_discount;
  });

  const avgTicket = totalOrders > 0 ? (totalNet / totalOrders) : 0;

  el.statNetSales.textContent = formatCurrency(totalNet);
  el.statTotalOrders.textContent = totalOrders;
  el.statAvgTicket.textContent = formatCurrency(avgTicket);
  el.statTotalDiscounts.textContent = formatCurrency(totalDiscount);
}

// Render left column of Everyday Ledger dates
function renderDailyLedger() {
  el.reportDatesList.innerHTML = '';

  if (state.reportsSummary.length === 0) {
    el.reportDatesList.innerHTML = `
      <div class="empty-state text-center text-muted" style="padding: 20px 0;">
        <i data-lucide="calendar" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
        <p>No orders registered yet.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  state.reportsSummary.forEach(day => {
    const div = document.createElement('div');
    div.className = `ledger-item ${state.selectedReportDate === day.date ? 'active' : ''}`;
    
    // Convert YYYY-MM-DD to a nicer date
    const dateObj = new Date(day.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    div.innerHTML = `
      <div>
        <div class="ledger-date">${formattedDate}</div>
        <div class="ledger-volume">${day.total_orders} order(s) taken</div>
      </div>
      <div class="ledger-total">${formatCurrency(day.total_net)}</div>
    `;

    div.addEventListener('click', () => selectReportDate(day.date));
    el.reportDatesList.appendChild(div);
  });

  lucide.createIcons();
}

async function selectReportDate(date) {
  state.selectedReportDate = date;
  
  // Re-render dates to update visual active border
  renderDailyLedger();

  // Load detailed invoices for this specific day
  try {
    const response = await fetch(`/api/reports/detail?date=${date}`);
    if (!response.ok) throw new Error('Invoice detail load failed');

    state.ordersForSelectedDate = await response.json();
    renderDetailedOrders();
  } catch (err) {
    console.error('Failed to load detailed report orders:', err);
    el.reportOrdersTbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">Error loading detailed invoices.</td>
      </tr>
    `;
  }
}

function renderDetailedOrders() {
  el.reportOrdersTbody.innerHTML = '';
  el.exportLedgerBtn.disabled = state.ordersForSelectedDate.length === 0;

  if (state.ordersForSelectedDate.length === 0) {
    el.reportOrdersTbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No details found for this date.</td>
      </tr>
    `;
    return;
  }

  // Update header descriptions
  const dateObj = new Date(state.selectedReportDate + 'T00:00:00');
  const dateText = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  el.reportsDateTitle.textContent = `Daily Invoices - ${dateText}`;
  el.reportsDateSubtitle.textContent = `Detailed list of sales transactions`;

  state.ordersForSelectedDate.forEach(order => {
    // Generate brief summary list of items
    const itemsSummary = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');

    // Extract time (HH:MM:SS) from ISO date
    const d = new Date(order.order_date);
    const orderTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${orderTime}</td>
      <td><code>#${order.id}</code></td>
      <td>${order.created_by}</td>
      <td>
        <div class="summary-items-popover" title="${itemsSummary}">
          ${itemsSummary.length > 40 ? itemsSummary.substring(0, 37) + '...' : itemsSummary}
        </div>
      </td>
      <td>
        <span class="badge ${order.payment_method === 'Cash' ? 'badge-success' : 'badge-info'}">
          ${order.payment_method}
        </span>
      </td>
      <td><strong>${formatCurrency(order.final_amount)}</strong></td>
    `;

    el.reportOrdersTbody.appendChild(row);
  });
}

// Export Daily Detailed Ledger to CSV
function exportLedgerCSV() {
  if (!state.selectedReportDate || state.ordersForSelectedDate.length === 0) return;

  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Headers
  csvContent += 'Order ID,Date Time,Created By,Items,Payment Method,Subtotal,Discount,Tax,Net Total\r\n';

  state.ordersForSelectedDate.forEach(o => {
    const itemsString = o.items.map(item => `${item.name} (${item.quantity}x₹${item.price.toFixed(2)})`).join('; ');
    const formattedDate = formatDateString(o.order_date);
    
    const row = [
      o.id,
      `"${formattedDate}"`,
      o.created_by,
      `"${itemsString}"`,
      o.payment_method,
      o.total_amount.toFixed(2),
      o.discount.toFixed(2),
      o.tax.toFixed(2),
      o.final_amount.toFixed(2)
    ].join(',');

    csvContent += row + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `CozyCup_Ledger_${state.selectedReportDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==================== USER MANAGEMENT (ADMIN ONLY) ====================
async function loadUsers() {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to load users');
    state.users = await response.json();
    renderUsersTable();
  } catch (err) {
    console.error('Failed to load users list:', err);
  }
}

function renderUsersTable() {
  el.usersTableBody.innerHTML = '';
  el.registeredUsersCount.textContent = `${state.users.length} Users`;

  state.users.forEach(user => {
    const isCurrentUser = user.username === state.currentUser.username;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${user.name}</strong></td>
      <td><code>${user.username}</code></td>
      <td>
        <span class="badge ${user.role === 'admin' ? 'badge-success' : 'badge-info'}">
          ${user.role.toUpperCase()}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary btn-sm" onclick="openChangePasswordModal(${user.id}, '${user.username}', '${user.name.replace(/'/g, "\\'")}')">
            <i data-lucide="key" style="width: 14px; height: 14px;"></i> Password
          </button>
          <button class="btn btn-danger-soft btn-sm" onclick="deleteUser(${user.id}, '${user.username}')" ${isCurrentUser ? 'disabled' : ''}>
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
          </button>
        </div>
      </td>
    `;
    el.usersTableBody.appendChild(row);
  });

  lucide.createIcons();
}

async function handleCreateUser(e) {
  e.preventDefault();

  const fullname = el.newUserFullName.value.trim();
  const username = el.newUsername.value.toLowerCase().trim();
  const password = el.newPassword.value;
  const role = el.newUserRole.value;

  const payload = { name: fullname, username, password, role };

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      alert('User created successfully!');
      el.createUserForm.reset();
      loadUsers();
    } else {
      alert('Error creating user: ' + (result.error || 'Server error'));
    }
  } catch (err) {
    alert('Communication error with server database.');
  }
}

window.openChangePasswordModal = function(id, username, fullname) {
  el.passwordModalUserId.value = id;
  el.passwordModalSubtitle.textContent = `Update password for ${fullname} (@${username})`;
  el.newModalPassword.value = '';
  el.passwordModal.classList.add('active');
  lucide.createIcons();
};

async function handleChangePasswordSubmit(e) {
  e.preventDefault();

  const userId = el.passwordModalUserId.value;
  const password = el.newModalPassword.value;

  try {
    const response = await fetch(`/api/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert('Password updated successfully!');
      el.passwordModal.classList.remove('active');
    } else {
      alert('Failed to update password: ' + (result.error || 'Server error'));
    }
  } catch (err) {
    alert('Communication error with the server database.');
  }
}

window.deleteUser = async function(id, username) {
  if (username === state.currentUser.username) {
    alert('You cannot delete your own account while logged in.');
    return;
  }

  if (!confirm(`Are you sure you want to delete user @${username}?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const result = await response.json();

    if (response.ok && result.success) {
      alert('User deleted successfully!');
      loadUsers();
    } else {
      alert('Failed to delete user: ' + (result.error || 'Server error'));
    }
  } catch (err) {
    alert('Communication error with the server database.');
  }
}
