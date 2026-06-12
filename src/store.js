// data/articles.json の読み書き。slug 採番（YYYYMMDD-連番）と link による冪等性を担う。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'articles.json');

export async function loadArticles() {
  if (!existsSync(DATA_FILE)) return [];
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveArticles(articles) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(articles, null, 2), 'utf8');
}

// 既存 link 集合（重複判定用）
export function existingLinks(articles) {
  return new Set(articles.map((a) => a.link));
}

// 日付ベースの slug を採番。同日内の既存件数 + offset で連番。
export function makeSlug(articles, dateStr, offset = 0) {
  // 件数ではなく「既存の最大連番＋1」。削除で欠番が出ても衝突しない。
  let maxSeq = 0;
  for (const a of articles) {
    if (!a.slug || !a.slug.startsWith(`${dateStr}-`)) continue;
    const n = Number(a.slug.slice(dateStr.length + 1));
    if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
  }
  const seq = String(maxSeq + offset + 1).padStart(2, '0');
  return `${dateStr}-${seq}`;
}

// YYYYMMDD（ローカル日付）
export function yyyymmdd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
