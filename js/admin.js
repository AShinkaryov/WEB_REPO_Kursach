/**
 * AMI Admin Panel
 */

// Check admin access
if (!auth.requireAuth('admin')) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminPanel();
  setupNavigation();
  loadNews();
  loadProducts();
  loadOrders();
  loadUsers();
});

function initAdminPanel() {
  const user = auth.getCurrentUser();
  if (user) {
    document.getElementById('admin-name').textContent = user.name;
  }

  // Setup forms
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
    'users': 'users-section'
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const section = href.substring(1);
        
        // Update active state
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Show/hide sections
        Object.keys(sections).forEach(key => {
          const el = document.getElementById(sections[key]);
          if (el) {
            el.style.display = key === section ? 'block' : 'none';
          }
        });
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

  // Save to localStorage
  const news = JSON.parse(localStorage.getItem('ami-news') || '[]');
  news.unshift(newsItem);
  localStorage.setItem('ami-news', JSON.stringify(news));

  // Also update News.json if json-server is running
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

  // Save to localStorage
  const products = JSON.parse(localStorage.getItem('ami-products') || '[]');
  products.push(product);
  localStorage.setItem('ami-products', JSON.stringify(products));

  // Also update Products.json
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
function loadOrders() {
  const list = document.getElementById('orders-list');
  if (!list) return;

  const orders = JSON.parse(localStorage.getItem('ami-orders') || '[]');
  
  if (orders.length === 0) {
    list.innerHTML = '<p>Пока нет заказов</p>';
    return;
  }

  list.innerHTML = orders.map(order => `
    <div class="admin-item">
      <div class="admin-item-info">
        <div class="admin-item-title">Заказ #${order.id}</div>
        <div class="admin-item-meta">
          ${order.customer} | ${order.date} | ${order.total} ₽
        </div>
      </div>
    </div>
  `).join('');
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

// Export for global use
window.adminPanel = {
  deleteNews,
  deleteProduct
};