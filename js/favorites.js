/**
 * AMI Favorites Page
 */

const FAVORITES_KEY_PREFIX = 'ami-favorites-';
const CART_KEY_PREFIX = 'ami-cart-';

/* ── Получить текущего пользователя ─────────────────────── */
function getCurrentUserId() {
  const session = JSON.parse(localStorage.getItem('ami-session') || 'null');
  return session ? session.id : 'guest';
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('ami-session') || 'null');
}

function getFavoritesKey() {
  return `${FAVORITES_KEY_PREFIX}${getCurrentUserId()}`;
}

function getCartKey() {
  return `${CART_KEY_PREFIX}${getCurrentUserId()}`;
}

/* ── Загрузка товаров ────────────────────────────────────── */
async function loadProducts() {
  try {
    const res = await fetch('http://localhost:3001/products');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('❌ Error loading products:', e);
  }
  return [];
}

/* ── Удалить из избранного ───────────────────────────────── */
function removeFromFavorites(productId) {
  const favoritesKey = getFavoritesKey();
  let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  
  const idStr = String(productId);
  favorites = favorites.filter(favId => String(favId) !== idStr);
  
  localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  
  renderFavorites();
  updateFavoritesBadge();
  updateFavoritesCount();
  
  const removedText = typeof I18n !== 'undefined' ? I18n.t('favorites.removed') : 'Удалено из избранного';
  showToast(removedText);
}

/* ── Обновить счетчик избранного (бейдж) ─────────────────── */
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

/* ── Обновить счетчик на странице ────────────────────────── */
function updateFavoritesCount() {
  const countEl = document.getElementById('favorites-count');
  if (!countEl) return;
  
  const favoritesKey = getFavoritesKey();
  const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  countEl.textContent = favorites.length;
}

