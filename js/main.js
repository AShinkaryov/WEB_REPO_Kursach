/**
 * ═══════════════════════════════════════════════════════════
 * ГЛАВНЫЙ СКРИПТ ГЛАВНОЙ СТРАНИЦЫ
 * Лабораторная работа №9: Интерактивные элементы
 * ═══════════════════════════════════════════════════════════
 * 
 * Реализованные требования ЛР9:
 * ✅ Слайдер (автопереключение + стрелки + точки)
 * ✅ Видео-плеер (запуск по клику)
 * ✅ Плавная прокрутка к разделам (smooth scrolling)
 * ✅ Кнопка "Наверх"
 * ✅ Parallax-эффект (3 слоя с разной скоростью)
 * 
 * ЗАПРЕЩЕНО в ЛР9: слайдеры на jQuery — используем чистый JS ✅
 */

// ═══════════════════════════════════════════════════════════
// СЛАЙДЕР ГЛАВНОЙ СТРАНИЦЫ
// Требование ЛР9: "автоматически переключается или позволяет 
// пользователю переключать изображения с помощью элементов управления"
// ═══════════════════════════════════════════════════════════

const slides = document.querySelectorAll('.hero__slide');  // Все слайды
const dots = document.querySelectorAll('.hdot');            // Точки-индикаторы
let current = 0;                                            // Индекс текущего слайда

/**
 * ПЕРЕХОД К СЛАЙДУ ПО ИНДЕКСУ
 * @param {number} n — индекс слайда (может быть отрицательным или > длины)
 * 
 * Используем циклический переход: если n < 0 → последний слайд,
 * если n >= длины → первый слайд
 */
function goTo(n) {
  // Убираем активные классы с текущего слайда и точки
  slides[current].classList.remove('hero__slide--active');
  dots[current].classList.remove('hdot--active');
  
  // Циклический переход
  current = ((n % slides.length) + slides.length) % slides.length;
  
  // Добавляем активные классы новому слайду и точке
  slides[current].classList.add('hero__slide--active');
  dots[current].classList.add('hdot--active');
}

// Обработчики стрелок
document.getElementById('prev')?.addEventListener('click', () => goTo(current - 1));
document.getElementById('next')?.addEventListener('click', () => goTo(current + 1));

// Обработчики точек (клик по точке → переход к слайду)
dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

// 🔥 АВТОПЛЕЙ — переключение каждые 4.5 секунды
setInterval(() => goTo(current + 1), 4500);

// ═══════════════════════════════════════════════════════════
// ВИДЕО-ПЛЕЕР
// Требование ЛР9: "Одно из изображений превратите в элемент 
// управления, запускающий видео"
// ═══════════════════════════════════════════════════════════

/**
 * ПЕРЕКЛЮЧЕНИЕ ВОСПРОИЗВЕДЕНИЯ ВИДЕО
 * Play/Pause по клику на кнопку или на само видео
 */
function toggleVideo() {
  const video = document.getElementById('ami-video');
  const container = document.querySelector('.video-container');
  if (!video) return;
  
  if (video.paused) {
    video.play();
    container?.classList.add('playing');      // Скрываем кнопку Play
  } else {
    video.pause();
    container?.classList.remove('playing');   // Показываем кнопку Play
  }
}

// Скрываем/показываем кнопку при воспроизведении/паузе
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('ami-video');
  const container = document.querySelector('.video-container');
  if (video && container) {
    video.addEventListener('play', () => container.classList.add('playing'));
    video.addEventListener('pause', () => container.classList.remove('playing'));
    video.addEventListener('click', toggleVideo);
  }
});

// ═══════════════════════════════════════════════════════════
// ПЛАВНАЯ ПРОКРУТКА К РАЗДЕЛАМ
// Требование ЛР9: "плавную прокрутку к разделам лендинга 
// при клике на элементы навигации"
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // 🔥 Прокрутка по клику на ссылки с якорями (#section)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        // 🔥 behavior: 'smooth' — нативная плавная прокрутка браузера
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // 🔥 КНОПКА "НАВЕРХ"
  // Создаём кнопку динамически, показываем при скролле > 500px
  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.className = 'scroll-top-btn';
  scrollTopBtn.innerHTML = '↑';
  scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(scrollTopBtn);

  // Показываем/скрываем кнопку в зависимости от скролла
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('scroll-top-btn--visible', window.scrollY > 500);
  });
});

// ═══════════════════════════════════════════════════════════
// PARALLAX-ЭФФЕКТ
// Требование ЛР9: "разделите контент на минимум три слоя 
// с разной скоростью движения"
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const parallaxSection = document.getElementById('parallax-section');
  if (!parallaxSection) return;

  // Получаем все слои parallax-секции
  const layers = parallaxSection.querySelectorAll('.parallax-layer');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const sectionTop = parallaxSection.offsetTop;
    const relativeScroll = scrolled - sectionTop;
    
    // Обрабатываем только когда секция видна на экране
    if (relativeScroll > -500 && relativeScroll < window.innerHeight + 500) {
      layers.forEach(layer => {
        // 🔥 data-speed — скорость движения слоя (0.2 = медленно, 0.8 = быстро)
        const speed = parseFloat(layer.dataset.speed) || 0.5;
        const yPos = -(relativeScroll * speed);
        layer.style.transform = `translateY(${yPos}px)`;
      });
    }
  });
});