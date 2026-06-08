const fs = require('fs');
const path = require('path');

// 🔥 Читаем ВСЕ JSON файлы из папки json/
const Products = JSON.parse(fs.readFileSync(path.join(__dirname, 'json/Products.json'), 'utf8'));
const orders = JSON.parse(fs.readFileSync(path.join(__dirname, 'json/orders.json'), 'utf8'));
const News = JSON.parse(fs.readFileSync(path.join(__dirname, 'json/News.json'), 'utf8'));

// 🔥 ВАЖНО: Если Products и News - это массивы, а не объекты с ключами
// Проверяем структуру:
const productsArray = Array.isArray(Products) ? Products : Products.products || [];
const newsArray = Array.isArray(News) ? News : News.news || [];
const ordersArray = Array.isArray(orders) ? orders : orders.orders || [];

// 🔥 Создаем db.json с ВСЕМИ коллекциями
const db = {
  products: productsArray,
  orders: ordersArray,
  news: newsArray,
  categories: [
    { "id": "all", "label": "#новое", "filter": null },
    { "id": "печенье", "label": "#печенье", "filter": "печенье" },
    { "id": "события", "label": "#события", "filter": "события" },
    { "id": "праздники", "label": "#праздники", "filter": "праздники" },
    { "id": "рецепты", "label": "#рецепты", "filter": "рецепты" },
    { "id": "магазиныami", "label": "#магазиныami", "filter": "магазиныami" }
  ],
  users: [],
  reviews: [],
  promoCodes: [],
  filters: {
    "brands": [],
    "types": [],
    "weights": [],
    "ingredients": [],
    "packQty": []
  }
};

fs.writeFileSync(path.join(__dirname, 'json/db.json'), JSON.stringify(db, null, 2));
console.log('✅ Все коллекции объединены в json/db.json');
console.log('📦 Коллекции:', Object.keys(db).join(', '));