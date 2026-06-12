/**
 * Интерактивная медиагалерея
 * Смена изображений + звук + индикация плеера
 */
const MediaGallery = (() => {
  // Коллекция изображений (минимум 10)
  const images = [
    'img/1.jpeg',
    'img/2.jpg',
    'img/3.jpg',
    'img/4.jpg',
    'img/5.jpg',
    'img/6.jpg',
    'img/7.jpg',
    'img/feature1.png',
    'img/feature2.jpg',
    'img/feature.jpg',
    'img/feature4.png',
    'img/feature5.png'
  ];

  // Звуковые эффекты (можно использовать короткие звуки)
  const sounds = [
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // тишина
    // Добавьте реальные звуки при необходимости
  ];

  let currentImage = 0;
  let isPlaying = false;
  let audioContext = null;

  function init() {
    console.log('🎨 MediaGallery initialized');
    createGallery();
  }

  function createGallery() {
    // Создаём галерею на главной странице
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const gallery = document.createElement('section');
    gallery.className = 'media-gallery';
    gallery.innerHTML = `
      <h2 class="media-gallery__title">Интерактивная галерея</h2>
      <div class="media-gallery__container">
        <div class="media-gallery__display">
          <img class="media-gallery__img" src="${images[0]}" alt="Gallery image" id="gallery-main-img"/>
          <div class="media-gallery__player-indicator" id="gallery-indicator">
            <span class="media-gallery__play-icon">▶</span>
            <span class="media-gallery__status">Пауза</span>
          </div>
        </div>
        <div class="media-gallery__controls">
          <div class="media-gallery__buttons">
            ${images.slice(0, 6).map((img, i) => `
              <button class="media-gallery__btn ${i === 0 ? 'media-gallery__btn--active' : ''}" 
                      data-index="${i}" 
                      title="Изображение ${i + 1}">
                <img src="${img}" alt="Thumb ${i + 1}"/>
              </button>
            `).join('')}
          </div>
          <div class="media-gallery__actions">
            <button class="media-gallery__action-btn" id="gallery-play-btn" title="Воспроизвести/Пауза">
              <span id="gallery-play-icon">▶</span>
            </button>
            <button class="media-gallery__action-btn" id="gallery-random-btn" title="Случайное изображение">
              🎲
            </button>
            <div class="media-gallery__volume">
              <label>🔊</label>
              <input type="range" id="gallery-volume" min="0" max="100" value="50"/>
            </div>
          </div>
        </div>
      </div>
    `;

    // Вставляем перед футером
    const footer = mainContent.querySelector('.footer');
    if (footer) {
      mainContent.insertBefore(gallery, footer);
    } else {
      mainContent.appendChild(gallery);
    }

    setupEventListeners();
  }

  function setupEventListeners() {
    // Клик по кнопкам изображений
    document.querySelectorAll('.media-gallery__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        changeImage(index);
        playSound();
      });
    });

    // Кнопка Play/Pause
    const playBtn = document.getElementById('gallery-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', togglePlay);
    }

    // Кнопка случайного изображения
    const randomBtn = document.getElementById('gallery-random-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * images.length);
        changeImage(randomIndex);
        playSound();
      });
    }

    // Регулировка громкости
    const volumeSlider = document.getElementById('gallery-volume');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        console.log(' Volume:', e.target.value);
      });
    }
  }

  function changeImage(index) {
    if (index < 0 || index >= images.length) return;
    
    const mainImg = document.getElementById('gallery-main-img');
    if (!mainImg) return;

    // Плавный переход
    mainImg.style.opacity = '0';
    
    setTimeout(() => {
      mainImg.src = images[index];
      currentImage = index;
      
      // Обновляем активную кнопку
      document.querySelectorAll('.media-gallery__btn').forEach((btn, i) => {
        btn.classList.toggle('media-gallery__btn--active', i === index);
      });
      
      mainImg.style.opacity = '1';
    }, 300);
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    const playIcon = document.getElementById('gallery-play-icon');
    const indicator = document.getElementById('gallery-indicator');
    const status = indicator?.querySelector('.media-gallery__status');
    
    if (isPlaying) {
      if (playIcon) playIcon.textContent = '⏸';
      if (status) status.textContent = 'Играет';
      indicator?.classList.add('media-gallery__player-indicator--playing');
      startAutoPlay();
    } else {
      if (playIcon) playIcon.textContent = '▶';
      if (status) status.textContent = 'Пауза';
      indicator?.classList.remove('media-gallery__player-indicator--playing');
      stopAutoPlay();
    }
  }

  function playSound() {
    // Создаём простой звуковой эффект через Web Audio API
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440 + (currentImage * 50); // Разная частота для разных изображений
    oscillator.type = 'sine';
    
    const volume = (document.getElementById('gallery-volume')?.value || 50) / 100;
    gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }

  let autoPlayInterval = null;

  function startAutoPlay() {
    autoPlayInterval = setInterval(() => {
      const nextIndex = (currentImage + 1) % images.length;
      changeImage(nextIndex);
      playSound();
    }, 3000);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  return { init };
})();

// Автоинициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MediaGallery.init());
} else {
  MediaGallery.init();
}