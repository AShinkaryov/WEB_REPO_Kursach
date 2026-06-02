/**
 * AMI Catalog Module
 * Loads products from /data/products.json
 * Handles: category tabs, filter panel, active filters, favorites, cart, pagination
 */

const PAGE_SIZE = 12;

let allProducts   = [];
let allData       = {};
let activeFilters = {
  category:    'pechenye',
  brands:      [],
  types:       [],
  weights:     [],
  ingredients: [],
  packQty:     []
};
let currentPage   = 1;
let favorites     = JSON.parse(localStorage.getItem('ami_favorites') || '[]');
let cart          = JSON.parse(localStorage.getItem('ami_cart')      || '[]');

/* ── Persist ────────────────────────────────────────────────── */
function saveFavorites() { localStorage.setItem('ami_favorites', JSON.stringify(favorites)); }
function saveCart()      { localStorage.setItem('ami_cart',      JSON.stringify(cart));      }

/* ── Cart badge ─────────────────────────────────────────────── */
function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = total > 0 ? total : '';
}

/* ── Cart ops ───────────────────────────────────────────────── */
function addToCart(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name: product.name, weight: product.weight, image: product.image, price: product.price, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  showToast(`«${product.name}» добавлен в корзину`);
}

/* ── Favorites ──────────────────────────────────────────────── */
function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx === -1) { favorites.push(id); }
  else            { favorites.splice(idx, 1); }
  saveFavorites();
  // re-render hearts
  document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('fav-btn--active', favorites.includes(id));
    btn.setAttribute('aria-pressed', favorites.includes(id));
  });
}

/* ── Toast ──────────────────────────────────────────────────── */
function showToast(msg) {
  let toast = document.getElementById('ami-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ami-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('ami-toast--visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('ami-toast--visible'), 2200);
}

/* ── Filter logic ───────────────────────────────────────────── */
function filtered() {
  return allProducts.filter(p => {
    if (p.category !== activeFilters.category) return false;
    if (activeFilters.brands.length      && !activeFilters.brands.includes(p.brand))       return false;
    if (activeFilters.types.length       && !activeFilters.types.includes(p.type))         return false;
    if (activeFilters.weights.length     && !activeFilters.weights.includes(p.weight))     return false;
    if (activeFilters.ingredients.length && !activeFilters.ingredients.includes(p.ingredient)) return false;
    if (activeFilters.packQty.length     && !activeFilters.packQty.includes(p.packQty))   return false;
    return true;
  });
}

/* ── Active filter pills ────────────────────────────────────── */
function renderActivePills() {
  const bar = document.getElementById('active-filters');
  if (!bar) return;
  bar.innerHTML = '';
  const groups = ['brands','types','weights','ingredients','packQty'];
  groups.forEach(group => {
    activeFilters[group].forEach(val => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'active-pill';
      btn.innerHTML = `<span>${val}</span><span class="active-pill__x">✕</span>`;
      btn.addEventListener('click', () => {
        activeFilters[group] = activeFilters[group].filter(v => v !== val);
        // uncheck in panel
        const cb = document.querySelector(`input[data-group="${group}"][value="${val}"]`);
        if (cb) cb.checked = false;
        currentPage = 1;
        renderAll();
      });
      bar.appendChild(btn);
    });
  });
}

/* ── Product card ───────────────────────────────────────────── */
function buildCard(p) {
  const isFav = favorites.includes(p.id);
  return `
    <article class="product-card" data-id="${p.id}">
      <button class="fav-btn ${isFav ? 'fav-btn--active' : ''}"
              data-id="${p.id}"
              aria-label="В избранное"
              aria-pressed="${isFav}"
              onclick="toggleFavorite(${p.id})">
        <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <img class="product-card__img" src="${p.image}" alt="${p.name}" loading="lazy"/>
      <p class="product-card__name">${p.name}</p>
      <div class="product-card__weight">${p.weight}</div>
      <button class="product-card__cart-btn" onclick="addToCart(${p.id})" aria-label="В корзину">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        В корзину
      </button>
    </article>`;
}

/* ── Render grid ────────────────────────────────────────────── */
function renderGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const items = filtered();
  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = items.slice(start, start + PAGE_SIZE);
  grid.innerHTML = page.length
    ? page.map(buildCard).join('')
    : '<p class="catalog__empty">Товары не найдены</p>';
}

