// ヘッドレスClaude執筆フロー用: 新着ニュース候補を data/_candidates.json に書き出す。
// RSS取得・重複排除・弱いソース除外は既存ロジックを再利用。
// （Claude はこのファイルを読み、各候補の元記事を WebFetch して執筆する）
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchNews } from './fetchNews.js';
import { loadArticles, existingLinks } from './store.js';
import { config } from './config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const store = await loadArticles();
// Claude が重要度で選別できるよう、広めの候補プールを提示する
const candidates = await fetchNews(existingLinks(store), config.candidatePool);
const out = path.join(ROOT, 'data', '_candidates.json');
await writeFile(out, JSON.stringify(candidates, null, 2), 'utf8');

// 人向けの要約は stderr（stdout を汚さない）
console.error(`候補 ${candidates.length} 件を ${path.relative(ROOT, out)} に書き出しました。`);
for (const c of candidates) console.error(`  - [${c.tier === 'primary' ? '一次' : 'media'}/${c.source}] ${c.title}`);
