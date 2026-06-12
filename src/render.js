// articles.json から index.html / archive.html / articles/<slug>.html を生成する。
// 並び: トップは最新 retentionTop 本を母集団とし、ヒーロー/カードは重要度順、
// 「最新記事」リストは時系列、超過分はアーカイブへ。
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderIndex } from '../templates/index.js';
import { renderArticle } from '../templates/article.js';
import { renderArchive } from '../templates/archive.js';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function dateLabel(d = new Date()) {
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${wd}`;
}

function decorate(a) {
  const d = a.createdAt ? new Date(a.createdAt) : new Date();
  const displayDate = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const displayTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { ...a, displayDate, displayTime };
}

const recencyDesc = (x, y) => Date.parse(y.createdAt || 0) - Date.parse(x.createdAt || 0);
const imp = (a) => Number(a.importance) || 3;
const importanceThenRecency = (x, y) => (imp(y) - imp(x)) || recencyDesc(x, y);

export async function renderSite(rawArticles) {
  const decorated = rawArticles.map(decorate);

  const byRecency = [...decorated].sort(recencyDesc);
  const universe = byRecency.slice(0, config.retentionTop);   // トップ掲載の母集団（最新N本）
  const archived = byRecency.slice(config.retentionTop);       // アーカイブ送り
  const featured = [...universe].sort(importanceThenRecency);  // ヒーロー/カード/人気（重要度順）

  const label = dateLabel();

  // index.html（ルート上書き）
  await writeFile(
    path.join(ROOT, 'index.html'),
    renderIndex(featured, universe, label, archived.length),
    'utf8',
  );

  // archive.html（超過分があるときのみ・全記事を時系列で一覧）
  if (archived.length) {
    await writeFile(path.join(ROOT, 'archive.html'), renderArchive(byRecency, label), 'utf8');
  }

  // 各記事ページ（全件）。関連は重要度上位から自分以外を3件。
  await mkdir(path.join(ROOT, 'articles'), { recursive: true });
  let count = 0;
  for (let i = 0; i < byRecency.length; i++) {
    const a = byRecency[i];
    const related = featured.filter((x) => x.slug !== a.slug).slice(0, 3);
    const html = renderArticle(a, related, label, i);
    await writeFile(path.join(ROOT, 'articles', `${a.slug}.html`), html, 'utf8');
    count++;
  }
  return { index: 1, articles: count, archived: archived.length };
}
