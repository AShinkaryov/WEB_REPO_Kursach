/**
 * AMI Theme Switcher — Светлая/Тёмная тема
 */

const ThemeSwitcher = (() => {
  const STORAGE_KEY = 'ami-theme';
  const DARK_CLASS = 'dark-theme';
  
  let currentTheme = 'light';
  
  // Инициализация
  function init() {
    // Загружаем сохранённую тему
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    
    if (savedTheme === 'dark') {
      enableDarkTheme();
    } else {
      enableLightTheme();
    }
    
    // Создаём кнопку переключения
    createToggleButton();
    
    console.log('🎨 Theme switcher initialized:', currentTheme);
  }
  
  // Создать кнопку переключения
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Переключить тему');
    btn.setAttribute('title', 'Переключить тему (светлая/тёмная)');
    
    updateButtonIcon(btn);
    
    btn.addEventListener('click', () => {
      toggleTheme();
      updateButtonIcon(btn);
    });
    
    document.body.appendChild(btn);
    
    // Анимация при загрузке
    setTimeout(() => {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1)';
    }, 300);
  }
  
  // Обновить иконку кнопки
  function updateButtonIcon(btn) {
    btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
  
  // Переключить тему
  function toggleTheme() {
    if (currentTheme === 'dark') {
      enableLightTheme();
    } else {
      enableDarkTheme();
    }
    
    console.log(`🎨 Theme switched to: ${currentTheme}`);
  }
  
  // Включить тёмную тему
  function enableDarkTheme() {
    document.body.classList.add(DARK_CLASS);
    currentTheme = 'dark';
    localStorage.setItem(STORAGE_KEY, 'dark');
    
    // Сообщаем другим модулям
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: 'dark' } 
    }));
  }
  
  // Включить светлую тему
  function enableLightTheme() {
    document.body.classList.remove(DARK_CLASS);
    currentTheme = 'light';
    localStorage.setItem(STORAGE_KEY, 'light');
    
    // Сообщаем другим модулям
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: 'light' } 
    }));
  }
  
  // Получить текущую тему
  function getCurrentTheme() {
    return currentTheme;
  }
  
  // Экспорт публичных методов
  return {
    init,
    toggleTheme,
    enableDarkTheme,
    enableLightTheme,
    getCurrentTheme
  };
})();

// Автоинициализация после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeSwitcher.init());
} else {
  ThemeSwitcher.init();
}

// Делаем глобально доступным (если нужно)
window.ThemeSwitcher = ThemeSwitcher;