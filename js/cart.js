/**
 * AMI Cart Page — с оформлением заказа, промокодами и отзывами
 */

// 🔥 Перерендер корзины при смене языка
window.addEventListener('languageChanged', () => {
  console.log('🌐 Перерендер корзины из-за смены языка');
  if (typeof renderCart === 'function') renderCart();
  if (typeof updateCartUI === 'function') updateCartUI();
});

/* ── Глобальные константы ───────────────────────────────── */
const PROMO_API = 'http://localhost:3001/promoCodes';
const ORDERS_API = 'http://localhost:3002/orders';
const REVIEWS_API = 'http://localhost:3001/reviews';

/* ── Получение ключа корзины ────────────────────────────── */
function getCartKey() {
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  return `ami-cart-${session ? session.id : 'guest'}`;
}

/* ── Переменные состояния ───────────────────────────────── */
let cart = [];
let promoCodes = [];
let appliedPromo = null;

/* ── Инициализация данных ───────────────────────────────── */
async function initCart() {
  const CART_KEY = getCartKey();
  cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  appliedPromo = JSON.parse(localStorage.getItem('ami-applied-promo') || 'null');
  
  console.log('🛒 Cart key:', CART_KEY);
  console.log('🛒 Cart loaded:', cart);
  
  await fetchProducts();
  await fetchPromoCodes();
  
  renderCart();
  updateCartBadge();
  updateCartUI();
  
  initOrderForm();
  
  const promoBtn = document.getElementById('promo-apply-btn');
  if (promoBtn) {
    promoBtn.addEventListener('click', applyPromo);
  }
}

/* ── Fetch Products ────────────────────────────────────── */
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

/* ── Fetch Promo Codes ─────────────────────────────────── */
async function fetchPromoCodes() {
  try {
    const res = await fetch(PROMO_API);
    if (res.ok) {
      promoCodes = await res.json();
      console.log('🎟️ Promo codes loaded:', promoCodes.length);
    }
  } catch (e) {
    console.error('❌ Error loading promo codes:', e);
  }
}

/* ── Save cart ─────────────────────────────────────────── */
function saveCart() {
  const CART_KEY = getCartKey();
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
    updateCartUI();
  }
}

/* ── Remove item ───────────────────────────────────────── */
function removeItem(id) {
  const idStr = String(id);
  cart = cart.filter(i => String(i.id) !== idStr);
  saveCart();
  renderCart();
  updateCartUI();
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
  const orderSection = document.getElementById('order-section');
  
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <p>${I18n.t('cart.empty')}</p>
        <a href="catalog.html" class="cart-empty__link">${I18n.t('cart.go_catalog')}</a>
      </div>`;
    if (totalBlock) totalBlock.style.display = 'none';
    if (orderSection) orderSection.style.display = 'none';
    return;
  }

  const currency = I18n.t('common.currency');
  const pcs = I18n.t('common.pcs');

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
        <p class="cart-item__price-one">${price} ${currency} × ${qty} ${pcs}</p>
      </div>
      <div class="cart-item__qty-wrap">
        <button class="qty-btn" onclick="window.CartApp.changeQty('${item.id}', -1)" aria-label="${I18n.t('cart.decrease')}">−</button>
        <span class="qty-val">${qty}</span>
        <button class="qty-btn" onclick="window.CartApp.changeQty('${item.id}', 1)" aria-label="${I18n.t('cart.increase')}">+</button>
      </div>
      <div class="cart-item__line-total">
        <span class="line-total-value">${lineTotal} ${currency}</span>
      </div>
      <button class="cart-item__remove" onclick="window.CartApp.removeItem('${item.id}')" aria-label="${I18n.t('cart.remove')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`;
  }).join('');

  if (totalBlock) totalBlock.style.display = 'flex';
  if (orderSection) orderSection.style.display = 'block';
  
  updateCartUI();
}

/* ── Промокоды ─────────────────────────────────────────── */
function showMessage(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = `promo-message ${type}`;
}

