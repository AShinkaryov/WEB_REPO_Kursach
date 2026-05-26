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