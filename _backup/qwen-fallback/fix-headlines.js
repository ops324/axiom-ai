// 保守用: 既に保存済みの記事の見出しを再検査し、崩れ/捏造があれば
// 本文をもとに作り直して安全な見出しに差し替え、サイトを再生成する。
// 使い方: npm run fix-headlines
import { config } from './config.js';
import { loadArticles, saveArticles } from './store.js';
import { headlineProblem, regenerateHeadline, safeFallbackHeadline } from './writeArticle.js';
import { renderSite } from './render.js';

const articles = await loadArticles();
let fixed = 0;

for (const a of articles) {
  // 検証コーパスは保存済みの本文・タグ・提供元（本文は忠実なので略語の参照元に使える）
  const corpus = [a.body_markdown, (a.tags || []).join(' '), a.source].filter(Boolean).join(' ');
  let problem = headlineProblem(a.headline, corpus);
  if (!problem) continue;

  console.log(`修正対象: 「${a.headline}」 → ${problem}`);
  const pseudo = { title: '', summary: '', source: a.source };

  for (let i = 0; problem && i < config.headlineRetries; i++) {
    const f = await regenerateHeadline(pseudo, a.body_markdown, a, problem);
    if (f) a.headline = f;
    problem = headlineProblem(a.headline, corpus);
  }
  if (problem) a.headline = safeFallbackHeadline(a, { title: a.source });

  console.log(`  → 修正後: 「${a.headline}」`);
  fixed++;
}

if (fixed > 0) {
  await saveArticles(articles);
  await renderSite(articles);
  console.log(`\n✓ ${fixed} 件の見出しを修正し、サイトを再生成しました。`);
} else {
  console.log('不具合のある見出しはありませんでした。');
}
