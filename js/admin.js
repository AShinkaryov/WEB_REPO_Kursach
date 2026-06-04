/**
 * AMI Admin Panel
 */

// Check admin access
if (!auth.requireAuth('admin')) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Admin panel initialized');
  initAdminPanel();
  setupNavigation();
  loadNews();
  loadProducts();
  loadOrders();
  loadUsers();
  initStats();
});

// Проверка доступности сервера заказов
async function checkOrdersServer() {
  try {
    console.log('🔍 Проверка сервера заказов на порту 3002...');
    const res = await fetch('http://localhost:3002/orders', {
      method: 'HEAD',
      cache: 'no-store'
    });
    console.log('✅ Сервер заказов доступен:', res.status);
    return true;
  } catch (err) {
    console.error('❌ Сервер заказов недоступен:', err.message);
    console.error('💡 Убедитесь, что выполнили: npx json-server --watch orders.json --port 3002');
    return false;
  }
}

checkOrdersServer();

function initAdminPanel() {
  const user = auth.getCurrentUser();
  if (user) {
    const adminNameEl = document.getElementById('admin-name');
    if (adminNameEl) adminNameEl.textContent = user.name;
  }

  const newsForm = document.getElementById('news-form');
  const productForm = document.getElementById('product-form');

  if (newsForm) {
    newsForm.addEventListener('submit', handleNewsSubmit);
  }

  if (productForm) {
    productForm.addEventListener('submit', handleProductSubmit);
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = {
    'news': 'news-section',
    'products': 'products-section',
    'orders': 'orders-section',
    'users': 'users-section',
    'stats': 'stats-section'
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const section = href.substring(1);
        
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        Object.keys(sections).forEach(key => {
          const el = document.getElementById(sections[key]);
          if (el) {
            el.style.display = key === section ? 'block' : 'none';
          }
        });

        // При первом открытии статистики - загружаем данные
        if (section === 'stats') {
          loadStats();
        }
      }
    });
  });
}

/* ── News Management ─────────────────────────────────────── */
async function handleNewsSubmit(e) {
  e.preventDefault();
  
  const newsItem = {
    id: Date.now().toString(),
    title: document.getElementById('news-title').value,
    content: document.getElementById('news-content').value,
    date: document.getElementById('news-date').value,
    image: document.getElementById('news-image').value || 'img/image.png'
  };

  const news = JSON.parse(localStorage.getItem('ami-news') || '[]');
  news.unshift(newsItem);
  localStorage.setItem('ami-news', JSON.stringify(news));

  try {
    await fetch('http://localhost:3000/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsItem)
    });
  } catch (err) {
    console.warn('Could not save to json-server:', err);
  }

  alert('Новость добавлена!');
  e.target.reset();
  loadNews();
}

async function loadNews() {
  const list = document.getElementById('news-list');
  if (!list) return;

  try {
    const res = await fetch('http://localhost:3000/news');
    const news = await res.json();
    
    list.innerHTML = news.map(item => `
      <div class="admin-item">
        <img src="${item.image}" alt="${item.title}"/>
        <div class="admin-item-info">
          <div class="admin-item-title">${item.title}</div>
          <div class="admin-item-meta">${item.date}</div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-btn admin-btn--danger admin-btn--small" 
                  onclick="deleteNews('${item.id}')">Удалить</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p>Не удалось загрузить новости</p>';
  }
}

async function deleteNews(id) {
  if (!confirm('Удалить эту новость?')) return;

  try {
    await fetch(`http://localhost:3000/news/${id}`, {
      method: 'DELETE'
    });
    loadNews();
  } catch (err) {
    alert('Ошибка при удалении');
  }
}

