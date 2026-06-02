/**
 * AMI Cart Page
 */

const CART_KEY = 'ami-cart';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

console.log('🛒 Cart loaded:', cart);

/* ── Fetch Products ────────────────────────────────────── */
async function fetchProducts() {
  try {
    const res = await fetch('http://localhost:3001/products');
    if (res.ok) {
      const products = await res.json();
      console.log('✅ Products loaded:', products.length, 'items');
      return products;
    }
  } catch (e) {
    console.error('❌ Error loading products:', e);
  }
  return [];
}

/* ─ Save cart ─────────────────────────────────────────── */
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
    console.log('🔢 Badge:', total);
  }
}

/* ── Change qty ────────────────────────────────────────── */
function changeQty(id, delta) {
  console.log('🔢 changeQty:', id, delta);
  const item = cart.find(i => {
    const itemId = typeof i.id === 'string' ? parseInt(i.id) : i.id;
    const searchId = typeof id === 'string' ? parseInt(id) : id;
    return itemId === searchId;
  });
  if (item) {
    item.quantity = Math.max(1, (item.quantity || 1) + delta);
    saveCart();
    renderCart();
  }
}

/* ── Remove item ───────────────────────────────────────── */
function removeItem(id) {
  console.log('️ removeItem:', id);
  cart = cart.filter(i => {
    const itemId = typeof i.id === 'string' ? parseInt(i.id) : i.id;
    const searchId = typeof id === 'string' ? parseInt(id) : id;
    return itemId !== searchId;
  });
  saveCart();
  renderCart();
}

/* ── Calculate total ───────────────────────────────────── */
function calculateTotal() {
  return cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);
}

/* ── Render cart ───────────────────────────────────────── */
function renderCart() {
  console.log('🎨 renderCart, cart.length:', cart.length);
  
  const list = document.getElementById('cart-list');
  const totalBlock = document.getElementById('cart-total-block');
  
  if (!list) {
    console.error('❌ cart-list not found');
    return;
  }

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <p>Корзина пуста</p>
        <a href="catalog.html" class="cart-empty__link">Перейти в каталог</a>
      </div>`;
    if (totalBlock) totalBlock.style.display = 'none';
    return;
  }

  // Render items
  list.innerHTML = cart.map(item => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    const lineTotal = price * qty;
    
    console.log('️ Item:', item.name, 'price:', price, 'qty:', qty, 'total:', lineTotal);
    
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
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)" aria-label="Уменьшить">−</button>
        <span class="qty-val">${qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)" aria-label="Увеличить">+</button>
      </div>
      <div class="cart-item__line-total">
        <span class="line-total-value">${lineTotal} ₽</span>
      </div>
      <button class="cart-item__remove" onclick="removeItem(${item.id})" aria-label="Удалить">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`;
  }).join('');

  // Calculate and show total
  const total = calculateTotal();
  console.log('💰 Total:', total, '₽');

  if (totalBlock) {
    totalBlock.innerHTML = `
      <div class="cart-total">
        <span class="cart-total__label">Итого:</span>
        <span class="cart-total__value">${total} ₽</span>
      </div>`;
    totalBlock.style.display = 'flex';
  }
}

/* ── Order form ────────────────────────────────────────── */
function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;
  
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Корзина пуста.');
      return;
    }
    alert('Заказ оформлен! Сумма: ' + calculateTotal() + ' ₽');
    cart = [];
    saveCart();
    renderCart();
    form.reset();
  });
}

/* ── Init ──────────────────────────────────────────────── */
async function init() {
  console.log('🚀 Cart page initializing...');
  await fetchProducts();
  renderCart();
  updateCartBadge();
  initOrderForm();
}

document.addEventListener('DOMContentLoaded', init);

window.CartApp = { changeQty, removeItem, updateCartBadge };