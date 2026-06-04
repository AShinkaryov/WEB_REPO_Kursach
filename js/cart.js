/**
 * AMI Cart Page — с оформлением заказа
 */

/* ── Получение ключа корзины с привязкой к пользователю ── */
function getCartKey() {
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  return `ami-cart-${session ? session.id : 'guest'}`;
}

const CART_KEY = getCartKey();
const ORDERS_API = 'http://localhost:3002/orders';  // ✅ Порт 3002 для заказов

let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

console.log('🛒 Cart key:', CART_KEY);
console.log('🛒 Cart loaded:', cart);

/* ── Fetch Products (опционально, для доп. данных) ───── */
async function fetchProducts() {
  try {
    const res = await fetch('http://localhost:3001/products');
    if (res.ok) {
      const products = await res.json();
      console.log('✅ Products loaded:', products.length);
      return products;
    }
  } catch (e) {
    console.error('❌ Error loading products:', e);
  }
  return [];
}

/* ── Save cart ─────────────────────────────────────────── */
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new Event('storage'));
}

/* ── Update badge ──────────────────────────────────────── */
function updateCartBadge() {
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = total > 0 ? total : '';
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}

/* ── Change qty ────────────────────────────────────────── */
function changeQty(id, delta) {
  const idStr = String(id);
  const item = cart.find(i => String(i.id) === idStr);
  
  if (item) {
    item.quantity = Math.max(1, (item.quantity || 1) + delta);
    saveCart();
    renderCart();
  }
}

/* ── Remove item ───────────────────────────────────────── */
function removeItem(id) {
  const idStr = String(id);
  cart = cart.filter(i => String(i.id) !== idStr);
  saveCart();
  renderCart();
}

/* ─ Calculate total ───────────────────────────────────── */
function calculateTotal() {
  return cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);
}

