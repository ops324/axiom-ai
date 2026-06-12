// data/articles.json から index.html + articles/*.html を再生成するだけのスクリプト。
import { loadArticles } from './store.js';
import { renderSite } from './render.js';

const arts = await loadArticles();
const stats = await renderSite(arts);
console.log(`✓ ${stats.articles} 記事を再生成しました（index.html + articles/）。`);
