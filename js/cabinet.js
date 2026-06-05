/**
 * AMI User Cabinet - Личный кабинет пользователя
 */

// API endpoints
const API_ORDERS = 'http://localhost:3002/orders';
const API_USERS = 'http://localhost:3001/users';

// Проверка авторизации
function checkAuth() {
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  
  return session;
}

// Загрузка данных пользователя
async function loadUserProfile(session) {
  try {
    const res = await fetch(`${API_USERS}/${session.id}`);
    if (res.ok) {
      const user = await res.json();
      
      document.getElementById('cabinet-username').textContent = user.name || user.fullName || I18n.t('cabinet.default_user');
      document.getElementById('cabinet-useremail').textContent = user.email;
      document.getElementById('cabinet-userrole').textContent = user.role === 'admin' 
        ? I18n.t('cabinet.role_admin') 
        : I18n.t('cabinet.role_buyer');
      
      // Заполнение полей профиля
      document.getElementById('profile-name').value = user.name || user.fullName || '';
      document.getElementById('profile-email').value = user.email || '';
      document.getElementById('profile-phone').value = user.phone || '';
      
      return user;
    }
  } catch (e) {
    console.error('Ошибка загрузки профиля:', e);
  }
  return null;
}

// Загрузка заказов пользователя
async function loadUserOrders(userId) {
  try {
    const res = await fetch(`${API_ORDERS}?userId=${userId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Ошибка загрузки заказов:', e);
  }
  return [];
}

// 🔥 Форматирование даты с учётом языка
function formatDate(dateString) {
  const lang = I18n ? I18n.getLang() : 'ru';
  const localeMap = { ru: 'ru-RU', en: 'en-US', be: 'be-BY' };
  const locale = localeMap[lang] || 'ru-RU';
  
  return new Date(dateString).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 🔥 Статусы заказов — функция, возвращающая переводы
function getStatusLabels() {
  return {
    'pending': { 
      label: I18n ? I18n.t('cabinet.order_status_pending') : '🕐 Принят', 
      class: 'order-status--pending' 
    },
    'processing': { 
      label: I18n ? I18n.t('cabinet.order_status_processing') : '🔄 Обрабатывается', 
      class: 'order-status--processing' 
    },
    'shipped': { 
      label: I18n ? I18n.t('cabinet.order_status_shipped') : '📦 Отправлен', 
      class: 'order-status--shipped' 
    },
    'delivered': { 
      label: I18n ? I18n.t('cabinet.order_status_delivered') : '✅ Доставлен', 
      class: 'order-status--delivered' 
    },
    'cancelled': { 
      label: I18n ? I18n.t('cabinet.order_status_cancelled') : '❌ Отменён', 
      class: 'order-status--cancelled' 
    }
  };
}

// Рендер уведомлений
function renderNotifications(orders) {
  const list = document.getElementById('notifications-list');
  const STATUS_LABELS = getStatusLabels();
  
  if (!orders || orders.length === 0) {
    list.innerHTML = `<div class="notification-empty">${I18n.t('cabinet.no_notifications')}</div>`;
    return;
  }
  
  // Сортируем по дате (новые сверху)
  const sorted = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  
  list.innerHTML = sorted.map(order => {
    const status = STATUS_LABELS[order.status] || STATUS_LABELS['pending'];
    const date = formatDate(order.orderDate);
    
    return `
      <div class="notification-item notification-item--info">
        <div class="notification-icon">📦</div>
        <div class="notification-body">
          <div class="notification-title">${I18n.t('cabinet.order_prefix')} #${order.id}</div>
          <div class="notification-text">
            ${I18n.t('cabinet.status_changed')}: <strong>${status.label}</strong><br>
            ${I18n.t('cabinet.total_amount')}: ${order.totalPrice} ${I18n.t('common.currency')}
          </div>
          <div class="notification-date">${date}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Рендер заказов
function renderOrders(orders) {
  const list = document.getElementById('orders-list');
  const STATUS_LABELS = getStatusLabels();
  
  if (!orders || orders.length === 0) {
    list.innerHTML = `
      <div class="orders-empty">
        <p>${I18n.t('cabinet.no_orders')}</p>
        <a href="catalog.html" class="btn-orange" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: #E8593A; color: #fff; text-decoration: none; border-radius: 6px;">
          ${I18n.t('cabinet.go_catalog')}
        </a>
      </div>`;
    return;
  }
  
  // Сортируем по дате (новые сверху)
  const sorted = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  
  list.innerHTML = sorted.map(order => {
    const status = STATUS_LABELS[order.status] || STATUS_LABELS['pending'];
    const date = formatDate(order.orderDate);
    
    const itemsText = (order.items || []).map(item => 
      `${item.name} × ${item.quantity}`
    ).join(', ');
    
    return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-id">${I18n.t('cabinet.order_prefix')} #${order.id}</div>
          <span class="order-status ${status.class}">${status.label}</span>
        </div>
        
        <div class="order-details">
          <div class="order-detail">
            <div class="order-detail-label">${I18n.t('cabinet.order_date')}</div>
            <div>${date}</div>
          </div>
          <div class="order-detail">
            <div class="order-detail-label">${I18n.t('cabinet.delivery_address')}</div>
            <div>${order.customer?.address || I18n.t('cabinet.not_specified')}</div>
          </div>
          <div class="order-detail">
            <div class="order-detail-label">${I18n.t('cabinet.label_phone')}</div>
            <div>${order.customer?.phone || I18n.t('cabinet.not_specified')}</div>
          </div>
        </div>
        
        <div class="order-items">
          <div class="order-item">
            <span>${I18n.t('cabinet.products_label')}:</span>
            <span>${itemsText || I18n.t('cabinet.no_data')}</span>
          </div>
        </div>
        
        <div class="order-total">
          ${I18n.t('cabinet.total_label')}: ${order.totalPrice} ${I18n.t('common.currency')}
        </div>
      </div>
    `;
  }).join('');
}

// Обработчик выхода
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('ami-session');
      window.location.href = 'login.html';
    });
  }
}

// Обработчик редактирования профиля (заглушка)
function setupProfileEdit() {
  const editBtn = document.getElementById('profile-edit-btn');
  const inputs = document.querySelectorAll('.profile-field input');
  
  if (editBtn) {
    let isEditing = false;
    
    editBtn.addEventListener('click', () => {
      isEditing = !isEditing;
      
      inputs.forEach(input => {
        input.disabled = !isEditing;
        input.classList.toggle('enabled', isEditing);
      });
      
      editBtn.textContent = isEditing 
        ? I18n.t('cabinet.save_btn') 
        : I18n.t('cabinet.edit_btn');
      
      if (!isEditing) {
        // Здесь можно добавить сохранение на сервер
        alert(I18n.t('cabinet.save_in_development'));
      }
    });
  }
}

// 🔥 Функция полного перерендера страницы
async function rerenderCabinet() {
  const session = checkAuth();
  if (!session) return;
  
  await loadUserProfile(session);
  const orders = await loadUserOrders(session.id);
  renderNotifications(orders);
  renderOrders(orders);
}

// Инициализация
async function init() {
  console.log('🚀 Cabinet page initializing...');
  
  const session = checkAuth();
  if (!session) return;
  
  // Загрузка профиля
  await loadUserProfile(session);
  
  // Загрузка и рендер заказов
  const orders = await loadUserOrders(session.id);
  console.log('📦 Orders loaded:', orders.length);
  
  renderNotifications(orders);
  renderOrders(orders);
  
  // Настройка обработчиков
  setupLogout();
  setupProfileEdit();
}

// 🔥 Перерендер при смене языка
window.addEventListener('languageChanged', async () => {
  console.log('🌐 Перерендер кабинета из-за смены языка');
  await rerenderCabinet();
});

document.addEventListener('DOMContentLoaded', init);