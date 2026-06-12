// Slider auto-play
const slides = document.querySelectorAll('.hero__slide');
const dots = document.querySelectorAll('.hdot');
let current = 0;

function goTo(n) {
  slides[current].classList.remove('hero__slide--active');
  dots[current].classList.remove('hdot--active');
  current = ((n % slides.length) + slides.length) % slides.length;
  slides[current].classList.add('hero__slide--active');
  dots[current].classList.add('hdot--active');
}

document.getElementById('prev')?.addEventListener('click', () => goTo(current - 1));
document.getElementById('next')?.addEventListener('click', () => goTo(current + 1));
dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
setInterval(() => goTo(current + 1), 4500);

/* ── Видео плеер ───────────────────────────────────────── */
function toggleVideo() {
  const video = document.getElementById('ami-video');
  const container = document.querySelector('.video-container');
  if (!video) return;
  
  if (video.paused) {
    video.play();
    container?.classList.add('playing');
  } else {
    video.pause();
    container?.classList.remove('playing');
  }
}

// Скрыть кнопку при воспроизведении
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('ami-video');
  const container = document.querySelector('.video-container');
  if (video && container) {
    video.addEventListener('play', () => container.classList.add('playing'));
    video.addEventListener('pause', () => container.classList.remove('playing'));
    video.addEventListener('click', toggleVideo);
  }
});

/* ── Плавная прокрутка к разделам ──────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Прокрутка по клику на ссылки с якорями
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Кнопки "Наверх"
  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.className = 'scroll-top-btn';
  scrollTopBtn.innerHTML = '↑';
  scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(scrollTopBtn);

  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('scroll-top-btn--visible', window.scrollY > 500);
  });
});

/* ── Parallax эффект ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const parallaxSection = document.getElementById('parallax-section');
  if (!parallaxSection) return;

  const layers = parallaxSection.querySelectorAll('.parallax-layer');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const sectionTop = parallaxSection.offsetTop;
    const relativeScroll = scrolled - sectionTop;
    
    // Проверяем, видна ли секция
    if (relativeScroll > -500 && relativeScroll < window.innerHeight + 500) {
      layers.forEach(layer => {
        const speed = parseFloat(layer.dataset.speed) || 0.5;
        const yPos = -(relativeScroll * speed);
        layer.style.transform = `translateY(${yPos}px)`;
      });
    }
  });
});