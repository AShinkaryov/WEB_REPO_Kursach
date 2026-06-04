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
  loadReviews();
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
    'stats': 'stats-section',
    'reviews': 'reviews-section'
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

        // Загружаем данные при переключении
        if (section === 'stats') {
          loadStats();
        }
        if (section === 'reviews') {
          loadReviews();
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
    ingredient: 'Без добавок',
    stock: 100
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
    
    list.innerHTML = products.map(item => `
      <div class="admin-item">
        <img src="${item.image}" alt="${item.name}"/>
        <div class="admin-item-info">
          <div class="admin-item-title">${item.name}</div>
          <div class="admin-item-meta">
            ${item.price} ₽ | ${item.brand} | 
            <span style="color: ${(item.stock || 0) > 10 ? '#27ae60' : '#e74c3c'}; font-weight: 600;">
              📦 На складе: ${item.stock || 0} шт.
            </span>
          </div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-btn admin-btn--small" 
                  onclick="updateProductStock('${item.id}', ${item.stock || 0})">
            ✏️ Изменить
          </button>
          <button class="admin-btn admin-btn--danger admin-btn--small" 
                  onclick="deleteProduct('${item.id}')">
            Удалить
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p>Не удалось загрузить товары</p>';
  }
}

async function updateProductStock(productId, currentStock) {
  const newStock = prompt('Введите количество товара на складе:', currentStock);
  
  if (newStock === null) return;
  
  const stock = parseInt(newStock);
  if (isNaN(stock) || stock < 0) {
    alert('Введите корректное число!');
    return;
  }
  
  try {
    await fetch(`http://localhost:3001/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: stock })
    });
    
    loadProducts();
  } catch (err) {
    alert('Ошибка при обновлении');
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
  const list = document.getElementById('orders-list');
  if (!list) return;

  try {
    const res = await fetch('http://localhost:3002/orders');
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const orders = await res.json();
    
    if (orders.length === 0) {
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
      
      const itemsText = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join('<br>');
      
      return `
      <div class="admin-item" style="flex-direction: column; align-items: stretch; gap: 12px; margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="admin-item-title" style="font-size: 18px; font-weight: 700; color: #423F3E; margin-bottom: 8px;">
              Заказ #${order.id} — ${date}
            </div>
            <div class="admin-item-meta" style="color: #7B7B7B; font-size: 14px; line-height: 1.6;">
              👤 ${order.customer?.name || 'Не указан'}<br>
              📞 ${order.customer?.phone || '-'}<br>
              📧 ${order.customer?.email || '-'}<br>
              📍 ${order.customer?.address || '-'}
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
          ${itemsText || 'Нет товаров'}
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
    
  } catch (err) {
    console.error('❌ Error loading orders:', err);
    list.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <p style="font-size: 16px; margin-bottom: 12px;">Не удалось загрузить заказы</p>
        <p style="font-size: 14px; color: #999;">${err.message}</p>
      </div>`;
  }
}

async function changeOrderStatus(orderId, newStatus) {
  try {
    const orderRes = await fetch(`http://localhost:3002/orders/${orderId}`);
    
    if (!orderRes.ok) {
      throw new Error(`Заказ не найден: ${orderRes.status}`);
    }
    
    const order = await orderRes.json();
    
    const response = await fetch(`http://localhost:3002/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
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
  
  if (users.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Нет пользователей</p>';
    return;
  }
  
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
  
  try {
    const res = await fetch('http://localhost:3002/orders');
    if (!res.ok) throw new Error('Не удалось загрузить заказы');
    
    let orders = await res.json();
    
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

/* ── Reviews Management ────────────────────────────────── */
async function loadReviews() {
  const list = document.getElementById('reviews-list');
  if (!list) return;

  try {
    const res = await fetch('http://localhost:3001/reviews');
    
    if (!res.ok) {
      list.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Сервер отзывов недоступен. Убедитесь, что JSON Server запущен на порту 3001</p>';
      return;
    }
    
    const reviews = await res.json();
    
    if (reviews.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Пока нет отзывов</p>';
      return;
    }
    
    // Сортируем по дате (новые сверху)
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = reviews.map(review => {
      const date = new Date(review.date).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const isNew = review.status === 'new';
      
      return `
        <div class="admin-item" style="flex-direction: column; align-items: stretch; gap: 12px; padding: 20px; background: ${isNew ? '#fff8f0' : '#fff'}; border-left: 4px solid ${isNew ? '#f39c12' : '#27ae60'};">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="admin-item-title" style="font-size: 16px; margin-bottom: 4px;">
                👤 ${review.userName}
              </div>
              <div class="admin-item-meta" style="font-size: 13px;">
                📧 ${review.userEmail} | 📅 ${date}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 24px; color: #f39c12; margin-bottom: 4px;">
                ${stars}
              </div>
              <div style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${isNew ? '#f39c1222' : '#27ae6022'}; color: ${isNew ? '#f39c12' : '#27ae60'}; font-size: 12px; font-weight: 600;">
                ${isNew ? '🆕 Новый' : '✅ Прочитан'}
              </div>
            </div>
          </div>
          
          <div style="background: #f8f8f8; padding: 12px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #333;">
            "${review.text}"
          </div>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            ${isNew ? `
              <button 
                onclick="window.adminPanel.markReviewAsRead('${review.id}')"
                style="padding: 6px 12px; background: #27ae60; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
                ✅ Отметить как прочитанный
              </button>
            ` : ''}
            <button 
              onclick="window.adminPanel.deleteReview('${review.id}')"
              style="padding: 6px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
              🗑️ Удалить
            </button>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (err) {
    console.error('❌ Error loading reviews:', err);
    list.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Не удалось загрузить отзывы</p>';
  }
}

async function markReviewAsRead(reviewId) {
  try {
    await fetch(`http://localhost:3001/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read' })
    });
    
    loadReviews();
  } catch (err) {
    console.error('❌ Ошибка обновления статуса:', err);
    alert('Не удалось обновить статус');
  }
}

async function deleteReview(reviewId) {
  if (!confirm('Удалить этот отзыв?')) return;
  
  try {
    await fetch(`http://localhost:3001/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    
    loadReviews();
  } catch (err) {
    console.error('❌ Ошибка удаления отзыва:', err);
    alert('Не удалось удалить отзыв');
  }
}

// ЕДИНОЕ объявление в самом конце файла
window.adminPanel = {
  deleteNews,
  deleteProduct,
  changeOrderStatus,
  deleteOrder,
  updateProductStock,
  markReviewAsRead,
  deleteReview
};