async function applyPromo() {
  const input = document.getElementById('promo-input');
  const message = document.getElementById('promo-message');
  const code = input ? input.value.trim().toUpperCase() : '';
  
  if (!code) {
    showMessage(message, I18n.t('cart.promo_enter'), 'error');
    return;
  }

  const promo = promoCodes.find(p => p.code === code);
  if (!promo) {
    showMessage(message, I18n.t('cart.promo_not_found'), 'error');
    return;
  }
  
  if (!promo.active) {
    showMessage(message, I18n.t('cart.promo_inactive'), 'error');
    return;
  }
  
  if ((promo.usedCount || 0) >= promo.maxUses) {
    showMessage(message, I18n.t('cart.promo_limit'), 'error');
    return;
  }

  const subtotal = calculateTotal();
  const currency = I18n.t('common.currency');
  if (promo.minOrder > 0 && subtotal < promo.minOrder) {
    showMessage(message, `${I18n.t('cart.promo_min_order')}: ${promo.minOrder} ${currency}`, 'error');
    return;
  }

  const discount = promo.type === 'percent' 
    ? (subtotal * promo.value / 100) 
    : promo.value;

  appliedPromo = {
    id: promo.id,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discount: Math.min(discount, subtotal)
  };

  localStorage.setItem('ami-applied-promo', JSON.stringify(appliedPromo));
  showMessage(message, `✅ ${I18n.t('cart.promo_applied')} ${promo.code}!`, 'success');
  updateCartUI();
}

function updateCartUI() {
  const subtotal = calculateTotal();
  const discount = appliedPromo ? appliedPromo.discount : 0;
  const finalTotal = Math.max(0, subtotal - discount);
  const currency = I18n.t('common.currency');

  const discountLine = document.getElementById('discount-line');
  const promoCodeDisplay = document.getElementById('promo-code-display');
  const discountValue = document.getElementById('discount-value');
  const totalValue = document.getElementById('total-value');
  
  if (discountLine && promoCodeDisplay && discountValue) {
    if (appliedPromo) {
      discountLine.style.display = 'flex';
      promoCodeDisplay.textContent = appliedPromo.code;
      discountValue.textContent = `-${appliedPromo.discount} ${currency}`;
    } else {
      discountLine.style.display = 'none';
    }
  }

  if (totalValue) {
    totalValue.textContent = `${finalTotal} ${currency}`;
  }
}

function removePromo() {
  appliedPromo = null;
  localStorage.removeItem('ami-applied-promo');
  const input = document.getElementById('promo-input');
  const message = document.getElementById('promo-message');
  if (input) input.value = '';
  if (message) {
    message.textContent = '';
    message.className = 'promo-message';
  }
  updateCartUI();
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
  
  if (!address) errors.address = I18n.t('cart.err_address');
  if (!name) errors.name = I18n.t('cart.err_name');
  if (!email) errors.email = I18n.t('cart.err_email');
  
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = I18n.t('cart.err_email_invalid');
  }
  
  if (phone && !/^\+375\d{9}$/.test(phone.replace(/\s/g, ''))) {
    errors.phone = I18n.t('cart.err_phone_format');
  }
  if (!phone) {
    errors.phone = I18n.t('cart.err_phone');
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { address, phone, name, email }
  };
}

