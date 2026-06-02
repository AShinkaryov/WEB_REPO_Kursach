/**
 * AMI Catalog Module
 */

const CatalogApp = (() => {
  let allProducts = [];
  let categories = [];
  let filters = {};
  let activeCategory = 'all';
  let activeFilters = {
    brands: [],
    types: [],
    weights: [],
    ingredients: [],
    packQty: []
  };

  const CART_KEY = 'ami-cart';
  const FAVORITES_KEY = 'ami-favorites';

  /* ── Fetch Data ─────────────────────────────────────────── */
  async function fetchData() {
    try {
      const [productsRes, categoriesRes, filtersRes] = await Promise.all([
        fetch('http://localhost:3001/products'),
        fetch('http://localhost:3001/categories'),
        fetch('http://localhost:3001/filters')
      ]);

      if (!productsRes.ok || !categoriesRes.ok || !filtersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      allProducts = await productsRes.json();
      categories = await categoriesRes.json();
      filters = await filtersRes.json();

      console.log('✅ Loaded products:', allProducts);
      console.log('First product:', allProducts[0]);

      init();
    } catch (error) {
      console.error('❌ Error loading catalog:', error);
      showToast('Ошибка загрузки каталога');
    }
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    renderCategories();
    renderFilters();
    renderProducts(getFilteredProducts());
    renderRecommended();
    renderFavoritesSection();
    updateCartBadge();
    updateFavoritesBadge();
  }

  /* ── Render Categories ──────────────────────────────────── */
  function renderCategories() {
    const tabsContainer = document.getElementById('category-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = categories.map(cat => `
      <button 
        class="catalog-tab${cat.id === 'all' || cat.id === activeCategory ? ' catalog-tab--active' : ''}" 
        data-category="${cat.id}"
        data-label="${cat.label}"
      >
        ${cat.label}
      </button>
    `).join('');

    tabsContainer.querySelectorAll('.catalog-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const categoryId = tab.dataset.category;
        activeCategory = categoryId;
        
        tabsContainer.querySelectorAll('.catalog-tab').forEach(t => {
          t.classList.toggle('catalog-tab--active', t.dataset.category === categoryId);
        });

        renderProducts(getFilteredProducts());
      });
    });
  }

  /* ── Render Filters ─────────────────────────────────────── */
  function renderFilters() {
    const brandsContainer = document.getElementById('filter-brands');
    if (brandsContainer && filters.brands) {
      brandsContainer.innerHTML = filters.brands.map(brand => `
        <label class="filter-checkbox">
          <input type="checkbox" value="${brand.value}" data-filter-type="brands" />
          <span>${brand.label}</span>
        </label>
      `).join('');

      const parentSection = brandsContainer.closest('.filter-section');
      const head = parentSection ? parentSection.querySelector('.filter-section__head') : null;
      const arrow = parentSection ? parentSection.querySelector('.filter-section__arrow') : null;

      if (head && parentSection) {
        head.addEventListener('click', (e) => {
          e.stopPropagation();
          
          document.querySelectorAll('.filter-section--open').forEach(section => {
            if (section !== parentSection) {
              section.classList.remove('filter-section--open');
              const otherArrow = section.querySelector('.filter-section__arrow');
              if (otherArrow) otherArrow.classList.remove('filter-section__arrow--up');
            }
          });
          
          parentSection.classList.toggle('filter-section--open');
          if (arrow) {
            arrow.classList.toggle('filter-section__arrow--up');
          }
        });
      }
    }

    renderFilterSection('filter-types', 'Тип', filters.types || []);
    renderFilterSection('filter-weights', 'Вес', filters.weights || []);
    renderFilterSection('filter-ingredients', 'Ингредиенты', filters.ingredients || []);
    renderFilterSection('filter-packqty', 'Количество в упаковке', filters.packQty || []);

    document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
      checkbox.addEventListener('change', handleFilterChange);
    });
  }

  function renderFilterSection(containerId, title, items) {
    const container = document.getElementById(containerId);
    if (!container || !items.length) return;

    container.innerHTML = `
      <div class="filter-section__head">
        <span>${title}</span>
        <img src="img/arrow-ic-3.svg" alt="" class="filter-section__arrow"/>
      </div>
      <div class="filter-section__body">
        ${items.map(item => `
          <label class="filter-checkbox">
            <input type="checkbox" value="${item}" data-filter-type="${containerId.replace('filter-', '')}" />
            <span>${item}</span>
          </label>
        `).join('')}
      </div>
    `;

    const head = container.querySelector('.filter-section__head');
    const body = container.querySelector('.filter-section__body');
    const arrow = container.querySelector('.filter-section__arrow');

    if (head && body) {
      head.addEventListener('click', () => {
        document.querySelectorAll('.filter-section--open').forEach(section => {
          if (section !== container) {
            section.classList.remove('filter-section--open');
            const otherArrow = section.querySelector('.filter-section__arrow');
            if (otherArrow) otherArrow.classList.remove('filter-section__arrow--up');
          }
        });
        
        container.classList.toggle('filter-section--open');
        if (arrow) {
          arrow.classList.toggle('filter-section__arrow--up');
        }
      });
    }
  }

  /* ── Handle Filter Change ───────────────────────────────── */
  function handleFilterChange(e) {
    const checkbox = e.target;
    const filterType = checkbox.dataset.filterType;
    const value = checkbox.value;

    if (checkbox.checked) {
      if (!activeFilters[filterType].includes(value)) {
        activeFilters[filterType].push(value);
      }
    } else {
      activeFilters[filterType] = activeFilters[filterType].filter(v => v !== value);
    }

    renderActiveFilters();
    renderProducts(getFilteredProducts());
  }

  /* ── Get Filtered Products ──────────────────────────────── */
  function getFilteredProducts() {
    return allProducts.filter(product => {
      if (activeCategory !== 'all' && product.category !== activeCategory) return false;
      if (activeFilters.brands.length && !activeFilters.brands.includes(product.brand)) return false;
      if (activeFilters.types.length && !activeFilters.types.includes(product.type)) return false;
      if (activeFilters.weights.length && !activeFilters.weights.includes(product.weight)) return false;
      if (activeFilters.ingredients.length && !activeFilters.ingredients.includes(product.ingredient)) return false;
      if (activeFilters.packQty.length && !activeFilters.packQty.includes(product.packQty)) return false;
      return true;
    });
  }

  /* ── Render Active Filters Pills ────────────────────────── */
  function renderActiveFilters() {
    const container = document.getElementById('active-filters');
    if (!container) return;

    const pills = [];
    Object.entries(activeFilters).forEach(([type, values]) => {
      values.forEach(value => {
        pills.push(`
          <span class="filter-pill">
            ${value}
            <button class="filter-pill__remove" data-type="${type}" data-value="${value}">×</button>
          </span>
        `);
      });
    });

    container.innerHTML = pills.join('');

    container.querySelectorAll('.filter-pill__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const value = btn.dataset.value;
        activeFilters[type] = activeFilters[type].filter(v => v !== value);
        const checkbox = document.querySelector(`input[data-filter-type="${type}"][value="${value}"]`);
        if (checkbox) checkbox.checked = false;
        renderActiveFilters();
        renderProducts(getFilteredProducts());
      });
    });
  }

  /* ── Render Products ────────────────────────────────────── */
  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = '<p class="products-empty">Товары не найдены</p>';
      return;
    }

    grid.innerHTML = products.map(product => {
      const isFav = isInFavorites(product.id);
      return `
      <article class="product-card" data-id="${product.id}">
        <div class="product-card__image-wrap">
          <img class="product-card__img" src="${product.image}" alt="${product.name}" />
          <button class="product-card__favorite ${isFav ? 'product-card__favorite--active' : ''}" 
                  onclick="CatalogApp.toggleFavorite(${product.id}); event.stopPropagation();"
                  aria-label="В избранное">
            <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" 
                 stroke="currentColor" stroke-width="1.5" width="20" height="20">
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
            <button class="product-card__add" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
              В корзину
            </button>
          </div>
        </div>
      </article>`;
    }).join('');

    grid.querySelectorAll('.product-card__add').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = btn.dataset.id;  // 🔥 Убрали parseInt — оставляем как строку
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    console.log('🔘 Button clicked:', { id, type: typeof id });
    addToCart(id, name, price);
  });
});
  }

  /* ── Render Recommended ─────────────────────────────────── */
  function renderRecommended() {
    const grid = document.getElementById('recommended-grid');
    if (!grid) return;

    const recommended = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 4);

    grid.innerHTML = recommended.map(product => `
      <article class="recommended-card" data-id="${product.id}">
        <img class="recommended-card__img" src="${product.image}" alt="${product.name}" />
        <div class="recommended-card__body">
          <h4 class="recommended-card__title">${product.name}</h4>
          <p class="recommended-card__price">${product.price} ₽</p>
          <button class="recommended-card__add" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
            В корзину
          </button>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.recommended-card__add').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = btn.dataset.id;  // 🔥 Убрали parseInt
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    addToCart(id, name, price);
  });
});
  }

  /* ── Render Favorites Section ───────────────────────────── */
  function renderFavoritesSection() {
  const container = document.getElementById('favorites-section');
  if (!container) return;

  if (allProducts.length === 0) return;

  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  
  // 🔥 ИСПРАВЛЕННОЕ СРАВНЕНИЕ
  const favoriteProducts = allProducts.filter(p => {
    const productId = typeof p.id === 'string' ? p.id : String(p.id);
    return favorites.some(favId => String(favId) === productId);
  });

  if (favoriteProducts.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <h3 class="favorites-title">❤️ Избранное</h3>
    <div class="favorites-grid">
      ${favoriteProducts.map(product => `
        <article class="product-card" data-id="${product.id}">
          <div class="product-card__image-wrap">
            <img class="product-card__img" src="${product.image}" alt="${product.name}" />
            <button class="product-card__favorite product-card__favorite--active" 
                    onclick="CatalogApp.toggleFavorite(${product.id}); event.stopPropagation();"
                    aria-label="Удалить из избранного">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="20" height="20">
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
                      onclick="CatalogApp.addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}); event.stopPropagation();">
                В корзину
              </button>
            </div>
          </div>
        </article>
      `).join('')}
    </div>`;
}

  /* ── Cart Functions ─────────────────────────────────────── */
 function addToCart(id, name, price) {
  console.log('🛒 addToCart:', { id, name, price, type: typeof id });
  console.log('allProducts length:', allProducts.length);
  if (allProducts.length > 0) {
    console.log('First product:', allProducts[0]);
  }
  
  // 🔥 ИЩЕМ ПРОДУКТ (с приведением типов!)
  const product = allProducts.find(p => {
    const productId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
    const searchId = typeof id === 'string' ? parseInt(id) : id;
    return productId === searchId;
  });
  
  console.log('Found product:', product);
  
  if (!product) {
    console.error('❌ Product not found! Looking for id:', id);
    console.error('Available products:', allProducts.map(p => p.id));
    showToast('Ошибка: товар не найден');
    return;
  }
  
  let cart = JSON.parse(localStorage.getItem('ami-cart') || '[]');
  const existingItem = cart.find(item => {
    const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
    const searchId = typeof id === 'string' ? parseInt(id) : id;
    return itemId === searchId;
  });
  
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      quantity: 1,
      image: product.image,
      weight: product.weight,
      brand: product.brand
    });
    console.log('✅ Added to cart');
  }

  localStorage.setItem('ami-cart', JSON.stringify(cart));
  updateCartBadge();
  showToast(`${name} добавлен в корзину`);
}

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = 'flex';
    } else {
      badge.textContent = '';
      badge.style.display = 'none';
    }
  }

  /* ── Favorites Functions ────────────────────────────────── */
  function toggleFavorite(id) {
  console.log('❤️ toggleFavorite:', id, 'type:', typeof id);
  
  let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  console.log('Current favorites:', favorites);
  
  // 🔥 Приводим к строке для сравнения
  const idStr = String(id);
  const index = favorites.findIndex(favId => String(favId) === idStr);
  
  if (index === -1) {
    favorites.push(id);
    showToast('Добавлено в избранное');
  } else {
    favorites.splice(index, 1);
    showToast('Удалено из избранного');
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  console.log('New favorites:', favorites);
  
  updateFavoritesBadge();
  
  if (allProducts.length > 0) {
    renderProducts(getFilteredProducts());
    renderRecommended();
    renderFavoritesSection();
  }
}

  function isInFavorites(id) {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return favorites.includes(id);
  }

  function updateFavoritesBadge() {
    const badge = document.getElementById('favorites-badge');
    if (!badge) return;
    
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    
    if (favorites.length > 0) {
      badge.textContent = favorites.length;
      badge.style.display = 'flex';
    } else {
      badge.textContent = '';
      badge.style.display = 'none';
    }
  }

  /* ── Toast Notification ─────────────────────────────────── */
  function showToast(message) {
    const toast = document.getElementById('ami-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('ami-toast--show');
    setTimeout(() => toast.classList.remove('ami-toast--show'), 3000);
  }

  /* ── Start App ──────────────────────────────────────────── */
  fetchData();

  return {
    addToCart,
    updateCartBadge,
    toggleFavorite,
    isInFavorites,
    updateFavoritesBadge,
    renderFavoritesSection
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('storage', () => {
    CatalogApp.updateCartBadge();
    CatalogApp.updateFavoritesBadge();
    CatalogApp.renderFavoritesSection();
  });
});