/**
 * AMI Catalog Page — с пагинацией, фильтрами и интернационализацией
 */

const CatalogApp = (() => {
  let allProducts = [];
  let categories = [];
  let filters = {};
  let activeCategory = 'all';
  let activeFilters = {
    brands: [], types: [], weights: [], ingredients: [], packQty: []
  };
  
  // 📄 Переменные для пагинации
  let currentPage = 1;
  const ITEMS_PER_PAGE = 6;

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

  function getCartKey() { return `ami-cart-${getCurrentUserId()}`; }
  function getFavoritesKey() { return `ami-favorites-${getCurrentUserId()}`; }

  function showCurrentUserDebug() {
    const debugDiv = document.getElementById('debug-user-info');
    if (!debugDiv) return;
    const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
    if (!session) {
      debugDiv.innerHTML = '👤 <strong>ГОСТЬ</strong>';
      debugDiv.style.background = '#999';
    } else {
      const roleText = session.role === 'admin' ? '⚙️ АДМИН' : '👤 ПОЛЬЗОВАТЕЛЬ';
      debugDiv.innerHTML = `${roleText}<br><strong>${session.name}</strong><br><small>${session.email}</small>`;
      debugDiv.style.background = session.role === 'admin' ? '#A7BB61' : '#E8593A';
    }
  }

  async function fetchData() {
    try {
      const [productsRes, categoriesRes, filtersRes] = await Promise.all([
        fetch('http://localhost:3001/products'),
        fetch('http://localhost:3001/categories'),
        fetch('http://localhost:3001/filters')
      ]);
      if (!productsRes.ok || !categoriesRes.ok || !filtersRes.ok) throw new Error('Failed to fetch data');
      allProducts = await productsRes.json();
      categories = await categoriesRes.json();
      filters = await filtersRes.json();
      console.log('✅ Loaded products:', allProducts.length);
      
      // 📄 Инициализация пагинации
      initPagination();
      init();
    } catch (error) {
      console.error('❌ Error loading catalog:', error);
      showToast(typeof I18n !== 'undefined' ? I18n.t('catalog.load_error') : 'Ошибка загрузки каталога');
    }
  }

  function init() {
    console.log('🚀 Catalog initialized');
    
    if (typeof I18n !== 'undefined') {
      I18n.translatePage();
    }
    
    if (isAdmin()) document.body.classList.add('admin-mode');
    showCurrentUserDebug();
    renderCategories();
    renderFilters();
    loadAndRenderProducts();
    renderRecommended();
    renderFavoritesSection();
    updateCartBadge();
    updateFavoritesBadge();
    if (isAdmin()) {
      const icons = document.querySelector('.sidebar__icons');
      if (icons) icons.style.display = 'none';
    }
    if (window.auth && window.auth.updateUserInterface) {
      window.auth.updateUserInterface();
    }
    
    // 📄 Настраиваем делегирование событий
    setupProductEvents();
  }

  /* ── 📄 ПАГИНАЦИЯ ────────────────────────────────────── */
  function initPagination() {
    renderPagination();
  }

  function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'flex';
    
    let html = '';
    
    // Кнопка "Назад"
    html += `
      <button class="pagination__btn pagination__btn--arrow ${currentPage === 1 ? 'pagination__btn--disabled' : ''}" 
              onclick="CatalogApp.goToPage(${currentPage - 1})" 
              ${currentPage === 1 ? 'disabled' : ''}
              aria-label="Предыдущая">
        ‹
      </button>
    `;
    
    // Номера страниц
    const pages = getVisiblePages(currentPage, totalPages);
    pages.forEach(page => {
      if (page === 'ellipsis') {
        html += `<span class="pagination__btn pagination__btn--disabled">...</span>`;
      } else {
        const isActive = page === currentPage;
        html += `
          <button class="pagination__btn ${isActive ? 'pagination__btn--active' : ''}" 
                  onclick="CatalogApp.goToPage(${page})"
                  aria-label="Страница ${page}"
                  ${isActive ? 'aria-current="page"' : ''}>
            ${page}
          </button>
        `;
      }
    });
    
    // Кнопка "Вперед"
    html += `
      <button class="pagination__btn pagination__btn--arrow ${currentPage === totalPages ? 'pagination__btn--disabled' : ''}" 
              onclick="CatalogApp.goToPage(${currentPage + 1})" 
              ${currentPage === totalPages ? 'disabled' : ''}
              aria-label="Следующая">
        ›
      </button>
    `;
    
    // Информация
    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);
    html += `<span class="pagination__info">${start}–${end} из ${filtered.length}</span>`;
    
    container.innerHTML = html;
  }

  function getVisiblePages(current, total) {
    const pages = [];
    const delta = 2;
    
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    return pages;
  }

  function goToPage(page) {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    loadAndRenderProducts();
    renderPagination();
    
    // Плавная прокрутка к началу каталога
    const catalogBody = document.querySelector('.catalog-body');
    if (catalogBody) {
      catalogBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function loadAndRenderProducts() {
    const filtered = getFilteredProducts();
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginated = filtered.slice(start, end);
    
    renderProducts(paginated);
    renderPagination();
  }

  /* ── 🔥 ДЕЛЕГИРОВАНИЕ СОБЫТИЙ ─────────────────────────── */
  function setupProductEvents() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    const adminMode = isAdmin();
    
    // ОДИН обработчик на весь grid
    grid.addEventListener('click', (e) => {
      // КОРЗИНА
      const addToCartBtn = e.target.closest('.product-card__add');
      if (addToCartBtn && !adminMode) {
        e.stopPropagation();
        const id = addToCartBtn.dataset.id;
        const name = addToCartBtn.dataset.name;
        const price = parseFloat(addToCartBtn.dataset.price);
        addToCart(id, name, price);
        return;
      }
      
      // ИЗБРАННОЕ
      const favBtn = e.target.closest('.product-card__favorite');
      if (favBtn && !adminMode) {
        e.stopPropagation();
        const id = favBtn.dataset.productId;
        toggleFavorite(id);
        return;
      }
      
      // QR-КОД
      const qrBtn = e.target.closest('.product-card__qr');
      if (qrBtn) {
        e.stopPropagation();
        e.preventDefault();
        const id = qrBtn.dataset.productId;
        const name = qrBtn.dataset.productName;
        const price = parseFloat(qrBtn.dataset.price);
        showQRCode(id, name, price);
        return;
      }
    });
  }

  function renderCategories() {
    const tabsContainer = document.getElementById('category-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = categories.map(cat => `
      <button class="catalog-tab${cat.id === 'all' || cat.id === activeCategory ? ' catalog-tab--active' : ''}" 
              data-category="${cat.id}" data-label="${cat.label}">
        ${cat.label}
      </button>
    `).join('');
    tabsContainer.querySelectorAll('.catalog-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeCategory = tab.dataset.category;
        tabsContainer.querySelectorAll('.catalog-tab').forEach(t => {
          t.classList.toggle('catalog-tab--active', t.dataset.category === activeCategory);
        });
        currentPage = 1; // 📄 Сброс на 1 страницу
        loadAndRenderProducts();
      });
    });
  }

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
    const tType = typeof I18n !== 'undefined' ? I18n.t('catalog.filter_type') : 'Тип';
    const tWeight = typeof I18n !== 'undefined' ? I18n.t('catalog.filter_weight') : 'Вес';
    const tIngredient = typeof I18n !== 'undefined' ? I18n.t('catalog.filter_ingredient') : 'Ингредиенты';
    const tPackqty = typeof I18n !== 'undefined' ? I18n.t('catalog.filter_packqty') : 'Количество в упаковке';
    
    renderFilterSection('filter-types', tType, filters.types || []);
    renderFilterSection('filter-weights', tWeight, filters.weights || []);
    renderFilterSection('filter-ingredients', tIngredient, filters.ingredients || []);
    renderFilterSection('filter-packqty', tPackqty, filters.packQty || []);
    document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
      checkbox.addEventListener('change', handleFilterChange);
    });
  }

  function renderFilterSection(containerId, title, items) {
    const container = document.getElementById(containerId);
    if (!container || !items || items.length === 0) return;
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
    const arrow = container.querySelector('.filter-section__arrow');
    if (head) {
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

  function handleFilterChange(e) {
    const checkbox = e.target;
    const filterType = checkbox.dataset.filterType;
    const value = checkbox.value;
    if (checkbox.checked) {
      if (!activeFilters[filterType].includes(value)) activeFilters[filterType].push(value);
    } else {
      activeFilters[filterType] = activeFilters[filterType].filter(v => v !== value);
    }
    currentPage = 1; // 📄 Сброс на 1 страницу
    renderActiveFilters();
    loadAndRenderProducts();
  }

  function getFilteredProducts() {
    return allProducts.filter(product => {
      if (!product) return false;
      if (activeCategory !== 'all' && product.category !== activeCategory) return false;
      if (activeFilters.brands.length && !activeFilters.brands.includes(product.brand)) return false;
      if (activeFilters.types.length && !activeFilters.types.includes(product.type)) return false;
      if (activeFilters.weights.length && !activeFilters.weights.includes(product.weight)) return false;
      if (activeFilters.ingredients.length && !activeFilters.ingredients.includes(product.ingredient)) return false;
      if (activeFilters.packQty.length && !activeFilters.packQty.includes(product.packQty)) return false;
      return true;
    });
  }

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
        currentPage = 1; // 📄 Сброс на 1 страницу
        renderActiveFilters();
        loadAndRenderProducts();
      });
    });
  }

  /* ── Render Products ────────────────────────────────────── */
  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    if (products.length === 0) {
      const emptyText = typeof I18n !== 'undefined' ? I18n.t('catalog.empty') : 'Товары не найдены';
      grid.innerHTML = `<p class="products-empty">${emptyText}</p>`;
      return;
    }
    
    const adminMode = isAdmin();
    const guestMode = isGuest();
    const currency = typeof I18n !== 'undefined' ? I18n.t('common.currency') : '₽';
    
    grid.innerHTML = products.map(product => {
      if (!product || !product.name) return '';
      
      const isFav = isInFavorites(product.id);
      const safeName = (product.name || 'Без названия').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safeBrand = product.brand || '';
      const safePackQty = product.packQty || '';
      const safeWeight = product.weight || '';
      const safePrice = typeof product.price === 'number' ? product.price : 0;
      const safeImage = product.image || '';
      
      let addBtnText = typeof I18n !== 'undefined' ? I18n.t('catalog.add_to_cart') : 'В корзину';
      if (adminMode) {
        addBtnText = typeof I18n !== 'undefined' ? I18n.t('catalog.view_mode') : '👁️ Просмотр';
      } else if (guestMode) {
        addBtnText = typeof I18n !== 'undefined' ? I18n.t('catalog.login') : 'Войти';
      }
      
      const adminModeText = typeof I18n !== 'undefined' ? I18n.t('catalog.admin_mode') : 'Режим админа';
      const toFavText = typeof I18n !== 'undefined' ? I18n.t('catalog.to_favorites') : 'В избранное';
      const qrLabelText = typeof I18n !== 'undefined' ? I18n.t('catalog.qr_code') : 'QR-код';
      
      return `
    <article class="product-card" data-id="${product.id}">
      ${adminMode ? `<div class="admin-view-badge">⚙️ ${adminModeText}</div>` : ''}
      <div class="product-card__image-wrap">
        <img class="product-card__img" src="${safeImage}" alt="${safeName}" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22157%22 height=%22132%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22157%22 height=%22132%22/%3E%3C/svg%3E'"/>
        
        <div class="product-card__actions-overlay">
          <button class="product-card__favorite ${isFav ? 'product-card__favorite--active' : ''} ${adminMode ? 'product-card__favorite--disabled' : ''}" 
                  data-product-id="${product.id}"
                  ${adminMode ? 'disabled' : ''}
                  aria-label="${toFavText}"
                  title="${toFavText}"
                  type="button">
            <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" 
                 stroke="currentColor" stroke-width="1.5" width="18" height="18">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          
          <button class="product-card__qr" 
                  data-product-id="${product.id}"
                  data-product-name="${safeName}"
                  data-product-price="${safePrice}"
                  aria-label="${qrLabelText}"
                  title="${qrLabelText}"
                  type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h3v3h-3z"/>
              <path d="M20 14v3"/>
              <path d="M14 20h3"/>
              <path d="M20 20v1"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="product-card__body">
        <h3 class="product-card__title">${safeName}</h3>
        <p class="product-card__weight">${safeWeight}</p>
        <div class="product-card__meta">
          <span class="product-card__brand">${safeBrand}</span>
          <span class="product-card__pack">${safePackQty}</span>
        </div>
        <div class="product-card__footer">
          <span class="product-card__price">${safePrice} ${currency}</span>
          <button class="product-card__add ${adminMode ? 'product-card__add--admin' : ''} ${guestMode ? 'product-card__add--disabled' : ''}" 
                  data-id="${product.id}" 
                  data-name="${safeName}" 
                  data-price="${safePrice}"
                  type="button">
            ${addBtnText}
          </button>
        </div>
      </div>
    </article>`;
    }).filter(Boolean).join('');

    // 📄 Обработчики через делегирование в setupProductEvents()
  }

  function renderRecommended() {
    const grid = document.getElementById('recommended-grid');
    if (!grid) return;
    const adminMode = isAdmin();
    const currency = typeof I18n !== 'undefined' ? I18n.t('common.currency') : '₽';
    const recommended = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 4);
    grid.innerHTML = recommended.map(product => {
      if (!product) return '';
      const viewText = typeof I18n !== 'undefined' ? I18n.t('catalog.view_mode') : '👁️ Просмотр';
      const cartText = typeof I18n !== 'undefined' ? I18n.t('catalog.add_to_cart') : 'В корзину';
      const viewOnlyText = typeof I18n !== 'undefined' ? I18n.t('catalog.view_only') : 'Только просмотр';
      const btnText = adminMode ? viewText : cartText;
      const safeName = (product.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safePrice = typeof product.price === 'number' ? product.price : 0;
      return `
      <article class="recommended-card" data-id="${product.id}">
        <img class="recommended-card__img" src="${product.image || ''}" alt="${safeName}" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22157%22 height=%22132%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22157%22 height=%22132%22/%3E%3C/svg%3E'"/>
        <div class="recommended-card__body">
          <h4 class="recommended-card__title">${safeName}</h4>
          <p class="recommended-card__price">${safePrice} ${currency}</p>
          <button class="recommended-card__add ${adminMode ? 'recommended-card__add--admin' : ''}" 
                  data-id="${product.id}" 
                  data-name="${safeName}" 
                  data-price="${safePrice}"
                  type="button">
            ${btnText}
          </button>
        </div>
      </article>`;
    }).filter(Boolean).join('');
    
    if (!adminMode) {
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.recommended-card__add');
        if (btn) {
          e.stopPropagation();
          const id = btn.dataset.id;
          const name = btn.dataset.name;
          const price = parseFloat(btn.dataset.price);
          addToCart(id, name, price);
        }
      });
    }
  }

  function renderFavoritesSection() {
    const container = document.getElementById('favorites-section');
    if (!container) return;
    container.style.display = 'none';
    container.innerHTML = '';
  }

  function addToCart(id, name, price) {
    const adminNoCart = typeof I18n !== 'undefined' ? I18n.t('catalog.admin_no_cart') : '⚙️ Администраторы не могут добавлять товары в корзину';
    const loginReq = typeof I18n !== 'undefined' ? I18n.t('catalog.login_required') : '⚠️ Для добавления в корзину необходимо войти!';
    const notFound = typeof I18n !== 'undefined' ? I18n.t('catalog.product_not_found') : 'Ошибка: товар не найден';
    const added = typeof I18n !== 'undefined' ? I18n.t('catalog.added_to_cart') : 'добавлен в корзину';
    
    if (isAdmin()) {
      showToast(adminNoCart);
      return;
    }
    if (isGuest()) {
      showToast(loginReq);
      setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      return;
    }
    const product = allProducts.find(p => String(p.id) === String(id));
    if (!product) {
      showToast(notFound);
      return;
    }
    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const existingItem = cart.find(item => String(item.id) === String(id));
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id, name: product.name, price: product.price,
        quantity: 1, image: product.image, weight: product.weight, brand: product.brand
      });
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartBadge();
    showToast(`${name || 'Товар'} ${added}`);
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

  function toggleFavorite(id) {
    const adminNoFav = typeof I18n !== 'undefined' ? I18n.t('catalog.admin_no_favorites') : '⚙️ Администраторы не могут добавлять товары в избранное';
    const loginReqFav = typeof I18n !== 'undefined' ? I18n.t('catalog.login_required_fav') : '⚠️ Для добавления в избранное необходимо войти!';
    const addedFav = typeof I18n !== 'undefined' ? I18n.t('catalog.added_to_favorites') : 'Добавлено в избранное';
    const removedFav = typeof I18n !== 'undefined' ? I18n.t('catalog.removed_from_favorites') : 'Удалено из избранного';
    
    if (isAdmin()) {
      showToast(adminNoFav);
      return;
    }
    if (isGuest()) {
      showToast(loginReqFav);
      setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      return;
    }
    const favoritesKey = getFavoritesKey();
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    const idStr = String(id);
    const index = favorites.findIndex(favId => String(favId) === idStr);
    if (index === -1) {
      favorites.push(id);
      showToast(addedFav);
    } else {
      favorites.splice(index, 1);
      showToast(removedFav);
    }
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    updateFavoritesBadge();
    if (allProducts.length > 0) {
      loadAndRenderProducts();
      renderRecommended();
      renderFavoritesSection();
    }
  }

  function isInFavorites(id) {
    const favoritesKey = getFavoritesKey();
    const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    return favorites.some(favId => String(favId) === String(id));
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

  function showToast(message) {
    const toast = document.getElementById('ami-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('ami-toast--show');
    setTimeout(() => toast.classList.remove('ami-toast--show'), 3000);
  }

  fetchData();

  return {
    addToCart, updateCartBadge, toggleFavorite,
    isInFavorites, updateFavoritesBadge, renderFavoritesSection,
    renderFilters,
    renderProducts,
    renderRecommended,
    getFilteredProducts,
    goToPage,
    loadAndRenderProducts
  };
})();

/* ════════════════════════════════════════════════════════════
   🔥 QR-КОДЫ ТОВАРОВ
   ════════════════════════════════════════════════════════════ */

let currentQRProduct = null;

function showQRCode(productId, productName, productPrice) {
  console.log('📱 Opening QR for product:', productId, productName);
  
  const modal = document.getElementById('qr-modal');
  const qrContainer = document.getElementById('qrcode-container');
  const nameEl = document.getElementById('qr-product-name');
  const priceEl = document.getElementById('qr-product-price');
  
  if (!modal || !qrContainer) {
    console.error('❌ QR modal elements not found!');
    alert(typeof I18n !== 'undefined' ? I18n.t('catalog.qr_modal_error') : 'Ошибка: модальное окно не найдено');
    return;
  }
  
  qrContainer.innerHTML = '';
  currentQRProduct = { id: productId, name: productName || '', price: productPrice || 0 };
  
  const productUrl = `${window.location.origin}/catalog.html?product=${productId}`;
  console.log('🔗 Generating QR for URL:', productUrl);
  
  if (typeof QRCode === 'undefined') {
    console.error('❌ QRCode library not loaded!');
    const libErr = typeof I18n !== 'undefined' ? I18n.t('catalog.qr_library_error') : 'Ошибка загрузки библиотеки QR-кодов';
    const checkNet = typeof I18n !== 'undefined' ? I18n.t('catalog.check_internet') : 'Проверьте подключение к интернету';
    qrContainer.innerHTML = `<p style="color:#e74c3c; padding: 20px;">${libErr}<br><small>${checkNet}</small></p>`;
    modal.classList.add('qr-modal--active');
    return;
  }
  
  try {
    new QRCode(qrContainer, {
      text: productUrl,
      width: 220,
      height: 220,
      colorDark: "#423F3E",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    console.log('✅ QR code generated successfully');
  } catch (err) {
    console.error('❌ Error generating QR:', err);
    const genErr = typeof I18n !== 'undefined' ? I18n.t('catalog.qr_gen_error') : 'Ошибка генерации QR-кода';
    qrContainer.innerHTML = `<p style="color:#e74c3c;">${genErr}</p>`;
  }
  
  nameEl.textContent = productName || '';
  const currency = typeof I18n !== 'undefined' ? I18n.t('common.currency') : '₽';
  priceEl.textContent = `${productPrice || 0} ${currency}`;
  
  modal.classList.add('qr-modal--active');
  console.log('✅ Modal opened');
}

function closeQRModal() {
  const modal = document.getElementById('qr-modal');
  if (modal) {
    modal.classList.remove('qr-modal--active');
    currentQRProduct = null;
    console.log('✅ Modal closed');
  }
}

function downloadQR() {
  const canvas = document.querySelector('#qrcode-container canvas');
  if (!canvas) {
    alert(typeof I18n !== 'undefined' ? I18n.t('catalog.qr_not_generated') : 'QR-код ещё не сгенерирован');
    return;
  }
  
  const link = document.createElement('a');
  const fileName = currentQRProduct 
    ? `qr-ami-${currentQRProduct.id}-${(currentQRProduct.name || 'product').replace(/\s+/g, '_')}.png`
    : `qr-product-${Date.now()}.png`;
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
  console.log('✅ QR downloaded:', fileName);
}

function printQR() {
  const canvas = document.querySelector('#qrcode-container canvas');
  if (!canvas) return;
  
  const currency = typeof I18n !== 'undefined' ? I18n.t('common.currency') : '₽';
  const printTitle = typeof I18n !== 'undefined' ? I18n.t('catalog.qr_print_title') : 'QR-код товара AMI';
  const scanHint = typeof I18n !== 'undefined' ? I18n.t('catalog.qr_scan_hint') : 'Отсканируйте код для перехода к товару';
  
  const printWindow = window.open('', '', 'width=400,height=500');
  const productInfo = currentQRProduct 
    ? `<h2 style="font-family:Arial;color:#E8593A;">${currentQRProduct.name || ''}</h2>
       <p style="font-size:20px;font-weight:bold;color:#E8593A;">${currentQRProduct.price || 0} ${currency}</p>`
    : '';
  
  printWindow.document.write(`
    <html>
      <head>
        <title>${printTitle}</title>
        <style>
          body { text-align: center; padding: 30px; font-family: Arial, sans-serif; }
          .label { border: 2px dashed #ccc; padding: 20px; display: inline-block; border-radius: 12px; }
        </style>
      </head>
      <body>
        <div class="label">
          <h1 style="color:#E8593A;margin:0 0 10px;">AMI</h1>
          ${productInfo}
          <img src="${canvas.toDataURL()}" style="width:220px;height:220px;margin:15px 0;"/>
          <p style="color:#666;font-size:12px;">${scanHint}</p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 300);
}

document.addEventListener('click', (e) => {
  const modal = document.getElementById('qr-modal');
  if (e.target === modal) closeQRModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeQRModal();
});

window.addEventListener('load', () => {
  if (typeof QRCode !== 'undefined') {
    console.log('✅ QRCode library loaded successfully');
  } else {
    console.error('❌ QRCode library NOT loaded!');
  }
});

// 🔥 Перерендер каталога при смене языка
window.addEventListener('languageChanged', () => {
  console.log('🌐 Перерендер каталога из-за смены языка');
  console.log('📍 Current language:', typeof I18n !== 'undefined' ? I18n.getLang() : 'unknown');
  
  if (typeof I18n !== 'undefined') {
    I18n.translatePage();
    console.log('✅ I18n.translatePage() вызван');
  }
  
  if (typeof CatalogApp !== 'undefined') {
    console.log('✅ CatalogApp найден, перерендериваем...');
    CatalogApp.renderFilters();
    CatalogApp.loadAndRenderProducts();
    CatalogApp.renderRecommended();
    console.log('✅ Каталог перерендерён');
  } else {
    console.error('❌ CatalogApp не найден!');
  }
});