/* ── Products Management ────────────────────────────────── */
async function handleProductSubmit(e) {
  e.preventDefault();
  
  const product = {
    id: Date.now().toString(),
    name: document.getElementById('product-name').value,
    price: parseFloat(document.getElementById('product-price').value),
    weight: document.getElementById('product-weight').value,
    brand: document.getElementById('product-brand').value,
    category: document.getElementById('product-category').value,
    image: document.getElementById('product-image').value || 'img/image.png',
    description: document.getElementById('product-desc').value,
    packQty: '12 шт',
    type: 'Сахарное',
    ingredient: 'Без добавок'
  };

  const products = JSON.parse(localStorage.getItem('ami-products') || '[]');
  products.push(product);
  localStorage.setItem('ami-products', JSON.stringify(products));

  try {
    await fetch('http://localhost:3001/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
  } catch (err) {
    console.warn('Could not save to json-server:', err);
  }

  alert('Товар добавлен!');
  e.target.reset();
  loadProducts();
}

async function loadProducts() {
  const list = document.getElementById('products-list');
  if (!list) return;

  try {
    const res = await fetch('http://localhost:3001/products');
    const products = await res.json();
    
    list.innerHTML = products.slice(0, 10).map(item => `
      <div class="admin-item">
        <img src="${item.image}" alt="${item.name}"/>
        <div class="admin-item-info">
          <div class="admin-item-title">${item.name}</div>
          <div class="admin-item-meta">${item.price} ₽ | ${item.brand}</div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-btn admin-btn--danger admin-btn--small" 
                  onclick="deleteProduct('${item.id}')">Удалить</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p>Не удалось загрузить товары</p>';
  }
}

async function deleteProduct(id) {
  if (!confirm('Удалить этот товар?')) return;

  try {
    await fetch(`http://localhost:3001/products/${id}`, {
      method: 'DELETE'
    });
    loadProducts();
  } catch (err) {
    alert('Ошибка при удалении');
  }
}

