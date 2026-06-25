// 一括移行（一回限り・冪等）: 既存 articles.json の旧カテゴリ section を
// config.sectionAliases で navSections へ正規化し、旧ラベルをタグへ退避する。
// 実行: npm run migrate-sections  → 続けて npm run render で全 HTML 再生成。
import { loadArticles, saveArticles, normalizeSectionTags } from './store.js';

const articles = await loadArticles();
let changed = 0;
const out = articles.map((a) => {
  const { section, tags } = normalizeSectionTags(a.section || 'AI', Array.isArray(a.tags) ? a.tags : []);
  if (section !== a.section) changed += 1;
  return { ...a, section, tags };
});

await saveArticles(out);

const by = {};
for (const a of out) by[a.section] = (by[a.section] || 0) + 1;
console.log(`✓ section を正規化: ${changed}/${out.length} 件を更新`);
console.log('  正規化後の内訳:', Object.entries(by).sort((p, q) => q[1] - p[1]).map(([s, n]) => `${s}=${n}`).join(' / '));
console.log('  次に `npm run render` で全 HTML を再生成してください。');