/* ── Render cart ───────────────────────────────────────── */
function renderCart() {
  const list = document.getElementById('cart-list');
  const totalBlock = document.getElementById('cart-total-block');
  
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <p>Корзина пуста</p>
        <a href="catalog.html" class="cart-empty__link">Перейти в каталог</a>
      </div>`;
    if (totalBlock) totalBlock.style.display = 'none';
    return;
  }

  list.innerHTML = cart.map(item => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    const lineTotal = price * qty;
    
    const imageSrc = item.image && item.image.trim() !== '' ? item.image : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22157%22 height=%22132%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22157%22 height=%22132%22/%3E%3C/svg%3E';
    
    return `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item__img" src="${imageSrc}" alt="${item.name}"
           onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22157%22 height=%22132%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22157%22 height=%22132%22/%3E%3C/svg%3E'"/>
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__weight">${item.weight || ''}</p>
        <p class="cart-item__price-one">${price} ₽ × ${qty} шт</p>
      </div>
      <div class="cart-item__qty-wrap">
        <button class="qty-btn" onclick="CartApp.changeQty('${item.id}', -1)" aria-label="Уменьшить">−</button>
        <span class="qty-val">${qty}</span>
        <button class="qty-btn" onclick="CartApp.changeQty('${item.id}', 1)" aria-label="Увеличить">+</button>
      </div>
      <div class="cart-item__line-total">
        <span class="line-total-value">${lineTotal} ₽</span>
      </div>
      <button class="cart-item__remove" onclick="CartApp.removeItem('${item.id}')" aria-label="Удалить">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`;
  }).join('');

  const total = calculateTotal();

  if (totalBlock) {
    totalBlock.innerHTML = `
      <div class="cart-total">
        <span class="cart-total__label">Итого:</span>
        <span class="cart-total__value">${total} ₽</span>
      </div>`;
    totalBlock.style.display = 'flex';
  }
}

/* ── Валидация формы ──────────────────────────────────── */
function validateForm() {
  const form = document.getElementById('order-form');
  if (!form) return { valid: false, errors: {} };
  
  const errors = {};
  const fields = {
    'address': document.getElementById('order-address') || form.querySelector('input[placeholder="Адрес*"]'),
    'phone': document.getElementById('order-phone') || form.querySelector('input[placeholder="Телефон*"]'),
    'name': document.getElementById('order-name') || form.querySelector('input[placeholder="Имя и фамилия*"]'),
    'email': document.getElementById('order-email') || form.querySelector('input[placeholder="E-mail*"]')
  };
  
  const address = fields.address ? fields.address.value.trim() : '';
  const phone = fields.phone ? fields.phone.value.trim() : '';
  const name = fields.name ? fields.name.value.trim() : '';
  const email = fields.email ? fields.email.value.trim() : '';
  
  if (!address) errors.address = 'Укажите адрес доставки';
  if (!name) errors.name = 'Укажите имя и фамилию';
  if (!email) errors.email = 'Укажите e-mail';
  
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Некорректный e-mail';
  }
  
  if (phone && !/^\+375\d{9}$/.test(phone.replace(/\s/g, ''))) {
    errors.phone = 'Номер должен быть в формате +375XXXXXXXXX';
  }
  if (!phone) {
    errors.phone = 'Укажите номер телефона';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { address, phone, name, email }
  };
}

/* ── Показать ошибки валидации ─────────────────────────── */
function showValidationErrors(errors) {
  document.querySelectorAll('.validation-error').forEach(el => el.remove());
  
  const form = document.getElementById('order-form');
  if (!form) return;
  
  const fieldMap = {
    'address': form.querySelector('input[placeholder="Адрес*"]') || document.getElementById('order-address'),
    'phone': form.querySelector('input[placeholder="Телефон*"]') || document.getElementById('order-phone'),
    'name': form.querySelector('input[placeholder="Имя и фамилия*"]') || document.getElementById('order-name'),
    'email': form.querySelector('input[placeholder="E-mail*"]') || document.getElementById('order-email')
  };
  
  Object.keys(errors).forEach(field => {
    const input = fieldMap[field];
    if (input) {
      input.classList.add('input-error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error';
      errorDiv.textContent = errors[field];
      errorDiv.style.cssText = 'color: #E8593A; font-size: 12px; margin-top: 4px; font-family: Manrope;';
      input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
  });
}

/* ── Убрать ошибки при вводе ───────────────────────────── */
function attachInputListeners() {
  const form = document.getElementById('order-form');
  if (!form) return;
  
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const error = input.nextElementSibling;
      if (error && error.classList.contains('validation-error')) {
        error.remove();
      }
    });
  });
}

/* ── Отправка заказа ───────────────────────────────────── */
async function submitOrder(e) {
  e.preventDefault();
  
  const validation = validateForm();
  
  if (!validation.valid) {
    showValidationErrors(validation.errors);
    alert('Пожалуйста, исправьте ошибки в форме');
    return;
  }
  
  if (cart.length === 0) {
    alert('Корзина пуста!');
    return;
  }
  
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  const total = calculateTotal();
  
  const order = {
    userId: session ? session.id : 'guest-' + Date.now(),
    userName: session ? session.name : validation.data.name,
    userEmail: session ? session.email : validation.data.email,
    customer: {
      name: validation.data.name,
      phone: validation.data.phone,
      address: validation.data.address,
      email: validation.data.email
    },
    orderDate: new Date().toISOString(),
    status: 'pending',
    totalPrice: total,
    items: cart.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
      image: item.image || '',
      weight: item.weight || ''
    })),
    notes: (document.querySelector('.order-form__textarea') || {}).value || ''
  };
  
  console.log('📦 Отправка заказа:', order);
  
  try {
    const response = await fetch(ORDERS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    if (response.ok) {
      const savedOrder = await response.json();
      console.log('✅ Заказ сохранён на сервере:', savedOrder);
      
      cart = [];
      saveCart();
      renderCart();
      
      alert(`✅ Заказ #${savedOrder.id} успешно оформлен!\n\nСумма: ${total} ₽\nМы свяжемся с вами в ближайшее время.`);
      
      const form = document.getElementById('order-form');
      if (form) form.reset();
      
      setTimeout(() => {
        window.location.href = 'catalog.html';
      }, 2000);
      
    } else {
      const errorText = await response.text();
      console.error('❌ Server error:', response.status, errorText);
      throw new Error('Server error: ' + response.status);
    }
  } catch (error) {
    console.error('❌ Ошибка при оформлении заказа:', error);
    alert('Произошла ошибка при оформлении заказа: ' + error.message + '\n\nУбедитесь, что:\n1. JSON Server запущен на порту 3002\n2. В файле есть массив "orders": []');
  }
}

/* ── Order form ────────────────────────────────────────── */
function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;
  
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  
  if (!session) {
    console.log('⚠️ Оформление заказа гостем');
  } else {
    const nameField = document.getElementById('order-name') || form.querySelector('input[placeholder="Имя и фамилия*"]');
    const emailField = document.getElementById('order-email') || form.querySelector('input[placeholder="E-mail*"]');
    if (nameField) nameField.value = session.name || '';
    if (emailField) emailField.value = session.email || '';
  }
  
  attachInputListeners();
  form.addEventListener('submit', submitOrder);
}

/* ── Init ──────────────────────────────────────────────── */
async function init() {
  console.log('🚀 Cart page initializing...');
  console.log('🔍 Cart key:', CART_KEY);
  console.log('🔍 Cart data:', localStorage.getItem(CART_KEY));
  console.log('🔍 Session:', localStorage.getItem('ami-session'));
  
  // Сначала рендерим корзину
  renderCart();
  updateCartBadge();
  
  // Опционально подгружаем продукты
  await fetchProducts();
  
  // Инициализируем форму
  initOrderForm();
}

document.addEventListener('DOMContentLoaded', init);

// Экспорт функций
window.CartApp = { 
  changeQty, 
  removeItem, 
  updateCartBadge,
  renderCart
};