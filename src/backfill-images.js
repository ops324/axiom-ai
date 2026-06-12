// 既存記事のうち、まだ実写真が無い（CSS抽象サムネの）ものに、
// フリー素材API（Unsplash/Pexels）の写真を一括で付与してサイトを再生成する。
// 前提: .env に UNSPLASH_KEY か PEXELS_KEY を設定済みであること。
// 使い方: npm run backfill-images
import { loadArticles, saveArticles } from './store.js';
import { fetchImage } from './fetchImage.js';
import { renderSite } from './render.js';

const arts = await loadArticles();
let updated = 0;

for (let i = 0; i < arts.length; i++) {
  const a = arts[i];
  if (a.image?.imageUrl) continue; // 既に実写真あり
  const img = await fetchImage(a, i);
  if (img?.imageUrl) {
    a.image = img;
    updated++;
    console.log(`  + ${a.headline} → ${img.provider} / ${img.photographer}`);
  }
}

if (updated > 0) {
  await saveArticles(arts);
  const stats = await renderSite(arts);
  console.log(`\n✓ ${updated} 件に実写真を付与し、計 ${stats.articles} 記事を再生成しました。`);
} else {
  console.log('付与できた画像はありませんでした（UNSPLASH_KEY/PEXELS_KEY 未設定か、検索ヒット0）。');
}
