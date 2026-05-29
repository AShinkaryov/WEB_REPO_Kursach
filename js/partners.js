document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  
  if (!slides.length) return; // Защита от пустого слайдера

  let currentSlide = 0;
  const totalSlides = slides.length;

  function showSlide(index) {
    // Циклический переход
    if (index < 0) currentSlide = totalSlides - 1;
    else if (index >= totalSlides) currentSlide = 0;
    else currentSlide = index;

    // Обновляем слайды
    slides.forEach(slide => slide.classList.remove('hero__slide--active'));
    slides[currentSlide].classList.add('hero__slide--active');

    // Обновляем точки
    dots.forEach(dot => dot.classList.remove('hero__dot--active'));
    dots[currentSlide].classList.add('hero__dot--active');
  }

  function nextSlide() { showSlide(currentSlide + 1); }
  function prevSlide() { showSlide(currentSlide - 1); }

  // Клик по стрелкам
  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', prevSlide);

  // Клик по точкам
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      showSlide(index);
      resetAutoPlay();
    });
  });

  // Автоплей (5 секунд) с паузой при наведении
  let autoPlay = setInterval(nextSlide, 5000);
  const heroSection = document.querySelector('.hero');

  function resetAutoPlay() {
    clearInterval(autoPlay);
    autoPlay = setInterval(nextSlide, 5000);
  }

  heroSection.addEventListener('mouseenter', () => clearInterval(autoPlay));
  heroSection.addEventListener('mouseleave', () => {
    autoPlay = setInterval(nextSlide, 5000);
  });

  // Инициализация
  showSlide(0);
});