/* ── Orders Management ──────────────────────────────────── */
async function loadOrders() {
  console.log('📥 loadOrders вызвана');
  const list = document.getElementById('orders-list');
  console.log('🔍 Элемент orders-list:', list);
  
  if (!list) {
    console.error('❌ Элемент orders-list не найден в HTML!');
    return;
  }

  try {
    console.log('📥 Загрузка заказов с http://localhost:3002/orders...');
    
    const res = await fetch('http://localhost:3002/orders');
    
    console.log('📊 Status:', res.status);
    console.log('📊 OK:', res.ok);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ HTTP Error:', res.status, errorText);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const orders = await res.json();
    console.log('📦 Orders loaded:', orders.length);
    console.log('📦 Orders data:', orders);
    
    if (orders.length === 0) {
      console.warn('⚠️ Заказов нет в базе данных');
      list.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Пока нет заказов</p>';
      return;
    }

    orders.sort((a, b) => {
      const dateA = new Date(a.orderDate || 0);
      const dateB = new Date(b.orderDate || 0);
      return dateB - dateA;
    });

    const statusLabels = {
      'pending': { label: '🕐 Принят', color: '#f39c12' },
      'processing': { label: '🔄 Обрабатывается', color: '#3498db' },
      'shipped': { label: '📦 Отправлен', color: '#9b59b6' },
      'delivered': { label: '✅ Доставлен', color: '#27ae60' },
      'cancelled': { label: '❌ Отменён', color: '#e74c3c' }
    };

    list.innerHTML = orders.map(order => {
      const status = statusLabels[order.status] || statusLabels['pending'];
      const date = new Date(order.orderDate).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      const itemsText = order.items.map(i => `${i.name} × ${i.quantity}`).join('<br>');
      
      return `
      <div class="admin-item" style="flex-direction: column; align-items: stretch; gap: 12px; margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="admin-item-title" style="font-size: 18px; font-weight: 700; color: #423F3E; margin-bottom: 8px;">
              Заказ #${order.id} — ${date}
            </div>
            <div class="admin-item-meta" style="color: #7B7B7B; font-size: 14px; line-height: 1.6;">
               👤 ${order.customer.name}<br>
              📞 ${order.customer.phone}<br>
              📧 ${order.customer.email}<br>
              📍 ${order.customer.address}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: 700; color: var(--red); margin-bottom: 8px;">
              ${order.totalPrice} ₽
            </div>
            <div style="display: inline-block; padding: 6px 16px; border-radius: 20px; background: ${status.color}22; color: ${status.color}; font-size: 13px; font-weight: 600;">
              ${status.label}
            </div>
          </div>
        </div>
        
        <div style="background: #f8f8f8; padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.6;">
          <strong style="color: #423F3E;">📦 Товары:</strong><br>
          ${itemsText}
        </div>
        
        ${order.notes ? `
          <div style="background: #fff8f0; padding: 12px; border-radius: 6px; font-size: 13px; color: #666; line-height: 1.6;">
            <strong>📝 Примечание:</strong> ${order.notes}
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
          <span style="font-size: 13px; color: #666; font-weight: 600;">Изменить статус:</span>
          ${Object.keys(statusLabels).map(statusKey => {
            const s = statusLabels[statusKey];
            const isActive = order.status === statusKey;
            return `
              <button 
                onclick="window.adminPanel.changeOrderStatus('${order.id}', '${statusKey}')"
                style="padding: 6px 12px; border: 2px solid ${s.color}; background: ${isActive ? s.color : '#fff'}; color: ${isActive ? '#fff' : s.color}; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;"
                ${isActive ? 'disabled' : ''}>
                ${s.label}
              </button>
            `;
          }).join('')}
          <button 
            onclick="window.adminPanel.deleteOrder('${order.id}')"
            style="margin-left: auto; padding: 6px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
            🗑️ Удалить
          </button>
        </div>
      </div>`;
    }).join('');
    
    console.log('✅ Заказы отрисованы в HTML');
  } catch (err) {
    console.error('❌ Error loading orders:', err);
    list.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <p style="font-size: 16px; margin-bottom: 12px;">Не удалось загрузить заказы</p>
        <p style="font-size: 14px; color: #999;">${err.message}</p>
      </div>`;
  }
}

async function changeOrderStatus(orderId, newStatus) {
  console.log('🔄 Изменение статуса заказа', orderId, '→', newStatus);
  
  try {
    const orderRes = await fetch(`http://localhost:3002/orders/${orderId}`);
    
    if (!orderRes.ok) {
      throw new Error(`Заказ не найден: ${orderRes.status}`);
    }
    
    const order = await orderRes.json();
    console.log('📦 Текущий заказ:', order);
    
    const response = await fetch(`http://localhost:3002/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const updatedOrder = await response.json();
    console.log('✅ Статус изменён:', updatedOrder);
    
    const notificationsKey = `ami-notifications-${order.userId}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
    
    const statusLabels = {
      'pending': '🕐 Принят',
      'processing': '🔄 Обрабатывается',
      'shipped': '📦 Отправлен',
      'delivered': '✅ Доставлен',
      'cancelled': '❌ Отменён'
    };
    
    notifications.unshift({
      id: Date.now().toString(),
      orderId: orderId,
      type: 'order_status',
      title: 'Статус заказа изменён',
      text: `Ваш заказ #${orderId} теперь: ${statusLabels[newStatus] || newStatus}`,
      date: new Date().toISOString(),
      read: false
    });
    
    localStorage.setItem(notificationsKey, JSON.stringify(notifications.slice(0, 20)));
    console.log('🔔 Уведомление сохранено');
    
    loadOrders();
    
    alert(`✅ Статус заказа #${orderId} изменён на: ${statusLabels[newStatus]}`);
    
  } catch (err) {
    console.error('❌ Ошибка при изменении статуса:', err);
    alert('Не удалось изменить статус: ' + err.message);
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Удалить заказ #' + orderId + '?')) return;
  
  try {
    const response = await fetch(`http://localhost:3002/orders/${orderId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      loadOrders();
    } else {
      throw new Error('Server error');
    }
  } catch (err) {
    console.error('❌ Ошибка при удалении заказа:', err);
    alert('Не удалось удалить заказ');
  }
}

/* ── Users Management ────────────────────────────────────── */
function loadUsers() {
  const list = document.getElementById('users-list');
  if (!list) return;

  const users = JSON.parse(localStorage.getItem('ami-users') || '[]');
  
  list.innerHTML = users.map(user => `
    <div class="admin-item">
      <div class="admin-item-info">
        <div class="admin-item-title">${user.name}</div>
        <div class="admin-item-meta">
          ${user.email} | ${user.phone} | Роль: ${user.role}
        </div>
      </div>
    </div>
  `).join('');
}

/* ── Statistics Management ───────────────────────────────── */
async function loadStats() {
  const period = document.getElementById('stats-period')?.value || 'all';
  console.log('📊 Загрузка статистики, период:', period);
  
  try {
    const res = await fetch('http://localhost:3002/orders');
    if (!res.ok) throw new Error('Не удалось загрузить заказы');
    
    let orders = await res.json();
    
    // Фильтрация по периоду
    if (period !== 'all') {
      const days = parseInt(period);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      orders = orders.filter(o => new Date(o.orderDate) >= cutoff);
    }
    
    renderStats(orders);
  } catch (err) {
    console.error('❌ Ошибка загрузки статистики:', err);
    document.getElementById('stat-orders').textContent = 'Ошибка';
  }
}

function renderStats(orders) {
  // Сводные карточки
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalItems = orders.reduce((s, o) => 
    s + (o.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0), 0
  );
  const uniqueUsers = new Set(orders.map(o => o.userId)).size;
  const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  
  document.getElementById('stat-orders').textContent = totalOrders;
  document.getElementById('stat-revenue').textContent = totalRevenue.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('stat-items').textContent = totalItems;
  document.getElementById('stat-users').textContent = uniqueUsers;
  document.getElementById('stat-avg').textContent = avgCheck.toLocaleString('ru-RU') + ' ₽';
  
  // Таблица товаров
  const prodMap = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const key = item.productId || item.name;
      if (!prodMap[key]) {
        prodMap[key] = { name: item.name || 'Без названия', qty: 0, revenue: 0, orders: 0 };
      }
      prodMap[key].qty += item.quantity || 0;
      prodMap[key].revenue += (item.price || 0) * (item.quantity || 0);
      prodMap[key].orders++;
    });
  });
  
  const sortedProd = Object.values(prodMap).sort((a, b) => b.qty - a.qty);
  const prodTbody = document.querySelector('#products-stats-table tbody');
  
  if (prodTbody) {
    if (sortedProd.length === 0) {
      prodTbody.innerHTML = '<tr><td colspan="5" class="stats-empty">Нет данных о продажах</td></tr>';
    } else {
      prodTbody.innerHTML = sortedProd.map((p, i) =>
        `<tr>
          <td>${i + 1}</td>
          <td>${p.name}</td>
          <td><strong>${p.qty}</strong></td>
          <td>${p.revenue.toLocaleString('ru-RU')} ₽</td>
          <td>${p.orders}</td>
        </tr>`
      ).join('');
    }
  }
  
  // Таблица пользователей
  const userMap = {};
  orders.forEach(order => {
    const uid = order.userId;
    if (!userMap[uid]) {
      userMap[uid] = {
        name: order.customer?.name || order.userName || 'Гость',
        email: order.customer?.email || order.userEmail || '-',
        orders: 0, 
        total: 0
      };
    }
    userMap[uid].orders++;
    userMap[uid].total += order.totalPrice || 0;
  });
  
  const sortedUsers = Object.values(userMap).sort((a, b) => b.total - a.total);
  const userTbody = document.querySelector('#users-stats-table tbody');
  
  if (userTbody) {
    if (sortedUsers.length === 0) {
      userTbody.innerHTML = '<tr><td colspan="5" class="stats-empty">Нет покупателей</td></tr>';
    } else {
      userTbody.innerHTML = sortedUsers.map((u, i) => {
        const avg = u.orders > 0 ? Math.round(u.total / u.orders) : 0;
        return `<tr>
          <td>${i + 1}</td>
          <td>${u.name}<br><small style="color:#888">${u.email}</small></td>
          <td>${u.orders}</td>
          <td><strong>${u.total.toLocaleString('ru-RU')} ₽</strong></td>
          <td>${avg.toLocaleString('ru-RU')} ₽</td>
        </tr>`;
      }).join('');
    }
  }
}

function initStats() {
  const refreshBtn = document.getElementById('stats-refresh-btn');
  const periodSelect = document.getElementById('stats-period');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadStats);
  }
  
  if (periodSelect) {
    periodSelect.addEventListener('change', loadStats);
  }
}

// ЕДИНОЕ объявление в самом конце файла!
window.adminPanel = {
  deleteNews,
  deleteProduct,
  changeOrderStatus,
  deleteOrder
};