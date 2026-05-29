/**
 * AMI Article Page
 * Reads ?id=N from URL, fetches news.json, renders the matching article.
 */

async function loadArticle() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  const body = document.getElementById('article-body');

  if (!id || isNaN(id)) {
    body.innerHTML = '<p class="article-error">Новость не найдена.</p>';
    return;
  }

  try {
    const res = await fetch('data/news.json');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();

    const item = data.news.find(n => n.id === id);
    if (!item) {
      body.innerHTML = '<p class="article-error">Новость не найдена.</p>';
      return;
    }

    // Update page title
    document.title = `AMI — ${item.title}`;

    // Render tags
    const tagsHTML = item.tags
      .map(t => `<span class="article-tag">#${t}</span>`)
      .join('');

    // Render paragraphs
    const paragraphs = item.content
      .split('\n\n')
      .filter(Boolean)
      .map(p => `<p class="article-paragraph">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    body.innerHTML = `
      <div class="article-meta">
        <span class="article-date">${item.date}</span>
        <div class="article-tags">${tagsHTML}</div>
      </div>
      <h1 class="article-title">${item.title}</h1>
      <img class="article-hero-img" src="${item.image}" alt="${item.title}" />
      <div class="article-content">
        ${paragraphs}
      </div>

      <div class="article-other-news" id="other-news-section">
        <h3 class="article-other-title">Другие новости</h3>
        <div class="article-other-grid" id="other-news-grid"></div>
      </div>
    `;

    // Render other news cards
    const others = data.news.filter(n => n.id !== id).slice(0, 3);
    const grid = document.getElementById('other-news-grid');
    if (grid) {
      others.forEach(n => {
        const card = document.createElement('a');
        card.className = 'article-other-card';
        card.href = `article.html?id=${n.id}`;
        card.innerHTML = `
          <img src="${n.image}" alt="${n.title}" />
          <div class="article-other-card__body">
            <span class="article-other-card__date">${n.date}</span>
            <p class="article-other-card__title">${n.title}</p>
          </div>
        `;
        grid.appendChild(card);
      });
    }

  } catch (e) {
    console.error(e);
    body.innerHTML = '<p class="article-error">Ошибка загрузки новости.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadArticle);