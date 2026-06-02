/**
 * AMI Cart Page
 * Reads cart from localStorage, renders items, handles qty +/-, remove, order submit
 */

let cart = JSON.parse(localStorage.getItem('ami_cart') || '[]');

function saveCart() {
  localStorage.setItem('ami_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = total > 0 ? total : '';
}

/* ── Change qty ──────────────────────────────────────────────── */
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
}

/* ── Remove item ─────────────────────────────────────────────── */
function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

/* ── Render rows ─────────────────────────────────────────────── */
function renderCart() {
  const list = document.getElementById('cart-list');
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <p>Корзина пуста</p>
        <a href="catalog.html" class="cart-empty__link">Перейти в каталог</a>
      </div>`;
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item__img" src="${item.image}" alt="${item.name}"/>

      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__weight">${item.weight}</p>
      </div>

      <div class="cart-item__qty-wrap">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)" aria-label="Уменьшить">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id},  1)" aria-label="Увеличить">+</button>
      </div>

      <button class="cart-item__remove" onclick="removeItem(${item.id})" aria-label="Удалить">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `).join('');
}

/* ── Order form submit ───────────────────────────────────────── */
function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Корзина пуста. Добавьте товары перед оформлением заказа.');
      return;
    }
    // Here you'd send to backend; for now just confirm
    alert('Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');
    cart = [];
    saveCart();
    renderCart();
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  updateCartBadge();
  initOrderForm();
});