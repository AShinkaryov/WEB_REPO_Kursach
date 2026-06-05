/**
 * AMI Preloader — Анимация загрузки страницы
 */

const Preloader = (() => {
  let preloaderElement = null;
  
  // Инициализация
  function init() {
    console.log('⏳ Preloader initialized');
    
    // Создаём элемент прелоадера
    createPreloader();
    
    // Скрываем после полной загрузки
    window.addEventListener('load', hidePreloader);
    
    // Также скрываем через 3 секунды (на случай если load не сработал)
    setTimeout(hidePreloader, 3000);
  }
  
  // Создать прелоадер
  function createPreloader() {
    preloaderElement = document.createElement('div');
    preloaderElement.className = 'preloader';
    preloaderElement.id = 'preloader';
    
    preloaderElement.innerHTML = `
      <img src="img/logo-sidebar.png" alt="AMI" class="preloader__logo"/>
      <div class="preloader__dots">
        <div class="preloader__dot"></div>
        <div class="preloader__dot"></div>
        <div class="preloader__dot"></div>
      </div>
      <div class="preloader__text">ЗАГРУЗКА</div>
      <div class="preloader__progress">
        <div class="preloader__progress-bar"></div>
      </div>
    `;
    
    document.body.appendChild(preloaderElement);
  }
  
  // Скрыть прелоадер
  function hidePreloader() {
    if (preloaderElement) {
      preloaderElement.classList.add('hidden');
      
      // Удаляем из DOM после анимации
      setTimeout(() => {
        if (preloaderElement && preloaderElement.parentNode) {
          preloaderElement.parentNode.removeChild(preloaderElement);
        }
      }, 500);
      
      console.log('✅ Preloader hidden');
    }
  }
  
  // Экспорт
  return {
    init,
    hidePreloader
  };
})();

// Автоинициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Preloader.init());
} else {
  Preloader.init();
}

// Глобальный доступ
window.Preloader = Preloader;