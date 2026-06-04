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

  /* ── Проверка ролей ─────────────────────────────────────── */
  function isAdmin() {
    const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
    return session && session.role === 'admin';
  }

  function isGuest() {
    const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
    return !session;
  }

  function getCurrentUserId() {
    const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
    return session ? session.id : 'guest';
  }

  /* ── Ключи хранилища с привязкой к пользователю ─────────── */
  function getCartKey() {
    return `ami-cart-${getCurrentUserId()}`;
  }

  function getFavoritesKey() {
    return `ami-favorites-${getCurrentUserId()}`;
  }

  /* ── Показать текущего пользователя (для отладки) ───────── */
  function showCurrentUserDebug() {
    const debugDiv = document.getElementById('debug-user-info');
    if (!debugDiv) return;

    const session = JSON.parse(localStorage.getItem('ami-session') || 'null');

    if (!session) {
      debugDiv.innerHTML = '👤 <strong>ГОСТЬ</strong> (не авторизован)';
      debugDiv.style.background = '#999';
      console.log('👤 Текущий пользователь: ГОСТЬ');
    } else {
      const roleText = session.role === 'admin' ? '⚙️ АДМИН' : '👤 ПОЛЬЗОВАТЕЛЬ';
      const bgColor = session.role === 'admin' ? '#A7BB61' : '#E8593A';

      debugDiv.innerHTML = `
        ${roleText}<br>
        <strong>${session.name}</strong><br>
        <small>${session.email}</small>
      `;
      debugDiv.style.background = bgColor;
      console.log(`✅ Текущий пользователь: ${session.name} (${session.role})`);
    }
  }

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

      console.log('✅ Loaded products:', allProducts.length);
      init();
    } catch (error) {
      console.error('❌ Error loading catalog:', error);
      showToast('Ошибка загрузки каталога');
    }
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init() {
    console.log('🚀 Catalog initialized');

    if (isAdmin()) {
      document.body.classList.add('admin-mode');
      console.log('✅ admin-mode добавлен в init()');
    }

    showCurrentUserDebug();
    renderCategories();
    renderFilters();
    renderProducts(getFilteredProducts());
    renderRecommended();
    renderFavoritesSection();
    updateCartBadge();
    updateFavoritesBadge();

    // Скрываем иконки корзины/избранного для админа
    if (isAdmin()) {
      const icons = document.querySelector('.sidebar__icons');
      if (icons) icons.style.display = 'none';
    }

    // Вызываем обновление UI авторизации
    if (window.auth && window.auth.updateUserInterface) {
      window.auth.updateUserInterface();
      console.log('✅ updateUserInterface вызван через auth');
    }
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
          if (arrow) arrow.classList.toggle('filter-section__arrow--up');
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
        if (arrow) arrow.classList.toggle('filter-section__arrow--up');
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

    const adminMode = isAdmin();
    const guestMode = isGuest();

    grid.innerHTML = products.map(product => {
      const isFav = isInFavorites(product.id);

      return `
      <article class="product-card" data-id="${product.id}">
        ${adminMode ? '<div class="admin-view-badge">⚙️ Режим админа</div>' : ''}
        <div class="product-card__image-wrap">
          <img class="product-card__img" src="${product.image}" alt="${product.name}" />
          <button class="product-card__favorite ${isFav ? 'product-card__favorite--active' : ''} ${adminMode ? 'product-card__favorite--disabled' : ''}" 
                  data-product-id="${product.id}"
                  ${adminMode ? 'disabled' : ''}
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
            <button class="product-card__add ${adminMode ? 'product-card__add--admin' : ''} ${guestMode ? 'product-card__add--disabled' : ''}" 
                    data-id="${product.id}" 
                    data-name="${product.name}" 
                    data-price="${product.price}"
                    ${adminMode ? 'title="Только просмотр"' : ''}>
              ${adminMode ? '👁️ Просмотр' : (guestMode ? 'Войти' : 'В корзину')}
            </button>
          </div>
        </div>
      </article>`;
    }).join('');

    // Обработчики для корзины
    if (!adminMode) {
      grid.querySelectorAll('.product-card__add').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const name = btn.dataset.name;
          const price = parseFloat(btn.dataset.price);
          addToCart(id, name, price);
        });
      });
    }

    // Обработчики для избранного
    grid.querySelectorAll('.product-card__favorite').forEach(btn => {
      if (!adminMode) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.productId;
          toggleFavorite(id);
        });
      }
    });
  }

  /* ── Render Recommended ─────────────────────────────────── */
  function renderRecommended() {
    const grid = document.getElementById('recommended-grid');
    if (!grid) return;

    const adminMode = isAdmin();
    const recommended = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 4);

    grid.innerHTML = recommended.map(product => `
      <article class="recommended-card" data-id="${product.id}">
        <img class="recommended-card__img" src="${product.image}" alt="${product.name}" />
        <div class="recommended-card__body">
          <h4 class="recommended-card__title">${product.name}</h4>
          <p class="recommended-card__price">${product.price} ₽</p>
          <button class="recommended-card__add ${adminMode ? 'recommended-card__add--admin' : ''}" 
                  data-id="${product.id}" 
                  data-name="${product.name}" 
                  data-price="${product.price}"
                  ${adminMode ? 'title="Только просмотр"' : ''}>
            ${adminMode ? '👁️ Просмотр' : 'В корзину'}
          </button>
        </div>
      </article>
    `).join('');

    if (!adminMode) {
      grid.querySelectorAll('.recommended-card__add').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const name = btn.dataset.name;
          const price = parseFloat(btn.dataset.price);
          addToCart(id, name, price);
        });
      });
    }
  }

  /* ── Render Favorites Section (СКРЫТО для всех в каталоге) ─ */
  function renderFavoritesSection() {
    const container = document.getElementById('favorites-section');
    if (!container) return;
    
    // 🔥 Блок избранного в каталоге скрыт для всех пользователей
    container.style.display = 'none';
    container.innerHTML = '';
  }

  /* ── Cart Functions ─────────────────────────────────────── */
  function addToCart(id, name, price) {
    if (isAdmin()) {
      showToast('⚙️ Администраторы не могут добавлять товары в корзину');
      return;
    }

    if (isGuest()) {
      showToast('⚠️ Для добавления в корзину необходимо войти!');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }

    console.log('🛒 addToCart:', id, name, price);

    const product = allProducts.find(p => {
      const productId = typeof p.id === 'string' ? p.id : String(p.id);
      const searchId = typeof id === 'string' ? id : String(id);
      return productId === searchId;
    });

    if (!product) {
      showToast('Ошибка: товар не найден');
      return;
    }

    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

    const existingItem = cart.find(item => {
      const itemId = typeof item.id === 'string' ? item.id : String(item.id);
      const searchId = typeof id === 'string' ? id : String(id);
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
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartBadge();
    showToast(`${name} добавлен в корзину`);
  }

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
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
    if (isAdmin()) {
      showToast('⚙️ Администраторы не могут добавлять товары в избранное');
      return;
    }

    if (isGuest()) {
      showToast('⚠️ Для добавления в избранное необходимо войти!');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }

    const favoritesKey = getFavoritesKey();
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    const idStr = String(id);
    const index = favorites.findIndex(favId => String(favId) === idStr);

    if (index === -1) {
      favorites.push(id);
      showToast('Добавлено в избранное');
    } else {
      favorites.splice(index, 1);
      showToast('Удалено из избранного');
    }

    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    updateFavoritesBadge();

    if (allProducts.length > 0) {
      renderProducts(getFilteredProducts());
      renderRecommended();
      renderFavoritesSection();
    }
  }

  function isInFavorites(id) {
    const favoritesKey = getFavoritesKey();
    const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    const idStr = String(id);
    return favorites.some(favId => String(favId) === idStr);
  }

  function updateFavoritesBadge() {
    const badge = document.getElementById('favorites-badge');
    if (!badge) return;

    const favoritesKey = getFavoritesKey();
    const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');

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

// В функции renderProducts() или где выводятся карточки товаров
function renderProducts(products) {
  const container = document.getElementById('products-container');
  
  container.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}"/>
      <h3>${product.name}</h3>
      <p class="price">${product.price} ₽</p>
      <p class="stock" style="color: ${product.stock > 10 ? '#27ae60' : '#e74c3c'}; font-weight: 600;">
        📦 В наличии: ${product.stock} шт.
      </p>
      ${product.stock === 0 ? 
        '<button disabled>Нет в наличии</button>' : 
        '<button onclick="addToCart(\'' + product.id + '\')">В корзину</button>'
      }
    </div>
  `).join('');
}