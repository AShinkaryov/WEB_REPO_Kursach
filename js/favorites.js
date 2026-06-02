/**
 * AMI Favorites Page
 */

const FAVORITES_KEY = 'ami-favorites';
const CART_KEY = 'ami-cart';
let allProducts = [];

/* ── Fetch Products ────────────────────────────────────── */
async function fetchProducts() {
  try {
    const res = await fetch('http://localhost:3001/products');
    if (res.ok) {
      allProducts = await res.json();
      console.log('✅ Favorites: loaded', allProducts.length, 'products');
    }
  } catch (e) {
    console.error('❌ Error loading products:', e);
  }
}

/* ── Update badge ──────────────────────────────────────── */
function updateFavoritesBadge() {
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  const badge = document.getElementById('favorites-badge');
  if (badge) {
    badge.textContent = favorites.length > 0 ? favorites.length : '';
    badge.style.display = favorites.length > 0 ? 'flex' : 'none';
    console.log('❤️ Favorites badge:', favorites.length);
  }
}

/* ── Toggle favorite ───────────────────────────────────── */
function toggleFavorite(id) {
  let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  const index = favorites.indexOf(id);
  
  if (index === -1) {
    favorites.push(id);
    showToast('Добавлено в избранное');
  } else {
    favorites.splice(index, 1);
    showToast('Удалено из избранного');
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  updateFavoritesBadge();
  renderFavorites();
  window.dispatchEvent(new Event('storage'));
}

/* ── Add to cart ───────────────────────────────────────── */
function addToCart(id, name, price) {
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const existing = cart.find(i => i.id === id);
  
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    const product = allProducts.find(p => p.id === id);
    cart.push({ 
      id, 
      name, 
      price, 
      quantity: 1, 
      image: product?.image || '',
      weight: product?.weight || ''
    });
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  showToast(`${name} добавлен в корзину`);
  
  const total = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = 'flex';
  }
  window.dispatchEvent(new Event('storage'));
}

/* ── Render favorites ──────────────────────────────────── */
function renderFavorites() {
  console.log('🎨 renderFavorites called');
  console.log('   allProducts:', allProducts.length);
  
  const grid = document.getElementById('favorites-grid');
  if (!grid) {
    console.error('❌ favorites-grid not found');
    return;
  }
  
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  console.log('   favorites IDs:', favorites);
  
  const favoriteProducts = allProducts.filter(p => favorites.includes(p.id));
  console.log('   favorite products:', favoriteProducts.length);
  
  if (favoriteProducts.length === 0) {
    console.log('ℹ️ No favorites to display');
    grid.innerHTML = `
      <div class="favorites-empty" style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
        <p style="font-family: Manrope; font-size: 18px; color: #999; margin-bottom: 30px;">
          В избранном пока нет товаров
        </p>
        <a href="catalog.html" class="btn-primary" style="display: inline-block; padding: 12px 32px; background: #E8593A; color: #fff; text-decoration: none; border-radius: 6px; font-family: Manrope; font-weight: 600;">
          Перейти в каталог
        </a>
      </div>`;
    return;
  }
  
  grid.innerHTML = favoriteProducts.map(product => {
    console.log('   🖼️ Rendering:', product.name, 'image:', product.image);
    return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-card__image-wrap">
        <img class="product-card__img" src="${product.image}" alt="${product.name}"
             onerror="console.error('❌ Image error:', this.src)"/>
        <button class="product-card__favorite product-card__favorite--active" 
                onclick="toggleFavorite(${product.id}); event.stopPropagation();">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__title">${product.name}</h3>
        <p class="product-card__weight">${product.weight}</p>
        <div class="product-card__meta">
          <span class="product-card__brand">${product.brand}</span>
          <span class="product-card__pack">${product.packQty}</span>
        </div>
        <div class="product-card__footer">
          <span class="product-card__price">${product.price} ₽</span>
          <button class="product-card__add" 
                  onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price});">
            В корзину
          </button>
        </div>
      </div>
    </article>`;
  }).join('');
}

/* ── Toast ─────────────────────────────────────────────── */
function showToast(message) {
  const toast = document.getElementById('ami-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('ami-toast--show');
  setTimeout(() => toast.classList.remove('ami-toast--show'), 3000);
}

/* ── Init ─────────────────────────────────────────────── */
async function init() {
  console.log('🚀 Favorites page initializing...');
  await fetchProducts();
  renderFavorites();
  updateFavoritesBadge();
}

document.addEventListener('DOMContentLoaded', init);
window.FavoritesApp = { toggleFavorite, addToCart, updateFavoritesBadge };