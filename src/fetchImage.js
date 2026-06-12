// 記事タグから英語キーワードを作り、Unsplash/Pexels で1枚取得（規約準拠の帰属付き）。
// キー無/ヒット0なら CSS抽象サムネにフォールバック（デザイン崩れゼロ）。
import { config } from './config.js';

// 日本語タグ→画像検索用の英語キーワード（簡易マップ＋既定値）
const KW_MAP = [
  [/規制|倫理|法|ガイドライン/, 'regulation technology'],
  [/医療|診断|臨床/, 'medical technology'],
  [/金融|銀行|投資/, 'finance technology'],
  [/半導体|GPU|チップ|ハードウェア/, 'semiconductor chip'],
  [/ロボット/, 'robotics'],
  [/研究|論文|科学/, 'research laboratory'],
  [/スタートアップ|資金|調達/, 'startup office'],
  [/画像|動画|生成/, 'digital art abstract'],
];

function keyword(tags = [], headline = '') {
  const hay = [...tags, headline].join(' ');
  for (const [re, kw] of KW_MAP) if (re.test(hay)) return kw;
  return 'artificial intelligence technology';
}

async function unsplash(kw) {
  if (!config.unsplashKey) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(kw)}&per_page=1&orientation=landscape&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${config.unsplashKey}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const p = data.results?.[0];
  if (!p) return null;
  // Unsplash 規約: ダウンロードトリガーを叩く（ベストエフォート）
  if (p.links?.download_location) {
    fetch(p.links.download_location, { headers: { Authorization: `Client-ID ${config.unsplashKey}` } }).catch(() => {});
  }
  return {
    imageUrl: `${p.urls.raw}&w=1280&q=80&fm=jpg`,
    photographer: p.user?.name || 'Unsplash',
    profileUrl: `${p.user?.links?.html || 'https://unsplash.com'}?utm_source=axiom_ai&utm_medium=referral`,
    provider: 'Unsplash',
  };
}

async function pexels(kw) {
  if (!config.pexelsKey) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(kw)}&per_page=1&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: config.pexelsKey } });
  if (!res.ok) return null;
  const data = await res.json();
  const p = data.photos?.[0];
  if (!p) return null;
  return {
    imageUrl: p.src?.large || p.src?.original,
    photographer: p.photographer || 'Pexels',
    profileUrl: p.photographer_url || 'https://www.pexels.com',
    provider: 'Pexels',
  };
}

// 戻り値: 画像メタ or { fallbackThumb } （CSS抽象サムネ）
export async function fetchImage(article, index = 0) {
  const kw = keyword(article.tags, article.headline);
  try {
    const primary = config.imageProvider === 'pexels' ? pexels : unsplash;
    const secondary = config.imageProvider === 'pexels' ? unsplash : pexels;
    const hit = (await primary(kw)) || (await secondary(kw));
    if (hit) return hit;
  } catch (err) {
    console.warn(`  [image] 取得失敗: ${err.message}`);
  }
  const thumb = config.thumbVariants[index % config.thumbVariants.length];
  return { fallbackThumb: thumb };
}
