/* ============================================================
   accessibility.js — версия для слабовидящих + hamburger menu
   Подключать в конце <body> на ВСЕХ страницах
   ============================================================ */

(function () {
  'use strict';

  /* ── Сохранение / загрузка настроек ── */
  const STORAGE_KEY = 'ami-a11y';

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  /* ── Применение настроек к <html> ── */
  const html = document.documentElement;
  const SCHEMES = ['bw', 'bg', 'wb', 'be', 'lb'];
  const FONTS   = ['md', 'lg', 'xl'];

  function applyScheme(scheme) {
    SCHEMES.forEach(s => html.classList.remove('a11y-scheme-' + s));
    if (scheme) {
      html.classList.add('a11y-scheme-' + scheme);
      html.classList.add('a11y-active');
    }
  }

  function applyFont(size) {
    FONTS.forEach(f => html.classList.remove('a11y-font-' + f));
    if (size) {
      html.classList.add('a11y-font-' + size);
      html.classList.add('a11y-active');
    }
  }

  function applyNoImages(enabled) {
    if (enabled) {
      html.classList.add('a11y-no-images');
      wrapImages();
    } else {
      html.classList.remove('a11y-no-images');
      unwrapImages();
    }
  }

  /* ── Обёртка картинок (для alt-текста при скрытии) ── */
  function wrapImages() {
    document.querySelectorAll('img:not(.a11y-wrapped)').forEach(img => {
      // Пропускаем декоративные (alt="") и иконки SVG-like
      const alt = img.getAttribute('alt');
      if (alt === null) { img.setAttribute('alt', '[Изображение]'); }

      const wrap = document.createElement('span');
      wrap.className = 'a11y-img-wrap';
      wrap.setAttribute('aria-label', img.alt || '[Изображение]');
      wrap.title = img.alt || '[Изображение]';
      img.classList.add('a11y-wrapped');
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);

      // Текстовая заглушка
      const txt = document.createElement('span');
      txt.className = 'a11y-img-alt-text';
      txt.textContent = img.alt ? '[' + img.alt + ']' : '[Изображение]';
      txt.style.cssText = 'font-size:12px;color:#555;display:block;text-align:center;padding:2px 4px;';
      wrap.appendChild(txt);
    });
  }

  function unwrapImages() {
    document.querySelectorAll('.a11y-img-wrap').forEach(wrap => {
      const img = wrap.querySelector('img');
      if (img) {
        img.classList.remove('a11y-wrapped');
        wrap.parentNode.insertBefore(img, wrap);
      }
      const txt = wrap.querySelector('.a11y-img-alt-text');
      if (txt) txt.remove();
      wrap.remove();
    });
  }

  /* ── Проверка: если нет ни одной настройки — html.classList не засоряем ── */
  function maybeRemoveActive(s) {
    if (!s.scheme && !s.font && !s.noImages) {
      html.classList.remove('a11y-active');
    }
  }

  /* ── Создание HTML панели ── */
  function buildPanel() {
    // Кнопка вызова
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'a11y-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Версия для слабовидящих');
    toggleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      </svg>
      Для слабовидящих
    `;
    document.body.appendChild(toggleBtn);

    // Панель
    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Настройки доступности');
    panel.innerHTML = `
      <div class="a11y-panel__head">
        <span class="a11y-panel__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px">
            <circle cx="12" cy="12" r="3"/>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          </svg>
          Для слабовидящих
        </span>
        <button class="a11y-panel__close" aria-label="Закрыть панель">&times;</button>
      </div>
      <div class="a11y-panel__body">

        <!-- Размер шрифта -->
        <div class="a11y-group">
          <span class="a11y-group__label">Размер шрифта</span>
          <div class="a11y-font-btns">
            <button class="a11y-font-btn" data-size="md" aria-label="Средний шрифт">A<br><small style="font-size:11px;font-weight:400">средний</small></button>
            <button class="a11y-font-btn" data-size="lg" aria-label="Большой шрифт" style="font-size:18px">A<br><small style="font-size:11px;font-weight:400">большой</small></button>
            <button class="a11y-font-btn" data-size="xl" aria-label="Очень большой шрифт" style="font-size:22px">A<br><small style="font-size:11px;font-weight:400">крупный</small></button>
          </div>
        </div>

        <!-- Цветовая схема -->
        <div class="a11y-group">
          <span class="a11y-group__label">Цветовая схема</span>
          <div class="a11y-scheme-grid">
            <button class="a11y-scheme-btn a11y-scheme-btn--bw" data-scheme="bw" aria-label="Чёрный фон, белый текст">Чёрный / белый</button>
            <button class="a11y-scheme-btn a11y-scheme-btn--bg" data-scheme="bg" aria-label="Чёрный фон, зелёный текст">Чёрный / зелёный</button>
            <button class="a11y-scheme-btn a11y-scheme-btn--wb" data-scheme="wb" aria-label="Белый фон, чёрный текст">Белый / чёрный</button>
            <button class="a11y-scheme-btn a11y-scheme-btn--be" data-scheme="be" aria-label="Бежевый фон, коричневый текст">Бежевый / коричневый</button>
            <button class="a11y-scheme-btn a11y-scheme-btn--lb" data-scheme="lb" aria-label="Голубой фон, синий текст">Голубой / синий</button>
          </div>
        </div>

        <!-- Скрытие изображений -->
        <div class="a11y-group">
          <span class="a11y-group__label">Изображения</span>
          <label class="a11y-toggle-row">
            <span>Скрыть изображения</span>
            <span class="a11y-switch">
              <input type="checkbox" id="a11y-no-images-chk" aria-label="Скрыть изображения"/>
              <span class="a11y-switch-slider"></span>
            </span>
          </label>
        </div>

        <!-- Сброс -->
        <button class="a11y-reset-btn" aria-label="Сбросить все настройки">↺ Сбросить настройки</button>
      </div>
    `;
    document.body.appendChild(panel);

    return { toggleBtn, panel };
  }

  /* ── Инициализация ── */
  function init() {
    const { toggleBtn, panel } = buildPanel();
    const closeBtn    = panel.querySelector('.a11y-panel__close');
    const resetBtn    = panel.querySelector('.a11y-reset-btn');
    const fontBtns    = panel.querySelectorAll('.a11y-font-btn');
    const schemeBtns  = panel.querySelectorAll('.a11y-scheme-btn');
    const noImagesChk = panel.querySelector('#a11y-no-images-chk');

    let settings = loadSettings();

    /* Восстанавливаем сохранённые настройки */
    if (settings.scheme) { applyScheme(settings.scheme); }
    if (settings.font)   { applyFont(settings.font); }
    if (settings.noImages) { applyNoImages(true); noImagesChk.checked = true; }

    /* Помечаем активные кнопки */
    function refreshUI() {
      fontBtns.forEach(b => b.classList.toggle('active', b.dataset.size === settings.font));
      schemeBtns.forEach(b => b.classList.toggle('active', b.dataset.scheme === settings.scheme));
      noImagesChk.checked = !!settings.noImages;
    }
    refreshUI();

    /* Открыть / закрыть панель */
    toggleBtn.addEventListener('click', () => panel.classList.toggle('open'));
    closeBtn.addEventListener('click',  () => panel.classList.remove('open'));
    panel.addEventListener('click', e => { if (e.target === panel) panel.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') panel.classList.remove('open'); });

    /* Размер шрифта */
    fontBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.dataset.size;
        settings.font = (settings.font === size) ? null : size;
        applyFont(settings.font);
        maybeRemoveActive(settings);
        saveSettings(settings);
        refreshUI();
      });
    });

    /* Цветовая схема */
    schemeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const scheme = btn.dataset.scheme;
        settings.scheme = (settings.scheme === scheme) ? null : scheme;
        applyScheme(settings.scheme);
        maybeRemoveActive(settings);
        saveSettings(settings);
        refreshUI();
      });
    });

    /* Скрытие изображений */
    noImagesChk.addEventListener('change', () => {
      settings.noImages = noImagesChk.checked;
      applyNoImages(settings.noImages);
      maybeRemoveActive(settings);
      saveSettings(settings);
    });

    /* Сброс */
    resetBtn.addEventListener('click', () => {
      settings = {};
      applyScheme(null);
      applyFont(null);
      applyNoImages(false);
      html.classList.remove('a11y-active');
      saveSettings(settings);
      refreshUI();
    });
  }

  /* ── Hamburger menu (мобильный) ── */
  function initHamburger() {
    const sidebar  = document.querySelector('.sidebar');
    if (!sidebar) return;

    const btn = document.createElement('button');
    btn.className   = 'hamburger-btn';
    btn.setAttribute('aria-label', 'Открыть меню');
    btn.innerHTML   = '<span></span><span></span><span></span>';
    document.body.appendChild(btn);

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-label', 'Закрыть меню');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-label', 'Открыть меню');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    // Закрываем при клике по ссылке в sidebar
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  /* ── Запуск ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); initHamburger(); });
  } else {
    init();
    initHamburger();
  }

})();