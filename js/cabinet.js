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
      
      document.getElementById('cabinet-username').textContent = user.name || user.fullName || 'Пользователь';
      document.getElementById('cabinet-useremail').textContent = user.email;
      document.getElementById('cabinet-userrole').textContent = user.role === 'admin' ? 'Администратор' : 'Покупатель';
      
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

// Форматирование даты
function formatDate(dateString) {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Статусы заказов
const STATUS_LABELS = {
  'pending': { label: '🕐 Принят', class: 'order-status--pending' },
  'processing': { label: '🔄 Обрабатывается', class: 'order-status--processing' },
  'shipped': { label: '📦 Отправлен', class: 'order-status--shipped' },
  'delivered': { label: '✅ Доставлен', class: 'order-status--delivered' },
  'cancelled': { label: '❌ Отменён', class: 'order-status--cancelled' }
};

// Рендер уведомлений
function renderNotifications(orders) {
  const list = document.getElementById('notifications-list');
  
  if (!orders || orders.length === 0) {
    list.innerHTML = '<div class="notification-empty">Нет новых уведомлений</div>';
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
          <div class="notification-title">Заказ #${order.id}</div>
          <div class="notification-text">
            Статус изменён на: <strong>${status.label}</strong><br>
            Сумма: ${order.totalPrice} ₽
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
  
  if (!orders || orders.length === 0) {
    list.innerHTML = `
      <div class="orders-empty">
        <p>У вас пока нет заказов</p>
        <a href="catalog.html" class="btn-orange" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: #E8593A; color: #fff; text-decoration: none; border-radius: 6px;">
          Перейти в каталог
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
          <div class="order-id">Заказ #${order.id}</div>
          <span class="order-status ${status.class}">${status.label}</span>
        </div>
        
        <div class="order-details">
          <div class="order-detail">
            <div class="order-detail-label">Дата заказа</div>
            <div>${date}</div>
          </div>
          <div class="order-detail">
            <div class="order-detail-label">Адрес доставки</div>
            <div>${order.customer?.address || 'Не указан'}</div>
          </div>
          <div class="order-detail">
            <div class="order-detail-label">Телефон</div>
            <div>${order.customer?.phone || 'Не указан'}</div>
          </div>
        </div>
        
        <div class="order-items">
          <div class="order-item">
            <span>Товары:</span>
            <span>${itemsText || 'Нет данных'}</span>
          </div>
        </div>
        
        <div class="order-total">
          Итого: ${order.totalPrice} ₽
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
      
      editBtn.textContent = isEditing ? 'Сохранить' : 'Редактировать';
      
      if (!isEditing) {
        // Здесь можно добавить сохранение на сервер
        alert('Функция сохранения в разработке');
      }
    });
  }
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

document.addEventListener('DOMContentLoaded', init);