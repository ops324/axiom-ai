// オーケストレーター: 取得 → 抽出 → 執筆 → 画像 → 保存 → サイト生成。
// `node src/pipeline.js --dry` で保存・書き出しをスキップ（内容確認のみ）。
import { config } from './config.js';
import { fetchNews } from './fetchNews.js';
import { extractBody } from './extract.js';
import { writeArticle } from './writeArticle.js';
import { fetchImage } from './fetchImage.js';
import { renderSite } from './render.js';
import { loadArticles, saveArticles, existingLinks, makeSlug, yyyymmdd } from './store.js';

const DRY = process.argv.includes('--dry');

async function checkOllama() {
  try {
    const base = config.ollamaUrl.replace(/\/api\/.*$/, '');
    const res = await fetch(`${base}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    const has = (data.models || []).some((m) => m.name === config.model || m.name.startsWith(config.model.split(':')[0]));
    if (!has) console.warn(`⚠ モデル ${config.model} が見つかりません。\`ollama pull ${config.model}\` を実行してください。`);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`\n=== AXIOM AI パイプライン ${DRY ? '(ドライラン)' : ''} ===\n`);

  if (!(await checkOllama())) {
    console.error('✗ ollama に接続できません（http://localhost:11434）。`ollama serve` が起動しているか確認してください。');
    process.exit(1);
  }

  const store = await loadArticles();
  console.log(`既存記事: ${store.length} 件`);

  console.log('① ニュース取得中...');
  const candidates = await fetchNews(existingLinks(store));
  console.log(`  新着候補: ${candidates.length} 件`);
  if (!candidates.length) {
    console.log('新着がありません。終了します。');
    return;
  }

  const dateStr = yyyymmdd();
  const created = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    console.log(`\n[${i + 1}/${candidates.length}] ${c.title}`);

    console.log('  ② 本文抽出...');
    const { text, thin } = await extractBody(c.link);
    console.log(`     抽出 ${text.length} 文字 ${thin ? '(薄い→短文モード)' : ''}`);

    // 材料不足（抽出本文＋要約が少なすぎる）は捏造の温床になるためスキップ
    if (text.length + (c.summary?.length || 0) < config.hardMinChars) {
      console.log(`     スキップ（材料不足 < ${config.hardMinChars}字・捏造回避）`);
      continue;
    }

    console.log(`  ③ 執筆 (${config.model})...`);
    const draft = await writeArticle(c, text, thin);
    if (!draft) { console.log('     スキップ（崩れ/捏造のため破棄）'); continue; }
    console.log(`     見出し: ${draft.headline}`);

    console.log('  ④ 画像取得...');
    const image = await fetchImage(draft, i);
    console.log(`     ${image.imageUrl ? `${image.provider} / ${image.photographer}` : `フォールバック(${image.fallbackThumb})`}`);

    const record = {
      slug: makeSlug(store, dateStr, created.length),
      headline: draft.headline,
      lead: draft.lead,
      body_markdown: draft.body_markdown,
      tags: draft.tags,
      section: c.section,
      source: c.source,
      link: c.link,
      importance: 3, // qwen版は重要度判定をしないため標準値
      image,
      mode: thin ? 'short' : 'full',
      createdAt: new Date().toISOString(),
    };
    created.push(record);
  }

  if (!created.length) {
    console.log('\n生成できた記事がありませんでした。');
    return;
  }

  if (DRY) {
    console.log(`\n[ドライラン] ${created.length} 件を生成（保存・書き出しはスキップ）。`);
    for (const a of created) {
      console.log(`\n--- ${a.headline} ---\n${a.body_markdown}\n出典: ${a.source} ${a.link}`);
    }
    return;
  }

  const all = [...created, ...store];
  await saveArticles(all);
  const stats = await renderSite(all);
  console.log(`\n✓ 完了: 新規 ${created.length} 件を保存。index.html + articles/ に ${stats.articles} 記事を出力。`);
  console.log('  確認: open index.html\n');
}

main().catch((err) => {
  console.error('パイプライン異常終了:', err);
  process.exit(1);
});
