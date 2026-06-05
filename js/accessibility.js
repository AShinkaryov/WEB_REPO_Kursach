/**
 * AMI Accessibility — Версия для слабовидящих
 */

const Accessibility = (() => {
  const STORAGE_KEY = 'ami-accessibility';
  const PANEL_CLASS = 'accessibility-panel';
  const MODE_CLASS = 'accessibility-mode';
  
  let settings = {
    enabled: false,
    fontSize: 1, // 1, 2, 3
    colorScheme: 3, // 1-5
    imagesOff: false
  };
  
  // Инициализация
  function init() {
    loadSettings();
    createToggleButton();
    createPanel();
    applySettings();
    
    console.log('👁️ Accessibility module initialized');
  }
  
  // Загрузить настройки
  function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading accessibility settings:', e);
      }
    }
  }
  
  // Сохранить настройки
  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
  
  // Создать кнопку открытия панели
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.className = 'accessibility-btn';
    btn.setAttribute('aria-label', 'Версия для слабовидящих');
    btn.setAttribute('title', 'Версия для слабовидящих');
    btn.innerHTML = '👁️';
    btn.onclick = togglePanel;
    
    document.body.appendChild(btn);
  }
  
  // Создать панель настроек
  function createPanel() {
    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Настройки для слабовидящих');
    
    panel.innerHTML = `
      <button class="accessibility-panel__close" onclick="Accessibility.closePanel()" aria-label="Закрыть панель">
        ✕
      </button>
      <h2 class="accessibility-panel__title">👁️ Версия для слабовидящих</h2>
      
      <div class="accessibility-panel__section">
        <h3 class="accessibility-panel__section-title">📏 Размер шрифта</h3>
        <div class="accessibility-panel__options">
          <button class="accessibility-panel__option" data-font="1" onclick="Accessibility.setFontSize(1)">
            <span class="accessibility-panel__option-icon">A</span>
            <span>Обычный (16px)</span>
          </button>
          <button class="accessibility-panel__option" data-font="2" onclick="Accessibility.setFontSize(2)">
            <span class="accessibility-panel__option-icon" style="font-size: 20px;">A</span>
            <span>Средний (20px)</span>
          </button>
          <button class="accessibility-panel__option" data-font="3" onclick="Accessibility.setFontSize(3)">
            <span class="accessibility-panel__option-icon" style="font-size: 24px;">A</span>
            <span>Крупный (24px)</span>
          </button>
        </div>
      </div>
      
      <div class="accessibility-panel__section">
        <h3 class="accessibility-panel__section-title"> Цветовая схема</h3>
        <div class="accessibility-panel__options">
          <button class="accessibility-panel__option" data-scheme="1" onclick="Accessibility.setColorScheme(1)">
            <span class="accessibility-panel__option-icon">⚫⚪</span>
            <span>Чёрный фон, белый текст</span>
          </button>
          <button class="accessibility-panel__option" data-scheme="2" onclick="Accessibility.setColorScheme(2)">
            <span class="accessibility-panel__option-icon">⚫🟢</span>
            <span>Чёрный фон, зелёный текст</span>
          </button>
          <button class="accessibility-panel__option" data-scheme="3" onclick="Accessibility.setColorScheme(3)">
            <span class="accessibility-panel__option-icon">⚫</span>
            <span>Белый фон, чёрный текст</span>
          </button>
          <button class="accessibility-panel__option" data-scheme="4" onclick="Accessibility.setColorScheme(4)">
            <span class="accessibility-panel__option-icon">🟤</span>
            <span>Бежевый фон, коричневый текст</span>
          </button>
          <button class="accessibility-panel__option" data-scheme="5" onclick="Accessibility.setColorScheme(5)">
            <span class="accessibility-panel__option-icon">🔵</span>
            <span>Голубой фон, тёмно-синий текст</span>
          </button>
        </div>
      </div>
      
      <div class="accessibility-panel__section">
        <h3 class="accessibility-panel__section-title">🖼️ Изображения</h3>
        <div class="accessibility-panel__options">
          <button class="accessibility-panel__option" data-images="on" onclick="Accessibility.setImagesOff(false)">
            <span class="accessibility-panel__option-icon">️</span>
            <span>Показывать изображения</span>
          </button>
          <button class="accessibility-panel__option" data-images="off" onclick="Accessibility.setImagesOff(true)">
            <span class="accessibility-panel__option-icon">🚫</span>
            <span>Скрыть изображения (показать текст)</span>
          </button>
        </div>
      </div>
      
      <div class="accessibility-panel__section">
        <button class="accessibility-panel__option" onclick="Accessibility.disable()" style="width: 100%; justify-content: center; background: #ffe0e0; border-color: #ff6b6b;">
          <span class="accessibility-panel__option-icon">❌</span>
          <span>Отключить версию для слабовидящих</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);
  }
  
  // Переключить панель
  function togglePanel() {
    const panel = document.querySelector('.' + PANEL_CLASS);
    if (panel) {
      panel.classList.toggle('open');
    }
  }
  
  // Закрыть панель
  function closePanel() {
    const panel = document.querySelector('.' + PANEL_CLASS);
    if (panel) {
      panel.classList.remove('open');
    }
  }
  
  // Применить настройки
  function applySettings() {
    const body = document.body;
    
    if (settings.enabled) {
      body.classList.add(MODE_CLASS);
      body.classList.add('font-size-' + settings.fontSize);
      body.classList.add('color-scheme-' + settings.colorScheme);
      
      if (settings.imagesOff) {
        body.classList.add('images-off');
      } else {
        body.classList.remove('images-off');
      }
      
      updatePanelUI();
    } else {
      body.classList.remove(MODE_CLASS);
      body.classList.remove('font-size-1', 'font-size-2', 'font-size-3');
      body.classList.remove('color-scheme-1', 'color-scheme-2', 'color-scheme-3', 'color-scheme-4', 'color-scheme-5');
      body.classList.remove('images-off');
    }
  }
  
  // Обновить UI панели
  function updatePanelUI() {
    document.querySelectorAll('.accessibility-panel__option[data-font]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.font) === settings.fontSize);
    });
    
    document.querySelectorAll('.accessibility-panel__option[data-scheme]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.scheme) === settings.colorScheme);
    });
    
    document.querySelectorAll('.accessibility-panel__option[data-images]').forEach(btn => {
      const isOff = btn.dataset.images === 'off';
      btn.classList.toggle('active', isOff === settings.imagesOff);
    });
  }
  
  // Установить размер шрифта
  function setFontSize(size) {
    settings.fontSize = size;
    settings.enabled = true;
    saveSettings();
    applySettings();
    console.log(' Font size set to:', size);
  }
  
  // Установить цветовую схему
  function setColorScheme(scheme) {
    settings.colorScheme = scheme;
    settings.enabled = true;
    saveSettings();
    applySettings();
    console.log('🎨 Color scheme set to:', scheme);
  }
  
  // Включить/выключить изображения
  function setImagesOff(off) {
    settings.imagesOff = off;
    settings.enabled = true;
    saveSettings();
    applySettings();
    console.log('🖼️ Images:', off ? 'OFF' : 'ON');
  }
  
  // Включить режим
  function enable() {
    settings.enabled = true;
    saveSettings();
    applySettings();
  }
  
  // Выключить режим
  function disable() {
    settings.enabled = false;
    saveSettings();
    applySettings();
    closePanel();
    console.log('❌ Accessibility mode disabled');
  }
  
  // Получить настройки
  function getSettings() {
    return settings;
  }
  
  // Экспорт
  return {
    init,
    togglePanel,
    closePanel,
    setFontSize,
    setColorScheme,
    setImagesOff,
    enable,
    disable,
    getSettings
  };
})();

// Автоинициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Accessibility.init());
} else {
  Accessibility.init();
}

// Глобальный доступ
window.Accessibility = Accessibility;