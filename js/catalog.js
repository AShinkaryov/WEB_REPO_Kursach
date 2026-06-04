const CatalogApp = (() => {
  let allProducts = [];
  let categories = [];
  let filters = {};
  let activeCategory = 'all';
  let activeFilters = {
    brands: [], types: [], weights: [], ingredients: [], packQty: []
  };

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
      init();
    } catch (error) {
      console.error('❌ Error loading catalog:', error);
      showToast('Ошибка загрузки каталога');
    }
  }

  function init() {
    console.log('🚀 Catalog initialized');
    if (isAdmin()) document.body.classList.add('admin-mode');
    showCurrentUserDebug();
    renderCategories();
    renderFilters();
    renderProducts(getFilteredProducts());
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
        renderProducts(getFilteredProducts());
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
    renderActiveFilters();
    renderProducts(getFilteredProducts());
  }

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
    // 🔥 Экранируем кавычки в названии
    const safeName = product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    return `
    <article class="product-card" data-id="${product.id}">
      ${adminMode ? '<div class="admin-view-badge">⚙️ Режим админа</div>' : ''}
      <div class="product-card__image-wrap">
        <img class="product-card__img" src="${product.image}" alt="${product.name}" />
        
        <!-- 🔥 Контейнер для кнопок поверх изображения -->
        <div class="product-card__actions-overlay">
          <button class="product-card__favorite ${isFav ? 'product-card__favorite--active' : ''} ${adminMode ? 'product-card__favorite--disabled' : ''}" 
                  data-product-id="${product.id}"
                  ${adminMode ? 'disabled' : ''}
                  aria-label="В избранное"
                  title="В избранное">
            <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" 
                 stroke="currentColor" stroke-width="1.5" width="18" height="18">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          
          <!-- 🔥 КНОПКА QR-КОДА -->
          <button class="product-card__qr" 
                  data-product-id="${product.id}"
                  data-product-name="${safeName}"
                  data-product-price="${product.price}"
                  aria-label="QR-код"
                  title="Показать QR-код">
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
  
  // 🔥 Обработчики для QR-кнопок
  grid.querySelectorAll('.product-card__qr').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const id = btn.dataset.productId;
      const name = btn.dataset.productName;
      const price = parseFloat(btn.dataset.price);
      console.log('📱 QR click:', id, name, price);
      showQRCode(id, name, price);
    });
  });
}

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

  function renderFavoritesSection() {
    const container = document.getElementById('favorites-section');
    if (!container) return;
    container.style.display = 'none';
    container.innerHTML = '';
  }

  function addToCart(id, name, price) {
    if (isAdmin()) {
      showToast('⚙️ Администраторы не могут добавлять товары в корзину');
      return;
    }
    if (isGuest()) {
      showToast('⚠️ Для добавления в корзину необходимо войти!');
      setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      return;
    }
    const product = allProducts.find(p => String(p.id) === String(id));
    if (!product) {
      showToast('Ошибка: товар не найден');
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

  function toggleFavorite(id) {
    if (isAdmin()) {
      showToast('⚙️ Администраторы не могут добавлять товары в избранное');
      return;
    }
    if (isGuest()) {
      showToast('⚠️ Для добавления в избранное необходимо войти!');
      setTimeout(() => { window.location.href = 'login.html'; }, 2000);
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
    isInFavorites, updateFavoritesBadge, renderFavoritesSection
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
    alert('Ошибка: модальное окно не найдено');
    return;
  }
  
  // Очищаем предыдущий QR-код
  qrContainer.innerHTML = '';
  
  // Сохраняем данные текущего товара
  currentQRProduct = { id: productId, name: productName, price: productPrice };
  
  // Формируем ссылку на товар (для сканирования)
  const productUrl = `${window.location.origin}/catalog.html?product=${productId}`;
  
  console.log('🔗 Generating QR for URL:', productUrl);
  
  // Проверяем, загрузилась ли библиотека
  if (typeof QRCode === 'undefined') {
    console.error('❌ QRCode library not loaded!');
    qrContainer.innerHTML = '<p style="color:#e74c3c; padding: 20px;">Ошибка загрузки библиотеки QR-кодов<br><small>Проверьте подключение к интернету</small></p>';
    modal.classList.add('qr-modal--active');
    return;
  }
  
  // Генерируем QR-код
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
    qrContainer.innerHTML = '<p style="color:#e74c3c;">Ошибка генерации QR-кода</p>';
  }
  
  // Заполняем информацию
  nameEl.textContent = productName;
  priceEl.textContent = `${productPrice} ₽`;
  
  // Показываем модальное окно
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
    alert('QR-код ещё не сгенерирован');
    return;
  }
  
  const link = document.createElement('a');
  const fileName = currentQRProduct 
    ? `qr-ami-${currentQRProduct.id}-${currentQRProduct.name.replace(/\s+/g, '_')}.png`
    : `qr-product-${Date.now()}.png`;
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
  console.log('✅ QR downloaded:', fileName);
}

function printQR() {
  const canvas = document.querySelector('#qrcode-container canvas');
  if (!canvas) return;
  
  const printWindow = window.open('', '', 'width=400,height=500');
  const productInfo = currentQRProduct 
    ? `<h2 style="font-family:Arial;color:#E8593A;">${currentQRProduct.name}</h2>
       <p style="font-size:20px;font-weight:bold;color:#E8593A;">${currentQRProduct.price} ₽</p>`
    : '';
  
  printWindow.document.write(`
    <html>
      <head>
        <title>QR-код товара AMI</title>
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
          <p style="color:#666;font-size:12px;">Отсканируйте код для перехода к товару</p>
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

// Закрытие модального окна по клику на фон или Escape
document.addEventListener('click', (e) => {
  const modal = document.getElementById('qr-modal');
  if (e.target === modal) closeQRModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeQRModal();
});

// Проверка загрузки библиотеки при старте
window.addEventListener('load', () => {
  if (typeof QRCode !== 'undefined') {
    console.log('✅ QRCode library loaded successfully');
  } else {
    console.error('❌ QRCode library NOT loaded!');
  }
});