/* ── Pagination ─────────────────────────────────────────────── */
function renderPagination() {
  const wrap = document.getElementById('pagination');
  if (!wrap) return;
  const total = Math.ceil(filtered().length / PAGE_SIZE);
  if (total <= 1) { wrap.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn page-btn--arrow" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>‹</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i===currentPage?'page-btn--active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn page-btn--arrow" onclick="goPage(${currentPage+1})" ${currentPage===total?'disabled':''}>›</button>`;
  wrap.innerHTML = html;
}

function goPage(n) {
  const total = Math.ceil(filtered().length / PAGE_SIZE);
  if (n < 1 || n > total) return;
  currentPage = n;
  renderGrid();
  renderPagination();
}

/* ── Recommended ────────────────────────────────────────────── */
function renderRecommended() {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;
  const recs = allProducts.filter(p => p.recommended).slice(0, 4);
  grid.innerHTML = recs.map(buildCard).join('');
}

/* ── Category tabs ──────────────────────────────────────────── */
function buildCategoryTabs() {
  const nav = document.getElementById('category-tabs');
  if (!nav || !allData.categories) return;
  nav.innerHTML = allData.categories.map(cat => `
    <button class="cat-tab ${cat.id === activeFilters.category ? 'cat-tab--active' : ''}"
            data-cat="${cat.id}"
            onclick="switchCategory('${cat.id}')">
      ${cat.label}
    </button>`).join('');
}

function switchCategory(id) {
  activeFilters.category = id;
  currentPage = 1;
  document.querySelectorAll('.cat-tab').forEach(b => {
    b.classList.toggle('cat-tab--active', b.dataset.cat === id);
  });
  renderAll();
}

/* ── Filter panel ───────────────────────────────────────────── */
function buildFilterPanel() {
  buildBrandsSection();
  buildCollapsible('filter-types',       'Тип печенья',       allData.filters.types,       'types');
  buildCollapsible('filter-weights',     'Вес',               allData.filters.weights,     'weights');
  buildCollapsible('filter-ingredients', 'Состав',            allData.filters.ingredients, 'ingredients');
  buildCollapsible('filter-packqty',     'Кол. в упаковке',   allData.filters.packQty,     'packQty');
}

function buildBrandsSection() {
  const wrap = document.getElementById('filter-brands');
  if (!wrap) return;
  wrap.innerHTML = allData.filters.brands.map(b => `
    <label class="filter-check">
      <input type="checkbox" data-group="brands" value="${b.value}"
             onchange="onFilterChange(this)"/>
      <span class="filter-check__box"></span>
      <span class="filter-check__label">${b.label}</span>
    </label>`).join('');
}

function buildCollapsible(containerId, title, items, group) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = `
    <button class="filter-section__toggle" onclick="toggleSection(this)" aria-expanded="false">
      <span>${title}</span>
      <img src="img/arrow-ic.svg" alt="" class="filter-section__arrow"/>
    </button>
    <div class="filter-section__body" hidden>
      ${items.map(v => `
        <label class="filter-check">
          <input type="checkbox" data-group="${group}" value="${v}"
                 onchange="onFilterChange(this)"/>
          <span class="filter-check__box"></span>
          <span class="filter-check__label">${v}</span>
        </label>`).join('')}
    </div>`;
}

function toggleSection(btn) {
  const body = btn.nextElementSibling;
  const open = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', !open);
  body.hidden = open;
  btn.querySelector('.filter-section__arrow').style.transform = open ? '' : 'rotate(180deg)';
}

function onFilterChange(cb) {
  const group = cb.dataset.group;
  const val   = cb.value;
  if (cb.checked) {
    if (!activeFilters[group].includes(val)) activeFilters[group].push(val);
  } else {
    activeFilters[group] = activeFilters[group].filter(v => v !== val);
  }
  currentPage = 1;
  renderAll();
}

/* ── Master render ──────────────────────────────────────────── */
function renderAll() {
  renderActivePills();
  renderGrid();
  renderPagination();
}

/* ── Init ───────────────────────────────────────────────────── */
async function initCatalog() {
  const res  = await fetch('data/products.json');
  allData    = await res.json();
  allProducts = allData.products;

  buildCategoryTabs();
  buildFilterPanel();
  renderRecommended();
  renderAll();
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', initCatalog);