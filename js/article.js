/**
 * AMI Article Page
 * Reads ?id=N from URL, fetches from json-server, renders the matching article.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = parseInt(urlParams.get('id'), 10);
  const articleBody = document.getElementById('article-body');

  console.log('🔍 Article ID:', articleId);
  console.log('📍 URL:', window.location.href);

  if (!articleId || isNaN(articleId)) {
    console.error('❌ Invalid article ID');
    articleBody.innerHTML = '<p class="article-error">Новость не найдена</p>';
    return;
  }

  try {
    console.log('📡 Fetching from http://localhost:3001/news...');
    const response = await fetch('http://localhost:3001/news');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const news = await response.json();
    console.log('✅ Loaded news:', news.length, 'items');
    console.log('📰 Looking for ID:', articleId);
    
    const article = news.find(item => {
        // Сравниваем как числа или как строки
        return parseInt(item.id) === articleId || item.id.toString() === articleId.toString();
      });
    if (!article) {
      console.error('❌ Article not found. Available IDs:', news.map(n => n.id));
      articleBody.innerHTML = `
        <p class="article-error">Новость не найдена</p>
        <p style="font-size: 14px; color: #999; margin-top: 10px;">
          Доступные ID: ${news.map(n => n.id).join(', ')}
        </p>
      `;
      return;
    }

    console.log('✅ Article found:', article.title);
    document.title = `${article.title} — AMI`;

    const tagsHTML = article.tags
      .map(tag => `<span class="article-tag">#${tag}</span>`)
      .join('');

    const paragraphs = article.content
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p class="article-paragraph">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    articleBody.innerHTML = `
      <div class="article-meta">
        <span class="article-date">${article.date}</span>
        <div class="article-tags">${tagsHTML}</div>
      </div>
      <h1 class="article-title">${article.title}</h1>
      <img src="${article.image}" alt="${article.title}" class="article-hero-img" />
      <div class="article-content">
        ${paragraphs}
      </div>

      <div class="article-other-news" id="other-news-section">
        <h3 class="article-other-title">Другие новости</h3>
        <div class="article-other-grid" id="other-news-grid"></div>
      </div>
    `;

    // Другие новости
    const otherNews = news.filter(n => n.id !== articleId).slice(0, 3);
    const grid = document.getElementById('other-news-grid');
    
    if (grid && otherNews.length > 0) {
      otherNews.forEach(newsItem => {
        const card = document.createElement('a');
        card.className = 'article-other-card';
        card.href = `article.html?id=${newsItem.id}`;
        card.innerHTML = `
          <img src="${newsItem.image}" alt="${newsItem.title}" />
          <div class="article-other-card__body">
            <span class="article-other-card__date">${newsItem.date}</span>
            <p class="article-other-card__title">${newsItem.title}</p>
          </div>
        `;
        grid.appendChild(card);
      });
    }

  } catch (error) {
    console.error('❌ Error loading article:', error);
    articleBody.innerHTML = `
      <p class="article-error">Ошибка загрузки новости</p>
      <p style="font-size: 14px; color: #999; margin-top: 10px;">
        ${error.message}<br><br>
        💡 Убедитесь, что:<br>
        1. json-server запущен (порт 3000)<br>
        2. В News.json есть новость с id=${articleId}<br>
        3. Откройте http://localhost:3001/news в браузере
      </p>
    `;
  }
});