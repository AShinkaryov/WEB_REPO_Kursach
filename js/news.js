/**
 * AMI News Module
 * Loads news from json-server, renders the grid, handles filtering,
 * and navigates to the article page.
 */

const NewsApp = (() => {
  let allNews = [];
  let activeFilter = null;

  /* ── Fetch ──────────────────────────────────────────────── */
  async function fetchNews() {
    const [newsRes, catsRes] = await Promise.all([
      fetch('http://localhost:3000/news'),
      fetch('http://localhost:3000/categories')
    ]);

    if (!newsRes.ok || !catsRes.ok) {
      throw new Error('Failed to load data from server');
    }

    const news = await newsRes.json();
    const categories = await catsRes.json();
    return { news, categories };
  }

  /* ── Filter buttons ─────────────────────────────────────── */
  function buildFilterBar(categories) {
    const bar = document.getElementById('news-filter-bar');
    if (!bar) return;
    bar.innerHTML = '';

    categories.forEach((cat, i) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (i === 0 ? ' filter-btn--active' : '');
      btn.textContent = cat.label;
      btn.dataset.filter = cat.filter ?? '';
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
        btn.classList.add('filter-btn--active');
        activeFilter = cat.filter || null;
        renderGrid(allNews, activeFilter);
      });
      bar.appendChild(btn);
    });
  }

  /* ── Grid rendering ─────────────────────────────────────── */
  function renderGrid(news, filter) {
    const filtered = filter ? news.filter(n => n.tags.includes(filter)) : news;
    renderRow1(filtered);
    renderRow2(filtered);
    renderRow3(filtered);
  }

  function renderRow1(news) {
    const slots = [
      document.getElementById('news-slot-r1-1'),
      document.getElementById('news-slot-r1-2'),
      document.getElementById('news-slot-r1-3'),
    ];
    const items = news.slice(0, 3);
    slots.forEach((slot, i) => {
      if (!slot) return;
      if (items[i]) {
        slot.innerHTML = buildCardHTML(items[i]);
        slot.style.visibility = 'visible';
      } else {
        slot.innerHTML = '';
        slot.style.visibility = 'hidden';
      }
    });
  }

  function renderRow2(news) {
    const slotL = document.getElementById('news-slot-r2-left');
    const slotR = document.getElementById('news-slot-r2-right');
    const items = news.slice(3, 5);
    if (slotL) {
      slotL.innerHTML = items[0] ? buildCardHTML(items[0]) : '';
      slotL.style.visibility = items[0] ? 'visible' : 'hidden';
    }
    if (slotR) {
      slotR.innerHTML = items[1] ? buildCardHTML(items[1]) : '';
      slotR.style.visibility = items[1] ? 'visible' : 'hidden';
    }
  }

  function renderRow3(news) {
    const slotL = document.getElementById('news-slot-r3-left');
    const slotR = document.getElementById('news-slot-r3-right');
    const items = news.slice(5, 7);
    if (slotL) {
      slotL.innerHTML = items[0] ? buildCardHTML(items[0]) : '';
      slotL.style.visibility = items[0] ? 'visible' : 'hidden';
    }
    if (slotR) {
      slotR.innerHTML = items[1] ? buildCardHTML(items[1]) : '';
      slotR.style.visibility = items[1] ? 'visible' : 'hidden';
    }
  }

  /* ── Card HTML builder ──────────────────────────────────── */
  function buildCardHTML(item) {
    return `
      <img src="${item.image}" alt="${item.title}" class="news-card__img" />
      <div class="news-card__overlay">
        <span class="news-card__date">${item.date}</span>
        <p class="news-card__title">${item.title}</p>
        <div class="news-card__read" onclick="NewsApp.openArticle(${item.id})">
          <span>Читать</span>
          <img src="img/Blog/arrow.png" alt="→" width="20" height="20" />
        </div>
      </div>
    `;
  }

  /* ── Open article page ──────────────────────────────────── */
  function openArticle(id) {
    window.location.href = `article.html?id=${id}`;
  }

  /* ── Init ───────────────────────────────────────────────── */
  async function init() {
    try {
      const data = await fetchNews();
      allNews = data.news;
      buildFilterBar(data.categories);
      renderGrid(allNews, null);
    } catch (e) {
      console.error('NewsApp init error:', e);
    }
  }

  return { init, openArticle };
})();

document.addEventListener('DOMContentLoaded', NewsApp.init);