/* ── Отображение избранного ──────────────────────────────── */
async function renderFavorites() {
  const grid = document.getElementById('favorites-grid');
  if (!grid) return;
  
  const products = await loadProducts();
  const favoritesKey = getFavoritesKey();
  const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  
  const favoriteProducts = products.filter(p => {
    const productId = typeof p.id === 'string' ? p.id : String(p.id);
    return favorites.some(favId => String(favId) === productId);
  });
  
  // 🔥 Переводы
  const emptyText = typeof I18n !== 'undefined' ? I18n.t('favorites.empty') : 'В избранном пока нет товаров';
  const catalogText = typeof I18n !== 'undefined' ? I18n.t('favorites.go_catalog') : 'Перейти в каталог';
  const cartBtnText = typeof I18n !== 'undefined' ? I18n.t('catalog.add_to_cart') : 'В корзину';
  const removeTitle = typeof I18n !== 'undefined' ? I18n.t('favorites.remove_title') : 'Удалить из избранного';
  const currency = typeof I18n !== 'undefined' ? I18n.t('common.currency') : '₽';
  
  if (favoriteProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
        <div style="font-size: 64px; margin-bottom: 24px;">🤍</div>
        <p style="font-family: Manrope; font-size: 18px; color: #7B7B7B; margin-bottom: 32px;">
          ${emptyText}
        </p>
        <a href="catalog.html" style="display: inline-block; padding: 14px 32px; background: #E8593A; color: #fff; text-decoration: none; border-radius: 100px; font-family: Manrope; font-weight: 600;">
          ${catalogText}
        </a>
      </div>`;
    updateFavoritesCount();
    return;
  }
  
  grid.innerHTML = favoriteProducts.map(product => `
    <article class="product-card" data-id="${product.id}">
      <div class="product-card__image-wrap" style="position: relative;">
        <img class="product-card__img" src="${product.image}" alt="${product.name}" 
             style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;"/>
        <button class="remove-from-favorites" 
                data-product-id="${product.id}"
                title="${removeTitle}"
                style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s;">
          ❤️
        </button>
      </div>
      <div class="product-card__body" style="padding: 16px;">
        <h3 class="product-card__title" style="font-family: Manrope; font-size: 16px; font-weight: 600; color: #423F3E; margin-bottom: 8px;">${product.name}</h3>
        <p class="product-card__weight" style="font-size: 14px; color: #7B7B7B; margin-bottom: 12px;">${product.weight}</p>
        <div class="product-card__meta" style="display: flex; justify-content: space-between; font-size: 13px; color: #999; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0;">
          <span>${product.brand}</span>
          <span>${product.packQty}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: Manrope; font-size: 18px; font-weight: 700; color: #E8593A;">${product.price} ${currency}</span>
          <button class="add-to-cart-btn" 
                  data-product-id="${product.id}"
                  data-product-name="${product.name}"
                  data-product-price="${product.price}"
                  style="padding: 10px 24px; background: #E8593A; color: #fff; border: none; border-radius: 6px; font-family: Manrope; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            ${cartBtnText}
          </button>
        </div>
      </div>
    </article>
  `).join('');
  
  // Обработчики на сердечки (удаление из избранного)
  grid.querySelectorAll('.remove-from-favorites').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      removeFromFavorites(productId);
    });
  });
  
  // Обработчики на кнопки "В корзину"
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.productId;
      const name = btn.dataset.productName;
      const price = parseFloat(btn.dataset.productPrice);
      addToCart(id, name, price);
    });
  });
  
  updateFavoritesCount();
}

/* ── Добавить в корзину ──────────────────────────────────── */
function addToCart(id, name, price) {
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
      id: id, 
      name: name, 
      price: price, 
      quantity: 1 
    });
  }
  
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartBadge();
  
  const addedText = typeof I18n !== 'undefined' ? I18n.t('catalog.added_to_cart') : 'добавлен в корзину';
  showToast(`${name} ${addedText}`);
}

/* ── Обновить счетчик корзины ────────────────────────────── */
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

/* ── Toast уведомление ───────────────────────────────────── */
function showToast(message) {
  let toast = document.getElementById('ami-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ami-toast';
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #333; color: #fff; padding: 12px 24px; border-radius: 6px; z-index: 9999; opacity: 0; transition: opacity 0.3s; font-family: Manrope, sans-serif;';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.style.opacity = '1';
  
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

/* ════════════════════════════════════════════════════════════
   ЭКСПОРТ / ИМПОРТ ИЗБРАННОГО
   ════════════════════════════════════════════════════════════ */

/* ── Экспорт избранного в текстовый файл ─────────────────── */
async function exportFavorites() {
  const session = getCurrentUser();
  
  const needLogin = typeof I18n !== 'undefined' ? I18n.t('favorites.need_login') : 'Войдите в аккаунт';
  const exportEmpty = typeof I18n !== 'undefined' ? I18n.t('favorites.export_empty') : 'Избранное пусто! Нечего экспортировать.';
  const exportSuccess = typeof I18n !== 'undefined' ? I18n.t('favorites.export_success') : '✅ Экспортировано товаров:';
  const exportError = typeof I18n !== 'undefined' ? I18n.t('favorites.export_error') : 'Ошибка при экспорте:';
  
  if (!session) {
    showToast(needLogin);
    return;
  }
  
  const favoritesKey = getFavoritesKey();
  const favoritesIds = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
  
  if (favoritesIds.length === 0) {
    showToast(exportEmpty);
    return;
  }
  
  try {
    const products = await loadProducts();
    
    const date = new Date().toLocaleString('ru-RU');
    const lines = [
      '# ============================================',
      '# AMI - Список избранного',
      '# ============================================',
      `# Пользователь: ${session.name || 'Не указано'}`,
      `# Email: ${session.email || 'Не указан'}`,
      `# Дата экспорта: ${date}`,
      `# Количество товаров: ${favoritesIds.length}`,
      '# ============================================',
      '#',
      '# Формат файла:',
      '# Каждая строка содержит ID товара.',
      '# Строки, начинающиеся с #, являются комментариями.',
      '# При импорте комментарии и пустые строки игнорируются.',
      '#',
      '# Список ID товаров:',
      '# --------------------------------------------',
      ''
    ];
    
    favoritesIds.forEach((favId) => {
      const product = products.find(p => String(p.id) === String(favId));
      if (product) {
        lines.push(`${product.id}  # ${product.name} | ${product.price}₽ | ${product.brand || ''}`);
      } else {
        lines.push(`${favId}  # Товар не найден в каталоге`);
      }
    });
    
    lines.push('');
    lines.push('# ============================================');
    lines.push('# Конец файла');
    lines.push('# ============================================');
    
    const fileContent = lines.join('\n');
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const userName = (session.name || 'user').replace(/\s+/g, '_');
    a.download = `ami-favorites-${userName}-${timestamp}.txt`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Избранное экспортировано:', favoritesIds.length, 'товаров');
    showToast(`${exportSuccess} ${favoritesIds.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка экспорта:', error);
    showToast(`${exportError} ${error.message}`);
  }
}

/* ── Импорт избранного из файла ──────────────────────────── */
async function importFavorites(event) {
  const file = event.target.files[0];
  
  if (!file) return;
  
  const session = getCurrentUser();
  
  const needLogin = typeof I18n !== 'undefined' ? I18n.t('favorites.need_login') : 'Войдите в аккаунт';
  const needTxt = typeof I18n !== 'undefined' ? I18n.t('favorites.need_txt') : 'Выберите текстовый файл (.txt)';
  const importEmpty = typeof I18n !== 'undefined' ? I18n.t('favorites.import_empty') : 'В файле не найдено товаров для импорта';
  const importConfirm = typeof I18n !== 'undefined' ? I18n.t('favorites.import_confirm') : 'Импортировать доступные товары в избранное?';
  const importSuccess = typeof I18n !== 'undefined' ? I18n.t('favorites.import_success') : '✅ Импорт завершён!';
  const importError = typeof I18n !== 'undefined' ? I18n.t('favorites.import_error') : 'Ошибка при чтении файла:';
  
  const foundInFile = typeof I18n !== 'undefined' ? I18n.t('favorites.found_in_file') : 'Найдено в файле:';
  const available = typeof I18n !== 'undefined' ? I18n.t('favorites.available') : '✅ Доступно для импорта:';
  const notFoundInCatalog = typeof I18n !== 'undefined' ? I18n.t('favorites.not_found_in_catalog') : '⚠️ Не найдено в каталоге:';
  const unrecognized = typeof I18n !== 'undefined' ? I18n.t('favorites.unrecognized') : '❌ Нераспознанных строк:';
  const addedCountText = typeof I18n !== 'undefined' ? I18n.t('favorites.added_count') : '➕ Добавлено:';
  const alreadyHad = typeof I18n !== 'undefined' ? I18n.t('favorites.already_had') : '⏭️ Уже было в избранном:';
  const notFoundText = typeof I18n !== 'undefined' ? I18n.t('favorites.not_found_text') : '❌ Не найдено в каталоге:';
  const itemsWord = typeof I18n !== 'undefined' ? I18n.t('common.pcs') : 'товаров';
  
  if (!session) {
    showToast(needLogin);
    event.target.value = '';
    return;
  }
  
  if (!file.name.toLowerCase().endsWith('.txt')) {
    showToast(needTxt);
    event.target.value = '';
    return;
  }
  
  try {
    const text = await file.text();
    const lines = text.split('\n');
    
    const importedIds = [];
    const invalidLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (line === '' || line.startsWith('#')) continue;
      
      const commentIndex = line.indexOf('#');
      if (commentIndex !== -1) {
        line = line.substring(0, commentIndex).trim();
      }
      
      const parts = line.split(/[\s|,;]+/);
      const id = parts[0].trim();
      
      if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
        importedIds.push(id);
      } else if (line.length > 0) {
        invalidLines.push({ lineNum: i + 1, content: line });
      }
    }
    
    if (importedIds.length === 0) {
      showToast(importEmpty);
      event.target.value = '';
      return;
    }
    
    const products = await loadProducts();
    const validIds = [];
    const notFoundIds = [];
    
    importedIds.forEach(id => {
      const exists = products.some(p => String(p.id) === String(id));
      if (exists) {
        validIds.push(id);
      } else {
        notFoundIds.push(id);
      }
    });
    
    let confirmMsg = `${foundInFile} ${importedIds.length} ${itemsWord}\n\n`;
    confirmMsg += `${available} ${validIds.length}\n`;
    
    if (notFoundIds.length > 0) {
      confirmMsg += `${notFoundInCatalog} ${notFoundIds.length}\n`;
    }
    
    if (invalidLines.length > 0) {
      confirmMsg += `${unrecognized} ${invalidLines.length}\n`;
    }
    
    confirmMsg += `\n${importConfirm}`;
    
    if (!confirm(confirmMsg)) {
      event.target.value = '';
      return;
    }
    
    const favoritesKey = getFavoritesKey();
    const currentFavorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    validIds.forEach(id => {
      const idStr = String(id);
      const exists = currentFavorites.some(favId => String(favId) === idStr);
      
      if (!exists) {
        currentFavorites.push(id);
        addedCount++;
      } else {
        skippedCount++;
      }
    });
    
    localStorage.setItem(favoritesKey, JSON.stringify(currentFavorites));
    
    renderFavorites();
    updateFavoritesBadge();
    updateFavoritesCount();
    
    let resultMsg = `${importSuccess}\n\n`;
    resultMsg += `${addedCountText} ${addedCount}\n`;
    if (skippedCount > 0) {
      resultMsg += `${alreadyHad} ${skippedCount}\n`;
    }
    if (notFoundIds.length > 0) {
      resultMsg += `${notFoundText} ${notFoundIds.length}\n`;
    }
    
    alert(resultMsg);
    console.log(`✅ Импортировано: ${addedCount}, пропущено: ${skippedCount}, не найдено: ${notFoundIds.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка импорта:', error);
    showToast(`${importError} ${error.message}`);
  }
  
  event.target.value = '';
}

/* ── Инициализация ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderFavorites();
  updateFavoritesBadge();
  updateCartBadge();
  updateFavoritesCount();
});

// 🔥 Перерендер избранного при смене языка
window.addEventListener('languageChanged', () => {
  console.log('🌐 Перерендер избранного из-за смены языка');
  if (typeof I18n !== 'undefined') {
    I18n.translatePage();
  }
  renderFavorites();
  updateFavoritesCount();
});