/* ── Показать ошибки ───────────────────────────────────── */
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
    return;
  }
  
  if (cart.length === 0) {
    alert(I18n.t('cart.empty_alert'));
    return;
  }
  
  // 🔥 ПРОВЕРКА наличия товара на складе
  try {
    const productsRes = await fetch('http://localhost:3001/products');
    const allProducts = await productsRes.json();
    
    for (const cartItem of cart) {
      const product = allProducts.find(p => p.id === cartItem.id);
      if (!product) {
        alert(`${I18n.t('cart.product_not_found')}: "${cartItem.name}"`);
        return;
      }
      if (product.stock < cartItem.quantity) {
        const pcs = I18n.t('common.pcs');
        alert(`${I18n.t('cart.stock_not_enough')} "${product.name}"! ${I18n.t('cart.stock_available')}: ${product.stock} ${pcs}`);
        return;
      }
    }
    
    // 🔥 УМЕНЬШАЕМ stock для каждого товара
    for (const cartItem of cart) {
      const product = allProducts.find(p => p.id === cartItem.id);
      const newStock = product.stock - cartItem.quantity;
      
      await fetch(`http://localhost:3001/products/${cartItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
    }
    
  } catch (err) {
    console.error('❌ Ошибка при обновлении stock:', err);
    alert(I18n.t('cart.stock_error'));
    return;
  }
  
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  const subtotal = calculateTotal();
  const discount = appliedPromo ? appliedPromo.discount : 0;
  const finalTotal = Math.max(0, subtotal - discount);
  const currency = I18n.t('common.currency');
  
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
    subtotal: subtotal,
    discount: discount,
    totalPrice: finalTotal,
    promoCode: appliedPromo ? appliedPromo.code : null,
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
      console.log('✅ Заказ сохранён:', savedOrder);
      
      if (appliedPromo) {
        const promo = promoCodes.find(p => p.id === appliedPromo.id);
        if (promo) {
          await fetch(`${PROMO_API}/${promo.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usedCount: (promo.usedCount || 0) + 1 })
          });
        }
        removePromo();
      }
      
      cart = [];
      saveCart();
      renderCart();
      
      alert(`✅ ${I18n.t('cart.order_success')} #${savedOrder.id}!\n${I18n.t('cart.total_amount')}: ${finalTotal} ${currency}`);
      document.getElementById('order-form').reset();
      setTimeout(() => window.location.href = 'catalog.html', 2000);
    } else {
      throw new Error('Server error: ' + response.status);
    }
  } catch (error) {
    console.error('❌ Ошибка заказа:', error);
    alert(`${I18n.t('cart.order_error')}: ${error.message}`);
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

/* ── Export to global scope ────────────────────────────── */
window.CartApp = { 
  changeQty, 
  removeItem, 
  updateCartBadge, 
  renderCart,
  updateCartUI,
  applyPromo,
  removePromo,
  calculateTotal,
  submitOrder
};

/* ── Initialize on DOM ready ───────────────────────────── */
document.addEventListener('DOMContentLoaded', initCart);

/* ── Отзывы ────────────────────────────────────────────── */
async function submitReview(e) {
  e.preventDefault();
  
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  
  if (!session) {
    showMessage(document.getElementById('review-message'), I18n.t('cart.review_login_required'), 'error');
    return;
  }
  
  const rating = document.querySelector('input[name="rating"]:checked');
  const text = document.getElementById('review-text').value.trim();
  
  if (!rating) {
    showMessage(document.getElementById('review-message'), I18n.t('cart.review_rating_required'), 'error');
    return;
  }
  
  if (!text) {
    showMessage(document.getElementById('review-message'), I18n.t('cart.review_text_required'), 'error');
    return;
  }
  
  if (text.length < 10) {
    showMessage(document.getElementById('review-message'), I18n.t('cart.review_too_short'), 'error');
    return;
  }
  
  const review = {
    userId: session.id,
    userName: session.name,
    userEmail: session.email,
    rating: parseInt(rating.value),
    text: text,
    date: new Date().toISOString(),
    status: 'new'
  };
  
  try {
    const response = await fetch(REVIEWS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    
    if (response.ok) {
      const savedReview = await response.json();
      console.log('✅ Отзыв сохранён:', savedReview);
      
      showMessage(document.getElementById('review-message'), I18n.t('cart.review_thanks'), 'success');
      
      document.getElementById('review-form').reset();
      
      setTimeout(() => {
        const msg = document.getElementById('review-message');
        if (msg) {
          msg.textContent = '';
          msg.className = 'review-message';
        }
      }, 3000);
    } else {
      throw new Error('Server error: ' + response.status);
    }
  } catch (error) {
    console.error('❌ Ошибка отправки отзыва:', error);
    showMessage(document.getElementById('review-message'), I18n.t('cart.review_error'), 'error');
  }
}

// Инициализация формы отзыва
document.addEventListener('DOMContentLoaded', () => {
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', submitReview);
  }
});