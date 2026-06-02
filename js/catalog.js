/**
 * AMI Catalog Module
 * Loads products, categories, and filters from json-server (port 3001)
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

      console.log('✅ Loaded:', {
        products: allProducts.length,
        categories: categories.length,
        filters: Object.keys(filters)
      });

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
    updateCartBadge();
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
    // Brands - ЗАПОЛНЯЕМ ТОЛЬКО ЧЕКБОКСЫ (заголовок уже есть в HTML!)
    const brandsContainer = document.getElementById('filter-brands');
    if (brandsContainer && filters.brands) {
      brandsContainer.innerHTML = filters.brands.map(brand => `
        <label class="filter-checkbox">
          <input type="checkbox" value="${brand.value}" data-filter-type="brands" />
          <span>${brand.label}</span>
        </label>
      `).join('');

      // Добавляем обработчик клика на УЖЕ СУЩЕСТВУЮЩИЙ заголовок
      const parentSection = brandsContainer.closest('.filter-section');
      const head = parentSection ? parentSection.querySelector('.filter-section__head') : null;
      const arrow = parentSection ? parentSection.querySelector('.filter-section__arrow') : null;

      if (head && parentSection) {
        head.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Закрываем все другие секции
          document.querySelectorAll('.filter-section--open').forEach(section => {
            if (section !== parentSection) {
              section.classList.remove('filter-section--open');
              const otherArrow = section.querySelector('.filter-section__arrow');
              if (otherArrow) otherArrow.classList.remove('filter-section__arrow--up');
            }
          });
          
          // Переключаем текущую
          parentSection.classList.toggle('filter-section--open');
          if (arrow) {
            arrow.classList.toggle('filter-section__arrow--up');
          }
        });
      }
    }

    // Types
    renderFilterSection('filter-types', 'Тип', filters.types || []);
    
    // Weights
    renderFilterSection('filter-weights', 'Вес', filters.weights || []);
    
    // Ingredients
    renderFilterSection('filter-ingredients', 'Ингредиенты', filters.ingredients || []);
    
    // Pack Qty
    renderFilterSection('filter-packqty', 'Количество в упаковке', filters.packQty || []);

    // Add listeners to all checkboxes
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
        const isOpen = container.classList.contains('filter-section--open');
        
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
      if (activeCategory !== 'all' && product.category !== activeCategory) {
        return false;
      }

      if (activeFilters.brands.length && !activeFilters.brands.includes(product.brand)) {
        return false;
      }
      if (activeFilters.types.length && !activeFilters.types.includes(product.type)) {
        return false;
      }
      if (activeFilters.weights.length && !activeFilters.weights.includes(product.weight)) {
        return false;
      }
      if (activeFilters.ingredients.length && !activeFilters.ingredients.includes(product.ingredient)) {
        return false;
      }
      if (activeFilters.packQty.length && !activeFilters.packQty.includes(product.packQty)) {
        return false;
      }

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
        if (checkbox) {
          checkbox.checked = false;
        }

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

    grid.innerHTML = products.map(product => `
      <article class="product-card" data-id="${product.id}">
        <div class="product-card__image-wrap">
          <img class="product-card__img" src="${product.image}" alt="${product.name}" />
          <button class="product-card__favorite" aria-label="В избранное">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
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
      </article>
    `).join('');

    grid.querySelectorAll('.product-card__add').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        addToCart(id, name, price);
      });
    });

    grid.querySelectorAll('.product-card__favorite').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('product-card__favorite--active');
        showToast(btn.classList.contains('product-card__favorite--active') ? 'Добавлено в избранное' : 'Удалено из избранного');
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
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        addToCart(id, name, price);
      });
    });
  }

  /* ── Cart Functions ─────────────────────────────────────── */
  function addToCart(id, name, price) {
    let cart = JSON.parse(localStorage.getItem('ami-cart') || '[]');
    
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({ id, name, price, quantity: 1 });
    }

    localStorage.setItem('ami-cart', JSON.stringify(cart));
    updateCartBadge();
    showToast(`${name} добавлен в корзину`);
  }

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem('ami-cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
      badge.textContent = totalItems;
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

    setTimeout(() => {
      toast.classList.remove('ami-toast--show');
    }, 3000);
  }

  /* ── Start App ──────────────────────────────────────────── */
  fetchData();

  return {
    addToCart,
    updateCartBadge
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('storage', () => {
    CatalogApp.updateCartBadge();
  });
});